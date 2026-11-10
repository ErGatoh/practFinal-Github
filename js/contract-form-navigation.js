const form = document.forms.namedItem('copilotContract');

if (form) {
  const steps = Array.from(form.querySelectorAll('[data-contract-step]'));
  const currentStep = form.querySelector('#contractCurrentStep');
  const currentStepLabel = form.querySelector('#contractCurrentStepLabel');
  const previousButton = form.querySelector('#contractPreviousButton');
  const nextButton = form.querySelector('#contractNextButton');
  const stage = form.querySelector('.contract-step-stage');

  if (steps.length && currentStep && currentStepLabel && previousButton && nextButton && stage) {
    const initiallyVisibleStep = steps.findIndex((step) => !step.hidden);
    let currentStepIndex = initiallyVisibleStep >= 0 ? initiallyVisibleStep : 0;
    let isTransitioning = false;

    const showStep = (stepIndex) => {
      currentStepIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));

      for (const [index, step] of steps.entries()) {
        step.hidden = index !== currentStepIndex;
      }

      const activeStep = steps[currentStepIndex];
      currentStep.textContent = `Step ${activeStep.dataset.contractStep} of 6`;
      currentStepLabel.textContent = activeStep.dataset.stepLabel;
      previousButton.disabled = currentStepIndex === 0;
      nextButton.disabled = currentStepIndex === steps.length - 1;
    };

    const changeStep = async (direction) => {
      const targetIndex = currentStepIndex + direction;
      if (isTransitioning || targetIndex < 0 || targetIndex >= steps.length) return;

      const outgoing = steps[currentStepIndex];
      const incoming = steps[targetIndex];
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mobileLayout = window.matchMedia('(max-width: 767.98px)').matches;

      if (reducedMotion || typeof outgoing.animate !== 'function') {
        showStep(targetIndex);
        return;
      }

      isTransitioning = true;
      previousButton.disabled = true;
      nextButton.disabled = true;
      if (outgoing.contains(document.activeElement)) document.activeElement.blur();

      incoming.hidden = false;
      stage.classList.add('is-transitioning');
      if (!mobileLayout) {
        incoming.style.position = 'absolute';
        incoming.style.inset = '0';
      }

      const options = { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' };
      const outgoingAnimation = outgoing.animate([
        { transform: 'translateX(0)', opacity: 1 },
        { transform: `translateX(${-direction * 18}%)`, opacity: 0 },
      ], options);
      const incomingAnimation = incoming.animate([
        { transform: `translateX(${direction * 18}%)`, opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ], options);

      try {
        await Promise.all([outgoingAnimation.finished, incomingAnimation.finished]);
      } finally {
        outgoingAnimation.cancel();
        incomingAnimation.cancel();
        incoming.style.position = '';
        incoming.style.inset = '';
        stage.classList.remove('is-transitioning');
        showStep(targetIndex);
        isTransitioning = false;
      }
    };

    previousButton.addEventListener('click', () => changeStep(-1));
    nextButton.addEventListener('click', () => changeStep(1));

    form.querySelectorAll('.contract-review-step a[href^="#contractStep"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        if (isTransitioning || currentStepIndex !== steps.length - 1) return;

        const targetIndex = steps.findIndex((step) => link.hash === `#${step.id}`);
        if (targetIndex < 0 || targetIndex >= currentStepIndex) return;

        showStep(targetIndex);
        steps[targetIndex].focus({ preventScroll: true });
        steps[targetIndex].scrollIntoView({ block: 'start' });
      });
    });

    showStep(currentStepIndex);
  }
}
