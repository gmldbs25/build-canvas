"""Chromium browser checks and screenshot evidence for Work 08.
Requires Python Playwright and, for screenshots, Pillow. Run from repository root.
"""
import argparse
import functools
import io
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import sync_playwright

WIDTHS = (320, 390, 768, 1024, 1440, 1920)
OTHER_WORKS = (
    'texas-trace', 'orca', 'transformer-to-agent', 'nand-flash',
    'kotomachi', 'fab-flow-preview', 'web-evolution',
)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def copyfile(self, source, target):
        try:
            super().copyfile(source, target)
        except (BrokenPipeError, ConnectionResetError):
            pass


def screenshot(page, output, name, wide=False):
    if output is None:
        return
    from PIL import Image
    output.mkdir(parents=True, exist_ok=True)
    page.evaluate('document.fonts.ready')
    im = Image.open(io.BytesIO(page.screenshot(animations='disabled')))
    if not wide:
        im.thumbnail((700, 800))
    im.save(output / f'{name}.webp', quality=85)


def verify_story(browser, portfolio, options, baseline):
    story = portfolio + 'riemann-lean/'
    base = story + 'textbook/'
    problems, font_failures = set(), set()
    for width in WIDTHS:
        mobile = width <= 390
        context = browser.new_context(viewport={'width': width, 'height': 844 if mobile else 1000},
                                      has_touch=mobile, reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda error: problems.add(str(error)))

        def flag_failure(url):
            if url.startswith(portfolio):
                problems.add(url)
            else:
                font_failures.add(url.split('/')[2])

        page.on('response', lambda response: flag_failure(response.url) if response.status >= 400 else None)
        page.on('requestfailed', lambda request: flag_failure(request.url) if request.failure != 'net::ERR_ABORTED' else None)
        page.goto(story)
        page.evaluate("localStorage.setItem('w8:mode', 'math')")
        page.goto(story + '?mode=math&selftest=1')
        page.locator('#selftest[data-result]').wait_for()
        assert page.locator('#selftest').get_attribute('data-result') == 'pass', page.locator('#selftest').inner_text()
        assert page.locator('#heroTitle').is_visible()
        assert not page.locator('#modeToggle, [data-mode], .only-math, .only-intuition').count()
        assert page.locator('#sieve button').count() == 100
        page.keyboard.press('m')
        page.keyboard.press('?')
        assert 'M ' not in page.locator('#shortcuts').inner_text()
        page.keyboard.press('Escape')
        assert not page.locator('#shortcuts').is_visible()

        assert page.evaluate('document.documentElement.scrollWidth') == width, ('story overflow', width)
        bridge = page.get_by_role('link', name='리만 가설, 깊이 읽기', exact=False)
        textbook = page.get_by_role('link', name='심화 교과서 ↗', exact=True)
        assert textbook.is_visible()
        assert textbook.evaluate('link => link.getBoundingClientRect().right <= innerWidth')
        for act in range(1, 5):
            anchor = f'#act{act}'
            page.goto(story + anchor)
            page.locator(f'.chapters a[href="{anchor}"][aria-current="location"]').wait_for()
            assert page.locator('html').get_attribute('data-era') == ('paper' if act < 3 else 'terminal')

        page.goto(story)
        for key in '1234':
            page.keyboard.press(key)
            page.locator(f'.chapters a[href="#act{key}"][aria-current="location"]').wait_for()
        assert '증명은 끝났고,' in page.locator('#act4Title').inner_text()
        assert '이해는 이제 시작이다.' in page.locator('#act4Title').inner_text()
        bridge.focus()
        assert bridge.evaluate('el => el === document.activeElement')
        bridge.press('Enter')
        page.wait_for_url(base)
        page.go_back()
        page.wait_for_url(story)

        page.goto(story + '#act2')
        page.locator('#psiCanvas').wait_for()
        preset = page.locator('[data-preset="60"]')
        preset.scroll_into_view_if_needed()
        page.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
        preset.click()
        assert page.locator('#nRange').input_value() == '60'
        plane_tab = page.locator('[data-lab-tab="plane"]')
        if plane_tab.is_visible():
            plane_tab.click()
        page.locator('#planeCanvas').wait_for()
        page.locator('#sigmaRange').press('End')
        assert page.locator('#labPlate').get_attribute('data-sigma-state') == 'escaped'
        page.locator('#resetSigma').click()
        assert page.locator('#sigmaRange').input_value() == '0.5'

        page.goto(story + '#act3')
        page.locator('#lean [data-step="1"]').click()
        page.locator('#wrongBtn').click()
        assert page.locator('#leanError').inner_text().strip()
        for step in (2, 3):
            page.locator(f'#lean [data-step="{step}"]').click()
        assert '3 / 3' in page.locator('#progressTxt').inner_text()
        page.locator('#resetLean').click()
        assert '0 / 3' in page.locator('#progressTxt').inner_text()

        page.goto(story + '?xp=1&step=1')
        dialog = page.get_by_role('dialog')
        dialog.wait_for()
        assert dialog.locator('.xp__numbers span').count() == 20
        action = dialog.locator('#xpNext')
        for _ in range(2):
            action.tap() if mobile else action.click()
        assert dialog.locator('.xp__numbers .prime').count() == 8
        dialog.get_by_role('button', name='2단계 비율 비교').click()
        action.click()
        assert '관찰 기록' in dialog.locator('.xp__note').inner_text()
        dialog.get_by_role('button', name='3단계 계단 그리기').click()
        for _ in range(dialog.locator('.xp__timeline i').count() - 1):
            action.click()
        assert dialog.locator('input[type=range]').count()
        dialog.locator('input[type=range]').press('End')
        page.goto(story + '?xp=1&step=4')
        dialog.wait_for()
        assert dialog.locator('button[data-xp-step="4"]').get_attribute('aria-pressed') == 'true'
        for _ in range(dialog.locator('.xp__timeline i').count() - 1):
            action.click()
        assert dialog.locator('input[type=range]').count()
        dialog.locator('input[type=range]').press('End')
        page.keyboard.press('Escape')
        dialog.wait_for(state='hidden')
        page.wait_for_url(story)
        page.locator('#xpOpen').click()
        page.wait_for_url(story + '?xp=1&step=1')
        page.go_back()
        dialog.wait_for(state='hidden')
        page.go_forward()
        dialog.wait_for()
        page.keyboard.press('Escape')
        dialog.wait_for(state='hidden')
        page.keyboard.press('h')
        page.wait_for_url(portfolio)
        page.goto(story + '?xp=1&step=4')
        dialog.wait_for()
        dialog.locator('h2').press('h')
        page.wait_for_url(portfolio)

        if options.output and width in (390, 1440):
            page.goto(story)
            screenshot(page, options.output, f'story-hero-{width}', wide=True)
            page.goto(story + '#act4')
            page.locator('html[data-era=terminal]').wait_for()
            screenshot(page, options.output, f'story-ending-{width}', wide=True)
            bridge.evaluate('link => link.scrollIntoView({block: "center"})')
            screenshot(page, options.output, f'story-textbook-link-{width}', wide=True)
            if baseline:
                page.goto(baseline)
                screenshot(page, options.output, f'before-story-hero-{width}', wide=True)
                page.goto(baseline + '#act4')
                page.locator('html[data-era=terminal]').wait_for()
                screenshot(page, options.output, f'before-story-ending-{width}', wide=True)
        context.close()
        print(f'{width}px story: 4 acts, era change, notes, wave/plane, Mini Lean, links and keyboard', flush=True)
    assert not problems, problems
    if font_failures:
        print('External story font requests failed: ' + ', '.join(sorted(font_failures)), flush=True)


