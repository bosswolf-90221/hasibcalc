# Browser interaction checks against the built site (python + playwright). Dev aid; run with the site served on :4321.
import re, sys
from playwright.sync_api import sync_playwright
import os
B = os.environ.get('BASE_URL', 'http://localhost:4321')
fails = []
def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  ({detail})' if detail and not cond else ''))
    if not cond: fails.append(name)
def val(pg, root='[data-calc]'):
    pg.wait_for_timeout(700)
    return pg.locator(f'{root} [data-r="value"] .sr-only').first.text_content().strip()
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, permissions=['clipboard-read', 'clipboard-write'])
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))

    pg.goto(B + '/loan/')
    pg.fill('#f-principal', '50000'); pg.fill('#f-annualRatePercent', '4.5'); pg.fill('#f-months', '48')
    P, r, n = 50000, 0.045/12, 48; exp = P*r/(1-(1+r)**-n)
    check('loan: typed values update instantly (reducing)', val(pg) == f'{exp:,.2f}', val(pg))
    pg.click('label:has(input[value="flat"])')
    check('loan: switching to flat recomputes', val(pg) == f'{(50000+50000*0.045*4)/48:,.2f}', val(pg))
    pg.fill('#f-months', '0')
    pg.wait_for_timeout(300)
    check('loan: invalid term shows field error', pg.locator('#f-months-err').is_visible() and pg.get_attribute('#f-months', 'aria-invalid') == 'true')
    check('loan: no NaN on screen', 'NaN' not in pg.content())
    pg.click('[data-act="reset"]')
    check('loan: reset restores defaults', pg.input_value('#f-months') == '48')

    pg.goto(B + '/end-of-service/?basicSalary=10000&startDate=2015-01-01&endDate=2024-12-31&unpaidAbsenceDays=0')
    check('eos: inputs filled from URL', pg.input_value('#f-basicSalary') == '10000')
    check('eos: URL notice shown', pg.locator('[data-r="from-url"]').is_visible())
    pg.click('[data-act="clear-url"]'); pg.wait_for_timeout(200)
    check('eos: clearing numbers from the URL', '?' not in pg.url)
    pg.click('[data-act="share-values"]'); pg.wait_for_timeout(200)
    clip = pg.evaluate('navigator.clipboard.readText()')
    check('eos: share-with-numbers copies params', 'basicSalary=10000' in clip, clip)
    pg.click('[data-act="share-clean"]'); pg.wait_for_timeout(200)
    clip = pg.evaluate('navigator.clipboard.readText()')
    check('eos: clean share has no numbers', '?' not in clip, clip)

    pg.goto(B + '/vat/')
    pg.click('label:has(input[value="extract"])'); pg.fill('#f-amount', '١٠٥٠')
    check('vat: Arabic digits accepted, 1050 incl. → 1,000.00', val(pg) == '1,000.00', val(pg))

    pg.goto(B + '/percentage/')
    pg.fill('#f-p2_whole', '0'); pg.wait_for_timeout(300)
    check('percentage: divide by zero handled', pg.locator('[data-calc="what-pct"] [data-r="error"]').is_visible())
    check('percentage: other questions unaffected', val(pg, '[data-calc="pct-of"]') == '100.00')

    pg.goto(B + '/zakat/')
    check('zakat: no invented gold price', pg.input_value('#f-goldPricePerGram') == '')
    pg.fill('#f-goldPricePerGram', '400')
    check('zakat: 75,000 net at 400/g → 1,875.00', val(pg) == '1,875.00', val(pg))

    pg.goto(B + '/age/')
    pg.fill('#f-birthDate', '2000-02-29')
    check('age: result renders a whole number', re.fullmatch(r'\d+', val(pg)) is not None, val(pg))

    pg.goto(B + '/')
    check('home: live calculator shows a number', re.fullmatch(r'[\d,]+\.\d\d', val(pg)) is not None, val(pg))
    pg.click('.topsearch'); pg.wait_for_timeout(200)
    pg.fill('#q', 'قسط سيارة'); pg.wait_for_timeout(200)
    check('home search: finds the loan page', pg.locator('#search-results a[href="/loan/"]').count() == 1)
    pg.fill('#q', 'زكاه'); pg.wait_for_timeout(200)
    check('home search: tolerant of ة/ه spelling', pg.locator('#search-results a[href="/zakat/"]').count() == 1)

    pg.goto(B + '/bmi/'); pg.keyboard.press('Tab'); pg.keyboard.press('Tab')
    focused = pg.evaluate('document.activeElement && document.activeElement.textContent.trim().slice(0,20)')
    check('keyboard: skip link then header reachable', bool(focused))

    check('no page errors during interaction', not errs, '; '.join(errs))
    b.close()
print(f'\n{len(fails)} failed' if fails else '\nall interaction checks passed'); sys.exit(1 if fails else 0)
