import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

function appendTail(current, chunk, limit = 160000) {
  const next = current + chunk;
  return next.length > limit ? next.slice(-limit) : next;
}

function walkMarkdown(dir, depth = 0) {
  if (depth > 5) return [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(full, depth + 1));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function newestMarkdown(root, since) {
  let best;
  for (const file of walkMarkdown(root)) {
    try {
      const stat = fs.statSync(file);
      if (stat.size < 200) continue;
      if (stat.mtimeMs + 5000 < since) continue;
      if (!best || stat.mtimeMs > best.mtimeMs) best = { file, mtimeMs: stat.mtimeMs };
    } catch {
      // ignore races
    }
  }
  return best?.file;
}

function extractPrintedPath(output) {
  let found = '';
  const pattern = /(?:→|➜|->)\s*(\/[^\n\r]+?\.md)\s*$/gm;
  for (const match of output.matchAll(pattern)) {
    found = match[1].trim().replace(/^["'`]|["'`]$/g, '');
  }
  return found;
}

/**
 * Run the podcast-to-markdown skill in single-episode mode.
 * Resolves with the produced markdown path.
 */
export function runTranscription({
  pythonPath,
  scriptPath,
  episodeUrl,
  outputRoot,
  cwd,
  signal,
  onLog = () => {},
  timeoutMs = 75 * 60 * 1000,
}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(pythonPath)) {
      reject(new Error(`Python 不存在：${pythonPath}`));
      return;
    }
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`转写脚本不存在：${scriptPath}`));
      return;
    }
    fs.mkdirSync(outputRoot, { recursive: true });
    const startedAt = Date.now();
    let output = '';
    let settled = false;
    let killTimer;
    let timeout;

    onLog(`启动转写：${episodeUrl}\n`);
    const child = spawn(pythonPath, ['-u', scriptPath, episodeUrl, '--output', outputRoot], {
      cwd: cwd || outputRoot,
      env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(killTimer);
      if (error) reject(error);
      else resolve(value);
    };

    const terminate = () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
      killTimer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore
        }
      }, 5000);
    };

    const onAbort = () => terminate();
    if (signal) {
      if (signal.aborted) {
        terminate();
        finish(new Error('已取消'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    timeout = setTimeout(() => {
      terminate();
      finish(new Error('转写超过 75 分钟，已终止'));
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      const text = data.toString('utf8');
      output = appendTail(output, text);
      onLog(text);
    });
    child.stderr.on('data', (data) => {
      const text = data.toString('utf8');
      output = appendTail(output, text);
      onLog(text);
    });
    child.on('error', (error) => {
      signal?.removeEventListener?.('abort', onAbort);
      finish(error);
    });
    child.on('close', (code, exitSignal) => {
      signal?.removeEventListener?.('abort', onAbort);
      if (settled) return;
      if (signal?.aborted) {
        finish(new Error('已取消'));
        return;
      }
      if (code !== 0) {
        const tail = output.trim().split('\n').slice(-8).join('\n');
        finish(new Error(`转写失败（退出码 ${code ?? exitSignal}）：${tail || '没有输出'}`));
        return;
      }
      let produced = extractPrintedPath(output);
      if (!produced || !fs.existsSync(produced)) {
        produced = newestMarkdown(outputRoot, startedAt);
      }
      if (!produced || !fs.existsSync(produced)) {
        finish(new Error('转写结束，但没有找到生成的 Markdown 文件'));
        return;
      }
      const chars = fs.statSync(produced).size;
      finish(null, { path: produced, bytes: chars, output });
    });
  });
}

export function stripFrontmatter(text) {
  return String(text ?? '').replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, '');
}

export function transcriptBody(text) {
  const marker = '## 逐字稿';
  const source = String(text ?? '');
  const at = source.indexOf(marker);
  return (at >= 0 ? source.slice(at + marker.length) : source).trim();
}

export function readText(file, limit = 2 * 1024 * 1024) {
  const stat = fs.statSync(file);
  if (stat.size > limit) throw new Error('文件过大，无法读取');
  return fs.readFileSync(file, 'utf8');
}

export function clipTranscript(text, maxChars = 90000) {
  if (text.length <= maxChars) return text;
  const head = Math.floor(maxChars * 0.66);
  const tail = maxChars - head;
  return `${text.slice(0, head)}\n\n[…中间省略 ${text.length - maxChars} 字…]\n\n${text.slice(-tail)}`;
}

export function composeNotesPrompt({ skillText, feedTitle, episode, transcript }) {
  const date = episode.pubDate ? new Date(episode.pubDate).toISOString().slice(0, 10) : '';
  const system = `${stripFrontmatter(skillText)}

---

你正在处理一份播客逐字稿。请严格按照上面的方法，把它整理成一份可以直接存入知识库的专家访谈笔记。

硬性要求：
- 只输出 Markdown 正文，从标题开始；不要输出解释、前言、代码围栏或“以下是整理结果”。
- 标题要同时点明对话对象和讨论领域。
- 用议题组织章节，不要按时间顺序复述。
- 保留逐字稿里的具体数字、人名、公司、案例、反例、保留意见和不确定性。
- 逐字稿没有说的，不要补；推断要标注为推断。
- 篇幅控制在中文 1800–4200 字。节目再长也不要逐段扩写；合并重复观点，宁可少写，也要保留判断和证据。
- 不要写行动计划、待办、分工、OKR 或战略建议。`;

  const user = `节目：${feedTitle || '未命名播客'}
单集：${episode.title}
发布日期：${date || '未知'}
时长：${episode.duration ? `${Math.round(episode.duration / 60)} 分钟` : '未知'}
原始链接：${episode.link || '无'}

逐字稿：
${clipTranscript(transcript)}`;

  return { system, user };
}
