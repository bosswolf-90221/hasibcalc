# Final walk through the whole built site, before any publish. Needs the site served at BASE_URL.
#   python scripts/final_check.py [chromium|firefox|webkit]
# Every page at several widths: loads, no script errors, no missing files, no sideways scroll, no broken values.
# Every calculator: typing real values, Arabic digits and separators gives a result, never NaN; reset is clean.
import os, re, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('BASE_URL', 'http://localhost:4321')
ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
WIDTHS = [320, 390, 768, 1280] if ENGINE == 'chromium' else [390, 1280]
CALCS = 'age annual-leave bmi calories days-between discount end-of-service exit-dues gosi gpa-target gpa hijri-age hijri loan ovulation percentage pregnancy salary-day salary-saudi salary-uae vat zakat'.split()
BAD_TEXT = re.compile(r'\bNaN\b|\bundefined\b|\bInfinity\b|\[object')
problems = []
counts = {'pages': 0, 'calcs': 0}
def bad(where, what): problems.append(f'{where}: {what}')

with sync_playwright() as p:
    launch = {'executable_path': os.environ['CHROME']} if ENGINE == 'chromium' and os.environ.get('CHROME') else {}
    br = getattr(p, ENGINE).launch(**launch)
    ctx0 = br.new_context()
    xml = ctx0.request.get(B + '/sitemap.xml').text()
    paths = re.findall(r'<loc>https?://[^/]+(/[^<]*)</loc>', xml) + ['/search/', '/404.html']
    ctx0.close()

    for w in WIDTHS:
        ctx = br.new_context(viewport={'width': w, 'height': 800}, locale='ar')
        pg = ctx.new_page()
        cur = {'p': ''}
        pg.on('pageerror', lambda e: bad(f"{cur['p']} @{w}", f'script error {e}'))
        pg.on('response', lambda r: bad(f"{cur['p']} @{w}", f'{r.status} {r.url}') if r.status >= 400 and '127.0.0.1' in r.url and '/nothing' not in r.url else None)
        for path in paths:
            cur['p'] = path
            pg.goto(B + path, wait_until='load')
            counts['pages'] += 1
            over = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            if over > 0: bad(f'{path} @{w}', f'sideways scroll {over}px')
            if pg.locator('h1').count() != 1: bad(f'{path} @{w}', 'h1 count')
            text = pg.locator('main').inner_text()
            m = BAD_TEXT.search(text)
            if m: bad(f'{path} @{w}', f'broken text: {text[max(0, m.start() - 30):m.end() + 20]}')
            broken = pg.evaluate("[...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src)")
            if broken: bad(f'{path} @{w}', f'broken image {broken}')
            # text cut off by its own box
            clipped = pg.evaluate("""[...document.querySelectorAll('main h1, main h2, main .btn, main label, .head-nav a, .result-peek')].filter(e => e.offsetParent && e.clientWidth > 1 && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow === 'hidden').length""")
            if clipped: bad(f'{path} @{w}', f'{clipped} clipped elements')
        ctx.close()

    # Calculators, phone width
    ctx = br.new_context(viewport={'width': 390, 'height': 800}, locale='ar')
    pg = ctx.new_page()
    cur = {'p': ''}
    pg.on('pageerror', lambda e: bad(cur['p'], f'script error {e}'))
    for slug in CALCS:
        cur['p'] = f'/{slug}/'
        pg.goto(f'{B}/{slug}/', wait_until='load')
        counts['calcs'] += 1
        fields = pg.locator('[data-calc] input[inputmode="decimal"]')
        for i in range(fields.count()):
            f = fields.nth(i)
            if not f.is_visible(): continue
            for val in ('1000', '١٢', '1,500', '-5', '0', '99999999', 'abc'):
                f.fill(val)
                t = pg.locator('main').inner_text()
                m = BAD_TEXT.search(t)
                if m: bad(f'/{slug}/ field {i}', f'{val!r} -> {t[max(0, m.start() - 30):m.end() + 20]}')
            f.fill('')
        # every choice can be picked without breaking the page
        for i in range(pg.locator('[data-calc] .choice input').count()):
            pg.locator('[data-calc] .choice input').nth(i).check(force=True)
            if BAD_TEXT.search(pg.locator('main').inner_text()): bad(f'/{slug}/', f'choice {i} broke the text')
        for b in pg.locator('[data-act="reset"]').all():
            b.click()
        t = pg.locator('main').inner_text()
        if BAD_TEXT.search(t): bad(f'/{slug}/', 'broken text after reset')
        over = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
        if over > 0: bad(f'/{slug}/', f'sideways scroll after use {over}px')
    ctx.close()

    # Without scripts the pages still say something useful
    ctx = br.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 800}, locale='ar')
    pg = ctx.new_page()
    for path in ['/', '/end-of-service/', '/moments/leaving-job/', '/guides/zakat-step-by-step/', '/search/']:
        pg.goto(B + path)
        if len(pg.locator('main').inner_text()) < 200: bad(f'{path} no-js', 'almost empty')
    ctx.close()
    br.close()

print(f"{ENGINE}: {counts['pages']} page views at {WIDTHS}, {counts['calcs']} calculators exercised")
for x in sorted(set(problems))[:60]: print('PROBLEM', x)
print('problems:', len(set(problems)))
