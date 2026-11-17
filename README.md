# Physics in Everyday Life: Forces and Motion

A responsive, self-paced learning module for secondary-level students, prepared as a practical assessment project for the UPOU Center for Open and Digital Teaching and Learning. This is an assessment prototype, not an official university learning platform.

## 1. Project overview

**Module 1 — Understanding Forces and Newton’s Laws** introduces force, net force, inertia, mass, acceleration, and Newton’s three laws through short explanations, familiar situations, guided practice, and formative assessment.

The supplied course materials are fictional and were prepared solely for this recruitment assessment. The wider course is approximately six hours across three modules; the assessment does not prescribe a time allocation for each module. This design allocates an estimated two hours to **Module 1**, including reflection, calculations, retries, and breaks. Modules 2 and 3 appear only as course context, with no inactive links or unfinished lesson pages.

## 2. Target learners

Secondary-level independent learners with introductory mathematics knowledge, including division and positive/negative numbers. No prior formal study of Newton’s laws is required. Learners can use a phone, tablet, or desktop, with limited instructor facilitation.

## 3. Learning objectives

By the end of this module, learners should be able to:

1. Describe force, net force, inertia, mass, and acceleration.
2. Explain Newton’s three laws using everyday situations.
3. Calculate acceleration using **F_net = ma**.
4. Predict how changes in force and mass affect acceleration.
5. Recognize Newton’s laws in familiar situations.

The supplied course learning outcomes are:

- **CLO 1:** Explain fundamental concepts of force and motion using Newton’s laws.
- **CLO 2:** Apply Newton’s laws to analyze familiar situations involving forces and motion.
- **CLO 3:** Interpret simple real-world motion scenarios using physical principles and basic calculations.

| Module objective | Course alignment | Learning and practice | Assessment evidence |
| --- | --- | --- | --- |
| Describe core concepts | CLO 1 | Force comparison, inertia examples, glossary | Quiz 1, 5, 6; net-force check |
| Explain the three laws | CLO 1, 2 | Jeepney, seatbelt, cart, wall | Quiz 4, 5; reflection prompts |
| Calculate acceleration | CLO 3 | Worked example, calculator, paper practice | Quiz 2 |
| Predict force/mass effects | CLO 2, 3 | Calculator presets, two cart scenarios | Cart checks; quiz 6 |
| Recognize everyday laws | CLO 2, 3 | Walking, braking, a sliding box | Quiz 3–6; everyday-force check |

## 4. Instructional design approach

The sequence moves from **concept → example → learner interaction → explanatory feedback**. It scaffolds simple applications before asking learners to combine ideas.

| Section | Approximate time | Learner action |
| --- | --- | --- |
| Start here | 10 min | Set expectations, consider the jeepney question, review objectives |
| Understanding force | 15 min | Combine opposing forces and predict a balanced-force case |
| Newton’s First Law | 15 min | Explain inertia and seatbelt protection before revealing feedback |
| Newton’s Second Law | 20 min | Follow a worked example, change calculator inputs, solve a problem |
| Newton’s Third Law | 15 min | Identify both objects in an interaction pair |
| Everyday forces | 10 min | Distinguish horizontal and vertical effects on a box |
| Cart activity | 10 min | Predict effects of doubling force or mass and explain why |
| Knowledge check | 15 min | Answer six questions, retry, and review reasoning |
| Summary | 10 min | Revisit the original hook and explain another everyday example |

These are study-time suggestions, not timed requirements. Reading alone takes less time; deliberate practice and reflection are included in the estimate.

- **Chunking:** one visible section at a time, with short paragraphs and a clear purpose.
- **Progressive disclosure:** native disclosure controls let learners think before seeing explanations.
- **Active learning:** predictions precede calculations and feedback.
- **Formative feedback:** each submitted choice receives reasoning; incorrect answers are invitations to revise.
- **Manageable cognitive load:** one quiz question at a time, a shared visual language, and no decorative motion or media playback.
- **Alignment:** the table above connects objectives, content, practice, and assessment.
- **Independent study:** learners can revisit any section without a gate or instructor approval.

The quiz reports a clearly labelled **first-try score**. Question retries retain the original first-try result, so the score is not inflated by retries. Starting a new quiz attempt clears only that attempt and its completion marker. There is no pass mark; finishing all six questions completes the knowledge check regardless of score.

Physics distinctions are explicit: acceleration is a change in velocity, inertia is not a force, zero net force does not mean zero motion, mass alone does not determine velocity, and Third Law forces act on different objects. The everyday-force diagram identifies directions without claiming arrow lengths represent magnitudes. Detailed free-body diagrams are reserved for Module 2.

### Adapting the draft assessment

The four source concepts—defining force, calculating acceleration for 12 N on 4 kg, questioning size and speed, and a person pushing a wall—are retained. Selected-response questions provide immediate explanatory feedback for independent learners, while the calculation still requires a numeric answer. Reflection prompts invite learners to explain their thinking before revealing an explanation.

The draft essay asking which law is “the most important” is replaced by questions about zero net force and mass/acceleration comparisons. No single law is universally the most important, and a preference-based answer would not provide clear evidence of the stated learning outcomes. The replacements offer observable, self-checkable evidence of conceptual understanding.

## 5. UX/UI decisions

