const value = (form, name) => form.elements[name].value.trim();
const error = (control, message) => ({ control, message });

export function calculateContractTotals(form) {
  const totals = { month: 0, hour: 0, 'gb-month': 0 };
  const selected = form.querySelectorAll('input[name="copilotPlan"]:checked, input[name="copilotAddons"]:checked');
  for (const item of selected) {
    const price = Number(item.dataset.price);
    if (!(item.dataset.billingUnit in totals) || !Number.isFinite(price) || price < 0) return null;
    totals[item.dataset.billingUnit] += price;
  }
  return totals;
}

const validIban = (iban) => {
  if (!/^ES\d{22}$/.test(iban)) return false;
  const rearranged = `${iban.slice(4)}1428${iban.slice(2, 4)}`;
  let remainder = 0;
  for (const digit of rearranged) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
};

const validCard = (digits) => {
  if (!/^\d{16}$/.test(digits)) return false;
  let sum = 0;
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index]);
    if ((digits.length - 1 - index) % 2) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    sum += digit;
  }
  return sum % 10 === 0;
};

export function validateContractStep(form, stepIndex) {
  const errors = [];
  const add = (name, message) => errors.push(error(form.elements[name], message));
  const required = (name, label) => {
    if (!value(form, name)) add(name, `Enter ${label}.`);
  };

  if (stepIndex === 0) {
    if (form.querySelectorAll('input[name="copilotPlan"]:checked').length !== 1) {
      errors.push(error(form.querySelector('input[name="copilotPlan"]'), 'Select one Copilot plan.'));
    }
  }
  if (stepIndex === 1) {
    if (form.querySelector('input[name="copilotAddons"][value="codespaces-storage"]:checked') &&
        !form.querySelector('input[name="copilotAddons"][value="codespaces-compute"]:checked')) {
      errors.push(error(form.querySelector('input[name="copilotAddons"][value="codespaces-storage"]'),
        'Codespaces storage requires Codespaces compute.'));
    }
  }
  if (stepIndex === 2) {
    required('firstName', 'your first name');
    required('lastName', 'your last name');
    const dni = value(form, 'dni').toUpperCase();
    if (!dni) add('dni', 'Enter your DNI.');
    else if (!/^\d{8}[A-Z]$/.test(dni) || 'TRWAGMYFPDXBNJZSQVHLCKE'[Number(dni.slice(0, 8)) % 23] !== dni[8]) {
      add('dni', 'Enter eight digits and the correct DNI control letter.');
    }
    const phone = value(form, 'phone').replace(/\s+/g, '').replace(/^\+34/, '');
    if (!value(form, 'phone')) add('phone', 'Enter your phone number.');
    else if (!/^[6789]\d{8}$/.test(phone)) add('phone', 'Enter a nine-digit Spanish phone number, optionally with +34.');
    const email = value(form, 'email').replace(/\s+/g, '').toLowerCase();
    const confirmation = value(form, 'emailConfirmation').replace(/\s+/g, '').toLowerCase();
    if (!value(form, 'email')) add('email', 'Enter your email address.');
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) add('email', 'Enter a valid email address.');
    if (!value(form, 'emailConfirmation')) add('emailConfirmation', 'Confirm your email address.');
    else if (confirmation !== email) add('emailConfirmation', 'The email addresses must match.');
    const birth = value(form, 'birthDate');
    if (!birth) add('birthDate', 'Enter your date of birth.');
    else {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
      const date = match && new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      if (!date || date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) {
        add('birthDate', 'Enter an existing date of birth.');
      } else {
        const today = new Date();
        if (date > today) add('birthDate', 'The date of birth cannot be in the future.');
        else {
          const age = today.getFullYear() - date.getFullYear() -
            (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate()) ? 1 : 0);
          if (age < 18) add('birthDate', 'You must be at least 18 years old.');
        }
      }
    }
  }
  if (stepIndex === 3) {
    required('streetType', 'a street type');
    required('streetName', 'a street name');
    required('streetNumber', 'a street number');
    const postal = value(form, 'postalCode');
    if (!postal) add('postalCode', 'Enter a postal code.');
    else if (!/^\d{5}$/.test(postal) || Number(postal.slice(0, 2)) < 1 || Number(postal.slice(0, 2)) > 52) {
      add('postalCode', 'Enter a five-digit Spanish postal code with a prefix from 01 to 52.');
    } else if (value(form, 'province') && postal.slice(0, 2) !== value(form, 'province')) {
      add('postalCode', 'The postal code prefix must match the selected province.');
    }
    required('city', 'a city or town');
    required('province', 'a province');
  }
  if (stepIndex === 4) {
    const method = form.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (method !== 'card' && method !== 'bank') add('paymentMethod', 'Choose a payment method.');
    if (method === 'bank') {
      required('bankAccountHolder', 'the account holder');
      const iban = value(form, 'bankIban').replace(/\s+/g, '').toUpperCase();
      if (!iban) add('bankIban', 'Enter a Spanish IBAN.');
      else if (!validIban(iban)) add('bankIban', 'Enter a valid Spanish IBAN with correct control digits.');
    }
    if (method === 'card') {
      required('cardholderName', 'the cardholder name');
      const card = value(form, 'cardNumber').replace(/\s+/g, '');
      if (!card) add('cardNumber', 'Enter a card number.');
      else if (!validCard(card)) add('cardNumber', 'Enter a 16-digit card number that passes the Luhn check.');
      const expiry = value(form, 'cardExpiry');
      if (!expiry) add('cardExpiry', 'Enter an expiry date.');
      else {
        const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
        const today = new Date();
        if (!match || 2000 + Number(match[2]) < today.getFullYear() ||
            (2000 + Number(match[2]) === today.getFullYear() && Number(match[1]) < today.getMonth() + 1)) {
          add('cardExpiry', 'Enter an expiry date in MM/YY that has not passed.');
        }
      }
      if (!value(form, 'cardCvv')) add('cardCvv', 'Enter a CVV.');
      else if (!/^\d{3}$/.test(value(form, 'cardCvv'))) add('cardCvv', 'Enter a three-digit CVV.');
    }
  }
  if (stepIndex === 5) {
    if (!form.elements.contractTermsConsent.checked) add('contractTermsConsent', 'Accept the contract terms.');
    if (!form.elements.contractPrivacyConsent.checked) add('contractPrivacyConsent', 'Accept the privacy policy.');
  }
  return errors;
}

export function validateContract(form) {
  const errors = Array.from({ length: 6 }, (_, index) => validateContractStep(form, index)).flat();
  const totals = calculateContractTotals(form);
  if (!totals && !errors.length) errors.push(error(form.querySelector('input[name="copilotPlan"]'), 'Check the selected prices before confirming.'));
  return { errors, totals };
}
