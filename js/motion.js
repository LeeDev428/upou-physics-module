(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 4000;
  const players = [];
  const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };

  function createPlayer(root, initialLabel, render, describe) {
    const playButton = root.querySelector('[data-motion-play]');
    const stepButton = root.querySelector('[data-motion-step]');
    const replayButton = root.querySelector('[data-motion-replay]');
    const status = root.querySelector('[data-motion-status]');
    let elapsed = 0;
    let running = false;
    let frame = 0;
    let startedAt = 0;
    let printPosition = 0;

    function updateControls() {
      playButton.textContent = running ? 'Pause' : elapsed === duration ? 'Play again' : elapsed > 0 ? 'Continue' : initialLabel;
      replayButton.textContent = reducedMotion.matches ? 'Restart steps' : 'Replay';
      stepButton.disabled = elapsed === duration;
      root.dataset.motionState = running ? 'running' : elapsed === duration ? 'finished' : elapsed > 0 ? 'paused' : 'ready';
    }

    function pause(announce = true) {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
      updateControls();
      if (announce) status.textContent = `Paused. ${describe()}`;
    }

    function tick(now) {
      if (!running) return;
      // Also check each frame: some browsers delay media-query change events.
      if (reducedMotion.matches) { pause(); return; }
      elapsed = Math.min(duration, now - startedAt);
      render(elapsed / duration);
      if (elapsed < duration) frame = requestAnimationFrame(tick);
      else {
        running = false;
        updateControls();
        status.textContent = `Demonstration complete. ${describe()}`;
      }
    }

    function play() {
      if (reducedMotion.matches || root.closest('.lesson').hidden || document.hidden) return;
      if (elapsed === duration) elapsed = 0;
      running = true;
      startedAt = performance.now() - elapsed;
      render(elapsed / duration);
      updateControls();
      status.textContent = 'Playing. You can pause or use Next step to inspect a still frame.';
      frame = requestAnimationFrame(tick);
    }

    playButton.addEventListener('click', () => { if (running) pause(); else play(); });
    stepButton.addEventListener('click', () => {
      pause(false);
      elapsed = Math.min(duration, (Math.floor(elapsed / 1000) + 1) * 1000);
      render(elapsed / duration);
      updateControls();
      status.textContent = describe();
    });
    replayButton.addEventListener('click', () => {
      pause(false);
      elapsed = 0;
      render(0);
      updateControls();
      if (reducedMotion.matches) status.textContent = `Back to the first step. ${describe()}`;
      else play();
    });
    reducedMotion.addEventListener('change', () => {
      const moveFocus = reducedMotion.matches && document.activeElement === playButton;
      pause(false);
      updateControls();
      if (moveFocus) (stepButton.disabled ? replayButton : stepButton).focus();
      status.textContent = reducedMotion.matches ? 'Motion is off. Use Next step to view still frames.' : 'Motion is available. Select Play or Continue when you are ready.';
    });
    document.addEventListener('module:reset', () => {
      pause(false);
      elapsed = 0;
      render(0);
      updateControls();
      status.textContent = '';
    });
    window.addEventListener('beforeprint', () => {
      pause(false);
      printPosition = elapsed;
      render(1);
    });
    window.addEventListener('afterprint', () => { render(printPosition / duration); });
    render(0);
    updateControls();
    players.push({ root, pause });
  }

  const cartRoot = document.getElementById('cart-demo');
  const lanes = [...cartRoot.querySelectorAll('.comparison-lane')].map(lane => ({
    acceleration: Number(lane.dataset.force) / Number(lane.dataset.mass),
    cart: lane.querySelector('.moving-cart'),
    distance: lane.querySelector('[data-distance]'),
    speed: lane.querySelector('[data-speed]')
  }));
  const cartExplanation = cartRoot.querySelector('[data-demo-explanation]');
  const cartTime = cartRoot.querySelector('[data-motion-time]');

  createPlayer(cartRoot, 'Play comparison', fraction => {
    const seconds = fraction * 2;
    lanes.forEach(({ acceleration, cart, distance, speed }) => {
      // Constant acceleration from rest: x = 1/2 at², v = at. All lanes use 0–16 m.
      const metres = 0.5 * acceleration * seconds ** 2;
      cart.style.left = `${metres / 16 * 100}%`;
      setText(distance, metres.toFixed(1));
      setText(speed, (acceleration * seconds).toFixed(1));
    });
    setText(cartTime, `Model time: ${seconds.toFixed(1)} / 2.0 s`);
    setText(cartExplanation, fraction === 0
      ? 'All carts start at rest: zero speed. Compare how quickly their speeds change when the net forces act.'
      : fraction < 1
        ? 'The gaps grow because the carts are speeding up. Double the force increases speed twice as quickly; double the mass increases speed half as quickly.'
        : 'After 2 seconds: the original cart travels 8 m, double the force gives 16 m, and double the mass gives 4 m. Greater acceleration means speed increases more each second.');
  }, () => `${cartTime.textContent}. ${lanes.map((lane, index) => `${['Original cart', 'Double force', 'Double mass'][index]}: distance ${lane.distance.textContent} metres, speed ${lane.speed.textContent} metres per second right.`).join(' ')}`);

  const wallRoot = document.getElementById('wall-demo');
  const frontArm = document.getElementById('wall-arm-front');
  const backArm = document.getElementById('wall-arm-back');
  const rightArrow = document.getElementById('wall-force-right');
  const leftArrow = document.getElementById('wall-force-left');
  const pairValues = [...wallRoot.querySelectorAll('[data-pair-force]')];
  const pairDirections = [...wallRoot.querySelectorAll('[data-pair-direction]')];
  const wallExplanation = wallRoot.querySelector('[data-demo-explanation]');
  const wallTime = wallRoot.querySelector('[data-motion-time]');

  createPlayer(wallRoot, 'Play push', fraction => {
    const reach = Math.min(1, fraction * 4);
    const push = Math.min(1, Math.max(0, (fraction - 0.25) * 4));
    frontArm.setAttribute('d', `M158 106 ${190 + reach * 22} ${132 - reach * 38} ${235 + reach * 36} ${122 - reach * 22}`);
    backArm.setAttribute('d', `M150 115 ${185 + reach * 25} ${142 - reach * 24} ${230 + reach * 41} ${135 - reach * 21}`);
    const arrowLength = push * 72;
    const tip = Math.min(8, arrowLength / 2);
    rightArrow.setAttribute('d', `M276 145h${arrowLength}m-${tip}-${tip * 0.75} ${tip} ${tip * 0.75}-${tip} ${tip * 0.75}`);
    leftArrow.setAttribute('d', `M276 179h-${arrowLength}m${tip}-${tip * 0.75}-${tip} ${tip * 0.75} ${tip} ${tip * 0.75}`);
    rightArrow.style.opacity = leftArrow.style.opacity = push > 0 ? '1' : '0';
    pairValues.forEach(value => setText(value, String(Math.round(30 * push))));
    pairDirections.forEach((direction, index) => setText(direction, push > 0 ? ['right', 'left'][index] : '— no push'));
    setText(wallTime, `Step ${Math.min(5, Math.floor(fraction * 4) + 1)} of 5`);
    setText(wallExplanation, fraction === 0
      ? 'The hands have not reached the wall. There is no contact force between them yet. Play or use Next step to follow the interaction.'
      : fraction < 0.25
        ? 'The hands reach toward the wall. The wall does not exert a contact force on the hands before they touch.'
        : fraction === 0.25
          ? 'The hands have reached the wall. Watch both forces as the person begins to push.'
          : fraction < 0.5
            ? 'As the person pushes harder, both forces grow together. Neither force waits for the other: they are one interaction.'
            : 'The person pushes the wall right with 30 N. At the same time, the wall pushes the person left with 30 N. A stationary object can exert a force.');
  }, () => `${wallTime.textContent}. ${wallExplanation.textContent} Force on each object: ${pairValues[0].textContent} newtons, in opposite directions.`);

  document.addEventListener('module:sectionchange', () => {
    players.filter(player => player.root.closest('.lesson').hidden).forEach(player => player.pause());
  });
  document.addEventListener('module:pause', () => players.forEach(player => player.pause(false)));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) players.forEach(player => player.pause(false));
  });
})();
