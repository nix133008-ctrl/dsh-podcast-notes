import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fetchFeed, normalizeFeedUrl } from './lib/rss.js';
import {
  Store,
  loadConfig,
  saveConfig,
  publicConfig,
  validateSettings,
  safeName,
  dateStamp,
} from './lib/store.js';
import { runTranscription, composeNotesPrompt, readText, transcriptBody } from './lib/transcribe.js';
import { resolveRoute, generateNotes, writeNotesFile, loadTranscript } from './lib/notes.js';
import { getEnvStatus, prepareEnvironment } from './lib/env.js';

const ROUTE_PREFIX = '/podcast-notes/api';
const MAX_BODY = 1024 * 1024;

let runtime;

class ApiError extends Error {
  constructor(message, status = 400, code = 'bad-request') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function createRuntime(ctx) {
  const config = loadConfig();
  const state = {
    ctx,
    config,
    store: new Store(config),
    jobs: new Map(),
    jobSeq: 0,
    models: undefined,
  };
  return state;
}

function logMessage(runtime, text) {
  try {
    runtime.ctx.logger?.info?.(`dsh-podcast-notes: ${text}`);
  } catch {
    // logging is best effort
  }
}

function requireStore(runtime) {
  return runtime.store;
}

function requireFeed(runtime, feedId) {
  const feed = runtime.store.getFeed(String(feedId ?? ''));
  if (!feed) throw new ApiError('找不到这个播客', 404, 'feed-not-found');
  return feed;
}

function requireEpisode(runtime, feedId, guid) {
  const episode = runtime.store.findEpisode(feedId, String(guid ?? ''));
  if (!episode) throw new ApiError('找不到这一集', 404, 'episode-not-found');
  return episode;
}

function feedCategory(feed) {
  const value = String(feed?.category || '').trim();
  return value || String(feed?.categories?.[0] || '').trim() || '未分类';
}

function cleanCategory(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 24);
}

function feedView(runtime, feed) {
  const stats = runtime.store.feedStats(feed.id);
  return { ...feed, category: feedCategory(feed), stats };
}

function jobView(job) {
  return {
    id: job.id,
    type: job.type,
    feedId: job.feedId,
    guid: job.guid,
    title: job.title,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt || 0,
    updatedAt: job.updatedAt || job.startedAt,
    log: String(job.log || '').slice(-6000),
    resultPath: job.resultPath || '',
    error: job.error || '',
  };
}

function appendJobLog(job, text) {
  job.log = `${job.log || ''}${text}`.slice(-160000);
  job.updatedAt = Date.now();
}

function runningJob(runtime, type, feedId, guid) {
  for (const job of runtime.jobs.values()) {
    if (job.type === type && job.feedId === feedId && job.guid === guid && job.status === 'running') {
      return job;
    }
  }
  return undefined;
}

function newJob(runtime, type, feed, episode) {
  runtime.jobSeq += 1;
  const job = {
    id: `${Date.now().toString(36)}-${runtime.jobSeq}`,
    type,
    feedId: feed.id,
    guid: episode.guid,
    title: episode.title,
    status: 'running',
    startedAt: Date.now(),
    updatedAt: Date.now(),
    finishedAt: 0,
    log: '',
    resultPath: '',
    error: '',
  };
  runtime.jobs.set(job.id, job);
  // Keep the in-memory job table bounded.
  if (runtime.jobs.size > 80) {
    const finished = [...runtime.jobs.values()]
      .filter((item) => item.status !== 'running')
      .sort((a, b) => a.startedAt - b.startedAt);
    while (runtime.jobs.size > 60 && finished.length) {
      runtime.jobs.delete(finished.shift().id);
    }
  }
  return job;
}

function newSetupJob(runtime) {
  const job = newJob(runtime, 'setup', { id: '' }, { guid: '', title: '转写环境' });
  job.title = '转写环境';
  return job;
}

function updateFeedError(runtime, feedId, message) {
  const library = runtime.store.getLibrary();
  const feed = library.feeds.find((item) => item.id === feedId);
  if (!feed) return;
  feed.lastError = message;
  feed.lastFetchedAt = Date.now();
  runtime.store.saveLibrary();
}

