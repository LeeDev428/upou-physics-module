(() => {
  'use strict';

  const root = document.getElementById('quiz-root');
  const module = window.PhysicsModule;
  if (!module) return;

  const questions = [
    {
      type: 'Multiple choice',
      prompt: 'Which description best defines a force?',
      options: ['A push or pull acting on an object', 'The distance an object travels', 'The speed of an object', 'The amount of time an object moves'],
      answer: '0', lesson: 'force',
      explanation: 'A force is a push or pull acting on an object. It has magnitude and direction, and is measured in newtons (N). Distance, speed, and time describe other aspects of motion.'
    },
    {
      type: 'Simple calculation',
      prompt: 'A 4 kg object experiences a net force of 12 N to the right. What is its acceleration?',
      numeric: true, answer: '3', lesson: 'second-law',
      explanation: 'Use a = Fnet / m: 12 N ÷ 4 kg = 3 m/s² to the right. Divide net force by mass, then give the unit and the direction of the net force.'
    },
    {
      type: 'True or false',
      prompt: '“A larger object always moves faster than a smaller object.”',
      options: ['True', 'False'], answer: '1', lesson: 'second-law',
      explanation: 'False. Neither size nor mass alone determines velocity. Objects can be at rest or moving at many speeds. Under the same net force, greater mass means less acceleration—not necessarily a lower speed.'
    },
    {
      type: 'Everyday application',
      prompt: 'A person pushes a wall. What does Newton’s Third Law predict?',
      options: ['The wall exerts no force because it stays still', 'The wall pushes the person with an equal force in the opposite direction', 'The wall pushes the person with a larger force', 'Both forces act on the wall and cancel'],
      answer: '1', lesson: 'third-law',
      explanation: 'The wall exerts an equal-magnitude, opposite force on the person. One force acts on the wall and the other on the person, so this pair does not cancel as forces on one object.'
    },
    {
      type: 'Conceptual question',
      prompt: 'An object is already moving in a straight line. If the net external force stays zero, what happens?',
      options: ['It immediately stops', 'It steadily speeds up', 'It keeps the same speed and direction', 'It must turn in a circle'],
      answer: '2', lesson: 'first-law',
      explanation: 'Newton’s First Law predicts constant velocity: the same speed and direction. Zero net force means zero acceleration, not necessarily zero motion. In everyday life, friction often makes the net force nonzero.'
    },
    {
      type: 'Make a prediction',
      prompt: 'The same net force acts on an empty cart and a full cart. The full cart has greater mass. Which has the smaller acceleration?',
      options: ['The empty cart', 'The full cart', 'Both have the same acceleration'],
      answer: '1', lesson: 'activity',
      explanation: 'The full cart has the smaller acceleration. Greater mass means more inertia, and a = Fnet / m tells us that increasing mass while keeping net force fixed decreases acceleration.'
    }
  ];

  function blankQuiz() {
    return { version: 1, index: 0, responses: questions.map(() => null), finished: false };
  }

  function isCorrect(question, answer) {
    return question.numeric ? Number(answer) === Number(question.answer) : answer === question.answer;
  }

  function restoreQuiz(saved) {
    const clean = blankQuiz();
    if (!saved || saved.version !== 1 || !Array.isArray(saved.responses)) return clean;
    questions.forEach((question, index) => {
      const response = saved.responses[index];
      if (!response || typeof response.answer !== 'string' || response.answer.trim() === '') return;
      const validAnswer = question.numeric ? Number.isFinite(Number(response.answer))
        : question.options.some((_, option) => String(option) === response.answer);
      if (!validAnswer || typeof response.firstCorrect !== 'boolean' || !Number.isInteger(response.attempts) || response.attempts < 1) return;
      clean.responses[index] = {
        answer: response.answer,
        firstCorrect: response.firstCorrect,
        correct: isCorrect(question, response.answer),
        attempts: response.attempts,
        checked: response.checked === true
      };
    });
    clean.index = Number.isInteger(saved.index) && saved.index >= 0 && saved.index < questions.length ? saved.index : 0;
    // Do not restore a question beyond the first gap in a damaged save.
    const firstUnanswered = clean.responses.findIndex(response => !response || !response.checked);
    if (firstUnanswered >= 0) clean.index = Math.min(clean.index, firstUnanswered);
    clean.finished = saved.finished === true && clean.responses.every(response => response && response.checked);
    return clean;
  }

  let quiz = restoreQuiz(module.getQuiz());

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function button(text, className, handler) {
    const item = element('button', className, text);
    item.type = 'button';
    item.addEventListener('click', handler);
    return item;
  }

  function save() { module.saveQuiz(quiz); }

  function focusQuestion() {
    const target = root.querySelector('legend, h2');
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function renderResults(focus) {
    const results = element('div', 'quiz-results');
    const badge = element('div', 'result-badge', '✓');
    badge.setAttribute('aria-hidden', 'true');
    const heading = element('h2', '', 'You’ve worked through all six.');
    const score = quiz.responses.filter(response => response.firstCorrect).length;
    const scoreText = element('p', 'score', `${score} / ${questions.length}`);
    scoreText.setAttribute('aria-label', `Your first-try score: ${score} out of ${questions.length}`);
    const encouragement = score === 6
      ? 'A strong start! Keep connecting each law to situations around you.'
      : score >= 4
        ? 'You’re making useful connections. Review the ideas below and give them another try.'
        : 'Every attempt is a step forward. Revisit the explanations, then try again at your own pace.';
    results.append(badge, heading, element('p', '', 'Your first-try score'), scoreText, element('p', '', encouragement));
    results.append(element('p', '', 'Retries help you learn; they do not change this attempt’s first-try score. There is no pass mark.'));
    const review = element('div', 'quiz-review');
    review.append(element('h3', '', 'Review your thinking'));
    questions.forEach((question, index) => {
      const response = quiz.responses[index];
      const detail = element('details');
      const summary = element('summary', '', `${index + 1}. ${question.prompt}`);
      summary.append(element('span', 'review-status', response.firstCorrect ? 'Correct on the first try' : response.correct ? 'Correct after a retry' : 'An idea to revisit'));
      const explanation = element('p', '', question.explanation);
      const link = element('a', '', 'Revisit this lesson');
      link.href = `#${question.lesson}`;
      detail.append(summary, explanation, link);
      review.append(detail);
    });
    results.append(review, button('Try the quiz again', 'button button-secondary', () => {
      quiz = blankQuiz();
      save();
      render(true);
    }));
    root.append(results);
    if (focus) focusQuestion();
  }

  function render(focus = false) {
    root.replaceChildren();
    if (quiz.finished) return renderResults(focus);

    const question = questions[quiz.index];
    const response = quiz.responses[quiz.index];
    const checked = Boolean(response && response.checked);
    const top = element('div', 'quiz-topline');
    top.append(element('strong', '', `Question ${quiz.index + 1} of ${questions.length}`), element('span', '', 'A chance to learn'));
    const progress = element('progress');
    progress.max = questions.length;
    progress.value = quiz.responses.filter(answer => answer && answer.checked).length;
    progress.setAttribute('aria-label', 'Questions answered');
    const type = element('p', 'question-type', question.type);
    const form = element('form');
    form.id = 'quiz-form';
    form.noValidate = true;
    const fieldset = element('fieldset');
    const legend = element('legend', '', question.prompt);
    legend.id = 'quiz-question';
    fieldset.append(legend);
    if (question.numeric) {
      const label = element('label', 'sr-only', 'Acceleration to the right in metres per second squared');
      label.htmlFor = 'quiz-calculation';
      const wrapper = element('div', 'number-input-wrap');
      const input = element('input');
      input.id = 'quiz-calculation';
      input.name = 'answer';
      input.type = 'number';
      input.step = 'any';
      input.required = true;
      input.setAttribute('aria-describedby', 'quiz-number-hint quiz-feedback');
      input.value = checked ? response.answer : '';
      input.disabled = checked;
      wrapper.append(input, element('span', '', 'm/s²'));
      const hint = element('p', 'field-hint', 'Enter a number. The acceleration is to the right.');
      hint.id = 'quiz-number-hint';
      fieldset.append(label, wrapper, hint);
    } else {
      const options = element('div', 'answer-options');
      question.options.forEach((answer, index) => {
        const label = element('label', 'radio-option');
        const input = element('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = String(index);
        input.checked = checked && response.answer === String(index);
        input.disabled = checked;
        label.append(input, element('span', '', answer));
        options.append(label);
      });
      fieldset.append(options);
    }
    const feedback = element('div', 'feedback quiz-feedback');
    feedback.id = 'quiz-feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    if (checked) {
      feedback.dataset.tone = response.correct ? 'correct' : 'retry';
      feedback.append(element('strong', '', response.correct ? 'Correct — nicely reasoned.' : 'Not quite — here’s the reasoning.'), element('span', '', question.explanation));
      const reviewLink = element('a', '', 'Revisit this idea in the lesson');
      reviewLink.href = `#${question.lesson}`;
      feedback.append(reviewLink);
    }
    const actions = element('div', 'quiz-action-row');
    const previous = button('← Previous question', 'button button-quiet', () => {
      quiz.index -= 1;
      save();
      render(true);
    });
    previous.disabled = quiz.index === 0;
    actions.append(previous);
    if (checked) {
      actions.append(button('Retry question', 'button button-secondary', () => {
        response.checked = false;
        save();
        render(true);
      }));
      actions.append(button(quiz.index === questions.length - 1 ? 'See my results →' : 'Next question →', 'button', () => {
        if (quiz.index === questions.length - 1) quiz.finished = true;
        else quiz.index += 1;
        save();
        render(true);
      }));
    } else {
      const submit = element('button', 'button', 'Check answer');
      submit.type = 'submit';
      actions.append(submit);
    }
    form.append(fieldset, feedback, actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (checked) return;
      const input = question.numeric ? form.querySelector('input') : form.querySelector('input:checked');
      if (!input || input.value.trim() === '' || (question.numeric && !Number.isFinite(input.valueAsNumber))) {
        feedback.dataset.tone = 'error';
        feedback.textContent = question.numeric ? 'Enter a number for acceleration before checking.' : 'Choose an answer first. A best guess is a good place to start.';
        const firstInput = form.querySelector('input');
        firstInput.setAttribute('aria-invalid', 'true');
        firstInput.focus();
        return;
      }
      const correct = isCorrect(question, input.value);
      quiz.responses[quiz.index] = {
        answer: input.value,
        correct,
        firstCorrect: response ? response.firstCorrect : correct,
        attempts: (response ? response.attempts : 0) + 1,
        checked: true
      };
      save();
      render();
      // The submitted button is replaced; move focus to the explanatory feedback.
      const newFeedback = root.querySelector('.quiz-feedback');
      newFeedback.tabIndex = -1;
      newFeedback.focus({ preventScroll: true });
    });
    form.addEventListener('input', () => {
      form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
      if (feedback.dataset.tone === 'error') feedback.replaceChildren();
    });
    root.append(top, progress, type, form);
    if (focus) focusQuestion();
  }

  document.addEventListener('module:reset', () => {
    quiz = blankQuiz();
    render();
  });
  save();
  render();
})();
