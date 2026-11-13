import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { detectProxy } from './rss.js';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

// Runtime lives outside the plugin package, so plugin updates don't wipe the
// downloaded Python/deps and the desktop profile's node_modules stays clean.
export const RUNTIME_DIR = process.env.PODCAST_NOTES_RUNTIME_DIR
  ? path.resolve(process.env.PODCAST_NOTES_RUNTIME_DIR)
  : path.join(os.homedir(), '.dsh', 'podcast-notes', 'runtime');
export const VENV_DIR = path.join(RUNTIME_DIR, 'venv');
export const VENV_PYTHON = path.join(VENV_DIR, 'bin', 'python');
export const READY_FILE = path.join(RUNTIME_DIR, 'ready.json');

const PYTHON_DIR = path.join(RUNTIME_DIR, 'python');
const PYTHON_BIN = path.join(PYTHON_DIR, 'bin', 'python3');
const SETUP_SCRIPT = process.env.PODCAST_NOTES_SETUP_SCRIPT
  ? path.resolve(process.env.PODCAST_NOTES_SETUP_SCRIPT)
  : path.join(ROOT, 'scripts', 'setup-env.sh');

// python-build-standalone: self-contained CPython, no system Python / Xcode
// CLT required. 3.11 keeps torch/funasr wheel compatibility boring.
const PYTHON_URLS = {
  arm64:
    'https://github.com/astral-sh/python-build-standalone/releases/download/20261110/cpython-3.11.18%2B20261110-aarch64-apple-darwin-install_only.tar.gz',
  x64:
    'https://github.com/astral-sh/python-build-standalone/releases/download/20261110/cpython-3.11.18%2B20261110-x86_64-apple-darwin-install_only.tar.gz',
};

const DEPS_CODE = [
  'import importlib.util as u',
  "mods = ['funasr', 'modelscope', 'torch', 'feedparser', 'requests', 'tqdm', 'imageio_ffmpeg']",
  'missing = [m for m in mods if u.find_spec(m) is None]',
  'raise SystemExit(1 if missing else 0)',
].join('\n');
const VERSION_CODE = 'import sys; print("%d.%d" % sys.version_info[:2])';

let depsCache = new Map();

function logLine(onLog, text) {
  if (typeof onLog === 'function') onLog(text);
}

async function probeVersion(pythonPath) {
  try {
    const { stdout } = await execFileAsync(pythonPath, ['-c', VERSION_CODE], {
      timeout: 8000,
      maxBuffer: 1024 * 1024,
    });
    return String(stdout).trim();
  } catch {
    return '';
  }
}

function majorMinor(version) {
  const [major, minor] = String(version)
    .split('.')
    .map((value) => Number(value));
  return { major, minor };
}

async function probeDeps(pythonPath, { timeout = 60_000 } = {}) {
  if (!pythonPath || !fs.existsSync(pythonPath)) return false;
  const now = Date.now();
  const cached = depsCache.get(pythonPath);
  if (cached && now - cached.at < 60_000) return cached.ok;
  let ok = false;
  try {
    await execFileAsync(pythonPath, ['-c', DEPS_CODE], {
      timeout,
      maxBuffer: 1024 * 1024,
    });
    ok = true;
  } catch {
    ok = false;
  }
  depsCache.set(pythonPath, { at: now, ok });
  return ok;
}

function clearDepsCache() {
  depsCache = new Map();
}

function readReady() {
  try {
    const value = JSON.parse(fs.readFileSync(READY_FILE, 'utf8'));
    if (value && typeof value.pythonPath === 'string' && fs.existsSync(value.pythonPath)) return value;
  } catch {
    // no marker yet
  }
  return undefined;
}

function writeReady(value) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const temp = `${READY_FILE}.tmp-${process.pid}`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, READY_FILE);
}

function runProcess(command, args, { env, onLine, signal, timeoutMs = 45 * 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: env || process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      // A new process group lets cancel kill curl/pip's children too; otherwise
      // a surviving grandchild keeps the stdout pipe open and the job hangs.
      detached: process.platform !== 'win32',
    });
    const killTree = (sig) => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, sig);
      } catch {
        try {
          child.kill(sig);
        } catch {
          // already gone
        }
      }
    };
    let tail = '';
    let settled = false;
    let timer;
    let killTimer;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      signal?.removeEventListener?.('abort', abort);
      if (error) reject(error);
      else resolve();
    };
    const abort = () => {
      killTree('SIGTERM');
      killTimer = setTimeout(() => killTree('SIGKILL'), 5000);
      killTimer.unref?.();
    };
    const push = (chunk) => {
      const text = chunk.toString();
      tail = `${tail}${text}`.slice(-6000);
      logLine(onLine, text);
    };

    child.stdout.on('data', push);
    child.stderr.on('data', push);
    child.on('error', (error) => finish(error));
    child.on('close', (code) => {
      if (signal?.aborted) {
        finish(new Error('已取消'));
        return;
      }
      if (code === 0) {
        finish();
        return;
      }
      const detail = tail.trim().split('\n').slice(-6).join(' ');
      finish(new Error(`命令失败（退出码 ${code}）：${detail || command}`));
    });

    timer = setTimeout(() => {
      killTree('SIGTERM');
      killTimer = setTimeout(() => killTree('SIGKILL'), 5000);
      killTimer.unref?.();
    }, timeoutMs);
    timer.unref?.();

    if (signal) {
      if (signal.aborted) abort();
      else signal.addEventListener('abort', abort, { once: true });
    }
  });
}

