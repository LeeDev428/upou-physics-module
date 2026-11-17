(() => {
  'use strict';

  const form = document.getElementById('force-calculator');
  const forceInput = document.getElementById('net-force-input');
  const massInput = document.getElementById('mass-input');
  const result = document.getElementById('calculator-result');
  const output = document.getElementById('acceleration-output');
  const direction = document.getElementById('acceleration-direction');
  const working = document.getElementById('calculation-working');
  const presets = [...document.querySelectorAll('.preset')];

  function formatNumber(number) {
    if (number === 0) return '0';
    const magnitude = Math.abs(number);
    if (magnitude < 0.001 || magnitude >= 1000000) return number.toExponential(3);
    return new Intl.NumberFormat('en', { maximumSignificantDigits: 5 }).format(number);
  }

  function setError(input, message) {
    document.getElementById(input === forceInput ? 'force-error' : 'mass-error').textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function calculate({ focusError = true } = {}) {
    setError(forceInput, '');
    setError(massInput, '');
    const force = forceInput.valueAsNumber;
    const mass = massInput.valueAsNumber;
    let invalidInput = null;
    if (!Number.isFinite(force)) {
      setError(forceInput, 'Enter a number for net force, such as 20, 0, or −20.');
      invalidInput = forceInput;
    }
    if (!Number.isFinite(mass)) {
      setError(massInput, 'Enter a mass in kilograms, such as 5 or 2.5.');
      invalidInput ||= massInput;
    } else if (mass <= 0) {
      setError(massInput, 'Mass must be greater than zero. Try 5 kg to get started.');
      invalidInput ||= massInput;
    }
    const acceleration = force / mass;
    if (!invalidInput && (!Number.isFinite(acceleration) || (force !== 0 && acceleration === 0))) {
      setError(forceInput, 'These numbers are too extreme for this calculator. Try a smaller force or a different mass.');
      invalidInput = forceInput;
    }
    if (invalidInput) {
      output.textContent = '—';
      direction.textContent = 'Check your inputs';
      working.textContent = 'Use the guidance beside each input, then calculate again.';
      if (focusError) invalidInput.focus();
      return false;
    }
    output.textContent = formatNumber(acceleration);
    direction.textContent = acceleration > 0 ? '→ To the right' : acceleration < 0 ? '← To the left' : 'No acceleration';
    working.textContent = force === 0
      ? 'Zero net force means velocity stays constant. The object may be at rest or moving.'
      : `${formatNumber(force)} N ÷ ${formatNumber(mass)} kg = ${formatNumber(acceleration)} m/s²`;
    presets.forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.force) === force && Number(button.dataset.mass) === mass));
    });
    return true;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    calculate();
  });
  form.addEventListener('input', event => {
    setError(event.target, '');
    presets.forEach(button => button.setAttribute('aria-pressed', 'false'));
    output.textContent = '—';
    direction.textContent = 'Ready for your prediction?';
    working.textContent = 'Select Calculate acceleration to see the result for these values.';
  });
  presets.forEach(button => button.addEventListener('click', () => {
    forceInput.value = button.dataset.force;
    massInput.value = button.dataset.mass;
    calculate({ focusError: false });
  }));
  document.addEventListener('module:reset', () => {
    form.reset();
    // Keep reset updates quiet when the calculator is not the current lesson.
    result.setAttribute('aria-live', 'off');
    calculate({ focusError: false });
    result.setAttribute('aria-live', 'polite');
  });
})();
