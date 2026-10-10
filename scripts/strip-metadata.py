#!/usr/bin/env python3
"""공개 이미지에서 촬영·편집 메타데이터를 무손실로 제거합니다.

JPEG 의 APP1(Exif·XMP), APP13(Photoshop/IPTC), COM(주석) 세그먼트만 빼고
나머지 바이트는 그대로 둡니다. 재인코딩하지 않으므로 화질·픽셀 크기가
바뀌지 않습니다. APP0(JFIF)·APP2(ICC 색 프로필)·APP14(Adobe 색 변환)는
색 표현에 필요해 유지합니다.

사용법:
  python3 scripts/strip-metadata.py              # img/optimized, img/thumb 전체
  python3 scripts/strip-metadata.py a.jpg b.jpg  # 지정 파일만
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DIRS = [ROOT / "img" / "optimized", ROOT / "img" / "thumb"]

DROP_MARKERS = {0xE1, 0xED, 0xFE}  # APP1, APP13, COM
SOS = 0xDA
EOI = 0xD9


def strip_jpeg(data: bytes) -> bytes:
    if data[:2] != b"\xff\xd8":
        raise ValueError("JPEG 아님")
    out = bytearray(b"\xff\xd8")
    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            raise ValueError(f"세그먼트 경계가 아님 (offset {i})")
        marker = data[i + 1]
        if marker == 0xFF:  # 채움 바이트
            i += 1
            continue
        if marker == EOI:
            out += data[i:]
            return bytes(out)
        if 0xD0 <= marker <= 0xD7 or marker == 0x01:  # 길이 없는 마커
            out += data[i:i + 2]
            i += 2
            continue
        length = int.from_bytes(data[i + 2:i + 4], "big")
        end = i + 2 + length
        if marker == SOS:  # 이후는 압축 데이터 — 그대로 복사
            out += data[i:]
            return bytes(out)
        if marker not in DROP_MARKERS:
            out += data[i:end]
        i = end
    raise ValueError("SOS 를 찾지 못함")


def main(argv):
    if argv:
        files = [Path(a) for a in argv]
    else:
        files = sorted(p for d in DEFAULT_DIRS for p in d.glob("*.jpg"))
    if not files:
        print("처리할 이미지가 없습니다.")
        return 1
    for f in files:
        data = f.read_bytes()
        stripped = strip_jpeg(data)
        if stripped != data:
            f.write_bytes(stripped)
            print(f"✓ {f.parent.name}/{f.name}  (-{len(data) - len(stripped):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
