#!/usr/bin/env python3

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT / "assets"
ICONS_DIR = ASSETS_DIR / "icons"
STORE_DIR = ASSETS_DIR / "chrome-web-store"
SCREENSHOTS_DIR = ROOT / "docs" / "screenshots"

BG = "#f4efe7"
PANEL = "#fffaf3"
INK = "#171512"
MUTED = "#645e55"
ACCENT = "#165c43"
def ensure_dirs():
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    STORE_DIR.mkdir(parents=True, exist_ok=True)


def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    if bold:
        candidates = [
            "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ] + candidates

    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def rounded_panel(draw, box, radius=48, fill=PANEL, outline="#e7ded1", width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def gradient_background(size):
    width, height = size
    image = Image.new("RGB", size, BG)
    draw = ImageDraw.Draw(image)

    for i in range(height):
        ratio = i / max(1, height - 1)
        r = int(244 + (255 - 244) * ratio)
        g = int(239 + (250 - 239) * ratio)
        b = int(231 + (243 - 231) * ratio)
        draw.line((0, i, width, i), fill=(r, g, b))

    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((-120, -80, 420, 420), fill=(22, 92, 67, 48))
    glow_draw.ellipse((width - 420, height - 280, width + 120, height + 160), fill=(240, 200, 138, 50))
    return Image.alpha_composite(image.convert("RGBA"), glow).convert("RGB")


def build_icon_source():
    size = 1024
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Full-bleed background instead of an inner rounded-square card.
    bg = gradient_background((size, size)).convert("RGBA")
    image.alpha_composite(bg)

    # Soft organic fields create depth without adding a second square container.
    draw.ellipse((-120, -80, 520, 520), fill="#dde7de")
    draw.ellipse((420, 560, 1120, 1200), fill="#f2e5c9")
    draw.polygon([(744, 128), (928, 128), (928, 312)], fill=(255, 255, 255, 120))
    draw.rectangle((744, 128, 928, 312), outline=(255, 255, 255, 0), width=0)

    serif = load_font(370, bold=True)
    sans = load_font(118, bold=True)
    label = load_font(84, bold=False)

    # Main mark
    draw.text((170, 208), "D", fill=INK, font=serif)
    draw.text((560, 258), ".md", fill=ACCENT, font=sans)

    # A thin extraction line reinforces the "extract / export" meaning.
    draw.rounded_rectangle((208, 648, 660, 670), radius=11, fill=ACCENT)
    draw.polygon([(648, 628), (760, 658), (648, 690)], fill=ACCENT)

    # Supporting label kept subtle so small-size readability still favors the main mark.
    draw.text((214, 722), "Extract", fill=MUTED, font=label)
    return image


def build_compact_icon_source():
    size = 1024
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    bg = gradient_background((size, size)).convert("RGBA")
    image.alpha_composite(bg)

    draw.ellipse((-120, -60, 520, 520), fill="#dde7de")
    draw.ellipse((470, 620, 1150, 1210), fill="#f2e5c9")

    serif = load_font(470, bold=True)
    sans = load_font(136, bold=True)

    draw.text((146, 214), "D", fill=INK, font=serif)
    draw.text((560, 250), ".md", fill=ACCENT, font=sans)
    draw.rounded_rectangle((186, 690, 640, 716), radius=13, fill=ACCENT)
    draw.polygon([(628, 660), (754, 704), (628, 744)], fill=ACCENT)
    return image


def save_extension_icons():
    source = build_icon_source()
    compact_source = build_compact_icon_source()
    source.save(ICONS_DIR / "icon-source-1024.png")

    for size in (16, 32, 48, 128):
        active_source = compact_source if size in (16, 32, 48) else source
        resized = active_source.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(ICONS_DIR / f"icon-{size}.png")

    store_icon = source.resize((128, 128), Image.Resampling.LANCZOS)
    store_icon.save(STORE_DIR / "store-icon-128.png")


def fit_image(source: Image.Image, box_size):
    target_w, target_h = box_size
    ratio = min(target_w / source.width, target_h / source.height)
    size = (int(source.width * ratio), int(source.height * ratio))
    return source.resize(size, Image.Resampling.LANCZOS)


def add_shadow(layer: Image.Image, radius=26, alpha=72):
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    mask = Image.new("L", layer.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, layer.size[0] - 1, layer.size[1] - 1), radius=26, fill=alpha)
    shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(18)))
    return shadow


