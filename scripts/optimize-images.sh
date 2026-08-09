#!/usr/bin/env bash
# macOS sips로 ./img/*.jpg 를 1600px 폭·품질 80으로 리사이즈해
# ./img/optimized/ 에 저장합니다.
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)/img"
OUT_DIR="${SRC_DIR}/optimized"

mkdir -p "${OUT_DIR}"

shopt -s nullglob
files=("${SRC_DIR}"/*.jpg "${SRC_DIR}"/*.jpeg "${SRC_DIR}"/*.png)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "처리할 이미지가 없습니다: ${SRC_DIR}"
  exit 1
fi

for f in "${files[@]}"; do
  name="$(basename "${f}")"
  sips -Z 1600 -s formatOptions 80 "${f}" --out "${OUT_DIR}/${name}" > /dev/null
  original=$(du -h "${f}" | cut -f1)
  optimized=$(du -h "${OUT_DIR}/${name}" | cut -f1)
  echo "✓ ${name}  (${original} → ${optimized})"
done

echo ""
echo "완료. 최적화된 이미지 → ${OUT_DIR}"
