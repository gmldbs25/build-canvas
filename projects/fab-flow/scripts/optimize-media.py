"""Build responsive derivatives of authentic PNG captures; requires Pillow.

Run from any directory. Never changes PNGs or capture provenance. Full-size WebP
must decode to identical RGB pixels. Preview widths match Figure's srcSet.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageChops

media = Path(__file__).resolve().parents[1] / 'public' / 'media'
manifest_path = media / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
for asset in manifest['assets']:
    source = media / Path(asset['media_path']).name
    original = Image.open(source).convert('RGB')
    full = source.with_suffix('.webp')
    original.save(full, lossless=True, method=6)
    assert ImageChops.difference(original, Image.open(full).convert('RGB')).getbbox() is None
    previews = []
    for width in ([1280] if source.stem == 'hero-overview' else [800, 1600]):
        preview = original.resize((width, round(original.height * width / original.width)), Image.Resampling.LANCZOS)
        target = source.with_name(f'{source.stem}-{width}.webp')
        preview.save(target, quality=92, method=6)
        previews.append(dict(file=target.name, width=width, height=preview.height, bytes=target.stat().st_size))
    asset['optimized'] = dict(full=full.name, encoding='lossless RGB, pixel equality verified', bytes=full.stat().st_size, previews=previews)
    print(source.name, original.size, hashlib.sha256(source.read_bytes()).hexdigest())
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
