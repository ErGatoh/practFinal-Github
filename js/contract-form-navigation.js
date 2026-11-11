import { validateContractStep, validateContract } from './contract-form-validation.js';

const form = document.forms.namedItem('copilotContract');

if (form) {
  const steps = Array.from(form.querySelectorAll('[data-contract-step]'));
  const currentStep = form.querySelector('#contractCurrentStep');
  const currentStepLabel = form.querySelector('#contractCurrentStepLabel');
  const previousButton = form.querySelector('#contractPreviousButton');
  const nextButton = form.querySelector('#contractNextButton');
  const stage = form.querySelector('.contract-step-stage');
  const errorSummary = form.querySelector('#contractErrorSummary');

  if (steps.length && currentStep && currentStepLabel && previousButton && nextButton && stage) {
    const initiallyVisibleStep = steps.findIndex((step) => !step.hidden);
    let currentStepIndex = initiallyVisibleStep >= 0 ? initiallyVisibleStep : 0;
    let isTransitioning = false;
    const errorMessages = new Map();

    const errorContainer = (control) => {
      if (control.name === 'copilotPlan') return control.closest('.contract-plan-stage');
      if (control.name === 'copilotAddons') return control.closest('.contract-addon-step');
      const card = control.closest('.contract-plan-frame, .contract-addon-card');
      if (card) return card.parentElement;
      if (control.type === 'checkbox' || control.type === 'radio') return control.closest('.form-check') || control.closest('fieldset');
      return control.parentElement;
    };

    const clearError = (control) => {
      const message = errorMessages.get(control);
      if (!message) return;
      control.classList.remove('is-invalid');
      control.removeAttribute('aria-invalid');
      const descriptions = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== message.id);
      if (descriptions.length) control.setAttribute('aria-describedby', descriptions.join(' '));
      else control.removeAttribute('aria-describedby');
      message.remove();
      errorMessages.delete(control);
    };

    const setError = ({ control, message }) => {
      clearError(control);
      if (!control.id) control.id = `contract-${control.name}-${control.value}`;
      const feedback = document.createElement('div');
      feedback.id = `${control.id || control.name}Error`;
      feedback.className = control.name === 'copilotPlan' || control.name === 'copilotAddons'
        ? 'contract-selection-error contract-error alert text-center mt-4 mb-0'
        : 'invalid-feedback d-block';
      feedback.textContent = message;
      errorContainer(control).append(feedback);
      control.classList.add('is-invalid');
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', [...(control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean), feedback.id].join(' '));
      errorMessages.set(control, feedback);
    };

    const renderErrors = (errors) => {
      for (const control of errorMessages.keys()) clearError(control);
      errors.forEach(setError);
      errorSummary.replaceChildren();
      errorSummary.hidden = !errors.length;
      if (!errors.length) return;
      const title = document.createElement('p');
      title.className = 'fw-semibold mb-2';
      title.textContent = 'Please correct these fields:';
      const list = document.createElement('ul');
      list.className = 'mb-0';
      for (const { control, message } of errors) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${control.id}`;
        link.textContent = message;
        link.addEventListener('click', (event) => {
          event.preventDefault();
          focusError(control);
        });
        item.append(link);
        list.append(item);
      }
      errorSummary.append(title, list);
    };

    const focusError = (control) => {
      const target = control.closest('[data-contract-step]');
      const targetIndex = steps.indexOf(target);
      if (targetIndex < 0) return;
      showStep(targetIndex);
      control.focus({ preventScroll: true });
      const feedback = errorMessages.get(control);
      (feedback?.classList.contains('contract-selection-error') ? feedback : control).scrollIntoView({ block: 'center' });
    };

    const showStep = (stepIndex) => {
      currentStepIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));

      for (const [index, step] of steps.entries()) {
        step.hidden = index !== currentStepIndex;
      }

      const activeStep = steps[currentStepIndex];
      currentStep.textContent = `Step ${activeStep.dataset.contractStep} of 6`;
      currentStepLabel.textContent = activeStep.dataset.stepLabel;
      previousButton.disabled = currentStepIndex === 0;
      const isFinalStep = currentStepIndex === steps.length - 1;
      nextButton.textContent = isFinalStep ? 'Confirm request' : 'Next';
      nextButton.type = isFinalStep ? 'submit' : 'button';
      nextButton.disabled = false;
    };

    const changeStep = async (direction) => {
      const targetIndex = currentStepIndex + direction;
      if (isTransitioning || targetIndex < 0 || targetIndex >= steps.length) return;

      const outgoing = steps[currentStepIndex];
      const incoming = steps[targetIndex];
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dynamicLayout = window.matchMedia('(max-width: 1199.98px)').matches;

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
      if (!dynamicLayout) {
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
    nextButton.addEventListener('click', () => {
      if (isTransitioning || currentStepIndex === steps.length - 1) return;
      const errors = validateContractStep(form, currentStepIndex);
      renderErrors(errors);
      if (errors.length) focusError(errors[0].control);
      else changeStep(1);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (isTransitioning) return;
      const { errors, totals } = validateContract(form);
      renderErrors(errors);
      if (errors.length || !totals) {
        if (errors.length) focusError(errors[0].control);
        return;
      }
      showStep(0);
      window.scrollTo({ top: 0, behavior: 'auto' });
      bootstrap.Modal.getOrCreateInstance(document.getElementById('contractSuccessModal')).show();
    });

    const refreshErrors = (event) => {
      if (!errorMessages.size) return;
      const control = event.target;
      if (!control.closest?.('[data-contract-step]')) return;
      const currentErrors = Array.from(errorMessages.keys());
      const affected = new Set([control]);
      if (control.name === 'copilotPlan' || control.name === 'copilotAddons') {
        form.querySelectorAll('input[name="copilotPlan"], input[name="copilotAddons"]').forEach((item) => affected.add(item));
      }
      if (control.name === 'province') affected.add(form.elements.postalCode);
      if (control.name === 'email') affected.add(form.elements.emailConfirmation);
      if (control.name === 'paymentMethod') currentErrors.forEach((item) => {
        if (item.closest('[data-contract-step="5"]')) affected.add(item);
      });
      const updated = currentErrors.filter((item) => !affected.has(item)).map((item) => ({ control: item, message: errorMessages.get(item).textContent }));
      for (const index of new Set([...affected].map((item) => steps.indexOf(item.closest('[data-contract-step]'))))) {
        if (index < 0) continue;
        for (const entry of validateContractStep(form, index)) {
          if (affected.has(entry.control)) updated.push(entry);
        }
      }
      updated.sort((a, b) => steps.indexOf(a.control.closest('[data-contract-step]')) - steps.indexOf(b.control.closest('[data-contract-step]')) ||
        (a.control.compareDocumentPosition(b.control) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      renderErrors(updated);
    };
    form.addEventListener('input', refreshErrors);
    form.addEventListener('change', refreshErrors);

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
