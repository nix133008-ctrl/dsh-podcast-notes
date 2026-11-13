import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { feedIdFor } from './rss.js';

const HOME = os.homedir();

export const CONFIG_DIR = path.join(HOME, '.dsh', 'podcast-notes');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export const DEFAULT_FEEDS = [
  'https://feed.xyzfm.space/qe8egag9eycv',
  'https://feed.xyzfm.space/myefm33b8n77',
  'https://feed.xyzfm.space/n6yvyxjvldc3',
  'https://feed.xyzfm.space/dv4uhcuxefx7',
];

function firstExisting(candidates, fallback) {
  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch {
      // ignore unreadable candidates
    }
  }
  return fallback;
}

const SKILL_CANDIDATES = [
  path.join(HOME, '.dsh/skills/expert-interview-notes/SKILL.md'),
  path.join(HOME, '.claude/skills/expert-interview-notes/SKILL.md'),
];

// The transcript script lives in the vita-podcast-download-skill package. When
// that package sits next to this one (a plain git clone of both repos), use it
// directly so a fresh install works without touching the skill directories.
function localSiblingCandidates(...relative) {
  const here = path.dirname(new URL(import.meta.url).pathname);
  return [
    path.resolve(here, '..', 'vita-podcast-download-skill', ...relative),
    path.resolve(here, '..', '..', 'vita-podcast-download-skill', ...relative),
  ];
}

const SCRIPT_CANDIDATES = [
  ...localSiblingCandidates('scripts', 'podcast_to_md.py'),
  path.join(HOME, '.claude/skills/vita-podcast-download-skill/scripts/podcast_to_md.py'),
  path.join(HOME, '.dsh/skills/vita-podcast-download-skill/scripts/podcast_to_md.py'),
];
const PYTHON_CANDIDATES = [
  ...localSiblingCandidates('.venv', 'bin', 'python'),
  path.join(HOME, '.claude/skills/vita-podcast-download-skill/.venv/bin/python'),
  path.join(HOME, '.dsh/skills/vita-podcast-download-skill/.venv/bin/python'),
  '/opt/homebrew/bin/python3',
  '/usr/local/bin/python3',
  '/usr/bin/python3',
];

