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
    pg.click('[data-act="reset"]'); pg.wait_for_timeout(300)
    check('loan: reset clears the numbers', pg.input_value('#f-months') == '' and pg.input_value('#f-principal') == '')
    check('loan: reset shows 0 and no red errors', val(pg) == '0.00' and not pg.locator('#f-months-err').is_visible() and not pg.locator('[data-r="error"]').is_visible(), val(pg))
    pg.fill('#f-principal', '50000'); pg.fill('#f-annualRatePercent', '4.5'); pg.fill('#f-months', '48'); pg.wait_for_timeout(400)
    check('loan: typing after reset computes again', val(pg) != '0.00', val(pg))

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

    pg.goto(B + '/hijri/')
    pg.fill('#f-date', '2026-10-21')
    check('hijri: 21 Oct 2026 → 10 جمادى الأولى 1448', val(pg, '[data-calc="to-hijri"]') == '10' and 'جمادى الأولى 1448' in pg.locator('[data-calc="to-hijri"] [data-r="unit"]').inner_text())
    pg.fill('#f-hYear', '1447'); pg.select_option('#f-hMonth', '9'); pg.fill('#f-hDay', '1')
    check('hijri: 1 Ramadan 1447 → 18 Feb 2026', val(pg, '[data-calc="to-greg"]') == '18' and 'فبراير 2026' in pg.locator('[data-calc="to-greg"] [data-r="unit"]').inner_text())

    pg.goto(B + '/days-between/')
    pg.fill('#f-startDate', '2026-10-01'); pg.fill('#f-endDate', '2026-10-31'); pg.click('label:has(input[value="yes"])')
    check('days: Oct 2026 inclusive = 31', val(pg) == '31', val(pg))
    check('days: 22 working days (Sat–Sun)', '22 يوم عمل' in pg.locator('[data-r="badge"]').inner_text())

    pg.goto(B + '/pregnancy/')
    pg.fill('#f-cycleDays', '60'); pg.wait_for_timeout(300)
    check('pregnancy: invalid cycle flagged', pg.locator('#f-cycleDays-err').is_visible())

    pg.goto(B + '/calories/')
    check('calories: default 2,740', val(pg) == '2,740', val(pg))
    pg.select_option('#f-activity', 'sedentary')
    check('calories: activity select recomputes', val(pg) == '2,121', val(pg))

    pg.goto(B + '/gosi/')
    check('gosi: new system Oct 2026 → 1,075.00', val(pg) == '1,075.00', val(pg))
    pg.click('label:has(input[value="legacy"])')
    check('gosi: legacy → 975.00', val(pg) == '975.00', val(pg))
    pg.click('label:has(input[value="non-saudi"])')
    check('gosi: non-Saudi → 0.00', val(pg) == '0.00', val(pg))

    pg.goto(B + '/hijri-age/')
    check('hijri-age: 1995-01-01 → 32 Hijri years', val(pg, '[data-calc="from-greg"]') == '32', val(pg, '[data-calc="from-greg"]'))
    check('hijri-age: Hijri birth date shown', '29 رجب 1415' in pg.locator('[data-calc="from-greg"] [data-result]').inner_text())
    check('hijri-age: Hijri input 29/7/1415 → 32', val(pg, '[data-calc="from-hijri"]') == '32', val(pg, '[data-calc="from-hijri"]'))
    pg.select_option('#f-hMonth', '8'); pg.fill('#f-hDay', '30'); pg.wait_for_timeout(300)
    check('hijri-age: 30th of a 29-day month flagged', pg.locator('#f-hDay-err').is_visible())
    pg.fill('#f-birthDate', '1960-03-15'); pg.wait_for_timeout(500)
    check('hijri-age: trio updates', pg.locator('[data-x="y"]').text_content().strip() == val(pg, '[data-calc="from-greg"]'))

    pg.goto(B + '/salary-day/')
    v0 = val(pg)
    check('salary-day: default renders a whole number of days', v0.isdigit(), v0)
    check('salary-day: 12 upcoming paydays listed', pg.locator('[data-x="table"] tbody tr').count() == 12)
    pg.fill('#f-payDay', '40'); pg.wait_for_timeout(300)
    check('salary-day: invalid day flagged', pg.locator('#f-payDay-err').is_visible())
    pg.fill('#f-payDay', '31'); pg.click('label:has(input[value="after"])'); pg.wait_for_timeout(400)
    check('salary-day: rule change recomputes, no NaN', 'NaN' not in pg.content() and val(pg).isdigit())

    pg.goto(B + '/pregnancy/')
    check('pregnancy: month row shown', 'الشهر من الحمل' in pg.locator('[data-result]').inner_text())
    check('pregnancy: weeks/months table has 9 rows', pg.locator('.article .data-table tbody tr').count() == 9)

    pg.goto(B + '/salary-day/')
    pg.evaluate("window.open = (u) => { window.__wa = u; return null; }")
    pg.click('[data-act="whatsapp"]')
    wa_url = pg.evaluate('window.__wa') or ''
    from urllib.parse import unquote
    txt = unquote(wa_url)
    check('whatsapp: wa.me link with result text and page URL', wa_url.startswith('https://wa.me/?text=') and ('باقي على الراتب' in txt or 'راتبك اليوم' in txt) and '/salary-day' in txt, txt[:160])

    for g in ['white-friday-2026', 'uae-national-day-2026', 'new-year-2027']:
        pg.goto(B + f'/guides/{g}/'); pg.wait_for_timeout(300)
        v = pg.locator('[data-countdown] [data-cd="value"] .sr-only').first.text_content().strip()
        check(f'countdown {g}: shows a number', v.isdigit(), v)
    check('preview image per page', pg.locator('meta[property="og:image"]').get_attribute('content').endswith('/og/g-new-year-2027.png'))

    for slug, day in [('salary-saudi', '27'), ('salary-uae', '1')]:
        pg.goto(B + f'/{slug}/'); pg.wait_for_timeout(400)
        check(f'{slug}: default day {day} and a whole number of days', pg.input_value('#f-payDay') == day and val(pg).isdigit(), val(pg))
        check(f'{slug}: 12 paydays listed', pg.locator('[data-x="table"] tbody tr').count() == 12)

    pg.goto(B + '/ovulation/?lmpDate=2026-10-01&cycleDays=28&periodDays=5'); pg.wait_for_timeout(500)
    check('ovulation: result shows a day', val(pg).isdigit(), val(pg))
    check('ovulation: 3 cycles listed', pg.locator('[data-x="table"] tbody tr').count() == 3)
    pg.fill('#f-cycleDays', '15'); pg.wait_for_timeout(300)
    check('ovulation: invalid cycle flagged', pg.locator('#f-cycleDays-err').is_visible())
    pg.evaluate("window.open = (u) => { window.__wa = u; return null; }")
    pg.fill('#f-cycleDays', '28'); pg.wait_for_timeout(300)
    pg.click('[data-act="whatsapp"]')
    from urllib.parse import unquote
    t = unquote(pg.evaluate('window.__wa') or '')
    check('whatsapp on a private result shares the question only', 'متى موعد التبويض' in t and 'يوم التبويض المتوقع' not in t, t[:120])

    pg.goto(B + '/annual-leave/?salary=6000&startDate=2024-03-01&endDate=2026-10-31&annualDays=30&takenDays=40&divisor=30'); pg.wait_for_timeout(500)
    check('annual-leave: 8,000 for 40 days left', val(pg).replace(',', '').startswith('8000'), val(pg))
    check('annual-leave: 3 service years + total row', pg.locator('[data-x="table"] tbody tr').count() == 4)
    pg.select_option('#f-divisor', '365'); pg.wait_for_timeout(300)
    check('annual-leave: 365 divisor changes the amount', val(pg).replace(',', '').startswith('7890'), val(pg))
    pg.fill('#f-annualDays', '20'); pg.wait_for_timeout(300)
    check('annual-leave: under 30 days flagged', pg.locator('#f-annualDays-err').is_visible())

    pg.goto(B + '/gpa/'); pg.wait_for_timeout(500)
    check('gpa: default cumulative 4.24', val(pg) == '4.24', val(pg))
    pg.fill('#f-prevGpa', ''); pg.fill('#f-prevHours', ''); pg.wait_for_timeout(300)
    check('gpa: semester only 4.38', val(pg) == '4.38', val(pg))
    pg.select_option('#f-g6', 'A-'); pg.fill('#f-h6', '3'); pg.wait_for_timeout(300)
    check('gpa: minus grade flagged on the Saudi scale', pg.locator('#f-g6-err').is_visible())

    pg.goto(B + '/gpa-target/?system=s4&current=3.37&doneHours=108&target=3.7&nextHours=18&leftHours=72'); pg.wait_for_timeout(500)
    check('gpa-target: impossible case shows 5.68 and best 3.62 at graduation', val(pg) == '5.68' and '3.62' in pg.locator('[data-r="rows"]').inner_text(), val(pg))

    check('no page errors during interaction', not errs, '; '.join(errs))
    b.close()
print(f'\n{len(fails)} failed' if fails else '\nall interaction checks passed'); sys.exit(1 if fails else 0)
