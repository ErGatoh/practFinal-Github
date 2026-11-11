import { calculateContractTotals } from './contract-form-validation.js';

const form = document.forms.namedItem('copilotContract');

if (form) {
  const outputs = {
    plan: form.querySelector('#reviewPlan'),
    addons: form.querySelector('#reviewAddons'),
    monthlyTotal: form.querySelector('#reviewMonthlyTotal'),
    hourlyRate: form.querySelector('#reviewHourlyRate'),
    storageRate: form.querySelector('#reviewStorageRate'),
    oneTimeTotal: form.querySelector('#reviewOneTimeTotal'),
    personalName: form.querySelector('#reviewPersonalName'),
    dni: form.querySelector('#reviewDni'),
    email: form.querySelector('#reviewEmail'),
    phone: form.querySelector('#reviewPhone'),
    birthDate: form.querySelector('#reviewBirthDate'),
    streetAddress: form.querySelector('#reviewStreetAddress'),
    city: form.querySelector('#reviewCity'),
    province: form.querySelector('#reviewProvince'),
    paymentMethod: form.querySelector('#reviewPaymentMethod'),
    paymentHolderLabel: form.querySelector('#reviewPaymentHolderLabel'),
    paymentHolder: form.querySelector('#reviewPaymentHolder'),
    paymentIdentifierLabel: form.querySelector('#reviewPaymentIdentifierLabel'),
    paymentIdentifier: form.querySelector('#reviewPaymentIdentifier'),
    paymentExpiryRow: form.querySelector('#reviewPaymentExpiryRow'),
    cardExpiry: form.querySelector('#reviewCardExpiry'),
  };

  const textValue = (control) => control?.value.trim() || '';
  const displayValue = (value) => value || 'Not provided';
  const formatPrice = (price) => `$${Number.isInteger(price) ? price : price.toFixed(2)} USD`;
  const selectedOptionText = (select) => select?.value ? select.selectedOptions[0].textContent.trim() : '';

  const updateProducts = () => {
    const selectedPlan = form.querySelector('input[name="copilotPlan"]:checked');
    const selectedAddons = Array.from(form.querySelectorAll('input[name="copilotAddons"]:checked'));
    const totals = calculateContractTotals(form);

    if (selectedPlan) {
      outputs.plan.textContent = selectedPlan.dataset.summaryName;
    } else {
      outputs.plan.textContent = 'Not selected';
    }

    const addonNames = selectedAddons.map((addon) => {
      return addon.dataset.reviewName;
    });

    if (addonNames.length) {
      const addonItems = addonNames.map((name, index) => {
        const item = document.createElement('span');
        item.textContent = `${index ? '| ' : ''}${name}`;
        return item;
      });
      outputs.addons.replaceChildren(...addonItems);
    } else {
      outputs.addons.textContent = 'No add-ons selected';
    }

    outputs.monthlyTotal.textContent = totals ? `${formatPrice(totals.month)} / month` : 'Check prices';
    outputs.hourlyRate.textContent = totals?.hour ? `${formatPrice(totals.hour)} / hour` : 'None selected';
    outputs.storageRate.textContent = totals?.['gb-month'] ? `${formatPrice(totals['gb-month'])} / GB-month` : 'None selected';
    outputs.oneTimeTotal.textContent = 'None';
  };

  const updatePersonalDetails = () => {
    const fullName = [textValue(form.elements.firstName), textValue(form.elements.lastName)].filter(Boolean).join(' ');
    outputs.personalName.textContent = displayValue(fullName);
    outputs.dni.textContent = displayValue(textValue(form.elements.dni));
    outputs.email.textContent = displayValue(textValue(form.elements.email));
    outputs.phone.textContent = displayValue(textValue(form.elements.phone));
    outputs.birthDate.textContent = displayValue(textValue(form.elements.birthDate));
  };

  const updateAddress = () => {
    const street = [
      selectedOptionText(form.elements.streetType),
      textValue(form.elements.streetName),
      textValue(form.elements.streetNumber),
    ].filter(Boolean).join(' ');
    const addressExtra = textValue(form.elements.addressExtra);
    const city = [textValue(form.elements.postalCode), textValue(form.elements.city)].filter(Boolean).join(' ');

    outputs.streetAddress.textContent = displayValue(addressExtra && street ? `${street}, ${addressExtra}` : street || addressExtra);
    outputs.city.textContent = displayValue(city);
    outputs.province.textContent = displayValue(selectedOptionText(form.elements.province));
  };

  const updatePayment = () => {
    const bankSelected = form.querySelector('input[name="paymentMethod"]:checked')?.value === 'bank';
    outputs.paymentMethod.textContent = bankSelected ? 'Simulated bank debit' : 'Simulated card';
    outputs.paymentHolderLabel.textContent = bankSelected ? 'Account holder' : 'Cardholder';
    outputs.paymentIdentifierLabel.textContent = bankSelected ? 'IBAN' : 'Card number';
    outputs.paymentExpiryRow.classList.toggle('d-none', bankSelected);

    if (bankSelected) {
      outputs.paymentHolder.textContent = displayValue(textValue(form.elements.bankAccountHolder));
      outputs.paymentIdentifier.textContent = displayValue(textValue(form.elements.bankIban));
      return;
    }

    const cardDigits = textValue(form.elements.cardNumber).replace(/\D/g, '');
    outputs.paymentHolder.textContent = displayValue(textValue(form.elements.cardholderName));
    outputs.paymentIdentifier.textContent = cardDigits ? `Card ending in ${cardDigits.slice(-4)}` : 'Not provided';
    outputs.cardExpiry.textContent = displayValue(textValue(form.elements.cardExpiry));
  };

  const updateReview = () => {
    updateProducts();
    updatePersonalDetails();
    updateAddress();
    updatePayment();
  };

  if (Object.values(outputs).every(Boolean)) {
    form.addEventListener('input', updateReview);
    form.addEventListener('change', updateReview);
    updateReview();
  }
}