def verify_chapters(browser, base, options):
    configs = list(range(options.first, options.last + 1))
    all_labs = set()
    all_questions = 0
    problems = []
    for width in WIDTHS:
        mobile = width <= 390
        cpu = browser.new_context(viewport={'width': width, 'height': 844 if mobile else 1000},
                                  reduced_motion='reduce', has_touch=mobile)
        page = cpu.new_page()
        page.on('pageerror', lambda error: problems.append(str(error)))
        page.on('response', lambda response: problems.append(f'{response.status} {response.url}')
                if response.status >= 400 else None)
        page.on('request', lambda request: problems.append(f'External request: {request.url}')
                if not request.url.startswith(base.rsplit('/riemann-lean', 1)[0]) else None)
        if options.first == 1:
            page.goto(base)
            assert page.locator('.part-index li').count() == 12
            assert page.evaluate('document.documentElement.scrollWidth') == width
            if width in (390, 1440):
                screenshot(page, options.output, 'after-mobile' if mobile else 'after-desktop', wide=True)
        labs_this_width = set()
        questions = 0
        for num in configs:
            response = page.goto(f'{base}chapter-{num:02d}/')
            assert response.status == 200
            assert page.locator('h1').count() == 1
            assert page.locator('.toc [aria-current="page"]').count() == 2
            assert page.locator('.chapter-pagination a').count() == 2
            assert page.evaluate('document.documentElement.scrollWidth') == width, (num, width, 'chapter overflow')
            pictures = width in (390, 1440)
            if pictures:
                screenshot(page, options.gallery, f'c{num:02d}-{width}')
            questions_by_chapter = page.locator('#review details')
            questions += questions_by_chapter.count()
            for question in questions_by_chapter.all():
                if width == 390:
                    question.locator('summary').click()
                    assert question.locator('p').is_visible()
                    question.locator('summary').click()
            for lab in page.locator('[data-lab]').all():
                name = lab.get_attribute('data-lab')
                lab.scroll_into_view_if_needed()
                page.wait_for_function('(id) => document.getElementById(id).dataset.ready === "true"', arg=name)
                assert not lab.locator('.lab-error:not([hidden]), .w08-warning:not([hidden])').count(), (name, width, 'invalid default')
                assert page.evaluate('document.documentElement.scrollWidth') == width, (name, width, 'lab overflow')
                labs_this_width.add(name)
                lab.evaluate('element => element.scrollIntoView({ block: "start" })')
                if pictures:
                    screenshot(page, options.gallery, f'lab-{name}-{width}')
                if width in (390, 1440) and name in ('07-a', '09-a', '11-b', '12-a'):
                    if name == '07-a':
                        lab.locator('canvas[data-ready]').wait_for()
                    if name == '09-a':
                        lab.locator('.w08-plot-card').scroll_into_view_if_needed()
                    screenshot(page, options.output, f'lab-{name}-{width}', wide=True)
                if width == 390:
                    button = lab.locator('[data-expand]')
                    button.tap()
                    assert page.locator('dialog[open]').count() == 1, name
                    page.keyboard.press('Escape')
                    assert page.locator('dialog[open]').count() == 0, name
                    assert button.evaluate('el => document.activeElement === el'), name
        all_labs.update(labs_this_width)
        all_questions = questions
        print(f'{width}px: {len(configs)} chapters · {len(labs_this_width)} labs · {questions} questions · no horizontal page overflow', flush=True)
        cpu.close()
    if configs == list(range(1, 13)):
        assert (len(all_labs), all_questions) == (25, 52)
    assert not problems, problems