export function defaultConfig() {
  return {
    dataDir: path.join(HOME, 'cc', 'vibe', '播客', 'podcast-data'),
    pythonPath: firstExisting(PYTHON_CANDIDATES, 'python3'),
    scriptPath: firstExisting(SCRIPT_CANDIDATES, SCRIPT_CANDIDATES[0]),
    notesSkillPath: firstExisting(SKILL_CANDIDATES, SKILL_CANDIDATES[0]),
    provider: '',
    model: '',
    refreshMinutes: 30,
    notesMaxTokens: 8192,
  };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

export function loadConfig() {
  const stored = readJson(CONFIG_PATH);
  const base = defaultConfig();
  if (!stored || typeof stored !== 'object') return base;
  return {
    ...base,
    ...stored,
    dataDir: typeof stored.dataDir === 'string' && path.isAbsolute(stored.dataDir) ? stored.dataDir : base.dataDir,
    refreshMinutes: clampNumber(stored.refreshMinutes, 5, 1440, base.refreshMinutes),
    notesMaxTokens: clampNumber(stored.notesMaxTokens, 1024, 16384, base.notesMaxTokens),
  };
}

export function saveConfig(config) {
  const next = {
    ...config,
    dataDir: path.resolve(config.dataDir),
  };
  writeJsonAtomic(CONFIG_PATH, next);
  return next;
}

export function publicConfig(config) {
  return {
    dataDir: config.dataDir,
    pythonPath: config.pythonPath,
    scriptPath: config.scriptPath,
    notesSkillPath: config.notesSkillPath,
    provider: config.provider,
    model: config.model,
    refreshMinutes: config.refreshMinutes,
    notesMaxTokens: config.notesMaxTokens,
  };
}

export function validateSettings(input, current) {
  const next = { ...current };
  if (input.dataDir !== undefined) {
    const value = String(input.dataDir).trim();
    if (!value || !path.isAbsolute(value)) throw new Error('数据目录必须是绝对路径');
    next.dataDir = path.resolve(value);
  }
  for (const key of ['pythonPath', 'scriptPath', 'notesSkillPath']) {
    if (input[key] !== undefined) {
      const value = String(input[key]).trim();
      if (!value || !path.isAbsolute(value)) throw new Error(`${key} 必须是绝对路径`);
      next[key] = value;
    }
  }
  if (input.provider !== undefined) next.provider = String(input.provider).trim();
  if (input.model !== undefined) next.model = String(input.model).trim();
  if (input.refreshMinutes !== undefined) {
    next.refreshMinutes = clampNumber(input.refreshMinutes, 5, 1440, current.refreshMinutes);
  }
  if (input.notesMaxTokens !== undefined) {
    next.notesMaxTokens = clampNumber(input.notesMaxTokens, 1024, 16384, current.notesMaxTokens);
  }
  return next;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function safeName(input, maxLength = 90) {
  const cleaned = String(input ?? '')
    .replace(/[\\/:*?"<>|\n\r\t]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '');
  return (cleaned || '未命名').slice(0, maxLength);
}

export function dateStamp(timestamp) {
  const date = new Date(timestamp || Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class Store {
  constructor(config) {
    this.config = config;
    this.dataDir = path.resolve(config.dataDir);
    this.episodesDir = path.join(this.dataDir, 'episodes');
    this.transcriptsDir = path.join(this.dataDir, 'transcripts');
    this.notesDir = path.join(this.dataDir, 'notes');
    this.libraryPath = path.join(this.dataDir, 'library.json');
    this.library = undefined;
    this.episodes = new Map();
    this.ensureDirs();
  }

  ensureDirs() {
    for (const dir of [this.dataDir, this.episodesDir, this.transcriptsDir, this.notesDir]) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  getLibrary() {
    if (this.library) return this.library;
    let stored = readJson(this.libraryPath);
    if (!stored || !Array.isArray(stored.feeds)) {
      stored = {
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        feeds: DEFAULT_FEEDS.map((url) => this.blankFeed(url)),
      };
      writeJsonAtomic(this.libraryPath, stored);
    }
    this.library = stored;
    return stored;
  }

  blankFeed(url) {
    return {
      id: feedIdFor(url),
      url,
      title: '',
      author: '',
      description: '',
      image: '',
      link: url,
      category: '',
      categories: [],
      addedAt: Date.now(),
      lastFetchedAt: 0,
      lastViewedAt: 0,
      lastError: '',
      episodeCount: 0,
    };
  }

  saveLibrary() {
    const library = this.getLibrary();
    library.updatedAt = Date.now();
    writeJsonAtomic(this.libraryPath, library);
  }

  feedFile(feedId) {
    return path.join(this.episodesDir, `${feedId}.json`);
  }

  getEpisodes(feedId) {
    if (this.episodes.has(feedId)) return this.episodes.get(feedId);
    const stored = readJson(this.feedFile(feedId));
    const list = Array.isArray(stored?.episodes) ? stored.episodes : [];
    list.sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));
    this.episodes.set(feedId, list);
    return list;
  }

  saveEpisodes(feedId, list) {
    list.sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));
    this.episodes.set(feedId, list);
    writeJsonAtomic(this.feedFile(feedId), {
      version: 1,
      feedId,
      updatedAt: Date.now(),
      episodes: list,
    });
  }

  getFeed(feedId) {
    return this.getLibrary().feeds.find((feed) => feed.id === feedId);
  }

  upsertFeed(meta) {
    const library = this.getLibrary();
    const index = library.feeds.findIndex((feed) => feed.id === meta.id);
    if (index === -1) {
      library.feeds.push({ ...this.blankFeed(meta.url), ...meta, addedAt: Date.now() });
    } else {
      const previous = library.feeds[index];
      library.feeds[index] = {
        ...previous,
        ...meta,
        addedAt: previous.addedAt,
        lastViewedAt: previous.lastViewedAt,
      };
    }
    this.saveLibrary();
    return library.feeds.find((feed) => feed.id === meta.id);
  }

  mergeEpisodes(feedId, incoming) {
    const existing = this.getEpisodes(feedId);
    const byGuid = new Map(existing.map((episode) => [episode.guid, episode]));
    let added = 0;
    const merged = [];
    const seen = new Set();
    for (const raw of incoming) {
      if (!raw.guid || seen.has(raw.guid)) continue;
      seen.add(raw.guid);
      const previous = byGuid.get(raw.guid);
      if (!previous) added += 1;
      merged.push({
        ...previous,
        ...raw,
        firstSeenAt: previous?.firstSeenAt ?? Date.now(),
        lastSeenAt: Date.now(),
        transcriptPath: previous?.transcriptPath ?? '',
        transcriptAt: previous?.transcriptAt ?? 0,
        transcriptChars: previous?.transcriptChars ?? 0,
        notesPath: previous?.notesPath ?? '',
        notesAt: previous?.notesAt ?? 0,
        notesChars: previous?.notesChars ?? 0,
        notesEdited: previous?.notesEdited ?? false,
        viewedAt: previous?.viewedAt ?? 0,
        starred: previous?.starred ?? false,
      });
    }
    for (const old of existing) {
      if (!seen.has(old.guid)) merged.push(old);
    }
    this.saveEpisodes(feedId, merged);
    return { added, total: merged.length };
  }

  findEpisode(feedId, guid) {
    return this.getEpisodes(feedId).find((episode) => episode.guid === guid);
  }

  updateEpisode(feedId, guid, patch) {
    const list = this.getEpisodes(feedId);
    const index = list.findIndex((episode) => episode.guid === guid);
    if (index === -1) throw new Error('找不到这一集');
    list[index] = { ...list[index], ...patch };
    this.saveEpisodes(feedId, list);
    return list[index];
  }

  updateFeed(feedId, patch) {
    const library = this.getLibrary();
    const index = library.feeds.findIndex((feed) => feed.id === feedId);
    if (index === -1) throw new Error('找不到这个播客');
    library.feeds[index] = { ...library.feeds[index], ...patch };
    this.saveLibrary();
    return library.feeds[index];
  }

  markEpisodeViewed(feedId, guid, viewed = true) {
    const list = this.getEpisodes(feedId);
    const index = list.findIndex((episode) => episode.guid === guid);
    if (index === -1) throw new Error('找不到这一集');
    const next = viewed ? Date.now() : 0;
    const changed = Boolean(list[index].viewedAt) !== Boolean(next);
    if (changed) {
      list[index] = { ...list[index], viewedAt: next };
      this.saveEpisodes(feedId, list);
    }
    return { episode: list[index], changed };
  }

  markViewed(feedId) {
    const feed = this.getFeed(feedId);
    if (!feed) return { changed: 0 };
    const now = Date.now();
    const list = this.getEpisodes(feedId);
    let changed = 0;
    for (const episode of list) {
      if (!episode.viewedAt) {
        episode.viewedAt = now;
        changed += 1;
      }
    }
    if (changed) this.saveEpisodes(feedId, list);
    feed.lastViewedAt = now;
    this.saveLibrary();
    return { changed };
  }

  toggleStar(feedId, guid, starred) {
    const list = this.getEpisodes(feedId);
    const index = list.findIndex((episode) => episode.guid === guid);
    if (index === -1) throw new Error('找不到这一集');
    const next = typeof starred === 'boolean' ? starred : !list[index].starred;
    list[index] = { ...list[index], starred: next };
    this.saveEpisodes(feedId, list);
    return list[index];
  }

  removeFeed(feedId) {
    const library = this.getLibrary();
    const before = library.feeds.length;
    library.feeds = library.feeds.filter((feed) => feed.id !== feedId);
    this.saveLibrary();
    this.episodes.delete(feedId);
    try {
      fs.rmSync(this.feedFile(feedId), { force: true });
    } catch {
      // best effort
    }
    return before !== library.feeds.length;
  }

  feedStats(feedId) {
    const feed = this.getFeed(feedId);
    const list = this.getEpisodes(feedId);
    const since = feed?.lastViewedAt ?? 0;
    return {
      episodeCount: list.length,
      transcriptCount: list.filter((episode) => episode.transcriptPath).length,
      notesCount: list.filter((episode) => episode.notesPath).length,
      unreadCount: list.filter((episode) => !episode.viewedAt).length,
      starredCount: list.filter((episode) => episode.starred).length,
      newCount: since ? list.filter((episode) => (episode.pubDate || 0) > since).length : 0,
    };
  }

  globalStats() {
    let totalEpisodes = 0;
    let transcriptCount = 0;
    let notesCount = 0;
    let unreadCount = 0;
    let starredCount = 0;
    let newCount = 0;
    for (const feed of this.getLibrary().feeds) {
      const stats = this.feedStats(feed.id);
      totalEpisodes += stats.episodeCount;
      transcriptCount += stats.transcriptCount;
      notesCount += stats.notesCount;
      unreadCount += stats.unreadCount;
      starredCount += stats.starredCount;
      newCount += stats.newCount;
    }
    return {
      feeds: this.getLibrary().feeds.length,
      totalEpisodes,
      transcriptCount,
      notesCount,
      unreadCount,
      starredCount,
      newCount,
    };
  }

  transcriptRoot(feedId) {
    return path.join(this.transcriptsDir, safeName(feedId, 40));
  }

  notesRoot(feedId) {
    return path.join(this.notesDir, safeName(feedId, 40));
  }

  notesPath(feedId, episode) {
    const stamp = dateStamp(episode.pubDate || Date.now());
    return path.join(this.notesRoot(feedId), `${stamp}_${safeName(episode.title, 70)}.md`);
  }
}
