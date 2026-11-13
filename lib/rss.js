import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CURL = '/usr/bin/curl';
const CURL_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) DSH-Podcast-Notes/0.1';
const PROXY_TTL = 60_000;
let proxyCache = { at: 0, url: '' };

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
};

export function decodeEntities(input) {
  if (!input) return '';
  return String(input).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (match, body) => {
    if (body[0] === '#') {
      const code = body[1]?.toLowerCase() === 'x' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
      if (Number.isFinite(code) && code >= 0 && code <= 0x10ffff) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      return match;
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

function cdata(input) {
  return String(input ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tag(block, name) {
  const pattern = new RegExp(`<${escapeRegExp(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapeRegExp(name)}>`, 'i');
  const match = block.match(pattern);
  if (!match) return '';
  return decodeEntities(cdata(match[1])).trim();
}

function attr(block, name) {
  const pattern = new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = block.match(pattern);
  if (!match) return '';
  return decodeEntities(match[1] ?? match[2] ?? '').trim();
}

function selfTag(block, name) {
  const pattern = new RegExp(`<${escapeRegExp(name)}\\b[^>]*\\/?>`, 'i');
  return block.match(pattern)?.[0] ?? '';
}

export function stripHtml(input) {
  if (!input) return '';
  let text = String(input);
  text = text.replace(/<script\b[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n');
  text = text.replace(/<li\b[^>]*>/gi, '· ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeEntities(text);
  text = text.replace(/\r\n?/g, '\n');
  text = text.replace(/[ \t\f\v]+/g, ' ');
  text = text.replace(/ *\n */g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

export function parseDuration(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number.parseInt(raw, 10);
  const parts = raw.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

const CATEGORY_ZH = {
  'Health & Fitness': '健康',
  Health: '健康',
  Fitness: '健身',
  Business: '商业',
  'Business News': '商业',
  Technology: '科技',
  'Tech News': '科技',
  'Society & Culture': '社会文化',
  Society: '社会',
  Culture: '文化',
  Education: '教育',
  Leisure: '休闲',
  Science: '科学',
  News: '新闻',
  'Daily News': '新闻',
  Arts: '艺术',
  Design: '设计',
  Books: '读书',
  Comedy: '喜剧',
  Sports: '体育',
  'True Crime': '真实犯罪',
  History: '历史',
  Fiction: '虚构',
  'Kids & Family': '亲子',
  Government: '政府',
  'TV & Film': '影视',
  Music: '音乐',
  'Religion & Spirituality': '宗教与灵性',
  Entrepreneurship: '创业',
  Marketing: '营销',
  Management: '管理',
  Investing: '投资',
  Careers: '职业',
  Medicine: '医学',
  'Mental Health': '心理',
  Nutrition: '营养',
};

export function categoryLabel(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  return CATEGORY_ZH[text] ?? text;
}

export function feedIdFor(url) {
  return createHash('sha1').update(String(url)).digest('hex').slice(0, 12);
}

export function parseRss(xml, sourceUrl) {
  const text = String(xml ?? '').replace(/^\uFEFF/, '').replace(/<!--[\s\S]*?-->/g, '');
  const firstItem = text.search(/<item\b/i);
  const channel = firstItem === -1 ? text : text.slice(0, firstItem);
  const itemBlocks = [...text.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);

  const rawCategories = [...channel.matchAll(/<itunes:category\b[^>]*\btext\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
    .map((match) => decodeEntities(match[1] ?? match[2] ?? '').trim())
    .filter(Boolean);
  const categories = [];
  for (const raw of rawCategories) {
    const label = categoryLabel(raw);
    if (label && !categories.includes(label)) categories.push(label);
  }
  if (!categories.length) categories.push('未分类');

  const channelImageTag = selfTag(channel, 'itunes:image');
  const image = attr(channelImageTag, 'href') || tag(channel, 'url') || '';
  const link = tag(channel, 'link') || attr(selfTag(channel, 'atom:link'), 'href') || sourceUrl;

  const episodes = [];
  const seen = new Set();
  for (const block of itemBlocks) {
    const title = tag(block, 'title') || '未命名单集';
    const guid = tag(block, 'guid') || tag(block, 'link') || title;
    const episodeLink = tag(block, 'link');
    const key = guid || episodeLink;
    if (seen.has(key)) continue;
    seen.add(key);

    const enclosure = selfTag(block, 'enclosure');
    const media = selfTag(block, 'media:content');
    const audioUrl = attr(enclosure, 'url') || attr(media, 'url');
    const published = tag(block, 'pubDate');
    const timestamp = Date.parse(published);
    const description = stripHtml(tag(block, 'description') || tag(block, 'content:encoded'));
    const duration = parseDuration(tag(block, 'itunes:duration'));
    const itemImage = attr(selfTag(block, 'itunes:image'), 'href');
    const episodeNumber = tag(block, 'itunes:episode');

    episodes.push({
      guid: key,
      title,
      link: episodeLink,
      audioUrl,
      pubDate: Number.isFinite(timestamp) ? timestamp : 0,
      published,
      duration,
      description: description.slice(0, 12000),
      image: itemImage || '',
      episodeNumber,
    });
  }

  episodes.sort((a, b) => b.pubDate - a.pubDate);

  return {
    id: feedIdFor(sourceUrl),
    url: sourceUrl,
    title: tag(channel, 'title') || sourceUrl,
    author: tag(channel, 'itunes:author') || tag(channel, 'managingEditor') || '',
    description: stripHtml(tag(channel, 'description')).slice(0, 4000),
    image,
    link,
    categories,
    language: tag(channel, 'language'),
    episodes,
  };
}

export function normalizeFeedUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new Error('请填写 RSS 地址');
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('RSS 地址必须是 http 或 https');
  return url.toString();
}

export async function detectProxy() {
  const now = Date.now();
  if (now - proxyCache.at < PROXY_TTL) return proxyCache.url;
  let proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.ALL_PROXY || process.env.all_proxy || '';
  if (!proxy && process.platform === 'darwin') {
    try {
      const { stdout } = await execFileAsync('/usr/sbin/scutil', ['--proxy'], { timeout: 3000 });
      const enabled = /HTTPSEnable\s*:\s*1/.test(stdout);
      const host = /HTTPSProxy\s*:\s*([^\s]+)/.exec(stdout)?.[1];
      const port = /HTTPSPort\s*:\s*(\d+)/.exec(stdout)?.[1];
      if (enabled && host && port) proxy = `http://${host}:${port}`;
    } catch {
      /* 没有系统代理时继续用直连 */
    }
  }
  proxyCache = { at: now, url: proxy };
  return proxy;
}

async function fetchWithCurl(url, proxy, timeoutMs) {
  const args = [
    '-sS', '-L', '--compressed', '--http1.1',
    '--retry', '4', '--retry-all-errors', '--retry-delay', '1',
    '--max-time', String(Math.ceil(timeoutMs / 1000)),
    '--max-filesize', '12582912',
    '-A', CURL_UA,
    '-H', 'accept: application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  ];
  if (proxy) args.push('-x', proxy);
  args.push(url);
  try {
    const { stdout } = await execFileAsync(CURL, args, {
      timeout: timeoutMs + 5000,
      maxBuffer: 20 * 1024 * 1024,
      encoding: 'utf8',
    });
    return stdout;
  } catch (error) {
    if (error?.code === 'ENOENT') throw error;
    const detail = String(error?.stderr || error?.message || '').trim().split('\n').slice(-3).join(' ');
    throw new Error(`RSS 请求失败：${detail || '无法连接 RSS 地址'}`);
  }
}

function parseFeedXml(xml, url) {
  if (!xml || !xml.trim()) throw new Error('RSS 返回了空内容');
  const parsed = parseRss(xml, url);
  if (!parsed.episodes.length) throw new Error('RSS 里没有解析到单集');
  return parsed;
}

export async function fetchFeed(url, { timeoutMs = 45000 } = {}) {
  const proxy = await detectProxy();
  if (proxy) {
    try {
      return parseFeedXml(await fetchWithCurl(url, proxy, timeoutMs), url);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      /* 系统没有 curl 时退回 Node fetch */
    }
  }

  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      'user-agent': CURL_UA,
    },
  });
  if (!response.ok) throw new Error(`RSS 请求失败：HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 12 * 1024 * 1024) throw new Error('RSS 内容超过 12MB，已停止读取');
  const xml = new TextDecoder('utf-8').decode(buffer);
  return parseFeedXml(xml, url);
}
