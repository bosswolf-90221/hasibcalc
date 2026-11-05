# Browser interaction checks against the built site (python + playwright). Dev aid; run with the site served on :4321.
import re, sys
from playwright.sync_api import sync_playwright
import os
sys.stdout.reconfigure(encoding='utf-8')
B = os.environ.get('BASE_URL', 'http://localhost:4321')
fails = []
def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  ({detail})' if detail and not cond else ''))
    if not cond: fails.append(name)
def val(pg, root='[data-calc]'):
    pg.wait_for_timeout(700)
    return pg.locator(f'{root} [data-r="value"] .sr-only').first.text_content().strip()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROME') or None); ctx = b.new_context(viewport={'width': 390, 'height': 844}, permissions=['clipboard-read', 'clipboard-write'])
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
    check('loan: reset shows a blank result and no red errors', val(pg) == '—' and not pg.locator('#f-months-err').is_visible() and not pg.locator('[data-r="error"]').is_visible(), val(pg))
    pg.fill('#f-principal', '50000'); pg.fill('#f-annualRatePercent', '4.5'); pg.fill('#f-months', '48'); pg.wait_for_timeout(400)
    check('loan: typing after reset computes again', val(pg) not in ('0.00', '—'), val(pg))

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
    check('home: all nine moments are listed', pg.locator('#moments .moment').count() == 9)
    check('home: all calculators are listed', pg.locator('#calc-list a').count() == 22)
    visible = lambda href: pg.locator(f'#calc-list a[href="{href}"]').is_visible()
    pg.fill('#q', 'قسط سيارة'); pg.wait_for_timeout(100)
    check('home search: finds the loan page', visible('/loan/') and not visible('/bmi/'))
    pg.fill('#q', 'زكاه'); pg.wait_for_timeout(100)
    check('home search: tolerant of ة/ه spelling', visible('/zakat/'))
    pg.fill('#q', 'لا شيء هنا'); pg.wait_for_timeout(100)
    check('home search: says when nothing matches', pg.locator('#finder-none').is_visible())
    pg.fill('#q', '')
    check('home: phone menu opens', pg.locator('.head-menu summary').is_visible())
    pg.click('.head-menu summary'); pg.wait_for_timeout(100)
    check('home: phone menu shows the moments', pg.locator('.head-menu a[href="/moments/leaving-job/"]').is_visible())

    pg.goto(B + '/moments/leaving-job/'); pg.wait_for_timeout(200)
    mval = lambda: pg.locator('[data-view] .result-value').inner_text()
    first = mval()
    pg.fill('#f-salary', '10000'); pg.wait_for_timeout(100)
    check('moment: result updates and the example label goes', mval() != first and not pg.locator('[data-example]').is_visible())
    pg.fill('#f-salary', '8000,500'); pg.wait_for_timeout(100)
    check('moment: unreadable number shows a message', pg.locator('[data-view] .field-error').is_visible())
    pg.click('[data-reset]'); pg.wait_for_timeout(100)
    check('moment: start over restores the example', pg.input_value('#f-salary') == '8000' and mval() == first and pg.locator('[data-example]').is_visible())
    pg.goto(B + '/moments/expecting-baby/'); pg.wait_for_timeout(200)
    check('moment: dated moments start empty', pg.locator('[data-view] .empty-state').is_visible())
    pg.fill('#f-lmp', '2026-10-20'); pg.wait_for_timeout(100)
    check('moment: a date gives a result', pg.locator('[data-view] .result-value').is_visible())
    pg.goto(B + '/moments/monthly-pay/'); pg.wait_for_timeout(200)
    check('moment: GOSI fields show for Saudi Arabia', pg.locator('#f-basic').is_visible())
    pg.locator('input[name="country"][value="uae"]').check(force=True); pg.wait_for_timeout(100)
    check('moment: GOSI fields hide for the UAE', not pg.locator('#f-basic').is_visible())

    pg.goto(B + '/bmi/'); pg.keyboard.press('Tab')
    check('keyboard: skip link comes first', pg.evaluate('document.activeElement.classList.contains("skip")'))
    pg.keyboard.press('Tab')
    check('keyboard: then the named logo link', bool(pg.evaluate('document.activeElement.getAttribute("aria-label")')))

    # Example numbers are marked, the mark goes with the first edit, and nothing stale stays on screen
    pg.goto(B + '/bmi/')
    check('example: marked on arrival', pg.locator('[data-example]').is_visible())
    pg.fill('#f-weightKg', '80'); pg.wait_for_timeout(100)
    check('example: mark gone after first edit', not pg.locator('[data-example]').is_visible())
    pg.click('[data-act="reset"]'); pg.wait_for_timeout(100)
    check('blank: no exhibit, copy or print without a result', not pg.locator('.exhibit').first.is_visible() and not pg.locator('[data-act="copy"]').is_visible() and not pg.locator('[data-act="print"]').is_visible())
    pg.fill('#f-weightKg', '80'); pg.fill('#f-heightCm', '180'); pg.wait_for_timeout(100)
    check('blank: result and exhibit return with numbers', pg.locator('.exhibit').first.is_visible() and pg.locator('[data-act="copy"]').is_visible())
    # Every number sits under its column heading, and no cell mixes Arabic words into a left-to-right run
    TABLES_JS = r'''() => { const box = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); }; const out = [];
      document.querySelectorAll('table').forEach((t) => { const ths = [...t.querySelectorAll('thead th')]; if (!ths.length || !t.getBoundingClientRect().width) return;
        t.querySelectorAll('tbody tr').forEach((tr) => { const tds = [...tr.children]; if (tds.length !== ths.length) return;
          tds.forEach((td, i) => { if (!td.textContent.trim()) return; const a = box(ths[i]), c = box(td);
            if (Math.min(a.right, c.right) - Math.max(a.left, c.left) <= 0) out.push('off ' + td.textContent.trim().slice(0, 12));
            if (getComputedStyle(td).direction === 'ltr' && /[\u0600-\u06FF]/.test(td.textContent)) out.push('mixed ' + td.textContent.trim().slice(0, 12)); }); }); });
      return out.slice(0, 4); }'''
    for slug, q in (('annual-leave', ''), ('gosi', ''), ('gpa', ''), ('gpa-target', ''), ('pregnancy', '?lmpDate=2026-08-26'), ('zakat', ''), ('loan', ''), ('vat', '')):
        pg.goto(f'{B}/{slug}/{q}')
        bad = pg.evaluate(TABLES_JS)
        check(f'{slug}: table numbers under their headings', not bad, str(bad))

    for slug in 'white-friday-2026 uae-national-day-2026 new-year-2027 ramadan-1448 end-of-service-guide flat-vs-reducing-interest vat-gulf-guide zakat-step-by-step pregnancy-weeks-months ideal-weight-by-height how-to-calculate-percentage age-in-hijri'.split():
        pg.goto(f'{B}/guides/{slug}/')
        bad = pg.evaluate(TABLES_JS)
        over = pg.evaluate('document.documentElement.scrollWidth - window.innerWidth')
        check(f'guide {slug}: one h1, new look, tables aligned, no overflow', pg.locator('h1').count() == 1 and pg.locator('.stage, .card, astro-island').count() == 0 and not bad and over <= 0, f'{bad} over {over}')
    pg.goto(B + '/guides/'); check('guides index: 12 guides listed', pg.locator('.guide-cards a').count() == 12)
    pg.goto(B + '/guides/pregnancy-weeks-months/')
    for wk, tri in (('13', 'الأول'), ('14', 'الأول'), ('28', 'الثاني'), ('29', 'الثالث')):
        pg.fill('#wk', wk)
        check(f'pregnancy guide: week {wk} is in the {tri} trimester', f'الثلث {tri}' in pg.locator('#wk-out').inner_text())

    pg.goto(B + '/bmi/?weightKg=80&heightCm=180')
    check('example: no mark on numbers from a link', not pg.locator('[data-example]').is_visible())
    for slug, field in (('age', 'birthDate'), ('pregnancy', 'lmpDate'), ('ovulation', 'lmpDate')):
        pg.goto(f'{B}/{slug}/')
        check(f'{slug}: starts empty with no made-up result', pg.input_value(f'#f-{field}') == '' and val(pg) == '—' and not pg.locator('[data-example]').is_visible() and not pg.locator('[data-r="error"]').is_visible() and not pg.locator('.exhibit').first.is_visible(), val(pg))
    for slug in 'age annual-leave bmi calories days-between discount end-of-service exit-dues gosi gpa-target gpa hijri-age hijri loan ovulation percentage pregnancy salary-day salary-saudi salary-uae vat zakat'.split():
        pg.goto(f'{B}/{slug}/')
        unlabeled = pg.evaluate('''[...document.querySelectorAll('[data-calc] input[data-field], [data-calc] select[data-field]')].filter((i) => !i.labels || !i.labels.length || !i.labels[0].textContent.trim()).length''')
        check(f'{slug}: every field has a label, one h1, old look gone', unlabeled == 0 and pg.locator('h1').count() == 1 and pg.locator('.sentence, .machine, .ask-line').count() == 0, str(unlabeled))

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

    pg.goto(B + '/pregnancy/?lmpDate=2026-08-26'); pg.wait_for_timeout(200)
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

    pg.goto(B + '/exit-dues/?basicSalary=8000&startDate=2019-03-01&endDate=2026-02-28&unpaidAbsenceDays=0&takenDays=150'); pg.wait_for_timeout(500)
    check('exit-dues: total 60,043.84', val(pg).replace(',', '') == '60043.84', val(pg))
    check('exit-dues: bar shows two parts', pg.locator('[data-x="bar"] .dues-key li').count() == 2)
    pg.fill('#f-takenDays', '210'); pg.wait_for_timeout(300)
    check('exit-dues: no leave left leaves gratuity only', val(pg).replace(',', '') == '44043.84', val(pg))
    pg.fill('#f-basicSalary', '-5'); pg.wait_for_timeout(300)
    check('exit-dues: negative salary flagged', pg.locator('#f-basicSalary-err').is_visible())

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
