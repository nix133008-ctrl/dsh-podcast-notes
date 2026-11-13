#!/usr/bin/env python3
"""Podcast → Markdown 逐字稿(带时间戳)。

支持两种入口:
  1. RSS URL — 解析整档播客,按 --range 选期,逐期转写
  2. 小宇宙单期 URL(xiaoyuzhoufm.com/episode/...) — 抓页面取音频直链

默认只产出 markdown 文件,音频不落地。--keep-audio 才把原始音频存到 audio/。

时间戳:[mm:ss],句级,连续递增。底层用 Paraformer-zh + fsmn-vad 拿 token 级
时间戳,按标点切句后,取每句首 token 的 start 和末 token 的 end。

设备自动探测 MPS (Apple Silicon) / CUDA / CPU。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

AUDIO_EXTS = (".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg")
DEFAULT_OUTPUT = str(Path.home() / "podcast_downloads")


# ============ 环境补丁 ============

def ensure_ffmpeg_in_path() -> None:
    """funasr 用 subprocess 调 `ffmpeg` 加载音频。如果系统没装,尝试用
    imageio_ffmpeg 自带的 ffmpeg 二进制建软链,放进 PATH 让 funasr 找到。

    必须在 import funasr / 调 model.generate 之前执行。
    """
    import shutil
    if shutil.which("ffmpeg"):
        return  # 系统已有,不需要
    try:
        import imageio_ffmpeg
    except ImportError:
        print(
            "[警告] 系统没有 ffmpeg,且 imageio-ffmpeg 未安装。"
            "m4a 等格式的音频转写会失败。请运行: pip install imageio-ffmpeg",
            file=sys.stderr,
        )
        return
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    if not Path(ff).exists():
        print(f"[警告] imageio_ffmpeg 给的二进制不存在: {ff}", file=sys.stderr)
        return
    link_dir = Path(tempfile.mkdtemp(prefix="p2md-ffmpeg-"))
    link = link_dir / "ffmpeg"
    try:
        link.symlink_to(ff)
    except OSError as exc:
        print(f"[警告] 建 ffmpeg 软链失败({exc}),放弃 fallback", file=sys.stderr)
        return
    os.environ["PATH"] = f"{link_dir}{os.pathsep}{os.environ.get('PATH', '')}"
    print(f"[ffmpeg] 注入临时 ffmpeg: {link_dir / 'ffmpeg'}")


ensure_ffmpeg_in_path()


# ============ 工具函数 ============

def safe_filename(text: str, max_len: int = 90) -> str:
    text = re.sub(r"[\\/:*?\"<>|]", "_", text)
    text = re.sub(r"\s+", " ", text).strip()
    return (text[:max_len].strip() or "untitled").rstrip(".")


def format_timestamp(seconds: float) -> str:
    """[mm:ss] 格式,整数秒,连续递增。"""
    seconds = max(0, int(seconds))
    m, s = divmod(seconds, 60)
    return f"[{m:02d}:{s:02d}]"


def estimate_duration(size_bytes: int, bitrate_kbps: int = 128) -> int:
    """估算 m4a 音频时长(秒)。默认 128kbps(典型播客比特率)。"""
    return int(size_bytes * 8 / 1000 / bitrate_kbps)


def estimate_transcribe_seconds(duration_sec: int, device: str) -> int:
    """根据设备估算转写耗时(秒)。MPS/CUDA 极快(~0.02x),CPU 慢(~0.3x)。"""
    rtf_by_device = {
        "mps": 0.025,
        "cuda": 0.015,
        "cpu": 0.30,
    }
    rtf = rtf_by_device.get(device.split(":")[0], 0.05)
    return int(duration_sec * rtf)


def fmt_eta(seconds: int) -> str:
    """秒 → 'X 分 Y 秒' / 'Y 秒'。"""
    if seconds < 60:
        return f"{seconds} 秒"
    m, s = divmod(seconds, 60)
    return f"{m} 分 {s:02d} 秒"


# 不同设备的 rtf 系数(用于显示进度条速度)
DEVICE_RTF_NOTE = {
    "mps": "MPS 加速 ~40x",
    "cuda": "CUDA 加速",
    "cpu": "CPU 模式",
}


def detect_input(arg: str) -> tuple[str, str]:
    """判断输入类型。返回 (kind, url);kind ∈ {'rss', 'xiaoyuzhou_episode'}。"""
    if "xiaoyuzhoufm.com/episode/" in arg:
        return "xiaoyuzhou_episode", arg
    return "rss", arg


# ============ 元数据获取 ============

def fetch_rss_entries(rss_url: str) -> tuple[str, list[dict]]:
    """解析 RSS,返回 (show_name, entries)。每条 entry 含 title/audio_url/episode_url。"""
    import feedparser
    feed = feedparser.parse(rss_url)
    if feed.bozo:
        print(f"[警告] RSS 解析提示:{feed.bozo_exception}")
    if not feed.entries:
        raise SystemExit("RSS 里没有找到节目条目,请检查地址是否正确。")
    show_name = feed.channel.get("title", "未知节目") if hasattr(feed, "channel") else "未知节目"
    show_name = safe_filename(show_name)

    out = []
    for entry in feed.entries:
        title = entry.get("title", "untitled")
        audio_url = None
        for enc in entry.get("enclosures", []):
            href = enc.get("href")
            ctype = enc.get("type", "")
            if href and ("audio" in ctype or href.lower().endswith(AUDIO_EXTS)):
                audio_url = href
                break
        if not audio_url:
            for link in entry.get("links", []):
                href = link.get("href")
                if href and link.get("rel") == "enclosure":
                    audio_url = href
                    break
        if not audio_url:
            print(f"[跳过] 没有音频链接:{title}")
            continue
        out.append({
            "title": title,
            "audio_url": audio_url,
            "episode_url": entry.get("link", ""),
            "published": entry.get("published", entry.get("updated", "")),
        })
    return show_name, out


def fetch_xiaoyuzhou_episode(episode_url: str) -> dict:
    """抓小宇宙单期页面,返回 {show_name, title, audio_url, episode_url}。"""
    import requests
    headers = {"User-Agent": "Mozilla/5.0 podcast-transcriber/1.0"}
    r = requests.get(episode_url, headers=headers, timeout=30)
    r.raise_for_status()
    html = r.text

    # 1) og:audio
    m = re.search(r'<meta property="og:audio" content="([^"]+)"', html)
    audio_url = m.group(1) if m else None

    # 2) __NEXT_DATA__ JSON 里取 show_name + title
    show_name = None
    title = None
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    if m:
        try:
            data = json.loads(m.group(1))
            def walk(o):
                nonlocal show_name, title
                if isinstance(o, dict):
                    if o.get("type") == "PODCAST" and o.get("title"):
                        show_name = o["title"]
                    if o.get("type") == "EPISODE" and o.get("title"):
                        title = o["title"]
                    for v in o.values():
                        walk(v)
                elif isinstance(o, list):
                    for v in o:
                        walk(v)
            walk(data)
        except Exception as e:
            print(f"[警告] __NEXT_DATA__ 解析失败:{e}")

    if not audio_url:
        raise SystemExit("无法从该页面提取音频链接,请检查 URL 是否正确。")
    if not title:
        title = "未命名单集"
    if not show_name:
        show_name = "未知节目"

    return {
        "show_name": safe_filename(show_name),
        "title": title,
        "audio_url": audio_url,
        "episode_url": episode_url,
        "published": "",
    }


# ============ 设备 + 模型 ============

def detect_device() -> str:
    import torch
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda:0"
    return "cpu"


def load_model(device: str):
    """加载 Paraformer-zh + fsmn-vad。首次运行会下载模型(~300MB)。"""
    try:
        from funasr import AutoModel
    except ImportError as exc:
        raise SystemExit(
            "FunASR 导入失败,通常是没装 torch。请先运行:pip install -r requirements.txt"
        ) from exc
    print(f"[模型] 加载 Paraformer-zh + fsmn-vad,设备 {device}...")
    return AutoModel(
        model="paraformer-zh",
        vad_model="fsmn-vad",
        vad_kwargs={"max_single_segment_time": 30000},
        device=device,
    )


# ============ 音频下载 + 转写 ============

def download_audio(audio_url: str) -> tuple[bytes, str]:
    """下载音频到内存,返回 (bytes, 文件后缀)。"""
    import requests
    from tqdm import tqdm
    headers = {"User-Agent": "Mozilla/5.0 podcast-transcriber/1.0"}
    with requests.get(audio_url, stream=True, timeout=180, headers=headers) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        buf = bytearray()
        with tqdm(total=total, unit="B", unit_scale=True, desc="[下载]") as bar:
            for chunk in r.iter_content(chunk_size=1024 * 256):
                if chunk:
                    buf.extend(chunk)
                    bar.update(len(chunk))
    suffix = Path(urlparse(audio_url).path).suffix.lower()
    if suffix not in AUDIO_EXTS:
        suffix = ".m4a"
    return bytes(buf), suffix


def transcribe_bytes(model, audio_bytes: bytes, suffix: str) -> list[dict]:
    """bytes → Paraformer → 字符级时间戳 [{start, end, char}](毫秒)。

    Paraformer 返回:
      text:带空格的逐字字符串,例 "未 来 AI ..."
      timestamp:[[start_ms, end_ms], ...],长度等于 token 数
      token ≈ 1 个中文字 或 1 个英文子词(用空格分隔)
    我们展开成字符级时间戳(token 内字符均匀分配时长),方便按标点切句。
    """
    # funasr 的 generate 需要文件路径,写临时文件
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    try:
        result = model.generate(input=tmp_path, use_itn=True, batch_size_s=60)
    finally:
        os.unlink(tmp_path)

    item = result[0] if isinstance(result, list) else result
    raw_text = str(item.get("text", ""))
    timestamp = item.get("timestamp", [])
    tokens = raw_text.split()  # Paraformer 用空格分隔 token
    n = min(len(tokens), len(timestamp))

    chars = []
    for i in range(n):
        tok = tokens[i].strip()
        if not tok:
            continue
        start_ms, end_ms = timestamp[i]
        dur = max(1, end_ms - start_ms)
        c_list = list(tok)
        m = len(c_list)
        # token 内字符均匀分配时长
        for j, ch in enumerate(c_list):
            s = start_ms + int(dur * j / m)
            e = start_ms + int(dur * (j + 1) / m)
            chars.append({"start": s, "end": e, "char": ch})
    return chars


# 标点(优先按标点切)
HARD_ENDERS = set("。！？…；\n")
# 口语停顿词(在这些字后面优先切)
SOFT_BREAK_CHARS = set("呢啊吧哦嗯嘛哈呗咯哇哟")
# 词级软切边界(在这些词后面优先切)
SOFT_BREAK_WORDS = ("其实", "所以", "但是", "不过", "然后", "就是说",
                    "这个", "那个", "比如说", "比如", "另外", "反正",
                    "其实", "不过", "总而言之")
# 切句的目标长度区间
MIN_LEN = 18   # 不到这个长度不切
TARGET_LEN = 30  # 切句的最佳长度
MAX_LEN = 45   # 超过这个长度强制切


def chars_to_sentences(chars: list[dict]) -> list[dict]:
    """字符级时间戳 → 启发式切句 → 句级时间戳 [{start, end, text}](秒)。

    Paraformer 不输出标点,所以用三层策略:
      1. 优先按标点切(如果有的话)
      2. 在 MIN_LEN 之后,遇到口语停顿字 / 词 → 切
      3. 到 MAX_LEN 强制切
    """
    sentences = []
    buf_chars: list[str] = []
    buf_start: int | None = None
    buf_end: int = 0

    def flush():
        nonlocal buf_chars, buf_start, buf_end
        if not buf_chars:
            return
        s = "".join(buf_chars).strip()
        s = re.sub(r"\s+", "", s)
        if s:
            sentences.append({
                "start": (buf_start or 0) / 1000.0,
                "end": buf_end / 1000.0,
                "text": s,
            })
        buf_chars = []
        buf_start = None
        buf_end = 0

    for c in chars:
        if buf_start is None:
            buf_start = c["start"]
        buf_chars.append(c["char"])
        buf_end = c["end"]
        ch = c["char"]

        if ch in HARD_ENDERS:
            flush()
            continue

        cur_len = len(buf_chars)
        if cur_len < MIN_LEN:
            continue

        # 在目标长度附近,优先按软边界切
        if cur_len >= MIN_LEN and ch in SOFT_BREAK_CHARS:
            flush()
            continue

        # 词级软切
        if cur_len >= MIN_LEN:
            tail = "".join(buf_chars[-3:])
            if any(tail.endswith(w) for w in SOFT_BREAK_WORDS):
                flush()
                continue

        # 超长强制切
        if cur_len >= MAX_LEN:
            flush()

    flush()  # 收尾
    return sentences


# ============ 输出 ============

def write_markdown(
    out_path: Path,
    title: str,
    episode_url: str,
    audio_url: str,
    published: str,
    sentences: list[dict],
) -> None:
    """写出 markdown:头部元数据 + 带时间戳逐字稿。"""
    lines = [
        f"# {title}",
        "",
        f"- 原链接:{episode_url or ''}",
        f"- 发布时间:{published or ''}",
        f"- 音频链接:{audio_url or ''}",
        "",
        "## 逐字稿",
        "",
    ]
    for s in sentences:
        text = str(s.get("text", "")).strip()
        if not text:
            continue
        lines.append(f"{format_timestamp(s['start'])} {text}")
        lines.append("")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


# ============ 主流程 ============

def process_one(
    *,
    audio_url: str,
    title: str,
    show_name: str,
    episode_url: str,
    published: str,
    index: int,
    out_root: Path,
    model,
    keep_audio: bool,
) -> Path:
    """处理一期,返回写出的 markdown 路径。"""
    safe_title = safe_filename(title)
    stem = f"{index:03d}_{safe_title}"
    out_dir = out_root / show_name
    md_path = out_dir / "markdown" / f"{stem}.md"

    print(f"[1/4] 元数据:节目={show_name} / 标题={title}")
    print(f"[2/4] 下载音频 ...")
    audio_bytes, suffix = download_audio(audio_url)

    # 预估耗时
    size_mb = len(audio_bytes) / 1024 / 1024
    duration_sec = estimate_duration(len(audio_bytes))
    transcribe_eta = estimate_transcribe_seconds(duration_sec, _current_device)
    print(f"[2/4] 下载完成:{size_mb:.1f}MB,预估音频时长 {fmt_eta(duration_sec)}")
    print(f"[3/4] 转写 ({DEVICE_RTF_NOTE.get(_current_device, _current_device)}) → 预计 {fmt_eta(transcribe_eta)} ...")
    import time as _t
    t0 = _t.time()
    chars = transcribe_bytes(model, audio_bytes, suffix)
    t_transcribe = _t.time() - t0
    print(f"[3/4] 转写完成:实际 {fmt_eta(int(t_transcribe))}({len(chars)} 字)")

    print(f"[4/4] 切句 + 写文件 ...")
    sentences = chars_to_sentences(chars)
    write_markdown(md_path, title, episode_url, audio_url, published, sentences)
    print(f"[4/4] 完成:{len(sentences)} 句 → {md_path}")

    if keep_audio:
        audio_dir = out_dir / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        audio_path = audio_dir / f"{stem}{suffix}"
        audio_path.write_bytes(audio_bytes)
        print(f"[保留音频] {audio_path}")

    return md_path


def main() -> None:
    p = argparse.ArgumentParser(
        description="把播客 RSS 或小宇宙单期链接转成带时间戳的 Markdown 逐字稿。"
    )
    p.add_argument(
        "input",
        help="RSS URL 或小宇宙单期链接(https://www.xiaoyuzhoufm.com/episode/...)",
    )
    p.add_argument("--range", help="RSS 模式下选期范围,例如 1-50")
    p.add_argument("--output", default=DEFAULT_OUTPUT, help="输出根目录")
    p.add_argument(
        "--keep-audio",
        action="store_true",
        help="默认不存原始音频,加这个开关才会存到 audio/",
    )
    p.add_argument("--device", default=None, help="mps / cuda:0 / cpu,默认自动探测")
    args = p.parse_args()

    out_root = Path(args.output).expanduser()
    kind, url = detect_input(args.input)

    device = args.device or detect_device()
    # 让 process_one 内部能拿到当前设备用于估算
    global _current_device
    _current_device = device
    print(f"[初始化] 设备:{device} | 输出:{out_root}")
    model = load_model(device)

    if kind == "rss":
        show_name, entries = fetch_rss_entries(url)
        if args.range:
            start, end = map(int, args.range.split("-"))
            entries = entries[start - 1: end]
        if not entries:
            raise SystemExit("范围内没有可用节目。")
        print(f"[节目] {show_name},共 {len(entries)} 期")
        for i, e in enumerate(entries, start=1):
            process_one(
                audio_url=e["audio_url"],
                title=e["title"],
                show_name=show_name,
                episode_url=e["episode_url"],
                published=e.get("published", ""),
                index=i,
                out_root=out_root,
                model=model,
                keep_audio=args.keep_audio,
            )
    elif kind == "xiaoyuzhou_episode":
        meta = fetch_xiaoyuzhou_episode(url)
        print(f"[节目] {meta['show_name']} — {meta['title']}")
        # 单期没有自然编号,默认 1。如果同节目已有期号,可以在未来扩展。
        # 简单做法:沿用 1,用户在文件名里能直接认出来。
        process_one(
            audio_url=meta["audio_url"],
            title=meta["title"],
            show_name=meta["show_name"],
            episode_url=meta["episode_url"],
            published=meta.get("published", ""),
            index=1,
            out_root=out_root,
            model=model,
            keep_audio=args.keep_audio,
        )


if __name__ == "__main__":
    main()