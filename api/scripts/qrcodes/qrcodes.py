import os
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image

LOGO_PATH = "/home/chai/workspace/genie/api/scripts/qrcodes/room-mitra-square-transparent.png"  # path to your logo file
HOTEL_CODE = "Woodrose"  # change if needed
OUTPUT_DIR = "qrs"       # folder to save generated QR images


def generate_qr_with_logo(data: str, filename: str, logo_path: str, logo_scale: float = 0.25):
    """
    Generate a QR code with:
      - transparent background
      - logo in the center
    """
    # Create QR code object
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,  # high error correction to tolerate logo
        box_size=12,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create QR image (white background, black modules), then convert to RGBA
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")

    # Make white background transparent
    datas = img.getdata()
    new_data = []
    for item in datas:
        if item[:3] == (255, 255, 255):  # white pixel
            new_data.append((255, 255, 255, 0))  # transparent
        else:
            new_data.append(item)

    img.putdata(new_data)

    # Load logo
    logo = Image.open(logo_path).convert("RGBA")

    # Resize logo relative to QR size
    qr_width, qr_height = img.size
    logo_size = int(min(qr_width, qr_height) * logo_scale)
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

    # Compute position for centered logo
    pos = (
        (qr_width - logo_size) // 2,
        (qr_height - logo_size) // 2,
    )

    # Paste logo onto QR using its alpha channel as mask
    img.paste(logo, pos, mask=logo)

    # Save final PNG
    img.save(filename)
    print(f"Saved {filename}")


def feedback_url_for_room(hotel_code: str) -> str:
    return f"https://roommitra.com/feedback?h={hotel_code}"


def main():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    url = feedback_url_for_room(HOTEL_CODE)
    output_file = os.path.join(OUTPUT_DIR, f"qr_{HOTEL_CODE}.png")
    generate_qr_with_logo(url, output_file, LOGO_PATH)


if __name__ == "__main__":
    main()
