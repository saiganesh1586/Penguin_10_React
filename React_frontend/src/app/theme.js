(() => {
  const storageKey = 'eventflow-theme';
  const root = document.documentElement;

  function setTheme(theme) {
    root.dataset.theme = theme;
  }

  try {
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  } catch (error) {
    console.warn('EventFlow could not read the saved color theme.', error);
  }

  function addThemeToggle() {
    if (!['/', '/landing'].includes(window.location.pathname)) return;

    const button = document.createElement('button');
    const isLight = root.dataset.theme === 'light';
    button.className = 'theme-toggle';
    button.type = 'button';
    button.setAttribute('aria-pressed', String(isLight));
    button.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
    button.title = `Switch to ${isLight ? 'dark' : 'light'} mode`;
    button.innerHTML = `
      <svg class="theme-icon-dark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"></path>
      </svg>
      <svg class="theme-icon-light" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>
      </svg>`;
    button.addEventListener('click', () => {
      const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      setTheme(theme);
      const light = theme === 'light';
      button.setAttribute('aria-pressed', String(light));
      button.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} mode`);
      button.title = `Switch to ${light ? 'dark' : 'light'} mode`;

      try {
        localStorage.setItem(storageKey, theme);
      } catch (error) {
        console.warn('EventFlow could not save the selected color theme.', error);
      }
    });

    document.body.prepend(button);

    const app = document.getElementById('app');
    const dashboardControls = app?.querySelector('.topbar-right');
    if (app && dashboardControls) {
      const placeThemeToggle = () => {
        const container = app.style.display === 'block' ? dashboardControls : document.body;
        if (button.parentElement !== container) container.prepend(button);
      };
      const observer = new MutationObserver(placeThemeToggle);
      observer.observe(app, { attributes: true, attributeFilter: ['style'] });
      placeThemeToggle();
    }
  }

  function addPasswordToggle(input) {
    if (input.type !== 'password' || input.closest('.password-field')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const button = document.createElement('button');
    button.className = 'password-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Show password');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `
      <svg class="eye-on" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <svg class="eye-off" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a14.8 14.8 0 0 1-3 3.8M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7a10.8 10.8 0 0 0 3.1-.5"></path>
      </svg>`;
    button.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(visible));
      button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} password`);
    });
    wrapper.appendChild(button);
  }

  function prepareFormField(field) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    if (
      field instanceof HTMLInputElement
      && (field.type === 'search' || /^([a-z0-9]+-)?q$/i.test(field.id) || /search/i.test(`${field.id} ${field.placeholder}`))
    ) return;

    const label = field.closest('.form-group')?.querySelector('label')?.textContent?.trim()
      || field.labels?.[0]?.textContent?.trim()
      || '';
    const details = `${label} ${field.id} ${field.name} ${field.placeholder}`.toLowerCase();

    if (
      label.includes('*')
      || field.hasAttribute('required')
      || ['l-email', 'l-pass'].includes(field.id)
    ) field.required = true;

    if (field instanceof HTMLSelectElement && field.options.length) {
      const first = field.options[0];
      if (!first.hasAttribute('value') && /^select\b/i.test(first.textContent.trim())) first.value = '';
    }

    if (field instanceof HTMLInputElement) {
      const isOtp = /\botp\b/i.test(details) || /otp/i.test(field.id) || /verification code/i.test(details);
      if (!isOtp && field.type === 'text' && /\b(email|e-mail)\b/.test(details)) field.type = 'email';
      if (!isOtp && field.type === 'text' && /\b(url|website|web site)\b/.test(details)) field.type = 'url';
      if (!isOtp && field.type === 'text' && /\b(phone|mobile|telephone|emergency contact)\b/.test(details)) field.type = 'tel';
      if (field.type === 'tel') {
        field.maxLength = 10;
        field.pattern = '[6-9]\\d{9}';
        field.inputMode = 'numeric';
      }
      if (field.type === 'text' && /\b(price|budget|amount|fee|cost|capacity|quantity|guests?|age|years? of experience|discount)\b/.test(label.toLowerCase())) {
        field.type = 'number';
      }
      if (field.type === 'text' && /\b(date|date of birth)\b/.test(label.toLowerCase())) field.type = 'date';
      if (field.type === 'password' && field.minLength < 6) {
        field.minLength = 6;
      }

      if (field instanceof HTMLInputElement && /\b(pin\s*code|pincode|postal\s*code)\b/i.test(details)) {
        field.maxLength = 6;
        field.pattern = '\\d{6}';
        field.inputMode = 'numeric';
      }

      if (field.type === 'number') {
        const isCaptcha = /\bcaptcha\b/i.test(details);
        if (!isCaptcha) {
          if (/\bbudget\b/i.test(details)) {
            field.min = '1000';
            field.max = '10000000';
            field.step = 'any';
          } else if (/\b(ticket\s*price|price)\b/i.test(details) && !/\b(budget|taxes|fee)\b/i.test(details)) {
            field.min = '0';
            field.max = '100000';
            field.step = 'any';
          } else if (/\b(capacity|guests?)\b/i.test(details)) {
            field.min = '1';
            field.max = '50000';
            field.step = '1';
          } else if (/\bquantity\b/i.test(details)) {
            field.min = '1';
            field.max = '50000';
            field.step = '1';
          } else if (/\b(years?\s+of\s+experience|experience)\b/i.test(details)) {
            field.min = '0';
            field.max = '60';
            field.step = '1';
          } else if (/\bdiscount\b/i.test(details)) {
            field.min = '0';
            field.max = '100';
            field.step = 'any';
          } else {
            const positiveCount = /\b(capacity|quantity|guests?)\b/.test(details);
            if (field.min === '' || Number(field.min) < 0) field.min = positiveCount ? '1' : '0';
            if (field.step === '') field.step = /\b(years? of experience|age|capacity|quantity|guests?)\b/.test(details) ? '1' : 'any';
          }
        }
      }

    }

    const validate = () => {
      const isOtp = /\botp\b/i.test(details) || /otp/i.test(field.id) || /verification code/i.test(details);
      if (isOtp) {
        field.setCustomValidity('');
        return;
      }
      const value = field.value;
      let message = '';
      if (field.required && !value.trim()) {
        message = 'Please fill out this field.';
      } else if (field instanceof HTMLInputElement && field.type === 'tel' && value) {
        if (!/^[6-9]\d{9}$/.test(value.trim())) {
          message = 'Enter a valid 10-digit Indian mobile number.';
        }
      } else if (field instanceof HTMLInputElement && /\b(pin\s*code|pincode|postal\s*code)\b/i.test(details) && value) {
        if (!/^\d{6}$/.test(value.trim())) {
          message = 'Enter a valid 6-digit Indian PIN code.';
        }
      } else if (field instanceof HTMLInputElement && field.type === 'date' && value && Number.isNaN(Date.parse(value))) {
        message = 'Enter a valid date.';
      } else if (field instanceof HTMLInputElement && field.type === 'password' && value.length < field.minLength) {
        message = `Password must be at least ${field.minLength} characters.`;
      } else if (
        field instanceof HTMLInputElement
        && /^(full name|your name|name|first name|last name|city|city\s*\/\s*location)$/i.test(label.replace(/\*/g, '').trim())
        && value
      ) {
        if (!/^[\p{L}\p{M} .,'’()-]+$/u.test(value.trim())) {
          message = 'Use letters and normal name or city characters only.';
        }
      } else if (field instanceof HTMLInputElement && field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = 'Enter a valid email address.';
      } else if (field instanceof HTMLInputElement && field.type === 'url' && value) {
        try {
          const parsedUrl = new URL(value);
          if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname.includes('.')) {
            message = 'Enter a valid URL.';
          }
        } catch (error) {
          message = 'Enter a valid URL.';
        }
      } else if (field instanceof HTMLInputElement && /\b(card number)\b/.test(details) && value) {
        const digits = value.replace(/\D/g, '');
        if (!/^[0-9 ]+$/.test(value) || digits.length < 13 || digits.length > 19) {
          message = 'Enter a valid card number using 13 to 19 digits.';
        }
      } else if (field instanceof HTMLInputElement && /\b(expiry)\b/.test(label) && value) {
        const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
        if (!match) {
          message = 'Enter an expiry date in MM/YY format.';
        } else {
          const expiry = new Date(2000 + Number(match[2]), Number(match[1]), 1);
          const currentMonth = new Date();
          currentMonth.setDate(1);
          currentMonth.setHours(0, 0, 0, 0);
          if (expiry <= currentMonth) message = 'Card expiry date must be in the future.';
        }
      } else if (field instanceof HTMLInputElement && /\botp\b/.test(details) && value && !/^\d{6}$/.test(value)) {
        message = 'Enter the 6-digit verification code.';
      } else if (field instanceof HTMLInputElement && field.type === 'number' && value) {
        const isCaptcha = /\bcaptcha\b/i.test(details);
        if (!isCaptcha) {
          const num = Number(value);
          if (!Number.isFinite(num)) {
            message = 'Enter a valid number.';
          } else if (/\bbudget\b/i.test(details)) {
            if (num < 1000) message = 'Event budget must be at least ₹1,000.';
            else if (num > 10000000) message = 'Event budget cannot exceed ₹1,00,00,000.';
            else if (Math.abs(num * 100 - Math.round(num * 100)) > 0.000001) message = 'Event budget can have at most 2 decimal places.';
          } else if (/\b(ticket\s*price|price)\b/i.test(details) && !/\b(budget|taxes|fee)\b/i.test(details)) {
            if (num < 0) message = 'Ticket price cannot be negative.';
            else if (num > 100000) message = 'Ticket price cannot exceed ₹1,00,000.';
            else if (Math.abs(num * 100 - Math.round(num * 100)) > 0.000001) message = 'Ticket price can have at most 2 decimal places.';
          } else if (/\b(capacity|guests?)\b/i.test(details)) {
            if (!Number.isInteger(num)) message = 'Event capacity must be a whole number.';
            else if (num < 1) message = 'Event capacity must be at least 1 guest.';
            else if (num > 50000) message = 'Maximum event capacity is 50,000.';
          } else if (/\bquantity\b/i.test(details)) {
            if (!Number.isInteger(num)) message = 'Ticket quantity must be a whole number.';
            else if (num < 1) message = 'Ticket quantity must be at least 1.';
            else if (num > 50000) message = 'Ticket quantity cannot exceed available capacity.';
          } else if (/\b(years?\s+of\s+experience|experience)\b/i.test(details)) {
            if (!Number.isInteger(num)) message = 'Years of experience must be a whole number.';
            else if (num < 0) message = 'Years of experience must be 0 or more.';
            else if (num > 60) message = 'Years of experience cannot exceed 60.';
          } else if (/\bdiscount\b/i.test(details)) {
            if (num < 0) message = 'Discount cannot be negative.';
            else if (num > 100) message = 'Discount cannot exceed 100%.';
            else if (Math.abs(num * 100 - Math.round(num * 100)) > 0.000001) message = 'Discount can have at most 2 decimal places.';
          } else {
            const positiveCount = /\b(capacity|quantity|guests?)\b/.test(details);
            if (num < (positiveCount ? 1 : 0)) {
              message = positiveCount ? 'Enter a number greater than 0.' : 'Enter a non-negative number.';
            }
          }
        }
      }
      field.setCustomValidity(message);
    };

    if (!field.dataset.validationReady) {
      field.addEventListener('input', () => {
        validate();
      });
      field.addEventListener('change', validate);
      field.dataset.validationReady = 'true';
    }
    validate();
  }

  function initializeFormValidation() {
    const prepareTree = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('input, select, textarea')) prepareFormField(node);
      node.querySelectorAll('input, select, textarea').forEach(prepareFormField);
    };

    prepareTree(document.body);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(prepareTree));
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (!button) return;

      let fields;
      if (button.closest('#modal-foot')) {
        const handler = (button.getAttribute('onclick') || '').trim();
        if (button.textContent.trim().toLowerCase() === 'cancel' || /^(?:window\.)?closeModal\s*\(\s*\)\s*;?$/.test(handler)) return;
        fields = [...document.querySelectorAll('#modal-body input, #modal-body select, #modal-body textarea')];
      } else if (button.matches('[onclick*="doLogin"]')) {
        fields = [
          document.getElementById('l-email'),
          document.getElementById('l-pass'),
        ].filter(Boolean);
      } else {
        return;
      }

      fields.forEach(prepareFormField);
      const invalid = fields.find((field) => !field.checkValidity());
      if (invalid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        invalid.reportValidity();
      }
    }, true);

    document.addEventListener('submit', (event) => {
      const fields = [...event.target.querySelectorAll('input, select, textarea')];
      fields.forEach(prepareFormField);
      const invalid = fields.find((field) => !field.checkValidity());
      if (invalid) {
        event.preventDefault();
        invalid.reportValidity();
      }
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
      const id = event.target.id;
      if (!['l-email', 'l-pass'].includes(id)) return;

      const fields = [
        document.getElementById('l-email'),
        document.getElementById('l-pass'),
      ].filter(Boolean);
      fields.forEach(prepareFormField);
      const invalid = fields.find((field) => !field.checkValidity());
      if (invalid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        invalid.reportValidity();
      }
    }, true);
  }

  function initializePasswordToggles() {
    const prepareTree = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('input[type="password"]')) addPasswordToggle(node);
      node.querySelectorAll('input[type="password"]').forEach(addPasswordToggle);
    };
    prepareTree(document.body);

    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(prepareTree));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addThemeToggle();
      initializePasswordToggles();
      initializeFormValidation();
    }, { once: true });
  } else {
    addThemeToggle();
    initializePasswordToggles();
    initializeFormValidation();
  }
})();
