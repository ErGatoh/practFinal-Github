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
    cardholder: form.querySelector('#reviewCardholder'),
    cardNumber: form.querySelector('#reviewCardNumber'),
    cardExpiry: form.querySelector('#reviewCardExpiry'),
  };

  const textValue = (control) => control?.value.trim() || '';
  const displayValue = (value) => value || 'Not provided';
  const formatPrice = (price) => `$${Number.isInteger(price) ? price : price.toFixed(2)} USD`;
  const selectedOptionText = (select) => select?.value ? select.selectedOptions[0].textContent.trim() : '';

  const updateProducts = () => {
    const selectedPlan = form.querySelector('input[name="copilotPlan"]:checked');
    const selectedAddons = Array.from(form.querySelectorAll('input[name="copilotAddons"]:checked'));
    let monthlyTotal = 0;
    let hourlyRate = 0;
    let storageRate = 0;

    if (selectedPlan) {
      const price = Number(selectedPlan.dataset.price);
      outputs.plan.textContent = selectedPlan.dataset.summaryName;
      monthlyTotal += price;
    } else {
      outputs.plan.textContent = 'Not selected';
    }

    const addonNames = selectedAddons.map((addon) => {
      const price = Number(addon.dataset.price);
      const unit = addon.dataset.billingUnit;
      if (unit === 'month') monthlyTotal += price;
      if (unit === 'hour') hourlyRate += price;
      if (unit === 'gb-month') storageRate += price;
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

    outputs.monthlyTotal.textContent = `${formatPrice(monthlyTotal)} / month`;
    outputs.hourlyRate.textContent = hourlyRate ? `${formatPrice(hourlyRate)} / hour` : 'None selected';
    outputs.storageRate.textContent = storageRate ? `${formatPrice(storageRate)} / GB-month` : 'None selected';
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
    const cardDigits = textValue(form.elements.cardNumber).replace(/\D/g, '');
    outputs.cardholder.textContent = displayValue(textValue(form.elements.cardholderName));
    outputs.cardNumber.textContent = cardDigits ? `Card ending in ${cardDigits.slice(-4)}` : 'Not provided';
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
