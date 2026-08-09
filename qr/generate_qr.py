"""웨딩 청첩장 QR 코드 생성기

사용법:
    python3 qr/generate_qr.py
    python3 qr/generate_qr.py "https://msandyj.github.io/wedding-card/"

출력:
    qr/wedding-card.png  — 인쇄/모바일 공유용 PNG
    qr/wedding-card.svg  — 확대해도 깨지지 않는 벡터 SVG

선행 설치 (한 번만):
    python3 -m pip install --user "qrcode[pil]"
"""

import sys
from pathlib import Path

try:
    import qrcode
    from qrcode.image.svg import SvgFillImage
    from PIL import Image
except ImportError:
    print("패키지 미설치. 아래 명령을 실행한 뒤 다시 시도하세요:")
    print('  python3 -m pip install --user "qrcode[pil]"')
    sys.exit(1)

DEFAULT_URL = "https://msandyj.github.io/wedding-card/"
OUT_DIR = Path(__file__).parent


def make_qr(url: str) -> qrcode.QRCode:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=14,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr


def save_png(qr: qrcode.QRCode, path: Path) -> None:
    img = qr.make_image(fill_color="#2b2421", back_color="#fbf8f4")
    img.save(path)
    print(f"PNG 저장: {path}")


def save_svg(qr: qrcode.QRCode, path: Path) -> None:
    img = qr.make_image(image_factory=SvgFillImage)
    img.save(path)
    print(f"SVG 저장: {path}")


def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    print(f"QR 생성 대상 URL: {url}")

    qr = make_qr(url)
    save_png(qr, OUT_DIR / "wedding-card.png")
    save_svg(qr, OUT_DIR / "wedding-card.svg")

    print("\n완료! 카메라로 스캔해 URL을 확인하세요.")


if __name__ == "__main__":
    main()