async function downloadPython(onLog, signal) {
  const arch = process.arch === 'arm64' ? 'arm64' : process.arch === 'x64' ? 'x64' : '';
  if (process.platform !== 'darwin' || !arch) {
    throw new Error(`当前系统（${process.platform}/${process.arch}）暂不支持自动安装，请手动准备 Python 3.9+ 环境`);
  }
  const url = PYTHON_URLS[arch];
  const tarPath = path.join(RUNTIME_DIR, 'python-runtime.tar.gz');
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  logLine(onLog, `没有找到可用的 Python，下载独立运行时（约 27MB）…\n`);

  const args = [
    '-f', '-L', '-S', '-s',
    '--retry', '4', '--retry-all-errors', '--retry-delay', '2',
    '--connect-timeout', '20', '--max-time', '900',
    '-o', tarPath, url,
  ];
  try {
    const proxy = await detectProxy();
    if (proxy) args.unshift('-x', proxy);
    await runProcess('/usr/bin/curl', args, { onLine, signal, timeoutMs: 15 * 60_000 });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`下载 Python 运行时失败：${error.message}`);
  }

  logLine(onLog, '解压 Python 运行时…\n');
  try {
    fs.rmSync(PYTHON_DIR, { recursive: true, force: true });
    await runProcess('/usr/bin/tar', ['-xzf', tarPath, '-C', RUNTIME_DIR], { onLine, signal, timeoutMs: 5 * 60_000 });
    fs.rmSync(tarPath, { force: true });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`解压 Python 运行时失败：${error.message}`);
  }
  if (!fs.existsSync(PYTHON_BIN)) throw new Error('Python 运行时解压后不完整，请重试');
  return PYTHON_BIN;
}

async function findSystemPython(config) {
  const candidates = [
    config?.pythonPath,
    '/opt/homebrew/bin/python3',
    '/usr/local/bin/python3',
    '/usr/bin/python3',
    'python3.12',
    'python3.11',
    'python3.10',
    'python3.9',
    'python3',
  ].filter(Boolean);
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const version = await probeVersion(candidate);
    if (!version) continue;
    const { major, minor } = majorMinor(version);
    if (major > 3 || (major === 3 && minor >= 9)) return { path: candidate, version };
  }
  return undefined;
}

async function runSetup(pythonPath, onLine, signal) {
  const runOnce = (extraArgs) =>
    runProcess('/bin/bash', [SETUP_SCRIPT, ...extraArgs], {
      env: {
        ...process.env,
        VENV_DIR,
        PYTHON: pythonPath,
        PIP_DISABLE_PIP_VERSION_CHECK: '1',
      },
      onLine,
      signal,
      timeoutMs: 45 * 60_000,
    });

  try {
    await runOnce([]);
  } catch (error) {
    if (signal?.aborted) throw error;
    logLine(onLine, `\n直接安装失败，换国内镜像重试一次…\n`);
    await runOnce(['--cn']);
  }
}

export async function getEnvStatus(config) {
  const base = {
    runtimeDir: RUNTIME_DIR,
    platform: process.platform,
    arch: process.arch,
    canAutoInstall: process.platform === 'darwin' && (process.arch === 'arm64' || process.arch === 'x64'),
    setupScript: fs.existsSync(SETUP_SCRIPT),
  };

  const ready = readReady();
  if (ready && (await probeDeps(ready.pythonPath))) {
    return { ...base, ready: true, pythonPath: ready.pythonPath, version: ready.version || '', source: 'installed' };
  }
  if (config?.pythonPath && (await probeDeps(config.pythonPath))) {
    return { ...base, ready: true, pythonPath: config.pythonPath, version: await probeVersion(config.pythonPath), source: 'configured' };
  }
  if (await probeDeps(VENV_PYTHON)) {
    const version = await probeVersion(VENV_PYTHON);
    writeReady({ pythonPath: VENV_PYTHON, version, installedAt: Date.now() });
    return { ...base, ready: true, pythonPath: VENV_PYTHON, version, source: 'installed' };
  }
  return { ...base, ready: false, pythonPath: config?.pythonPath || '', version: '', source: 'missing' };
}

export async function prepareEnvironment({ config, onLog, signal } = {}) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  if (!fs.existsSync(SETUP_SCRIPT)) {
    throw new Error(`安装脚本缺失：${SETUP_SCRIPT}`);
  }

  logLine(onLog, '检查转写环境…\n');
  if (await probeDeps(VENV_PYTHON)) {
    const version = await probeVersion(VENV_PYTHON);
    writeReady({ pythonPath: VENV_PYTHON, version, installedAt: Date.now() });
    return { pythonPath: VENV_PYTHON, version, already: true };
  }

  let python;
  const system = await findSystemPython(config);
  if (system) {
    python = system.path;
    logLine(onLog, `使用 Python ${system.version}：${python}\n`);
  } else {
    python = await downloadPython(onLog, signal);
    logLine(onLog, `使用自带 Python：${python}\n`);
  }

  await runSetup(python, onLog, signal);
  clearDepsCache();

  if (!(await probeDeps(VENV_PYTHON))) {
    throw new Error('依赖装完了，但自检没有通过；请查看上面的日志');
  }
  const version = await probeVersion(VENV_PYTHON);
  writeReady({ pythonPath: VENV_PYTHON, version, installedAt: Date.now() });
  return { pythonPath: VENV_PYTHON, version };
}
