#!/usr/bin/env bash
# 갤러리 가로 스트립(OUR STORY)용 경량 썸네일을 만듭니다.
#   출력: ./img/thumb/*.jpg  (1080px 폭 · 품질 72)
#
# 원본(./img/*.JPG)이 있으면 원본에서, 없으면 ./img/optimized/*.jpg 에서
# 생성합니다. 라이트박스(크게 보기)는 계속 ./img/optimized/ 1600px 을 씁니다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ORIG_DIR="${ROOT}/img"
OPT_DIR="${ORIG_DIR}/optimized"
OUT_DIR="${ORIG_DIR}/thumb"

WIDTH=1080
QUALITY=72

mkdir -p "${OUT_DIR}"

shopt -s nullglob nocaseglob

# 원본 우선, 없으면 optimized 를 소스로 사용
files=("${ORIG_DIR}"/*.jpg "${ORIG_DIR}"/*.jpeg)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "원본이 없어 ${OPT_DIR} 를 소스로 사용합니다."
  files=("${OPT_DIR}"/*.jpg)
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "처리할 이미지가 없습니다: ${ORIG_DIR}"
  exit 1
fi

for f in "${files[@]}"; do
  # 확장자는 항상 소문자 .jpg 로 통일 (js/main.js 의 경로 규칙과 일치)
  base="$(basename "${f}")"
  name="${base%.*}.jpg"
  sips -Z "${WIDTH}" -s format jpeg -s formatOptions "${QUALITY}" \
       "${f}" --out "${OUT_DIR}/${name}" > /dev/null
  src_size=$(du -h "${f}" | cut -f1)
  out_size=$(du -h "${OUT_DIR}/${name}" | cut -f1)
  echo "✓ ${name}  (${src_size} → ${out_size})"
done

echo ""
echo "완료. 썸네일 → ${OUT_DIR}  (총 $(du -sh "${OUT_DIR}" | cut -f1))"
