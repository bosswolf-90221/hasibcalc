# Screenshots + console-error check across pages, widths and colour schemes (dev aid, not part of the build).
import sys, json
from playwright.sync_api import sync_playwright
import os
BASE = os.environ.get('BASE_URL', 'http://localhost:4321')
OUT = sys.argv[1]
pages = ['/', '/end-of-service/', '/vat/', '/loan/', '/percentage/', '/discount/', '/age/', '/bmi/', '/zakat/', '/hijri/', '/days-between/', '/pregnancy/', '/calories/', '/category/dates/', '/category/money/', '/about/', '/privacy/', '/contact/', '/nope/']
report = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for scheme in ['light', 'dark']:
        for w, h, tag in [(1280, 900, 'desk'), (390, 844, 'phone')]:
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme, device_scale_factor=1)
            for path in pages:
                pg = ctx.new_page()
                errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
                pg.goto(BASE + path, wait_until='networkidle')
                pg.evaluate('async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); }')
                pg.wait_for_timeout(500)
                overflow = pg.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
                key = f'{scheme}-{tag}{path}'
                report[key] = {'errors': errs, 'overflow': overflow}
                if (scheme == 'light') or path in ['/', '/loan/', '/bmi/']:
                    name = path.strip('/').replace('/', '_') or 'home'
                    pg.screenshot(path=f'{OUT}/{scheme}-{tag}-{name}.png', full_page=True)
                pg.close()
            ctx.close()
    b.close()
bad = {k: v for k, v in report.items() if v['errors'] or v['overflow']}
print(json.dumps(bad, ensure_ascii=False, indent=1) if bad else 'no console errors, no horizontal overflow')
