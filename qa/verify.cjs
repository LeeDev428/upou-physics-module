/* Optional browser QA: supply an existing Playwright installation; no runtime dependency. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PHYSICS_QA_PLAYWRIGHT || 'playwright');

const baseURL = process.env.PHYSICS_QA_URL || 'http://127.0.0.1:4173';
const key = 'upou-physics-module:v1';
const ids = ['welcome', 'force', 'first-law', 'second-law', 'third-law', 'everyday-forces', 'activity', 'knowledge-check', 'summary'];
const report = { checkedAt: new Date().toISOString(), checks: [], browserErrors: [], failedRequests: [], screenshots: [] };
const check = (name, condition = true) => { assert.ok(condition, name); report.checks.push(name); };
const readState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

(async () => {
  const browser = await chromium.launch({ headless: true });
  report.browser = await browser.version();
  async function newContext(options = {}) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
    context.on('page', page => {
      page.on('pageerror', error => report.browserErrors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') report.browserErrors.push(message.text()); });
      page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() }); });
    });
    return context;
  }
  async function go(page, id) {
    if (!(await page.locator('.section-nav').isVisible())) await page.locator('#mobile-nav-toggle').click();
    await page.locator(`.section-nav a[href="#${id}"]`).click();
    assert.equal(await page.locator('.lesson:visible').getAttribute('id'), id);
  }
  async function capture(page, filename) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(__dirname, filename), fullPage: true });
    report.screenshots.push(filename);
  }
  const context = await newContext();
  const page = await context.newPage();
  await page.goto(baseURL);
  check('Exactly nine sections, with only Welcome initially visible', await page.locator('.lesson').count() === 9 && await page.locator('.lesson:visible').count() === 1);
  check('Initial progress is zero and lesson footer is hidden', await page.locator('#progress-percent').innerText() === '0%' && !await page.locator('#lesson-navigation').isVisible());
  check('Desktop learning path is visible', await page.locator('.sidebar').isVisible());
  await capture(page, 'desktop-welcome.png');
  await page.locator('#start-learning').click();
  check('Start completes Welcome and focuses the first lesson', (await readState(page)).completed.includes('welcome') && await page.evaluate(() => document.activeElement.id) === 'force-title');
  await page.locator('#previous-section').click();
  check('Previous returns to Welcome without erasing completion', await page.locator('#welcome').isVisible() && (await readState(page)).completed.length === 1);

  await go(page, 'activity');
  const cartDemo = page.locator('#cart-demo');
  const wallDemo = page.locator('#wall-demo');
  check('Motion demonstrations never autoplay', await cartDemo.getAttribute('data-motion-state') === 'ready' && await wallDemo.getAttribute('data-motion-state') === 'ready');
  for (let step = 1; step <= 4; step++) {
    await cartDemo.locator('[data-motion-step]').click();
    const seconds = step / 2;
    const values = await cartDemo.locator('.comparison-lane').evaluateAll(lanes => lanes.map(lane => ({
      distance: lane.querySelector('[data-distance]').textContent,
      speed: lane.querySelector('[data-speed]').textContent,
      position: parseFloat(lane.querySelector('.moving-cart').style.left)
    })));
    check(`Cart at ${seconds}s: distances and speeds follow constant acceleration from rest`, values.every((value, index) => {
      const acceleration = [4, 8, 2][index];
      return value.distance === (0.5 * acceleration * seconds ** 2).toFixed(1) && value.speed === (acceleration * seconds).toFixed(1);
    }));
    check(`Cart at ${seconds}s: all lanes use the same distance scale`, values.every((value, index) => Math.abs(value.position - (0.5 * [4, 8, 2][index] * seconds ** 2 / 16 * 100)) < 0.001));
  }
  check('Cart comparison ends at exactly 2 seconds without looping', await cartDemo.getAttribute('data-motion-state') === 'finished' && await cartDemo.locator('[data-motion-step]').isDisabled());
  check('Viewing the animation does not bypass the two prediction activities', !(await readState(page)).completed.includes('activity'));
  await cartDemo.screenshot({ path: path.join(__dirname, 'desktop-cart-comparison.png') });
  report.screenshots.push('desktop-cart-comparison.png');
  await cartDemo.locator('[data-motion-replay]').click();
  await page.waitForFunction(() => Number(document.querySelector('#cart-demo [data-speed]').textContent) > 0);
  await cartDemo.locator('[data-motion-play]').click();
  const pausedTime = await cartDemo.locator('[data-motion-time]').innerText();
  await page.waitForTimeout(150);
  check('Pause freezes motion and its numerical readout', await cartDemo.getAttribute('data-motion-state') === 'paused' && await cartDemo.locator('[data-motion-time]').innerText() === pausedTime);
  await cartDemo.locator('[data-motion-play]').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(previous => document.querySelector('#cart-demo [data-motion-time]').textContent !== previous, pausedTime);
  check('Keyboard Continue resumes the same demonstration', await cartDemo.getAttribute('data-motion-state') === 'running');
  await go(page, 'third-law');
  check('Leaving a lesson pauses its animation', await cartDemo.getAttribute('data-motion-state') === 'paused');
  await wallDemo.locator('[data-motion-play]').click();
  await page.waitForFunction(() => { const force = Number(document.querySelector('[data-pair-force]').textContent); return force > 0 && force < 30; });
  const wallDuringPush = await wallDemo.evaluate(root => {
    const values = [...root.querySelectorAll('[data-pair-force]')].map(item => Number(item.textContent));
    const right = root.querySelector('#wall-force-right').getBBox();
    const left = root.querySelector('#wall-force-left').getBBox();
    return { values, right: right.width, left: left.width };
  });
  check('The contact forces grow together with equal arrow lengths', wallDuringPush.values[0] === wallDuringPush.values[1] && Math.abs(wallDuringPush.right - wallDuringPush.left) < 0.01);
  await wallDemo.locator('[data-motion-play]').click();
  check('Wall push can be paused with an accessible textual explanation', (await wallDemo.locator('[data-motion-status]').innerText()).includes('Paused') && await wallDemo.getAttribute('data-motion-state') === 'paused');
  await wallDemo.locator('[data-motion-replay]').click();
  await page.waitForFunction(() => document.querySelector('#wall-demo').dataset.motionState === 'finished');
  check('Wall demonstration finishes with 30 N on each different object', await wallDemo.locator('[data-pair-force]').allTextContents().then(values => values.join(',') === '30,30'));
  await wallDemo.screenshot({ path: path.join(__dirname, 'desktop-wall-demonstration.png') });
  report.screenshots.push('desktop-wall-demonstration.png');
  await wallDemo.locator('[data-motion-replay]').click();
  await page.locator('#reset-progress').click();
  check('Opening the reset dialog pauses background motion', await wallDemo.getAttribute('data-motion-state') === 'paused' || await wallDemo.getAttribute('data-motion-state') === 'ready');
  await page.locator('#cancel-reset').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check('Reduced motion hides playback and explains still-step controls', !await wallDemo.locator('[data-motion-play]').isVisible() && await wallDemo.locator('[data-motion-preference]').isVisible());
  await wallDemo.locator('[data-motion-replay]').click();
  check('Restart under reduced motion stays still before contact', await wallDemo.getAttribute('data-motion-state') === 'ready' && (await wallDemo.locator('[data-pair-force]').allTextContents()).join(',') === '0,0');
  const initialArm = await page.locator('#wall-arm-front').getAttribute('d');
  await wallDemo.locator('[data-motion-step]').focus(); await page.keyboard.press('Enter');
  check('Keyboard Next step reaches the wall without premature contact forces', initialArm !== await page.locator('#wall-arm-front').getAttribute('d') && (await wallDemo.locator('[data-pair-force]').allTextContents()).join(',') === '0,0');
  await wallDemo.locator('[data-motion-step]').click();
  check('Still steps show the same equal and opposite force result', (await wallDemo.locator('[data-pair-force]').allTextContents()).join(',') === '30,30' && await wallDemo.getAttribute('data-motion-state') === 'paused');
  await go(page, 'activity');
  await cartDemo.locator('[data-motion-replay]').click();
  await cartDemo.locator('[data-motion-step]').click();
  check('Reduced-motion cart steps retain the numerical comparison', await cartDemo.locator('[data-motion-time]').innerText() === 'Model time: 0.5 / 2.0 s' && await cartDemo.getAttribute('data-motion-state') === 'paused');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  check('Changing motion preferences never starts automatic playback', await cartDemo.getAttribute('data-motion-state') === 'paused');
  await page.reload();
  check('Reload resets animation playback without changing saved lesson progress', await page.locator('#cart-demo').getAttribute('data-motion-state') === 'ready' && (await readState(page)).completed.includes('welcome'));

  const practice = [
    ['force', 'net-force-practice', '1'], ['third-law', 'third-law-practice', '0'],
    ['everyday-forces', 'everyday-practice', '1'], ['activity', 'cart-force-practice', '1'], ['activity', 'cart-mass-practice', '2']
  ];
  for (const [section, formId, correct] of practice) {
    await go(page, section);
    const form = page.locator(`#${formId}`);
    await form.locator('button').click();
    check(`${formId}: empty submission gives guidance`, await form.locator('.feedback').getAttribute('data-tone') === 'error');
    for (let option = 0; option < 3; option++) {
      await form.locator(`input[value="${option}"]`).check();
      await form.locator('button').click();
      check(`${formId}: choice ${option + 1} has correct feedback`, await form.locator('.feedback').getAttribute('data-tone') === (String(option) === correct ? 'correct' : 'retry'));
      check(`${formId}: choice ${option + 1} includes reasoning`, (await form.locator('.feedback').innerText()).length > 100);
    }
  }
  check('Both cart scenarios complete the activity without requiring a pass score', (await readState(page)).completed.includes('activity'));
  await page.reload();
  check('Practice selection and feedback survive reload', await page.locator('#cart-mass-practice input[value="2"]').isChecked() && await page.locator('#cart-mass-practice .feedback').getAttribute('data-tone') === 'correct');

  for (const id of ids) {
    await go(page, id);
    const disclosures = page.locator(`#${id} .reflection details`);
    for (let index = 0; index < await disclosures.count(); index++) {
      const disclosure = disclosures.nth(index);
      await disclosure.locator('summary').click();
      check(`${id}: reflection ${index + 1} reveals its explanation`, await disclosure.getAttribute('open') !== null && await disclosure.locator('p').isVisible());
      await disclosure.locator('summary').click();
    }
  }

  await go(page, 'second-law');
  const force = page.locator('#net-force-input');
  const mass = page.locator('#mass-input');
  const calculate = page.locator('#force-calculator button');
  for (const [f, m, expected, direction] of [['20','5','4','right'], ['-20','5','-4','left'], ['0','5','0','No acceleration'], ['2.5','0.5','5','right'], ['0.000001','1','1.000e-6','right']]) {
    await force.fill(f); await mass.fill(m); await calculate.click();
    check(`Calculator: ${f} N / ${m} kg`, await page.locator('#acceleration-output').innerText() === expected && (await page.locator('#acceleration-direction').innerText()).includes(direction));
  }
  for (const [f, m, field] of [['','5','force'], ['20','','mass'], ['20','0','mass'], ['20','-2','mass'], ['1e308','1e-308','force'], ['1e-308','1e308','force']]) {
    await force.fill(f); await mass.fill(m); await calculate.click();
    check(`Calculator rejects force=${f || 'blank'}, mass=${m || 'blank'}`, (await page.locator(`#${field}-error`).innerText()).length > 0 && await page.locator('#acceleration-output').innerText() === '—');
  }
  for (const [index, value] of ['4', '8', '2', '-4'].entries()) {
    await page.locator('.preset').nth(index).click();
    check(`Calculator preset ${index + 1}`, await page.locator('#acceleration-output').innerText() === value && await page.locator('.preset[aria-pressed="true"]').count() === 1);
  }
  await force.fill('9');
  check('Editing an input clears the previous calculation', await page.locator('#acceleration-output').innerText() === '—');
  await page.locator('.preset').first().click();
  await capture(page, 'desktop-calculator.png');

  await go(page, 'knowledge-check');
  const optionSets = [['0','1','2','3'], ['2','-3','3.1','3.0'], ['0','1'], ['0','1','2','3'], ['0','1','2','3'], ['0','1','2']];
  const correctAnswers = ['0','3','1','1','2','1'];
  async function submitQuiz(answer, numeric) {
    if (numeric) await page.locator('#quiz-calculation').fill(answer);
    else await page.locator(`#quiz-form input[value="${answer}"]`).check();
    await page.locator('#quiz-form button[type="submit"]').click();
  }
  for (let q = 0; q < 6; q++) {
    await page.locator('#quiz-form button[type="submit"]').click();
    check(`Quiz ${q + 1}: empty answer gets guidance`, await page.locator('#quiz-feedback').getAttribute('data-tone') === 'error');
    for (let option = 0; option < optionSets[q].length; option++) {
      if (option > 0) await page.getByRole('button', { name: 'Retry question', exact: true }).click();
      const answer = optionSets[q][option];
      await submitQuiz(answer, q === 1);
      const correct = q === 1 ? Number(answer) === 3 : answer === correctAnswers[q];
      check(`Quiz ${q + 1}: answer ${answer} feedback`, await page.locator('#quiz-feedback').getAttribute('data-tone') === (correct ? 'correct' : 'retry'));
      check(`Quiz ${q + 1}: answer ${answer} is saved accurately`, (await readState(page)).quiz.responses[q].correct === correct);
    }
    await page.getByRole('button', { name: 'Retry question', exact: true }).click();
    await submitQuiz(correctAnswers[q], q === 1);
    check(`Quiz ${q + 1}: retry reaches the correct explanation`, await page.locator('#quiz-feedback').getAttribute('data-tone') === 'correct');
    if (q === 2) {
      await page.getByRole('button', { name: 'Previous question', exact: false }).click();
      check('Previous quiz question restores its checked answer', await page.locator('#quiz-calculation').inputValue() === '3');
      await page.getByRole('button', { name: 'Next question', exact: false }).click();
    }
    await page.getByRole('button', { name: q === 5 ? 'See my results' : 'Next question', exact: false }).click();
    if (q === 1) {
      await page.reload();
      check('Quiz reload resumes at question 3 and preserves previous attempts', (await page.locator('.quiz-topline').innerText()).includes('Question 3') && (await readState(page)).quiz.responses[0].attempts === 5);
    }
  }
  check('First-try score remains 1/6 after retries', await page.locator('.score').innerText() === '1 / 6');
  check('Completing all questions marks the quiz complete', (await readState(page)).completed.includes('knowledge-check'));
  for (let i = 0; i < 6; i++) {
    const review = page.locator('.quiz-review details').nth(i);
    await review.locator('summary').click();
    check(`Quiz results: explanation ${i + 1} and review link work`, await review.locator('p').isVisible() && ids.includes((await review.locator('a').getAttribute('href')).slice(1)));
  }
  await page.reload();
  check('Finished quiz and first-try score survive reload', await page.locator('.score').innerText() === '1 / 6');
  await page.getByRole('button', { name: 'Try the quiz again', exact: true }).click();
  check('Retaking clears only the quiz completion and attempt', !(await readState(page)).completed.includes('knowledge-check') && (await readState(page)).completed.includes('activity'));
  for (let q = 0; q < 6; q++) {
    await submitQuiz(correctAnswers[q], q === 1);
    await page.getByRole('button', { name: q === 5 ? 'See my results' : 'Next question', exact: false }).click();
  }
  check('A fully correct fresh attempt scores 6/6', await page.locator('.score').innerText() === '6 / 6');
  await capture(page, 'desktop-quiz-results.png');

  await go(page, 'summary'); await page.locator('#next-section').click();
  check('Finishing early identifies incomplete learning rather than claiming completion', (await page.locator('#completion-message').innerText()).includes('Keep going!'));
  for (const id of ['force', 'first-law', 'second-law', 'third-law', 'everyday-forces']) {
    await go(page, id); await page.locator('#next-section').click();
  }
  await go(page, 'summary'); await page.locator('#next-section').click();
  check('Full learning path reaches 100% and a completion message', await page.locator('#progress-percent').innerText() === '100%' && (await page.locator('#completion-message').innerText()).includes('Module 1 complete'));
  await page.reload();
  check('Completed sections and current section persist', await page.locator('#summary').isVisible() && await page.locator('#progress-percent').innerText() === '100%');

  await page.evaluate(() => localStorage.setItem('qa-unrelated', 'keep'));
  await page.locator('#reset-progress').click(); await page.locator('#cancel-reset').click();
  check('Reset can be cancelled', await page.locator('#progress-percent').innerText() === '100%');
  await page.locator('#reset-progress').click(); await page.keyboard.press('Escape');
  check('Escape cancels reset and restores focus', !await page.locator('#reset-dialog').isVisible() && await page.evaluate(() => document.activeElement.id) === 'reset-progress');
  await page.locator('#reset-progress').click(); await page.locator('#confirm-reset').click();
  const resetState = await readState(page);
  check('Reset clears completion, quiz, and practice', resetState.completed.length === 0 && resetState.quiz === null && Object.keys(resetState.practice).length === 0);
  check('Reset restores Welcome, unchecks practice, and closes reflections', await page.locator('#welcome').isVisible() && await page.locator('.practice-form input:checked').count() === 0 && await page.locator('details[open]').count() === 0);
  check('Reset preserves unrelated local storage', await page.evaluate(() => localStorage.getItem('qa-unrelated')) === 'keep');
  check('Reset restores both demonstrations to their first still frame', await page.locator('.motion-demo[data-motion-state="ready"]').count() === 2 && (await page.locator('[data-pair-force]').allTextContents()).join(',') === '0,0');
  await go(page, 'force'); await go(page, 'first-law'); await page.goBack();
  check('Browser Back restores the previous section', await page.locator('#force').isVisible());
  await page.goForward();
  check('Browser Forward restores the next section', await page.locator('#first-law').isVisible());

  for (const width of [375, 768, 1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ids) {
      await go(page, id);
      const geometry = await page.evaluate(() => ({ viewport: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      check(`${width}px: ${id} has no horizontal overflow`, geometry.viewport === width && geometry.scroll <= geometry.client + 1);
      if (width === 375) await capture(page, `mobile-${id}.png`);
      if (width === 768 && id === 'welcome') await capture(page, 'tablet-welcome.png');
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('#mobile-nav-toggle').click();
  check('Mobile menu exposes all nine sections', await page.locator('.section-nav a:visible').count() === 9);
  await page.keyboard.press('Escape');
  check('Escape closes the mobile menu and restores focus', !await page.locator('.sidebar').isVisible() && await page.evaluate(() => document.activeElement.id) === 'mobile-nav-toggle');
  await page.locator('#mobile-nav-toggle').focus(); await page.keyboard.press('Enter');
  check('Mobile menu opens with the keyboard', await page.locator('#mobile-nav-toggle').getAttribute('aria-expanded') === 'true');
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  check('Mobile menu navigation focuses the new lesson', await page.evaluate(() => document.activeElement.id) === 'welcome-title');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.keyboard.press('Tab');
  check('Skip link is first in the keyboard tab order', await page.evaluate(() => document.activeElement.classList.contains('skip-link')));
  await page.keyboard.press('Enter');
  check('Skip link reaches main content', await page.evaluate(() => document.activeElement.id) === 'lesson-main');
  await go(page, 'force');
  await page.locator('#net-force-practice input').first().focus(); await page.keyboard.press('ArrowDown');
  check('Radio choices support arrow-key selection', await page.locator('#net-force-practice input[value="1"]').isChecked());
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  check('Practice can be submitted with the keyboard', await page.locator('#net-force-practice .feedback').getAttribute('data-tone') === 'correct');
  await page.locator('#force summary').focus(); await page.keyboard.press('Enter');
  check('Reflection opens with Enter', await page.locator('#force details').getAttribute('open') !== null);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check('Reduced motion disables transitions', await page.locator('#next-section').evaluate(button => getComputedStyle(button).transitionDuration) === '0s');
  await page.emulateMedia({ media: 'print' });
  check('Print exposes all nine lesson sections', await page.locator('.lesson:visible').count() === 9);
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  check('Print renders useful final diagrams and hides playback controls', (await page.locator('#cart-demo [data-distance]').allTextContents()).join(',') === '8.0,16.0,4.0' && await page.locator('.demo-controls:visible').count() === 0 && (await page.locator('[data-pair-force]').allTextContents()).join(',') === '30,30');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  check('Leaving print restores the previous still frame', (await page.locator('#cart-demo [data-distance]').allTextContents()).join(',') === '0.0,0.0,0.0');
  await page.emulateMedia({ media: 'screen', reducedMotion: 'no-preference' });
  const audit = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('[id]')];
    const duplicates = elements.filter((item, index) => elements.findIndex(other => other.id === item.id) !== index).map(item => item.id);
    const brokenReferences = [...document.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls]')].flatMap(item => ['aria-labelledby','aria-describedby','aria-controls'].flatMap(attr => (item.getAttribute(attr) || '').split(/\s+/).filter(Boolean).filter(id => !document.getElementById(id))));
    const brokenAnchors = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(id => !document.getElementById(id));
    const unlabelledInputs = [...document.querySelectorAll('input')].filter(input => !input.labels?.length && !input.getAttribute('aria-label')).map(input => input.id);
    const externalResources = performance.getEntriesByType('resource').map(item => item.name).filter(url => !url.startsWith(location.origin));
    return { duplicates, brokenReferences, brokenAnchors, unlabelledInputs, externalResources };
  });
  for (const [name, failures] of Object.entries(audit)) check(`Document audit: no ${name}`, failures.length === 0);

  const blockedContext = await newContext();
  await blockedContext.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }); });
  const blocked = await blockedContext.newPage(); await blocked.goto(baseURL);
  await blocked.locator('#start-learning').click();
  check('Blocked storage still permits navigation and in-memory progress', await blocked.locator('#force').isVisible() && await blocked.locator('#progress-percent').innerText() === '11%');
  check('Blocked storage gets an accurate persistence message', (await blocked.locator('#save-message').innerText()).includes('this visit only'));
  await go(blocked, 'second-law'); await blocked.locator('#force-calculator button').click();
  check('Calculator works without storage', await blocked.locator('#acceleration-output').innerText() === '4');
  await go(blocked, 'knowledge-check'); await blocked.locator('#quiz-form input[value="0"]').check(); await blocked.locator('#quiz-form button[type="submit"]').click();
  check('Quiz works without storage', await blocked.locator('#quiz-feedback').getAttribute('data-tone') === 'correct');
  await blocked.locator('#reset-progress').click(); await blocked.locator('#confirm-reset').click();
  check('Reset works without storage', await blocked.locator('#progress-percent').innerText() === '0%');
  await blockedContext.close();

  const corruptContext = await newContext();
  await corruptContext.addInitScript(key => {
    if (location.protocol === 'http:') localStorage.setItem(key, '{not valid JSON');
  }, key);
  const corrupt = await corruptContext.newPage(); await corrupt.goto(baseURL);
  check('Corrupt storage recovers to a usable fresh module', await corrupt.locator('#welcome').isVisible() && await corrupt.locator('#progress-percent').innerText() === '0%');
  await corruptContext.close();

  const fileContext = await newContext();
  const filePage = await fileContext.newPage();
  await filePage.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);
  await filePage.locator('#start-learning').click();
  check('Opening index.html directly supports the learning flow', await filePage.locator('#force').isVisible());
  await go(filePage, 'second-law'); await filePage.locator('.preset').nth(1).click();
  check('Direct-file calculator works', await filePage.locator('#acceleration-output').innerText() === '8');
  await go(filePage, 'activity'); await filePage.locator('#cart-demo [data-motion-step]').click();
  check('Direct-file motion demonstration works without a server', await filePage.locator('#cart-demo [data-motion-time]').innerText() === 'Model time: 0.5 / 2.0 s');
  await go(filePage, 'knowledge-check'); await filePage.locator('#quiz-form input[value="0"]').check(); await filePage.locator('#quiz-form button[type="submit"]').click();
  check('Direct-file quiz works', await filePage.locator('#quiz-feedback').getAttribute('data-tone') === 'correct');
  await fileContext.close();

  const noJSContext = await newContext({ javaScriptEnabled: false });
  const noJS = await noJSContext.newPage(); await noJS.goto(baseURL);
  check('Without JavaScript all lessons and the paper quiz remain available', await noJS.locator('.lesson:visible').count() === 9 && await noJS.getByText('A check you can do on paper').isVisible());
  check('Nonfunctional interactive forms are hidden without JavaScript', await noJS.locator('.practice-form:visible').count() === 0 && !await noJS.locator('#force-calculator').isVisible());
  check('Without JavaScript, both diagrams retain complete static explanations', (await noJS.locator('#cart-demo [data-distance]').allTextContents()).join(',') === '8.0,16.0,4.0' && (await noJS.locator('[data-pair-force]').allTextContents()).join(',') === '30,30' && await noJS.locator('.demo-controls:visible').count() === 0);
  await noJSContext.close();

  if (process.env.PHYSICS_QA_AXE) {
    await page.addScriptTag({ path: process.env.PHYSICS_QA_AXE });
    report.accessibility = [];
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const id of ids) {
        await go(page, id);
        const result = await page.evaluate(async () => {
          const results = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
          return { violations: results.violations.map(item => ({ id: item.id, impact: item.impact, description: item.description, elements: item.nodes.map(node => node.target) })), passes: results.passes.length };
        });
        report.accessibility.push({ width, section: id, ...result });
        if (result.violations.length === 0) check(`Accessibility: ${id} at ${width}px has no axe violations`);
      }
    }
    check('All section accessibility audits have no axe violations', report.accessibility.every(result => result.violations.length === 0));
  }

  check('No browser JavaScript or console errors', report.browserErrors.length === 0);
  check('No failed resource requests', report.failedRequests.length === 0);
  await context.close();
  await browser.close();
  report.passed = true;
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS: ${report.checks.length} checks. Chromium ${report.browser}. Evidence in qa/.`);
})().catch(error => {
  report.passed = false;
  report.failure = error.stack;
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.error(error);
  process.exit(1);
});
