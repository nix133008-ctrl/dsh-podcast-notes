#!/usr/bin/env bash
# 一键准备转写用的 Python 环境（建 .venv + 装 FunASR 等依赖）。
#
#   bash scripts/setup-env.sh          # 安装（已装好会直接跳过）
#   bash scripts/setup-env.sh --check  # 只检查，不安装
#   bash scripts/setup-env.sh --cn     # 国内网络：走清华 PyPI 镜像
#
# 环境变量：PYTHON（默认 python3）、VENV_DIR（默认仓库根目录下的 .venv）、
#           PIP_MIRROR（自定义镜像地址）。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON="${PYTHON:-python3}"
VENV_DIR="${VENV_DIR:-$ROOT/.venv}"
CHECK_ONLY=0
MIRROR="${PIP_MIRROR:-}"

for arg in "$@"; do
  case "$arg" in
    --check) CHECK_ONLY=1 ;;
    --cn) MIRROR="${MIRROR:-https://pypi.tuna.tsinghua.edu.cn/simple}" ;;
    -h|--help)
      sed -n '2,7p' "$0"
      exit 0
      ;;
    *)
      echo "未知参数：$arg（可用：--check / --cn）" >&2
      exit 2
      ;;
  esac
done

PY="$VENV_DIR/bin/python"

check_deps() {
  "$PY" - <<'PYCODE'
import importlib
missing = []
for name in ("funasr", "modelscope", "torch", "feedparser", "requests", "tqdm", "imageio_ffmpeg"):
    try:
        importlib.import_module(name)
    except Exception:
        missing.append(name)
if missing:
    print("缺少依赖：" + ", ".join(missing))
    raise SystemExit(1)
print("转写依赖已就绪")
PYCODE
}

if [ "$CHECK_ONLY" = "1" ]; then
  if [ ! -x "$PY" ]; then
    echo "还没有 Python 环境：$VENV_DIR" >&2
    echo "运行 bash scripts/setup-env.sh 安装。" >&2
    exit 1
  fi
  check_deps
  exit 0
fi

if [ ! -x "$PY" ]; then
  command -v "$PYTHON" >/dev/null 2>&1 || {
    echo "找不到 $PYTHON。请先安装 Python 3.9+（推荐 3.10/3.11），或用 PYTHON=/path/to/python3 指定。" >&2
    exit 1
  }
  "$PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' || {
    echo "Python 版本太旧，需要 3.9 及以上（当前：$("$PYTHON" -V 2>&1)）。" >&2
    exit 1
  }
  echo "创建虚拟环境：$VENV_DIR"
  "$PYTHON" -m venv "$VENV_DIR"
fi

echo "升级 pip…"
"$PY" -m pip install --upgrade pip --quiet

echo "安装依赖（首次下载体积较大，请耐心等待）…"
install_deps() {
  if [ -n "$MIRROR" ]; then
    "$PY" -m pip install --index-url "$MIRROR" "$@"
  else
    "$PY" -m pip install "$@"
  fi
}
if [ -n "$MIRROR" ]; then
  echo "使用镜像：$MIRROR"
fi
install_deps funasr modelscope torch feedparser requests tqdm imageio-ffmpeg

check_deps

cat <<EOF

环境装好了：$VENV_DIR
插件会自动找到它（设置里的 Python 解释器一般不用改）。
第一次转写还会下载几百 MB 的识别模型，之后走本地缓存。
EOF
