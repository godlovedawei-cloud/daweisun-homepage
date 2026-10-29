"""Version the self-contained offline tool; no network calls or dependencies."""
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1] / 'tools' / 'anesthesia-dosing'
worker = ROOT / 'sw.js'
source = worker.read_text()
normalized = re.sub(r"const CACHE_VERSION = '[^']+';", "const CACHE_VERSION = 'BUILD_VERSION';", source)
names = ['index.html', 'style.css', 'app.js', 'calculator.mjs', 'manifest.webmanifest',
         'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']
digest = hashlib.sha256(normalized.encode())
for name in names:
    digest.update(name.encode())
    digest.update((ROOT / name).read_bytes())
version = digest.hexdigest()[:16]
worker.write_text(normalized.replace("'BUILD_VERSION'", repr(version), 1))
print(f'Built anesthesia offline cache {version}')