- A restrained maroon, sage, and warm-paper palette, with system sans-serif text and a serif display face.
- An original local SVG jeepney illustration grounds the welcome in a familiar experience without stock imagery or video.
- Desktop learning-path navigation becomes an expandable menu on smaller screens.
- Each lesson ends with Previous and Continue controls. Lessons remain freely accessible from the learning path.
- The calculator exposes net force, mass, units, direction, useful presets, and friendly validation. Editing inputs clears the old result to avoid displaying stale calculations.
- Progress is completion-based, not a scroll estimate or a grade. Reading sections are completed by Continue; the cart activity requires both scenarios to be answered, and the quiz requires all questions. Summary completion is explicit.
- The final progress review links to the first incomplete section rather than falsely reporting completion.
- Reset Progress is unobtrusive and uses a cancellable confirmation dialog.

## 6. Accessibility considerations

- Semantic landmarks, an English language declaration, a skip link, heading hierarchy, and one active lesson heading.
- Native buttons, links, radio groups, number inputs, labelled progress elements, and disclosure controls.
- Visible keyboard focus, appropriate labels and units, error associations, and explanatory live feedback.
- Focus moves to the new section heading, the quiz explanation, or the next question as appropriate.
- The mobile menu supports keyboard operation and Escape. The native reset dialog provides modal focus management and supports Escape to cancel.
- Completion and correctness use text and symbols as well as color.
- SVG diagrams have text alternatives; decorative icons are hidden from assistive technology.
- `prefers-reduced-motion` disables transitions. No timed activities or essential animations are used.
- Browser zoom and reflow are supported. Print styles expose all lesson sections and the paper-based knowledge check.
- Without JavaScript, all authored lesson content remains readable, and a paper-based knowledge check with an answer key is available. Interactive features require JavaScript.

Browser and keyboard checks are documented in [QA.md](./QA.md). These checks are not a certification of WCAG conformance or a substitute for testing with actual assistive technology and learners.

## 7. Low-bandwidth considerations

- No runtime libraries, web fonts, embedded video, remote images, network APIs, analytics, or trackers.
- All HTML, styles, scripts, and SVG assets are local. The module makes no external requests.
- No build step, package installation, database, backend, authentication, or personal-information collection.
- Direct-file use works without an internet connection. When using a web server, the files must first load; this project does not add a service worker or promise offline reloads of a hosted page.
- Images are compact vector assets with explicit dimensions to minimize layout shift.

## 8. Technical architecture

```text
index.html               Semantic lessons and interaction markup
css/main.css             Shared tokens, typography, layouts, and components
css/responsive.css       Tablet, mobile, and print adaptations
js/app.js                Navigation, practice checks, progress, and reset
js/calculator.js         Acceleration calculation, validation, and presets
js/quiz.js               Question bank, retry state, scoring, and review
assets/jeepney.svg        Original educational illustration
assets/favicon.svg       Local site icon
README.md                Project and handoff documentation
QA.md                    Verification record and reproduction checklist
qa/                      Optional browser QA script, results, and screenshots
.vscode/tasks.json       Optional VS Code local-preview task
```

Classic deferred scripts are used instead of JavaScript modules or `fetch`, so the application also runs under `file://`.

### Local progress

The versioned key `upou-physics-module:v1` stores visited sections, completed sections, the current section, practice responses, and the current quiz attempt in `localStorage`. Values are validated on restore; unknown sections and invalid responses are ignored. No learner identity or free-text personal information is collected.

Progress is specific to this browser and location. A local file, a local server, and a hosted origin may have separate storage; browser policies for `file://` persistence vary. If storage is unavailable, all interactions continue with in-memory progress, and the interface explains that progress is available for the current visit only. Reset affects this module’s state, not unrelated browser data.

The public `PhysicsModule` bridge is intentionally small: the quiz can read and save its state, while the main controller owns progress and persistence. No application framework or routing package is required.

## 9. How to run

### Open the file

Open [index.html](./index.html) in a modern browser. Keep the adjacent `css`, `js`, and `assets` folders together. No installation is needed.

### Use a local development server

From this folder, with Python 3 installed:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173**. Stop the server with Ctrl+C. Any simple static server is suitable. Hosting consists of uploading the same static files; there are no environment variables or server-side routes.

In VS Code, the **Preview physics module** task runs the same local server. The `qa` folder is development evidence and is not needed to run or host the learning module.

### JavaScript syntax checks

If Node.js is available (it is not required to run the module):

```powershell
node --check js/app.js
node --check js/calculator.js
node --check js/quiz.js
```

## 10. AI-use disclosure

Generative AI, specifically OpenAI Codex, assisted with **implementation, brainstorming, interface refinement, debugging, accessibility review, and code review**. The HTML, CSS, JavaScript, SVG illustrations, instructional wording, and documentation were developed with AI assistance using the supplied assessment brief. AI contributions are not represented as wholly unaided candidate work.

Automated and agent-led reviews are recorded in [QA.md](./QA.md). The candidate retains responsibility for the final instructional and development decisions. **Personal candidate review cannot be verified by the coding agent and must be completed before submission.**

After personally reviewing and accepting or revising the output, the candidate can use this final disclosure statement:

> I used generative AI/Codex to assist with implementation, brainstorming, interface refinement, debugging, accessibility review, and code review. I reviewed the generated output, verified its suitability for the intended learners, and made the final instructional and development decisions.

Do not present the final statement as a completed personal review until that review has actually taken place.
