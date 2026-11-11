const form = document.forms.namedItem('copilotContract');

if (form) {
  const methods = form.querySelectorAll('input[name="paymentMethod"]');
  const cardFields = form.querySelector('#contractCardFields');
  const bankFields = form.querySelector('#contractBankFields');

  if (methods.length === 2 && cardFields && bankFields) {
    const setFieldsActive = (group, active) => {
      group.hidden = !active;
      group.querySelectorAll('input').forEach((input) => {
        input.disabled = !active;
      });
    };

    const updatePaymentMethod = () => {
      const selectedMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value;
      setFieldsActive(cardFields, selectedMethod === 'card');
      setFieldsActive(bankFields, selectedMethod === 'bank');
    };

    methods.forEach((method) => method.addEventListener('change', updatePaymentMethod));
    updatePaymentMethod();
  }
}