function episodeUrl(episode) {
  if (episode.link && /xiaoyuzhoufm\.com\/episode\//i.test(episode.link)) return episode.link;
  if (episode.guid && /^[0-9a-f]{16,32}$/i.test(episode.guid)) {
    return `https://www.xiaoyuzhoufm.com/episode/${episode.guid}`;
  }
  if (episode.link) return episode.link;
  throw new ApiError('这一集没有可用的单集链接', 400, 'missing-url');
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY) throw new ApiError('请求体过大', 413, 'too-large');
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('请求体不是合法 JSON', 400, 'bad-json');
  }
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function isInside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  return resolved === resolvedRoot || resolved.startsWith(`${resolvedRoot}${path.sep}`);
}

function buildApi(runtime) {
  const ctx = runtime.ctx;

  const api = {
    async state() {
      const library = requireStore(runtime).getLibrary();
      const feeds = library.feeds.map((feed) => feedView(runtime, feed));
      const counts = new Map();
      for (const feed of feeds) {
        counts.set(feed.category, (counts.get(feed.category) || 0) + 1);
      }
      const categories = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
        .map(([name, count]) => ({ name, count }));
      return {
        feeds,
        categories,
        stats: requireStore(runtime).globalStats(),
        settings: publicConfig(runtime.config),
        dataDir: runtime.config.dataDir,
      };
    },

    async episodes(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      return {
        feed: feedView(runtime, feed),
        episodes: requireStore(runtime).getEpisodes(feed.id),
      };
    },

    async episode(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const episode = requireEpisode(runtime, feed.id, payload.guid);
      let transcript = null;
      let notes = null;
      if (episode.transcriptPath && fs.existsSync(episode.transcriptPath)) {
        try {
          transcript = readText(episode.transcriptPath, 3 * 1024 * 1024);
        } catch {
          transcript = null;
        }
      }
      if (episode.notesPath && fs.existsSync(episode.notesPath)) {
        try {
          notes = readText(episode.notesPath, 3 * 1024 * 1024);
        } catch {
          notes = null;
        }
      }
      return { feed: feedView(runtime, feed), episode, transcript, notes };
    },

    async refresh(payload) {
      const feeds = payload.feedId
        ? [requireFeed(runtime, payload.feedId)]
        : [...requireStore(runtime).getLibrary().feeds];
      if (!feeds.length) return { results: [] };
      const results = await Promise.all(
        feeds.map(async (feed) => {
          try {
            const parsed = await fetchFeed(feed.url);
            const meta = {
              id: feed.id,
              url: feed.url,
              title: parsed.title,
              author: parsed.author,
              description: parsed.description,
              image: parsed.image,
              link: parsed.link,
              category: feed.category || parsed.categories[0] || '未分类',
              categories: parsed.categories,
              lastFetchedAt: Date.now(),
              lastError: '',
            };
            requireStore(runtime).upsertFeed(meta);
            const merged = requireStore(runtime).mergeEpisodes(feed.id, parsed.episodes);
            const updated = requireStore(runtime).getFeed(feed.id);
            if (updated && !updated.lastViewedAt) {
              updated.lastViewedAt = Date.now();
              requireStore(runtime).saveLibrary();
            }
            return { feedId: feed.id, title: parsed.title, added: merged.added, total: merged.total };
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            updateFeedError(runtime, feed.id, message);
            return { feedId: feed.id, title: feed.title, error: message };
          }
        }),
      );
      return {
        results,
        feeds: requireStore(runtime).getLibrary().feeds.map((feed) => feedView(runtime, feed)),
      };
    },

    async previewFeed(payload) {
      const url = normalizeFeedUrl(payload.url);
      const parsed = await fetchFeed(url);
      return {
        url,
        title: parsed.title,
        author: parsed.author,
        description: parsed.description,
        image: parsed.image,
        link: parsed.link,
        categories: parsed.categories,
        episodeCount: parsed.episodes.length,
      };
    },

    async addFeed(payload) {
      const url = normalizeFeedUrl(payload.url);
      const store = requireStore(runtime);
      if (store.getLibrary().feeds.some((feed) => feed.url === url)) {
        throw new ApiError('这个 RSS 已经订阅过了', 409, 'duplicate-feed');
      }
      const parsed = await fetchFeed(url);
      const category = cleanCategory(payload.category) || parsed.categories[0] || '未分类';
      store.upsertFeed({
        id: parsed.id,
        url,
        title: parsed.title,
        author: parsed.author,
        description: parsed.description,
        image: parsed.image,
        link: parsed.link,
        category,
        categories: parsed.categories,
        lastFetchedAt: Date.now(),
        lastViewedAt: Date.now(),
        lastError: '',
      });
      store.mergeEpisodes(parsed.id, parsed.episodes);
      return { feed: feedView(runtime, store.getFeed(parsed.id)) };
    },

    async updateFeedCategory(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const category = cleanCategory(payload.category);
      if (!category) throw new ApiError('分类名称不能为空', 400, 'category-required');
      const updated = requireStore(runtime).updateFeed(feed.id, { category });
      return { feed: feedView(runtime, updated) };
    },

    async removeFeed(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      requireStore(runtime).removeFeed(feed.id);
      return { removed: feed.id };
    },

    async markViewed(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const store = requireStore(runtime);
      const guid = String(payload.guid ?? '').trim();
      if (guid) {
        requireEpisode(runtime, feed.id, guid);
        const result = store.markEpisodeViewed(feed.id, guid, payload.viewed !== false);
        return {
          feedId: feed.id,
          guid,
          changed: result.changed,
          unreadCount: store.feedStats(feed.id).unreadCount,
        };
      }
      const result = store.markViewed(feed.id);
      return { feedId: feed.id, changed: result.changed, unreadCount: 0 };
    },

    async starEpisode(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const episode = requireEpisode(runtime, feed.id, payload.guid);
      const updated = requireStore(runtime).toggleStar(feed.id, episode.guid, payload.starred);
      return { feedId: feed.id, guid: updated.guid, starred: Boolean(updated.starred) };
    },

    async envStatus() {
      const value = await getEnvStatus(runtime.config);
      const setupJobs = [...runtime.jobs.values()]
        .filter((item) => item.type === 'setup')
        .sort((a, b) => b.startedAt - a.startedAt);
      const running = setupJobs.find((item) => item.status === 'running');
      return {
        ...value,
        installing: running ? jobView(running) : null,
        lastJob: setupJobs[0] ? jobView(setupJobs[0]) : null,
      };
    },

    async setupEnv() {
      const existing = runningJob(runtime, 'setup', '', '');
      if (existing) return jobView(existing);

      const job = newSetupJob(runtime);
      const controller = new AbortController();
      job.controller = controller;

      job.promise = (async () => {
        try {
          appendJobLog(job, '开始准备转写环境。首次会下载语音识别依赖，约 2GB，请保持网络连接。\n');
          const result = await prepareEnvironment({
            config: runtime.config,
            signal: controller.signal,
            onLog: (text) => appendJobLog(job, text),
          });
          runtime.config = { ...runtime.config, pythonPath: result.pythonPath };
          saveConfig(runtime.config);
          job.status = 'done';
          job.resultPath = result.pythonPath;
          job.finishedAt = Date.now();
          job.updatedAt = job.finishedAt;
          appendJobLog(job, `\n环境已就绪：${result.pythonPath}\n`);
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          job.status = controller.signal.aborted ? 'cancelled' : 'error';
          job.error = message;
          job.finishedAt = Date.now();
          job.updatedAt = job.finishedAt;
          appendJobLog(job, `\n失败：${message}\n`);
          if (job.status === 'error') logMessage(runtime, `环境安装失败：${message}`);
          return undefined;
        } finally {
          job.controller = undefined;
        }
      })();

      return jobView(job);
    },

    async transcribe(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const episode = requireEpisode(runtime, feed.id, payload.guid);
      const existing = runningJob(runtime, 'transcript', feed.id, episode.guid);
      if (existing) return jobView(existing);

      const env = await getEnvStatus(runtime.config);
      if (!env.ready) {
        throw new ApiError(
          '转写环境还没准备好：打开设置，点「一键准备转写环境」即可',
          400,
          'env-not-ready',
        );
      }
      if (env.pythonPath && env.pythonPath !== runtime.config.pythonPath) {
        runtime.config = { ...runtime.config, pythonPath: env.pythonPath };
        saveConfig(runtime.config);
      }

      const job = newJob(runtime, 'transcript', feed, episode);
      const controller = new AbortController();
      job.controller = controller;
      const url = episodeUrl(episode);
      const outputRoot = requireStore(runtime).transcriptRoot(feed.id);

      job.promise = (async () => {
        try {
          appendJobLog(job, `准备转写：${episode.title}\n`);
          const result = await runTranscription({
            pythonPath: runtime.config.pythonPath,
            scriptPath: runtime.config.scriptPath,
            episodeUrl: url,
            outputRoot,
            cwd: runtime.config.dataDir,
            signal: controller.signal,
            onLog: (text) => appendJobLog(job, text),
          });
          const text = readText(result.path, 4 * 1024 * 1024);
          const body = transcriptBody(text).replace(/\s+/g, '');
          if (body.length < 20) {
            fs.rmSync(result.path, { force: true });
            throw new Error('没有识别到有效语音（这一集可能是试听、静音或付费片段）');
          }
          const chars = text.length;
          const store = requireStore(runtime);
          const target = path.join(
            store.transcriptRoot(feed.id),
            `${dateStamp(episode.pubDate)}_${safeName(episode.title, 70)}.md`,
          );
          const sourceDir = path.dirname(result.path);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          if (path.resolve(result.path) !== path.resolve(target)) {
            fs.renameSync(result.path, target);
            result.path = target;
            try {
              fs.rmdirSync(sourceDir);
            } catch {
              // source directory may still hold other files
            }
          }
          const updated = store.updateEpisode(feed.id, episode.guid, {
            transcriptPath: result.path,
            transcriptAt: Date.now(),
            transcriptChars: chars,
          });
          job.status = 'done';
          job.resultPath = result.path;
          job.finishedAt = Date.now();
          job.updatedAt = job.finishedAt;
          appendJobLog(job, `\n完成：${result.path}\n`);
          return updated;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          job.status = controller.signal.aborted ? 'cancelled' : 'error';
          job.error = message;
          job.finishedAt = Date.now();
          job.updatedAt = job.finishedAt;
          appendJobLog(job, `\n失败：${message}\n`);
          if (job.status === 'error') {
            logMessage(runtime, `转写失败：${message}`);
            if (message.startsWith('没有识别到有效语音')) {
              try {
                requireStore(runtime).updateEpisode(feed.id, episode.guid, {
                  transcriptPath: '',
                  transcriptAt: 0,
                  transcriptChars: 0,
                });
              } catch {
                // best effort
              }
            }
          }
          return undefined;
        } finally {
          job.controller = undefined;
        }
      })();

      return jobView(job);
    },

    async notes(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const episode = requireEpisode(runtime, feed.id, payload.guid);
      const existing = runningJob(runtime, 'notes', feed.id, episode.guid);
      if (existing) return jobView(existing);
      if (!episode.transcriptPath || !fs.existsSync(episode.transcriptPath)) {
        throw new ApiError('请先生成这一集的逐字稿', 400, 'missing-transcript');
      }

      const job = newJob(runtime, 'notes', feed, episode);
      const controller = new AbortController();
      job.controller = controller;

      job.promise = (async () => {
        try {
          const transcript = loadTranscript(episode.transcriptPath);
          const skillPath = runtime.config.notesSkillPath;
          if (!fs.existsSync(skillPath)) throw new Error(`找不到专家访谈笔记 skill：${skillPath}`);
          const skillText = readText(skillPath);
          const route = await resolveRoute(ctx, runtime.config);
          const prompt = composeNotesPrompt({
            skillText,
            feedTitle: feed.title,
            episode,
            transcript,
          });
          const text = await generateNotes({
            ctx,
            route,
            system: prompt.system,
            user: prompt.user,
            maxTokens: runtime.config.notesMaxTokens,
            signal: controller.signal,
            onLog: (line) => appendJobLog(job, line),
          });
          const written = writeNotesFile(requireStore(runtime), feed.id, episode, text);
          requireStore(runtime).updateEpisode(feed.id, episode.guid, {
            notesPath: written.path,
            notesAt: Date.now(),
            notesChars: written.chars,
          });
          job.status = 'done';
          job.resultPath = written.path;
          job.finishedAt = Date.now();
          job.updatedAt = job.finishedAt;
          appendJobLog(job, `完成：${written.path}\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          job.status = controller.signal.aborted ? 'cancelled' : 'error';
          job.error = message;
          job.finishedAt = Date.now();
          job.updatedAt = job.finishedAt;
          appendJobLog(job, `失败：${message}\n`);
          if (job.status === 'error') logMessage(runtime, `笔记生成失败：${message}`);
        } finally {
          job.controller = undefined;
        }
      })();

      return jobView(job);
    },

    async jobs() {
      return [...runtime.jobs.values()]
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 30)
        .map(jobView);
    },

    async cancel(payload) {
      const job = runtime.jobs.get(String(payload.jobId ?? ''));
      if (!job) throw new ApiError('找不到这个任务', 404, 'job-not-found');
      if (job.status !== 'running') return jobView(job);
      job.controller?.abort();
      appendJobLog(job, '\n已请求取消…\n');
      return jobView(job);
    },

    async deleteArtifact(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const episode = requireEpisode(runtime, feed.id, payload.guid);
      const type = String(payload.type ?? '');
      if (type === 'transcript') {
        if (episode.transcriptPath) {
          try {
            fs.rmSync(episode.transcriptPath, { force: true });
          } catch {
            // best effort
          }
        }
        return {
          episode: requireStore(runtime).updateEpisode(feed.id, episode.guid, {
            transcriptPath: '',
            transcriptAt: 0,
            transcriptChars: 0,
          }),
        };
      }
      if (type === 'notes') {
        if (episode.notesPath) {
          try {
            fs.rmSync(episode.notesPath, { force: true });
          } catch {
            // best effort
          }
        }
        return {
          episode: requireStore(runtime).updateEpisode(feed.id, episode.guid, {
            notesPath: '',
            notesAt: 0,
            notesChars: 0,
          }),
        };
      }
      throw new ApiError('未知的文件类型', 400, 'bad-type');
    },

    async saveNotes(payload) {
      const feed = requireFeed(runtime, payload.feedId);
      const episode = requireEpisode(runtime, feed.id, payload.guid);
      if (!episode.notesPath || !fs.existsSync(episode.notesPath)) {
        throw new ApiError('这一集还没有笔记文件', 400, 'missing-notes');
      }
      const text = String(payload.text ?? '');
      if (!text.trim()) throw new ApiError('笔记内容不能为空', 400, 'empty-notes');
      const written = writeNotesFile(requireStore(runtime), feed.id, episode, text);
      requireStore(runtime).updateEpisode(feed.id, episode.guid, {
        notesPath: written.path,
        notesAt: Date.now(),
        notesChars: written.chars,
        notesEdited: true,
      });
      return { path: written.path, chars: written.chars };
    },

    async reveal(payload) {
      if (process.platform !== 'darwin') throw new ApiError('当前只支持在 macOS 上打开文件', 400, 'unsupported');
      let target = String(payload.path ?? '').trim();
      if (payload.kind) {
        const map = {
          data: runtime.config.dataDir,
          transcripts: path.join(runtime.config.dataDir, 'transcripts'),
          notes: path.join(runtime.config.dataDir, 'notes'),
        };
        target = map[String(payload.kind)] || '';
      }
      if (!target || !fs.existsSync(target)) throw new ApiError('路径不存在', 404, 'not-found');
      if (!isInside(runtime.config.dataDir, target)) throw new ApiError('只能打开插件数据目录里的文件', 403, 'forbidden');
      const directory = fs.statSync(target).isDirectory();
      const child = spawn('open', directory ? [target] : ['-R', target], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return { opened: target };
    },

    async settingsGet() {
      return { settings: publicConfig(runtime.config) };
    },

    async settingsSave(payload) {
      const next = validateSettings(payload || {}, runtime.config);
      const previousDir = runtime.config.dataDir;
      saveConfig(next);
      runtime.config = next;
      if (next.dataDir !== previousDir) {
        runtime.store = new Store(next);
      }
      const warnings = [];
      for (const [key, label] of [
        ['pythonPath', 'Python'],
        ['scriptPath', '转写脚本'],
        ['notesSkillPath', '笔记 skill'],
      ]) {
        if (!fs.existsSync(next[key])) warnings.push(`${label}不存在：${next[key]}`);
      }
      return { settings: publicConfig(next), dataDir: next.dataDir, warnings };
    },

    async models() {
      const now = Date.now();
      if (runtime.models && runtime.models.expiresAt > now) return runtime.models.value;
      const llm = ctx.get('llm');
      if (!llm || typeof llm.listProviders !== 'function') {
        return { providers: [], current: undefined };
      }
      let providers = [];
      try {
        const list = await llm.listProviders();
        providers = await Promise.all(
          (Array.isArray(list) ? list : []).map(async (provider) => {
            try {
              const models = await llm.listModels(provider.id);
              return {
                id: provider.id,
                name: provider.name || provider.id,
                models: await Promise.all(
                  (Array.isArray(models) ? models : []).map(async (model) => {
                    let info;
                    try {
                      info = await llm.resolveModelInfo?.(provider.id, model.id);
                    } catch {
                      info = undefined;
                    }
                    return {
                      id: model.id,
                      name: model.name || model.id,
                      reasoning: info?.reasoning,
                      inputModalities: info?.inputModalities,
                    };
                  }),
                ),
              };
            } catch {
              return { id: provider.id, name: provider.name || provider.id, models: [] };
            }
          }),
        );
      } catch {
        providers = [];
      }
      let current;
      try {
        const selector = ctx.get('agentDefaultModel');
        current = await Promise.resolve(selector?.currentSelection?.());
      } catch {
        current = undefined;
      }
      const value = { providers, current: current ? { provider: current.provider, model: current.model } : undefined };
      runtime.models = { value, expiresAt: now + 60_000 };
      return value;
    },
  };

  return api;
}

function installRoute(ctx, runtime) {
  const api = buildApi(runtime);
  return ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: ROUTE_PREFIX,
        handler: async (req, res) => {
          const connection = ctx.get('connection');
          const rejection = connection?.requestRejection?.(req);
          if (rejection !== undefined) {
            sendJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'forbidden' } });
            return;
          }
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, error: { code: 'method-error', message: 'method not allowed' } });
            return;
          }
          const pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname;
          const rest = pathname.startsWith(`${ROUTE_PREFIX}/`) ? pathname.slice(ROUTE_PREFIX.length + 1) : '';
          const method = rest.includes('/') ? '' : rest;
          if (!method || !/^[a-zA-Z.]+$/.test(method)) {
            sendJson(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown podcast API' } });
            return;
          }
          const handler = api[method];
          if (typeof handler !== 'function') {
            sendJson(res, 404, { ok: false, error: { code: 'not-found', message: `unknown method ${method}` } });
            return;
          }
          try {
            const payload = await readJsonBody(req);
            const value = await handler(payload);
            sendJson(res, 200, { ok: true, value });
          } catch (error) {
            const status = Number(error?.status) || 500;
            if (status >= 500) {
              logMessage(runtime, `${method} failed: ${error instanceof Error ? error.stack || error.message : String(error)}`);
            }
            sendJson(res, status, {
              ok: false,
              error: {
                code: error?.code || 'error',
                message: error instanceof Error ? error.message : String(error),
              },
            });
          }
        },
      }),
    'dsh-podcast-notes: api',
  );
}

export const name = 'dsh-podcast-notes';
export const inject = ['webServer'];

export function apply(ctx) {
  runtime = createRuntime(ctx);
  installRoute(ctx, runtime);
  ctx.effect(
    () => () => {
      for (const job of runtime.jobs.values()) {
        try {
          job.controller?.abort();
        } catch {
          // ignore
        }
      }
    },
    'dsh-podcast-notes: jobs',
  );
  logMessage(runtime, `ready · ${runtime.config.dataDir}`);
}