def build_store_screenshot(input_name, output_name, label, heading, body):
    screenshot = Image.open(SCREENSHOTS_DIR / input_name).convert("RGB")
    canvas = gradient_background((1280, 800)).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    draw.text((72, 80), label, fill=ACCENT, font=load_font(24, bold=True))
    draw.multiline_text((72, 118), heading, fill=INK, font=load_font(40, bold=True), spacing=0)
    draw.multiline_text((72, 226), body, fill=MUTED, spacing=8, font=load_font(22))

    badge_box = (72, 342, 310, 392)
    draw.rounded_rectangle(badge_box, radius=25, fill="#dfeee4")
    draw.text((96, 353), "AI-ready extension", fill=ACCENT, font=load_font(22, bold=True))

    panel = Image.new("RGBA", (768, 486), (255, 250, 243, 255))
    panel_draw = ImageDraw.Draw(panel)
    panel_draw.rounded_rectangle((0, 0, 767, 485), radius=30, fill=(255, 250, 243, 255), outline="#eadfce", width=2)
    fitted = fit_image(screenshot, (720, 438))
    x = (panel.width - fitted.width) // 2
    y = (panel.height - fitted.height) // 2
    panel.paste(fitted, (x, y))

    shadow = add_shadow(panel)
    canvas.alpha_composite(shadow, (438, 178))
    canvas.alpha_composite(panel, (424, 162))
    canvas.convert("RGB").save(STORE_DIR / output_name)


def build_promo_assets():
    for size, name in [((440, 280), "small-promo-tile-440x280.png"), ((1400, 560), "marquee-promo-tile-1400x560.png")]:
        canvas = gradient_background(size).convert("RGBA")
        draw = ImageDraw.Draw(canvas)
        width, height = size

        if width < 600:
            draw.multiline_text(
                (24, 34),
                "DESIGN.md\nExtractor",
                fill=INK,
                font=load_font(28, bold=True),
                spacing=0,
            )
            draw.multiline_text(
                (24, 110),
                "Analyze webpage UI and\nexport reusable DESIGN.md",
                fill=MUTED,
                font=load_font(15),
                spacing=6,
            )
            badge_y = 214
            badge_specs = [
                (34, "Local"),
                (148, "AI"),
                (238, "Export"),
            ]
            for x, text in badge_specs:
                box = (x, badge_y, x + 78, badge_y + 34)
                draw.rounded_rectangle(box, radius=18, fill="#e3efe8")
                draw.text((x + 16, badge_y + 8), text, fill=ACCENT, font=load_font(15, bold=True))

            icon = Image.open(ICONS_DIR / "icon-source-1024.png").resize((114, 114), Image.Resampling.LANCZOS)
            canvas.alpha_composite(icon, (width - icon.width - 32, 34))
        else:
            draw.text((58, 56), "DESIGN.md Extractor", fill=INK, font=load_font(78, bold=True))
            draw.multiline_text(
                (58, 166),
                "Analyze the current webpage UI\nand export a reusable DESIGN.md",
                fill=MUTED,
                font=load_font(28),
                spacing=8,
            )
            badge_y = height - 94
            for idx, text in enumerate(["Local mode", "AI mode", "One-click export"]):
                x = 58 + idx * 178
                box = (x, badge_y, x + 160, badge_y + 44)
                draw.rounded_rectangle(box, radius=22, fill="#e3efe8")
                draw.text((x + 18, badge_y + 10), text, fill=ACCENT, font=load_font(22, bold=True))

            icon = Image.open(ICONS_DIR / "icon-source-1024.png").resize((260, 260), Image.Resampling.LANCZOS)
            canvas.alpha_composite(icon, (width - icon.width - 72, height // 2 - icon.height // 2))

        canvas.convert("RGB").save(STORE_DIR / name)


def main():
    ensure_dirs()
    save_extension_icons()
    build_store_screenshot(
        "settings-page-1.png",
        "screenshot-1-1280x800.png",
        "Settings preview",
        "AI settings\nfor DESIGN.md",
        "Set the model endpoint, output language,\nand export behavior before generating a reusable draft.",
    )
    build_store_screenshot(
        "settings-page-2.png",
        "screenshot-2-1280x800.png",
        "Workflow preview",
        "Local mode\nor AI mode",
        "Use local mode for a fast draft, then enable AI mode\nfor stronger structure, wording quality, and reusable output.",
    )
    build_promo_assets()
    print("Store assets generated in", STORE_DIR)


if __name__ == "__main__":
    main()