def verify_reference_labs(browser, base):
    page = browser.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
    for name, selector, text in (
        ('08-a', 'button[data-preset="x = 5.5"]', '4.094345'),
        ('08-b', 'button[data-preset="m = 50"]', '3,099,044,504,245,996,706,400'),
        ('08-c', 'button[data-preset="2의 세 항"]', '0.01083042'),
        ('10-a', 'button[data-preset="β = 0.9"]', '11.669982'),
        ('07-b', 'button[data-preset="t = 14"]', '0.105626268'),
        ('07-c', 'button[data-preset="β = ½"]', '좌우 반사는 같은 점'),
    ):
        page.goto(f'{base}chapter-{name[:2]}/#{name}')
        lab = page.locator(f'[data-lab="{name}"]')
        lab.locator(selector).tap()
        assert text in lab.inner_text(), (name, text)
        lab.get_by_role('button', name='초기화', exact=True).tap()
    page.goto(f'{base}chapter-07/?07-a-re=-3#07-a')
    lab = page.locator('[data-lab="07-a"]')
    lab.locator('canvas[data-ready]').wait_for()
    assert '기본값' in lab.locator('.lab-error').inner_text()
    lab.get_by_role('button', name='s = 1 · 극').tap()
    assert '단순극' in lab.locator('.lab-readout').inner_text()
    lab.locator('select[name=view]').select_option('full')
    lab.get_by_role('button', name='현재 점을 중심으로 확대').tap()
    lab.locator('canvas[data-ready]').wait_for()
    assert '세로 허수부 -10–10' in lab.locator('[data-map-axis]').inner_text()
    lab.locator('canvas').press('ArrowUp')
    assert float(lab.locator('input[name=im]').input_value()) > 0
    lab.locator('input[name=re]').fill('-3')
    assert lab.locator('[aria-invalid=true]').count() == 1
    lab.get_by_role('button', name='초기화', exact=True).tap()
    assert lab.locator('input[name=re]').input_value() == '0.5'
    page.goto(f'{base}chapter-09/?09-a-n=60&09-a-x=4#09-a')
    lab = page.locator('[data-lab="09-a"]')
    lab.locator('[data-control=n]').wait_for()
    assert '2.14768468' in lab.locator('.w08-readouts').inner_text()
    lab.locator('[data-panel=wave]').tap()
    assert '선택한 파동' in lab.locator('.w08-plot-card').inner_text()
    assert lab.locator('.w08-spectrum-item .w08-bar').count() == 60
    lab.locator('[data-control=selected]').select_option('1')
    assert '21.022039' in lab.locator('.w08-detail-card').first.inner_text()
    lab.locator('[data-window=zoom]').tap()
    assert lab.locator('[data-control=end]').input_value() == '51'
    lab.locator('[data-control=x]').fill('0')
    lab.locator('[data-control=x]').press('Tab')
    assert lab.locator('.w08-warning').is_visible()
    assert lab.locator('[data-control=x]').input_value() == '4'
    lab.get_by_role('button', name='초기화', exact=True).tap()
    assert lab.locator('[data-control=n]').input_value() == '15'
    print('07–10: numeric readouts, presets, bounds, reset, worker tokens and keyboard/touch inputs', flush=True)
    page.close()


