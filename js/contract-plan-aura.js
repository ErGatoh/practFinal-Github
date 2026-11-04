const canvas = document.querySelector('.contract-plan-aura');

if (canvas) {
  const context = canvas.getContext('2d');

  if (context) {
    let previousWidth = 0;
    let previousHeight = 0;
    let previousPixelRatio = 0;

    const drawGlow = (width, height, x, y, radius, color) => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };

    const drawAura = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      if (width === previousWidth && height === previousHeight && pixelRatio === previousPixelRatio) return;
      previousWidth = width;
      previousHeight = height;
      previousPixelRatio = pixelRatio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      context.globalCompositeOperation = 'screen';
      drawGlow(width, height, width * 0.32, height * 0.55, Math.max(width * 0.65, height * 0.85), 'rgba(99, 58, 204, 0.5)');
      drawGlow(width, height, width * 0.62, height * 0.4, Math.max(width * 0.55, height * 0.7), 'rgba(212, 102, 185, 0.37)');
      drawGlow(width, height, width * 0.53, height * 0.45, Math.max(width * 0.35, height * 0.48), 'rgba(255, 225, 246, 0.3)');
      context.globalCompositeOperation = 'source-over';
    };

    const resizeObserver = new ResizeObserver(drawAura);
    resizeObserver.observe(canvas.parentElement);
  }
}

const planFrames = document.querySelectorAll('.contract-plan-frame');

for (const frame of planFrames) {
  const card = frame.querySelector('.contract-plan-card');
  const radio = frame.querySelector('input[type="radio"]');
  let bounds;
  let pointerX;
  let pointerY;
  let pendingFrame = 0;

  const updatePointer = (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (pendingFrame) return;

    pendingFrame = requestAnimationFrame(() => {
      card.style.setProperty('--pointer-x', `${pointerX - bounds.left}px`);
      card.style.setProperty('--pointer-y', `${pointerY - bounds.top}px`);
      pendingFrame = 0;
    });
  };

  card.addEventListener('pointerenter', (event) => {
    bounds = card.getBoundingClientRect();
    updatePointer(event);
  });
  card.addEventListener('pointermove', updatePointer);
  card.addEventListener('pointerleave', () => {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
  });

  radio.addEventListener('change', () => {
    if (bounds) bounds = card.getBoundingClientRect();
    frame.classList.remove('is-just-selected');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void frame.offsetWidth;
      frame.classList.add('is-just-selected');
    }
  });

  frame.addEventListener('animationend', () => {
    if (bounds) bounds = card.getBoundingClientRect();
    frame.classList.remove('is-just-selected');
  });
}
