#!/usr/bin/env python3
"""Deterministically rasterize the canonical Nadia Bloom SVG for Android and Apple.
Requires cairosvg and Pillow. Never touches user data or remote services.
"""
from pathlib import Path
from io import BytesIO
from PIL import Image
import cairosvg

root = Path(__file__).resolve().parents[1] / "nadias-bloom"
svg = (root / "icon.svg").read_bytes()
assert b'<svg' in svg and b'viewBox="0 0 512 512"' in svg
for size in (192, 512):
    png = cairosvg.svg2png(bytestring=svg, output_width=size, output_height=size)
    image = Image.open(BytesIO(png))
    assert image.size == (size, size)
    image.save(root / f"icon-{size}.png", optimize=True, compress_level=9)
    print(f"NADIA_V35_ICON_{size}_PASS", (root / f"icon-{size}.png").stat().st_size)