def verify_proof_labs(browser, base):
    page = browser.new_page()
    page.goto(base + 'chapter-11/#11-b')
    lean = page.locator('[data-lab="11-b"]')
    lean.get_by_role('combobox').select_option('positive')
    advance = lean.get_by_role('button', name='다음 단계')
    for _ in range(3):
        advance.click()
    assert '실제 Lean 컴파일 성공 · exit code 0' in lean.inner_text()
    lean.get_by_role('button', name='의도적으로 실패한 제출 보기').click()
    assert '기록된 Lean 오류' in lean.inner_text()
    assert 'SHA-256:' in lean.inner_text()
    page.goto(base + 'chapter-12/#12-a')
    explorer = page.locator('[data-lab="12-a"]')
    explorer.locator('[data-view=graph]').click()
    explorer.locator('select').first.select_option('compact')
    assert explorer.locator('.proof-edge').count() == 17
    explorer.get_by_role('combobox', name='의존성 그래프 깊이').select_option('1')
    assert 0 < explorer.locator('.proof-edge').count() < 17
    explorer.locator('.proof-edge').first.click()
    assert '간선 근거:' in explorer.inner_text()
    explorer.locator('[data-view=ledger]').click()
    assert explorer.locator('a[href*="math.mit.edu"]').count()
    page.close()
    print('11–12: successful and failed Lean replay, proof graph and source ledger', flush=True)


