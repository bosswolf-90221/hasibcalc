# Renders a 1200x630 social preview image per calculator and guide into public/og/, in the life-moments identity.
# Usage: npx vite-node scripts/og-data.ts > og.json && python scripts/og.py og.json
# Optional env: OG_OUT (output folder), CHROME (path to a Chromium binary).
import base64, html, json, os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(ROOT, 'node_modules/@fontsource-variable/vazirmatn/files')
OUT = os.environ.get('OG_OUT') or os.path.join(ROOT, 'public/og')
os.makedirs(OUT, exist_ok=True)
items = json.load(open(sys.argv[1], encoding='utf-8'))

def font(name):
    return 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(F, name), 'rb').read()).decode()

LOGO = open(os.path.join(ROOT, 'public/brand/logo.svg'), encoding='utf-8').read()
CSS = f"""
@font-face {{ font-family: V; font-weight: 100 900; src: url({font('vazirmatn-arabic-wght-normal.woff2')}); unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F; }}
@font-face {{ font-family: V; font-weight: 100 900; src: url({font('vazirmatn-latin-wght-normal.woff2')}); unicode-range: U+0000-00FF, U+2026; }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ width: 1200px; height: 630px; font-family: V; direction: rtl; color: #15201d; background: #e4f1ec; overflow: hidden; }}
.wrap {{ position: absolute; inset: 64px 72px 56px; display: flex; flex-direction: column; }}
.title {{ text-wrap: balance; font-size: 84px; font-weight: 800; line-height: 1.16; max-width: 1040px; letter-spacing: -.01em; }}
.title.long {{ font-size: 66px; }}
.title.xlong {{ font-size: 54px; }}
.sub {{ margin-top: 22px; font-size: 32px; color: #3f4a46; max-width: 980px; font-weight: 500; }}
.foot {{ margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; }}
.foot svg {{ height: 84px; width: auto; display: block; }}
.url {{ font-size: 28px; color: #0b6e5f; font-weight: 700; direction: ltr; }}
"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROME') or None)
    pg = b.new_page(viewport={'width': 1200, 'height': 630})
    for it in items:
        t = html.escape(it['title'])
        size = ' xlong' if len(it['title']) > 44 else ' long' if len(it['title']) > 26 else ''
        sub = f'<p class="sub">{html.escape(it["sub"])}</p>' if it.get('sub') else ''
        doc = f'<html lang="ar"><head><style>{CSS}</style></head><body><div class="wrap"><h1 class="title{size}">{t}</h1>{sub}<div class="foot">{LOGO}<span class="url">hasibcalc.com</span></div></div></body></html>'
        pg.set_content(doc)
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(120)
        pg.screenshot(path=os.path.join(OUT, it['file']), type='png')
    b.close()
print('wrote', len(items), 'images to', OUT)
