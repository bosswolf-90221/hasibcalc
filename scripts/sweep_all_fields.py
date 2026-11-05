# Fill every field of every calculator and moment together, under 40 random mixes of its choices, and report any script error.
import itertools, json, re, subprocess, os, random
random.seed(7)
from playwright.sync_api import sync_playwright
B = os.environ.get('BASE_URL', 'http://localhost:4321')
root = 'dist'
pages = sorted(d for d in os.listdir(root) if os.path.isdir(f'{root}/{d}') and os.path.exists(f'{root}/{d}/index.html'))
paths = []
for d in pages:
    s = open(f'{root}/{d}/index.html', encoding='utf-8').read()
    if 'data-calc=' in s:
        paths.append(f'/{d}/')
paths += [f'/moments/{d}/' for d in os.listdir(f'{root}/moments') if os.path.isdir(f'{root}/moments/{d}')]
print(len(paths), 'pages')
total, bad = 0, []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    cur = ['']
    pg.on('pageerror', lambda e: bad.append((cur[0], e.message)) if 'googlesyndication' not in (e.stack or '') else None)
    for path in paths:
        pg.goto(B + path)
        cur[0] = path
        # all choices: radios by group, selects
        groups = pg.evaluate("""() => { const g = {}; document.querySelectorAll('main input[type=radio]').forEach(r => { (g[r.name] = g[r.name] || []).push(r.value) });
          document.querySelectorAll('main select').forEach(s => { g['#' + s.id] = [...s.options].map(o => o.value) }); return g }""")
        keys = list(groups)
        combos = [tuple(random.choice(groups[k]) for k in keys) for _ in range(40)] if keys else [()]
        for values in combos:
            cur[0] = f'{path} {dict(zip(keys, values))}'
            for k, v in zip(keys, values):
                if k.startswith('#'):
                    pg.select_option(k, v)
                else:
                    pg.evaluate("([n, v]) => { const r = [...document.querySelectorAll('main input[type=radio]')].find(x => x.name === n && x.value === v); if (r) r.click() }", [k, v])
            pg.evaluate("""() => { let i = 0; document.querySelectorAll('main input[inputmode=decimal]').forEach(el => { if (el.closest('[hidden]') && !el.closest('[data-other-rate]')) return; if (el.closest('.search-box')) return;
              el.value = String(el.value.trim() || (3 + (i++ % 5) * 40)); el.dispatchEvent(new Event('input', {bubbles: true})); }) }""")
            pg.wait_for_timeout(25)
            total += 1
    b.close()
print('combinations', total)
print('errors', len(bad))
for x in sorted(set(bad))[:20]:
    print(x[0][:110], '=>', x[1][:140])