def verify_navigation(browser, base, portfolio):
    page = browser.new_page()
    story = f'{portfolio}riemann-lean/' if portfolio else None
    for target, previous in (
        ('01/#01-b', '?xp=1&step=1'), ('03/#03-a', '?xp=1&step=2'),
        ('09/#09-a', '?xp=1&step=3'), ('10/#10-a', '?xp=1&step=4'),
        ('02/#02-a', '#act1'), ('09/#09-a', '#act2'), ('11/#11-b', '#act3'), ('12/#12-a', '#act4'),
    ):
        page.goto(base + previous, wait_until='commit')
        page.wait_for_url(f'{base}chapter-{target}')
    if story:
        for route in tuple(f'chapter-{number:02d}/' for number in range(1, 13)) + ('epilogue/', 'glossary/'):
            fragment = '?09-a-n=60&09-a-x=4#09-a' if route == 'chapter-09/' else ''
            page.goto(story + route + fragment, wait_until='commit')
            page.wait_for_url(base + route + fragment)
            assert page.locator('link[rel=canonical]').get_attribute('href').endswith('/textbook/' + route)
        page.reload()
        assert page.url == base + 'glossary/'

        page.goto(base + 'chapter-09/?09-a-n=60&09-a-x=4#09-a')
        assert '2.14768468' in page.locator('.w08-readouts').inner_text()
        page.get_by_role('link', name='← 이야기로 돌아가기').click()
        page.wait_for_url(story)
        assert page.locator('#act4').count() == 1
        page.go_back()
        page.wait_for_url(base + 'chapter-09/?09-a-n=60&09-a-x=4#09-a')
        page.go_forward()
        page.wait_for_url(story)
        page.evaluate("""localStorage.setItem('build-canvas.work-08.study.v2', JSON.stringify({
            visited: ['06'], completed: ['06'], resume: { id: '06', section: '#6-2' }
        }))""")
        page.goto(base)
        assert page.locator('[data-resume]').get_attribute('href').endswith('chapter-06/#6-2')
        assert '학습 완료로 표시한 장 1' in page.locator('[data-study-status]').inner_text()
        page.locator('[data-clear]').click()
    page.goto(f'{base}chapter-09/#09-a')
    page.locator('[data-complete]').click()
    assert page.locator('[data-complete]').get_attribute('aria-pressed') == 'true'
    page.go_back()
    page.goto(base)
    assert page.locator('[data-resume]').is_visible()
    assert '학습 완료로 표시한 장 1' in page.locator('[data-study-status]').inner_text()
    page.locator('[data-clear]').click()
    assert not page.locator('[data-resume]').is_visible()
    page.goto(f'{base}chapter-09/#09-a')
    page.locator('[data-control=x]').focus()
    page.keyboard.press('h')
    assert 'chapter-09' in page.url
    page.locator('[data-control=x-slider]').focus()
    page.keyboard.press('h')
    assert 'chapter-09' in page.url
    if portfolio:
        page.locator('h1').click()
        page.keyboard.press('h')
        page.wait_for_url(portfolio)
        page.locator('a[href="./riemann-lean/"]').click()
        page.wait_for_url(story)
        page.get_by_role('link', name='심화 교과서 ↗').click()
        page.wait_for_url(base)
        page.locator('h1').click()
        page.keyboard.press('h')
        page.wait_for_url(portfolio)
        for slug in OTHER_WORKS:
            assert page.locator(f'a[href="./{slug}/"]').count() >= 1, slug
            assert page.goto(portfolio + slug + '/').status == 200, slug
            assert page.title().strip(), slug
            page.goto(portfolio)
        print('Pages: home plus seven Work routes, and H navigation intact', flush=True)
    page.close()
    print('Navigation: old routes, manual study marks, resume and storage reset', flush=True)
    with browser.new_context(java_script_enabled=False) as plain:
        page = plain.new_page()
        if story:
            page.goto(story + 'chapter-09/#09-a')
            assert 'noindex' in page.locator('meta[name=robots]').get_attribute('content')
            page.get_by_role('link', name='새 교과서 페이지로 이동 →').click()
            page.wait_for_url(base + 'chapter-09/')
        page.goto(f'{base}chapter-09/#09-a')
        assert page.locator('math').count() == 2
        assert '대표 관찰' in page.locator('[data-lab]').inner_text()
        assert page.locator('noscript').is_visible()
        page.locator('#review summary').first.click()
        assert page.locator('#review details[open] p').is_visible()
        print('JS disabled: chapter text, math, example, navigation and answer disclosure', flush=True)


def verify_accessibility(browser, base):
    page = browser.new_page(viewport={'width': 320, 'height': 720}, reduced_motion='reduce')
    for chapter in ('09', '11'):
        page.goto(f'{base}chapter-{chapter}/')
        assert page.get_by_role('main').get_by_role('heading', level=1).count() == 1
        assert page.get_by_role('link', name='Build Canvas 홈 (H)').count() == 1
        back = page.get_by_role('link', name='← 이야기로 돌아가기')
        assert back.is_visible()
        assert back.evaluate('el => el.getBoundingClientRect().right <= innerWidth')
        page.locator('.mast-contents summary').press('Enter')
        assert page.locator('.mast-panel').get_by_role('link', name='교과서 목차').is_visible()
        page.keyboard.press('Escape')
        assert not page.locator('.mast-panel').is_visible()
        contrast = page.evaluate("""() => {
          const style = getComputedStyle(document.body);
          function luminance(name) {
            const value = style.getPropertyValue(name).trim().slice(1);
            const rgb = [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16) / 255);
            return rgb.map(x => x <= 0.04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
              .reduce((acc, x, i) => acc + x * [.2126, .7152, .0722][i], 0);
          }
          return ['--ink', '--muted', '--accent'].flatMap(foreground => ['--paper', '--surface'].map(background => {
            const first = luminance(foreground), second = luminance(background);
            return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
          }));
        }""")
        assert min(contrast) >= 4.5, (chapter, contrast)
    page.goto(f'{base}chapter-09/#09-a')
    graph = page.get_by_role('img', name='실제 ψ₀(x), 점프에서 중간값', exact=False)
    graph.first.wait_for()
    select = page.get_by_role('combobox', name='포함한 영점 쌍 N')
    select.focus()
    select.press('ArrowDown')
    assert select.input_value() == '16'
    assert select.evaluate('el => el === document.activeElement')
    assert select.evaluate('el => getComputedStyle(el).outlineStyle') == 'solid'
    page.close()
    print('Accessibility: native roles and labels, focus and contrast checks in paper/terminal themes', flush=True)


