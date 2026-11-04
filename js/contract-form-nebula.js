const section = document.querySelector('.contract-form-section');
const canvas = section?.querySelector('.contract-form-nebula');
const context = canvas?.getContext('2d');

if (section && canvas && context) {
  let previousWidth = 0;
  let previousHeight = 0;

  const drawNebula = () => {
    const { width, height } = section.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    const canvasWidth = Math.round(width * pixelRatio);
    const canvasHeight = Math.round(height * pixelRatio);
    if (canvasWidth === previousWidth && canvasHeight === previousHeight) return;

    previousWidth = canvasWidth;
    previousHeight = canvasHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const clouds = [
      [0.22, 0.2, 'rgba(102, 50, 170, 0.22)'],
      [0.78, 0.43, 'rgba(99, 58, 204, 0.19)'],
      [0.35, 0.78, 'rgba(156, 68, 146, 0.14)'],
    ];

    for (const [x, y, color] of clouds) {
      const radius = Math.max(width * 0.42, 340);
      const gradient = context.createRadialGradient(width * x, height * y, 0, width * x, height * y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    }
  };

  new ResizeObserver(drawNebula).observe(section);
}
