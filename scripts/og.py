# Renders a 1200x630 social preview image per calculator and guide into public/og/.
# Usage: npx vite-node scripts/og-data.ts > /tmp/og.json && python3 scripts/og.py /tmp/og.json
import json, sys, os, html, base64
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(ROOT, 'node_modules/@fontsource/readex-pro/files')
OUT = os.path.join(ROOT, 'public/og'); os.makedirs(OUT, exist_ok=True)
items = json.load(open(sys.argv[1]))
def font(name): return 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(F, name), 'rb').read()).decode()
CSS = f"""
@font-face {{ font-family: R; font-weight: 400; src: url({font('readex-pro-arabic-400-normal.woff2')}); unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+060C, U+061F; }}
@font-face {{ font-family: R; font-weight: 600; src: url({font('readex-pro-arabic-600-normal.woff2')}); unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+060C, U+061F; }}
@font-face {{ font-family: R; font-weight: 600; src: url({font('readex-pro-latin-600-normal.woff2')}); unicode-range: U+0000-00FF, U+2026; }}
@font-face {{ font-family: R; font-weight: 400; src: url({font('readex-pro-latin-400-normal.woff2')}); unicode-range: U+0000-00FF, U+2026; }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ width: 1200px; height: 630px; font-family: R; direction: rtl; color: #fff; overflow: hidden;
  background: radial-gradient(900px 500px at 85% 0%, #0f5c45 0%, #06291f 60%); }}
.wrap {{ position: absolute; inset: 64px 72px 56px; display: flex; flex-direction: column; }}
.kick {{ font-size: 34px; font-weight: 600; color: #a9cbbf; }}
.title {{ text-wrap: balance; margin-top: 22px; font-size: 88px; font-weight: 600; line-height: 1.22; max-width: 1000px; }}
.title.long {{ font-size: 66px; }}
.title.xlong {{ font-size: 58px; }}
.sub {{ margin-top: 22px; font-size: 32px; color: #a9cbbf; max-width: 980px; }}
.foot {{ margin-top: auto; display: flex; align-items: center; justify-content: space-between; }}
.brand {{ display: flex; align-items: center; gap: 16px; font-size: 44px; font-weight: 600; }}
.logo {{ display: grid; grid-template-columns: 22px 22px; gap: 6px; }}
.logo i {{ width: 22px; height: 22px; border-radius: 6px; background: #fff; display: block; }}
.logo i:nth-child(4) {{ background: #7df0c8; }}
.url {{ font-size: 30px; color: #7df0c8; direction: ltr; }}
.bar {{ position: absolute; inset: auto 0 0 0; height: 14px; }}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630})
    for it in items:
        t = html.escape(it['title']); long = ' xlong' if len(it['title']) > 44 else ' long' if len(it['title']) > 30 else ''
        sub = f'<p class="sub">{html.escape(it["sub"])}</p>' if it['sub'] else ''
        doc = f"""<html><head><style>{CSS}</style></head><body><div class="wrap"><p class="kick">{html.escape(it['kicker'])}</p>
        <h1 class="title{long}">{t}</h1>{sub}<div class="foot"><div class="brand"><span class="logo"><i></i><i></i><i></i><i></i></span>حاسِب</div><span class="url">hasibcalc.com</span></div></div>
        <div class="bar" style="background:{it['tone']}"></div></body></html>"""
        pg.set_content(doc); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(120)
        pg.screenshot(path=os.path.join(OUT, it['file']), type='png')
    b.close()
print('wrote', len(items), 'images to', OUT)