def measure(browser, base):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True)
    page = context.new_page()
    client = context.new_cdp_session(page)
    client.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    client.send('Network.enable')
    client.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150,
        'downloadThroughput': 1_600_000 / 8, 'uploadThroughput': 750_000 / 8})
    page.add_init_script("""window.metrics = { lcp: 0, cls: 0 };
      new PerformanceObserver(list => { metrics.lcp = list.getEntries().at(-1).startTime; }).observe({type:'largest-contentful-paint', buffered:true});
      new PerformanceObserver(list => { for(const e of list.getEntries()) if(!e.hadRecentInput) metrics.cls += e.value; }).observe({type:'layout-shift', buffered:true});
    """)
    page.goto(base, wait_until='networkidle')
    landing = page.evaluate('window.metrics')
    page.goto(f'{base}chapter-09/#09-a')
    page.locator('[data-lab][data-ready]').wait_for()
    timings = page.evaluate("""async () => {
      const samples = [];
      for (const n of [1, 3, 15, 30, 60, 29, 5, 8, 50, 12, 60, 1, 30, 48, 15, 0, 60, 3, 30, 15]) {
        const control = document.querySelector('[data-control=n]');
        const start = performance.now();
        control.value = String(n);
        control.dispatchEvent(new Event('change', { bubbles:true }));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        samples.push(performance.now() - start);
      }
      return samples.sort((a,b) => a-b);
    }""")
    page.goto(f'{base}chapter-07/#07-a')
    page.locator('[data-lab="07-a"] canvas[data-ready]').wait_for()
    worker_load = page.evaluate('performance.now()')
    print(f"Performance Chromium loopback · 390px, CPU 4×, 1.6 Mbps/150 ms: LCP {landing['lcp']:.0f} ms, cumulative CLS {landing['cls']:.4f}, N change→second frame p95 {timings[18]:.0f} ms, navigation→first zeta map {worker_load:.0f} ms", flush=True)
    context.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', type=Path, default=Path('dist-pages'))
    parser.add_argument('--work-only', action='store_true')
    parser.add_argument('--story-only', action='store_true')
    parser.add_argument('--baseline-story', type=Path)
    parser.add_argument('--first', type=int, default=1)
    parser.add_argument('--last', type=int, default=12)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--gallery', type=Path)
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    options = parser.parse_args()
    if options.work_only and options.story_only:
        parser.error('--work-only serves the standalone textbook and cannot be used with --story-only')
    directory = options.directory.resolve(strict=True)
    with TemporaryDirectory(prefix='work8-browser-') as tmp:
        (Path(tmp) / 'build-canvas').symlink_to(directory, target_is_directory=True)
        if options.baseline_story:
            (Path(tmp) / 'baseline').symlink_to(options.baseline_story.resolve(strict=True), target_is_directory=True)
        handler = functools.partial(QuietHandler, directory=tmp)
        with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server, sync_playwright() as playwright:
            Thread(target=server.serve_forever, daemon=True).start()
            portfolio = f'http://127.0.0.1:{server.server_port}/build-canvas/'
            base = portfolio if options.work_only else portfolio + 'riemann-lean/textbook/'
            browser = playwright.chromium.launch(executable_path=options.chromium, args=['--no-sandbox'])
            if options.story_only:
                baseline = f'http://127.0.0.1:{server.server_port}/baseline/' if options.baseline_story else None
                verify_story(browser, portfolio, options, baseline)
                return
            verify_chapters(browser, base, options)
            if options.first <= 7 and options.last >= 10:
                verify_reference_labs(browser, base)
            if options.first == 1 and options.last == 12:
                verify_proof_labs(browser, base)
                verify_navigation(browser, base, None if options.work_only else portfolio)
                verify_accessibility(browser, base)
                measure(browser, base)


if __name__ == '__main__':
    main()
