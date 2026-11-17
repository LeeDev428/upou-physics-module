# Module 1 verification record

Verified locally on **17 November 2026** with **Chromium 156.0.8078.4** using Playwright. The last completed verification run passed **258 checks**, including **18 axe accessibility scans** of all nine sections at mobile and desktop widths. There were **zero JavaScript/console errors**, **zero failed resource requests**, and **zero axe violations** in the tested states.

The machine-readable evidence is [qa/results.json](./qa/results.json). The repeatable browser checks are in [qa/verify.cjs](./qa/verify.cjs).

## Learning flow and content

- All nine sections are reachable, with one lesson visible at a time when JavaScript is enabled.
- Start, Previous, Continue, browser Back/Forward, and direct section links work.
- Every reflection can reveal and hide its explanation.
- Both supplied worked examples are included, with Example B explicitly connecting 15 N right minus 5 N left to 10 N net force and 2 m/s² acceleration for a 5 kg box.
- All five practice checks were tested with an empty submission and every available answer.
- Correct and incorrect feedback explains the underlying concept rather than simply reporting a result.
- The physics wording and diagrams were reviewed against the supplied source content, including inertia, signed force, acceleration versus velocity, zero net force, and forces on different objects.
- Detailed force diagrams and quantitative multi-force analysis remain outside the Module 1 scope, apart from the introductory source examples.

## Calculator

Verified positive, negative, zero, fractional, and very small forces; fractional mass; all four presets; blank inputs; zero/negative mass; arithmetic overflow and underflow; and clearing a stale result after editing an input. Errors are associated with inputs and move focus to the first invalid field. Zero net force is described as constant velocity, not necessarily rest.

## Learner-controlled demonstrations

- The cart comparison uses a shared two-second model clock, constant net forces, and a common distance scale. Its numerical speeds, distances, and drawn positions were checked at 0.5, 1.0, 1.5, and 2.0 seconds for accelerations of 4, 8, and 2 m/s².
- The person-and-wall illustration moves the arms into contact, then shows both forces increasing together. Both force values and arrow lengths remain equal; the objects receiving them and their opposite directions are explicit. The wall remains stationary.
- Tests cover no autoplay, Play/Pause, Replay, keyboard continuation, still steps, stopping at the end, pausing when leaving a lesson or opening reset, reset/reload behavior, and direct-file operation.
- Reduced-motion preferences expose still-step controls and a clear explanation. Changing the preference during playback stops motion even if the browser delays its media-query change event. Changing it back does not start playback.
- Print uses useful final snapshots and hides playback controls. Leaving print restores the learner's previous frame. Without JavaScript, both diagrams retain explanatory text and complete static results.
- Watching a demonstration does not complete the cart activity; both learner predictions are still required.

The demonstrations add no remote media or runtime library. Text and numerical results carry the same learning point as movement.

## Quiz

Every multiple-choice and true/false option was submitted. The calculation was tested with incorrect positive and negative values, a near miss, and a correct decimal-form answer. Checks cover empty submission, feedback, retry, previous question, partial-attempt reload, completed-attempt reload, review disclosures, and retaking the quiz.

A run with incorrect initial responses followed by correct retries retained its **1/6 first-try score**. A fresh correct attempt scored **6/6**. Completing the quiz marks participation complete regardless of score; restarting it removes only the quiz completion and current attempt.

## Progress and resilience

- Completion reaches 100% only after all reading sections, both cart scenarios, the quiz, and the summary are completed.
- Finishing early identifies unfinished sections and links back to them.
- Section completion, the current section, practice answers, and quiz state survive reload.
- Reset cancellation, Escape cancellation, and confirmed reset were tested. Confirmed reset clears this module’s progress and preserves unrelated local storage.
- When storage access throws a security error, lessons, the calculator, the quiz, and reset continue to work in memory; the interface explains the persistence limitation.
- Malformed stored JSON recovers to a fresh, usable module.
- Directly opening [index.html](./index.html) was tested for navigation, calculation, and quiz feedback.
- With JavaScript disabled, every lesson and the paper-based quiz remain readable; nonfunctional interactive controls are hidden.

## Responsive layout and accessibility

All nine sections were checked at **320, 375, 768, and 1440 CSS pixels**. No horizontal page overflow was found. Desktop, tablet, and mobile screenshots were visually inspected; this review corrected an SVG curve, small diagram labels, and a formula wrapping issue.

Keyboard checks cover the skip link, focus after navigation, radio arrow keys, submitting an answer with Enter, disclosure controls, animation continuation and still steps, the mobile menu, and Escape/focus restoration for both the menu and reset dialog. Reduced-motion settings disable transitions and continuous playback. Print media exposes all nine lessons and static demonstration results.

The document was checked for duplicate IDs, missing local assets, broken internal anchors, invalid ARIA references, unlabelled inputs, external resource requests, and HTML nesting issues. JavaScript syntax checks and SVG parsing passed. Unused CSS and icon definitions were removed.

The axe scans used the `wcag2a`, `wcag2aa`, `wcag21aa`, and `best-practice` rule tags. Automated checks do not certify full accessibility. Screen-reader use, real-device Safari/Firefox testing, and learner usability sessions were not performed.

## Screenshots

- [Desktop welcome](./qa/desktop-welcome.png)
- [Desktop calculator](./qa/desktop-calculator.png)
- [Desktop cart comparison](./qa/desktop-cart-comparison.png)
- [Desktop person-and-wall demonstration](./qa/desktop-wall-demonstration.png)
- [Desktop quiz results](./qa/desktop-quiz-results.png)
- [Tablet welcome](./qa/tablet-welcome.png)
- [Mobile welcome](./qa/mobile-welcome.png)
- [Mobile force lesson](./qa/mobile-force.png)
- [Mobile First Law](./qa/mobile-first-law.png)
- [Mobile Second Law and calculator](./qa/mobile-second-law.png)
- [Mobile Third Law](./qa/mobile-third-law.png)
- [Mobile everyday forces](./qa/mobile-everyday-forces.png)
- [Mobile cart activity](./qa/mobile-activity.png)
- [Mobile knowledge check](./qa/mobile-knowledge-check.png)
- [Mobile summary](./qa/mobile-summary.png)

Screenshots are QA evidence; they are not loaded by the learning module.

## Reproducing the browser checks

1. Start the local server using the command in [README.md](./README.md).
2. Use Node.js and an existing Playwright installation with its Chromium browser available. These are optional development tools, not learner-facing dependencies.
3. If Playwright is available through normal Node resolution, run `node qa/verify.cjs`. Otherwise, set `PHYSICS_QA_PLAYWRIGHT` to its installed package folder before running the script.
4. To include the 18 accessibility scans, set `PHYSICS_QA_AXE` to an existing `axe-core/axe.min.js` file. Without this optional setting, the functional and responsive checks still run.
5. `PHYSICS_QA_URL` can override the default local address, `http://127.0.0.1:4173`.

The script writes a fresh result file and screenshots under `qa`. It uses separate browser contexts and does not reset a learner’s normal browser progress. No development package was added to the module’s runtime.
