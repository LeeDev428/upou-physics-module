(() => {
  'use strict';

  const STORAGE_KEY = 'upou-physics-module:v1';
  const sections = [...document.querySelectorAll('.lesson')];
  const sectionIds = sections.map(section => section.id);
  const navLinks = [...document.querySelectorAll('.section-nav a')];
  const sidebar = document.getElementById('module-sidebar');
  const menuButton = document.getElementById('mobile-nav-toggle');
  const resetDialog = document.getElementById('reset-dialog');
  const nextButton = document.getElementById('next-section');
  let storageAvailable = true;

  const practiceQuestions = {
    'net-force-practice': {
      correct: '1',
      explanation: 'The forces act in opposite directions, so subtract: 15 − 5 = 10 N. The larger force points right, so the net force is 10 N to the right.',
      hints: ['Opposing forces subtract; adding 15 and 5 would treat them as pointing the same way.', '', 'The 15 N force to the right is larger than the 5 N force to the left.']
    },
    'third-law-practice': {
      correct: '0',
      explanation: 'The wall pushes you with 30 N in the opposite direction. Your force acts on the wall; the wall’s force acts on you. They are an interaction pair, even when nothing moves.',
      hints: ['', 'An interaction involves two objects. The paired force from the wall acts on you.', 'An object does not have to move to exert a force. Think about the push you feel on your hands.']
    },
    'everyday-practice': {
      correct: '1',
      explanation: 'The horizontal net force is 15 − 5 = 10 N right, so acceleration is to the right. The vertical forces balance, so vertical acceleration is zero.',
      hints: ['Balance vertically does not imply balance horizontally.', '', 'There is no upward net force because the vertical forces balance.']
    },
    'cart-force-practice': {
      correct: '1',
      explanation: 'Acceleration doubles. With the same 5 kg mass, a = 40 / 5 = 8 m/s² right, twice the original 4 m/s². At fixed mass, acceleration is proportional to net force.',
      hints: ['The mass stays the same, but the net force increases. The ratio Fnet / m must increase.', '', 'A larger net force on the same mass produces more acceleration, not less.']
    },
    'cart-mass-practice': {
      correct: '2',
      explanation: 'Acceleration becomes half as large. With the same 20 N net force, a = 20 / 10 = 2 m/s² right. Doubling mass doubles the resistance to acceleration.',
      hints: ['A greater mass resists acceleration more. The same force cannot produce a larger acceleration.', 'The force stays the same, but the mass in the denominator doubles.', '']
    }
  };

  function freshState() {
    return { version: 1, current: 'welcome', visited: [], completed: [], practice: {}, quiz: null };
  }

  function readState() {
    const clean = freshState();
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || stored.version !== 1) return clean;
      clean.current = sectionIds.includes(stored.current) ? stored.current : 'welcome';
      for (const key of ['visited', 'completed']) {
        clean[key] = Array.isArray(stored[key]) ? [...new Set(stored[key].filter(id => sectionIds.includes(id)))] : [];
      }
      if (stored.practice && typeof stored.practice === 'object') {
        for (const id of Object.keys(practiceQuestions)) {
          if (['0', '1', '2'].includes(stored.practice[id])) clean.practice[id] = stored.practice[id];
        }
      }
      // The quiz controller validates its own question and answer schema.
      clean.quiz = stored.quiz || null;
      if (!clean.practice['cart-force-practice'] || !clean.practice['cart-mass-practice']) {
        clean.completed = clean.completed.filter(id => id !== 'activity');
      }
    } catch {
      storageAvailable = false;
    }
    return clean;
  }

  let state = readState();

  function updateSaveMessage() {
    document.getElementById('save-message').textContent = storageAvailable
      ? 'Your place is saved on this device. Come back whenever you’re ready.'
      : 'Progress is available for this visit only. You can still use every lesson and activity.';
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    updateSaveMessage();
  }

  function updateProgress() {
    const count = state.completed.length;
    const percent = Math.round(count / sectionIds.length * 100);
    const progress = document.getElementById('module-progress');
    progress.value = count;
    progress.textContent = `${count} of 9 sections`;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('mobile-progress-text').textContent = `${percent}% complete`;
    document.getElementById('progress-detail').textContent = `${count} of 9 sections completed`;
    document.getElementById('start-label').textContent = count === 9 ? 'Review the module' : count > 0 ? 'Continue learning' : 'Start learning';
    navLinks.forEach((link, index) => {
      const completed = state.completed.includes(sectionIds[index]);
      link.classList.toggle('is-complete', completed);
      link.querySelector('.nav-number').textContent = completed ? '✓' : String(index + 1).padStart(2, '0');
      link.querySelector('.nav-status').textContent = completed ? ' — completed' : '';
      if (sectionIds[index] === state.current) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  }

  function setCompleted(id, completed = true) {
    if (!sectionIds.includes(id)) return;
    if (completed && !state.completed.includes(id)) state.completed.push(id);
    if (!completed) state.completed = state.completed.filter(item => item !== id);
    saveState();
    updateProgress();
    updateCompletionMessage();
  }

  function closeMenu() {
    sidebar.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  function showSection(id, { focus = true, updateHash = true } = {}) {
    if (!sectionIds.includes(id)) id = 'welcome';
    const index = sectionIds.indexOf(id);
    document.getElementById('global-status').textContent = '';
    state.current = id;
    if (!state.visited.includes(id)) state.visited.push(id);
    sections.forEach(section => { section.hidden = section.id !== id; });
    document.dispatchEvent(new CustomEvent('module:sectionchange', { detail: { id } }));
    document.getElementById('lesson-navigation').hidden = id === 'welcome';
    document.getElementById('lesson-count').textContent = id === 'welcome' ? 'GETTING STARTED' : `SECTION ${String(index + 1).padStart(2, '0')} OF 09`;
    document.getElementById('section-position').textContent = `Section ${index + 1} of 9`;
    document.getElementById('mobile-section-name').textContent = sections[index].dataset.title;
    document.getElementById('next-label').textContent = id === 'summary' ? 'Finish & review progress'
      : id === 'activity' ? 'Continue to knowledge check'
      : id === 'knowledge-check' ? 'Continue to summary'
      : 'Complete & continue';
    document.title = `${sections[index].dataset.title} · Physics in Everyday Life`;
    closeMenu();
    saveState();
    updateProgress();
    if (updateHash && location.hash !== `#${id}`) {
      try { history.pushState(null, '', `#${id}`); }
      catch { location.hash = id; }
    }
    if (focus) {
      sections[index].querySelector('h1').focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function updateCompletionMessage() {
    const message = document.getElementById('completion-message');
    if (message.hidden) return;
    message.replaceChildren();
    const incomplete = sectionIds.filter(id => !state.completed.includes(id));
    const heading = document.createElement('h3');
    const body = document.createElement('p');
    if (incomplete.length === 0) {
      heading.textContent = 'Module 1 complete. Well done!';
      body.textContent = 'You’ve completed all nine sections and explored the knowledge check. Revisit any lesson or retry the quiz whenever you want a refresher.';
    } else {
      heading.textContent = `${state.completed.length} of 9 sections complete. Keep going!`;
      body.textContent = 'Complete each lesson, try both cart scenarios, and finish all six quiz questions. Your progress tracks participation, not a pass or fail grade.';
    }
    message.append(heading, body);
    if (incomplete.length > 0) {
      const link = document.createElement('a');
      link.href = `#${incomplete[0]}`;
      link.className = 'button button-secondary';
      link.textContent = `Return to ${sections[sectionIds.indexOf(incomplete[0])].dataset.title.toLowerCase()}`;
      message.append(link);
    }
  }

  function displayPracticeFeedback(form, value) {
    const question = practiceQuestions[form.id];
    const feedback = form.querySelector('.feedback');
    const isCorrect = value === question.correct;
    feedback.dataset.tone = isCorrect ? 'correct' : 'retry';
    feedback.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = isCorrect ? 'Correct — you’ve got it.' : 'Not quite — use this clue and try again.';
    const explanation = document.createElement('span');
    explanation.textContent = isCorrect ? question.explanation : `${question.hints[Number(value)]} ${question.explanation}`;
    feedback.append(heading, explanation);
    form.querySelector('button[type="submit"]').textContent = isCorrect ? 'Check again' : 'Try again';
  }

  document.querySelectorAll('.practice-form').forEach(form => {
    const restored = state.practice[form.id];
    if (restored !== undefined) {
      form.querySelector(`input[value="${restored}"]`).checked = true;
      displayPracticeFeedback(form, restored);
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = form.querySelector('input:checked');
      if (!selected) {
        const feedback = form.querySelector('.feedback');
        feedback.dataset.tone = 'error';
        feedback.textContent = 'Choose an answer first. It’s okay to make a prediction.';
        form.querySelector('input').focus();
        return;
      }
      state.practice[form.id] = selected.value;
      displayPracticeFeedback(form, selected.value);
      saveState();
      if (state.practice['cart-force-practice'] !== undefined && state.practice['cart-mass-practice'] !== undefined) {
        setCompleted('activity');
      }
    });
    form.addEventListener('change', () => {
      form.querySelector('.feedback').replaceChildren();
      form.querySelector('button[type="submit"]').textContent = form.id.startsWith('cart-') ? 'Check prediction' : 'Check answer';
    });
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (sectionIds.includes(id)) {
      event.preventDefault();
      showSection(id);
    }
  });

  document.getElementById('start-learning').addEventListener('click', () => {
    setCompleted('welcome');
    const next = sectionIds.find(id => !state.completed.includes(id)) || 'force';
    showSection(next);
  });
  document.getElementById('previous-section').addEventListener('click', () => {
    showSection(sectionIds[Math.max(0, sectionIds.indexOf(state.current) - 1)]);
  });
  nextButton.addEventListener('click', () => {
    if (!['activity', 'knowledge-check'].includes(state.current)) setCompleted(state.current);
    if (state.current === 'summary') {
      const message = document.getElementById('completion-message');
      message.hidden = false;
      updateCompletionMessage();
      message.focus({ preventScroll: true });
      message.scrollIntoView({ block: 'center', behavior: 'instant' });
      return;
    }
    showSection(sectionIds[sectionIds.indexOf(state.current) + 1]);
  });

  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    sidebar.classList.toggle('is-open', !expanded);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar.classList.contains('is-open')) {
      closeMenu();
      menuButton.focus();
    }
  });
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (sectionIds.includes(id) && state.current !== id) showSection(id, { updateHash: false });
  });
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1) || 'welcome';
    if (sectionIds.includes(id) && state.current !== id) showSection(id, { updateHash: false });
  });

  function resetProgress() {
    if (resetDialog.open) resetDialog.close();
    state = freshState();
    document.querySelectorAll('.practice-form').forEach(form => {
      form.reset();
      form.querySelector('.feedback').replaceChildren();
      form.querySelector('button[type="submit"]').textContent = form.id.startsWith('cart-') ? 'Check prediction' : 'Check answer';
    });
    document.querySelectorAll('details[open]').forEach(detail => { detail.open = false; });
    document.getElementById('completion-message').hidden = true;
    document.dispatchEvent(new CustomEvent('module:reset'));
    showSection('welcome');
    document.getElementById('global-status').textContent = 'Your progress has been reset. Ready for a fresh start.';
  }

  document.getElementById('reset-progress').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('module:pause'));
    if (typeof resetDialog.showModal === 'function') resetDialog.showModal();
    else if (window.confirm('Clear your saved section progress, practice answers, and quiz attempts?')) resetProgress();
  });
  document.getElementById('cancel-reset').addEventListener('click', () => resetDialog.close());
  document.getElementById('confirm-reset').addEventListener('click', resetProgress);

  window.PhysicsModule = {
    getQuiz: () => state.quiz,
    saveQuiz(quiz) {
      state.quiz = quiz;
      setCompleted('knowledge-check', quiz.finished === true);
    }
  };

  document.documentElement.classList.add('js');
  const requested = location.hash.slice(1);
  showSection(sectionIds.includes(requested) ? requested : state.current, { focus: false, updateHash: false });
})();
