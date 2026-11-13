import fs from 'node:fs';
import path from 'node:path';
import { readText } from './transcribe.js';

export async function resolveRoute(ctx, config) {
  const llm = ctx.get('llm');
  if (!llm || typeof llm.stream !== 'function') {
    throw new Error('当前 Host 没有可用的 llm 服务，无法生成笔记');
  }
  if (config.provider && config.model) {
    return { provider: config.provider, model: config.model };
  }
  const selector = ctx.get('agentDefaultModel');
  if (selector && typeof selector.currentSelection === 'function') {
    const selection = await Promise.resolve(selector.currentSelection());
    if (selection?.provider && selection?.model) {
      return {
        provider: selection.provider,
        model: selection.model,
        reasoningEffort: selection.reasoningEffort,
      };
    }
  }
  throw new Error('还没有选择模型。请先在插件设置里指定模型，或在 DSH 里选一个默认模型。');
}

function cleanMarkdown(text) {
  return String(text ?? '')
    .replace(/^\s*```(?:markdown|md)?\s*\r?\n/i, '')
    .replace(/\r?\n```\s*$/, '')
    .trim();
}

export async function generateNotes({
  ctx,
  route,
  system,
  user,
  maxTokens = 8192,
  signal,
  onLog = () => {},
}) {
  const llm = ctx.get('llm');
  let info;
  try {
    info = await llm.resolveModelInfo?.(route.provider, route.model);
  } catch {
    info = undefined;
  }
  const effortIds = (info?.reasoning?.efforts || [])
    .map((effort) => (typeof effort === 'string' ? effort : effort?.id))
    .filter(Boolean);
  const preferredEffort = ['off', 'minimal', 'low'].find((id) => effortIds.includes(id)) || effortIds[0];

  const run = async (reasoningEffort) => {
    const chunks = [];
    let failure;
    let finishKind = 'unknown';
    let usage;
    const options = {
      provider: route.provider,
      model: route.model,
      system,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: user }],
          source: { kind: 'user' },
        },
      ],
      maxTokens,
      temperature: 0.3,
      purpose: 'podcast-notes',
    };
    if (reasoningEffort) options.reasoningEffort = reasoningEffort;
    if (signal) options.signal = signal;

    for await (const chunk of llm.stream(options)) {
      if (chunk?.type === 'text-delta') {
        chunks.push(chunk.text);
      } else if (chunk?.type === 'finish') {
        finishKind = chunk.reason?.kind || 'unknown';
        if (chunk.reason?.kind === 'error') {
          failure = chunk.reason.failure?.message || '模型返回错误';
        } else if (chunk.reason?.kind === 'aborted') {
          failure = chunk.reason.failure?.message || '模型调用已中断';
        }
      } else if (chunk?.type === 'usage') {
        usage = chunk.usage;
      }
    }
    if (failure) throw new Error(failure);
    return { text: cleanMarkdown(chunks.join('')), finishKind, usage };
  };

  onLog(`使用模型 ${route.provider}/${route.model} 生成笔记（思考档位：${preferredEffort || '默认'}）…\n`);
  let result = await run(preferredEffort);
  if (result.text.length < 80 && result.finishKind === 'max-tokens' && effortIds.includes('off') && preferredEffort !== 'off') {
    onLog('模型把输出预算都用在思考上，关闭思考后重试一次…\n');
    result = await run('off');
  }
  onLog(`结束原因：${result.finishKind}；输出 ${result.text.length} 字${result.usage?.outputTokens ? `（${result.usage.outputTokens} tokens）` : ''}\n`);
  if (result.text.length < 80) {
    if (result.finishKind === 'max-tokens') {
      throw new Error('模型把输出上限都用在思考上，没有写出笔记；请换用非推理模型或调高“笔记最大 token”');
    }
    throw new Error('模型没有返回有效的笔记内容');
  }
  if (result.finishKind === 'max-tokens') {
    throw new Error('笔记被模型输出上限截断，请调高“笔记最大 token”或换用输出更长的模型');
  }
  return result.text;
}

export function writeNotesFile(store, feedId, episode, text) {
  const file = store.notesPath(feedId, episode);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, `${text.trim()}\n`, 'utf8');
  fs.renameSync(temp, file);
  return { path: file, chars: text.trim().length };
}

export function loadTranscript(file) {
  if (!file) throw new Error('这一集还没有逐字稿');
  if (!fs.existsSync(file)) throw new Error(`逐字稿文件不存在：${file}`);
  return readText(file);
}
