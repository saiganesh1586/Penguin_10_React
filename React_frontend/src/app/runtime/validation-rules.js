/**
 * EventFlow Central Validation Rules & Numeric Limits (Frontend)
 *
 * Configurable platform-wide defaults and validation helpers for:
 * - Event budget (₹1,000–₹1,00,00,000)
 * - Ticket price (₹0–₹1,00,000; 0 for free events; max 2 decimal places)
 * - Expected guests and event capacity (1–50,000 integer)
 * - Ticket quantity (1–50,000 integer, capped at available capacity)
 * - Years of experience (0–60 integer)
 * - Discount (0–100%)
 * - Indian PIN code (exactly 6 digits)
 * - Indian mobile number (valid 10-digit mobile number starting with 6-9)
 */

export const EVENTFLOW_NUMERIC_LIMITS = {
  BUDGET: {
    MIN: 1000,
    MAX: 10000000,
    LABEL: 'Event budget',
    ERROR_REQUIRED: 'Event budget is required',
    ERROR_MIN: 'Event budget must be at least ₹1,000',
    ERROR_MAX: 'Event budget cannot exceed ₹1,00,00,000',
    ERROR_DECIMAL: 'Event budget can have at most 2 decimal places',
  },
  TICKET_PRICE: {
    MIN: 0,
    MAX: 100000,
    LABEL: 'Ticket price',
    ERROR_REQUIRED: 'Ticket price is required',
    ERROR_MIN: 'Ticket price cannot be negative',
    ERROR_MAX: 'Ticket price cannot exceed ₹1,00,000',
    ERROR_DECIMAL: 'Ticket price can have at most 2 decimal places',
  },
  CAPACITY: {
    MIN: 1,
    MAX: 50000,
    LABEL: 'Event capacity',
    ERROR_REQUIRED: 'Event capacity is required',
    ERROR_MIN: 'Event capacity must be at least 1 guest',
    ERROR_MAX: 'Maximum event capacity is 50,000',
    ERROR_INTEGER: 'Event capacity must be a whole number',
  },
  TICKET_QUANTITY: {
    MIN: 1,
    MAX: 50000,
    LABEL: 'Ticket quantity',
    ERROR_REQUIRED: 'Ticket quantity is required',
    ERROR_MIN: 'Ticket quantity must be at least 1',
    ERROR_MAX: 'Ticket quantity cannot exceed available capacity',
    ERROR_INTEGER: 'Ticket quantity must be a whole number',
  },
  YEARS_EXPERIENCE: {
    MIN: 0,
    MAX: 60,
    LABEL: 'Years of experience',
    ERROR_REQUIRED: 'Years of experience is required',
    ERROR_MIN: 'Years of experience must be 0 or more',
    ERROR_MAX: 'Years of experience cannot exceed 60',
    ERROR_INTEGER: 'Years of experience must be a whole number',
  },
  DISCOUNT: {
    MIN: 0,
    MAX: 100,
    LABEL: 'Discount',
    ERROR_MIN: 'Discount cannot be negative',
    ERROR_MAX: 'Discount cannot exceed 100%',
    ERROR_DECIMAL: 'Discount can have at most 2 decimal places',
  },
  PIN_CODE: {
    REGEX: /^\d{6}$/,
    LENGTH: 6,
    ERROR: 'Enter a valid 6-digit Indian PIN code',
  },
  MOBILE_NUMBER: {
    REGEX: /^[6-9]\d{9}$/,
    LENGTH: 10,
    ERROR: 'Enter a valid 10-digit Indian mobile number',
  },
};

/**
 * Validate Event Budget
 * @param {unknown} value Number or numeric string
 * @param {boolean} required Whether budget is mandatory
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validateEventBudget(value, required = true) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return required ? EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_REQUIRED : null;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter a valid numeric budget';
  if (num < EVENTFLOW_NUMERIC_LIMITS.BUDGET.MIN) return EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_MIN;
  if (num > EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX) return EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_MAX;
  if (Math.abs(num * 100 - Math.round(num * 100)) > 0.000001)
    return EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_DECIMAL;
  return null;
}

/**
 * Validate Ticket Price
 * @param {unknown} value Number or numeric string
 * @param {boolean} required Whether ticket price is mandatory
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validateTicketPrice(value, required = false) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return required ? EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_REQUIRED : null;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter a valid numeric ticket price';
  if (num < EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.MIN)
    return EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_MIN;
  if (num > EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.MAX)
    return EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_MAX;
  if (Math.abs(num * 100 - Math.round(num * 100)) > 0.000001)
    return EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_DECIMAL;
  return null;
}

/**
 * Validate Capacity / Expected Guests
 * @param {unknown} value Number or numeric string
 * @param {boolean} required Whether capacity is mandatory
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validateCapacity(value, required = true) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return required ? EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_REQUIRED : null;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter a valid numeric capacity';
  if (!Number.isInteger(num)) return EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_INTEGER;
  if (num < EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MIN)
    return EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_MIN;
  if (num > EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MAX)
    return EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_MAX;
  return null;
}

/**
 * Validate Ticket Quantity
 * @param {unknown} value Number or numeric string
 * @param {number} [availableCapacity] Optional current available seats limit
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validateTicketQuantity(value, availableCapacity) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_REQUIRED;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter a valid ticket quantity';
  if (!Number.isInteger(num)) return EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_INTEGER;
  if (num < EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.MIN)
    return EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_MIN;
  const max =
    typeof availableCapacity === 'number' && availableCapacity > 0
      ? Math.min(availableCapacity, EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.MAX)
      : EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.MAX;
  if (num > max) return EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_MAX;
  return null;
}

/**
 * Validate Years of Experience
 * @param {unknown} value Number or numeric string
 * @param {boolean} required Whether years of experience is mandatory
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validateYearsOfExperience(value, required = true) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return required ? EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.ERROR_REQUIRED : null;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter a valid number for years of experience';
  if (!Number.isInteger(num)) return EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.ERROR_INTEGER;
  if (num < EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.MIN)
    return EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.ERROR_MIN;
  if (num > EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.MAX)
    return EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.ERROR_MAX;
  return null;
}

/**
 * Validate Discount Percentage
 * @param {unknown} value Number or numeric string
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validateDiscount(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter a valid numeric discount';
  if (num < EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.MIN)
    return EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.ERROR_MIN;
  if (num > EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.MAX)
    return EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.ERROR_MAX;
  if (Math.abs(num * 100 - Math.round(num * 100)) > 0.000001)
    return EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.ERROR_DECIMAL;
  return null;
}

/**
 * Validate Indian PIN Code
 * @param {unknown} value String PIN code
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validatePinCode(value) {
  if (typeof value !== 'string' && typeof value !== 'number')
    return EVENTFLOW_NUMERIC_LIMITS.PIN_CODE.ERROR;
  const str = String(value).trim();
  if (!EVENTFLOW_NUMERIC_LIMITS.PIN_CODE.REGEX.test(str)) {
    return EVENTFLOW_NUMERIC_LIMITS.PIN_CODE.ERROR;
  }
  return null;
}

/**
 * Validate Indian Mobile Number
 * @param {unknown} value String mobile number
 * @returns {string|null} Error message string if invalid, or null if valid
 */
export function validateIndianMobile(value) {
  if (typeof value !== 'string' && typeof value !== 'number')
    return EVENTFLOW_NUMERIC_LIMITS.MOBILE_NUMBER.ERROR;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return null;
  }
  if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
    return null;
  }
  return EVENTFLOW_NUMERIC_LIMITS.MOBILE_NUMBER.ERROR;
}

// Global browser attachment for legacy runtimes and test runners
if (typeof window !== 'undefined') {
  window.EventFlowValidation = {
    EVENTFLOW_NUMERIC_LIMITS,
    validateEventBudget,
    validateTicketPrice,
    validateCapacity,
    validateTicketQuantity,
    validateYearsOfExperience,
    validateDiscount,
    validatePinCode,
    validateIndianMobile,
  };
}
if (typeof globalThis !== 'undefined') {
  globalThis.EventFlowValidation = {
    EVENTFLOW_NUMERIC_LIMITS,
    validateEventBudget,
    validateTicketPrice,
    validateCapacity,
    validateTicketQuantity,
    validateYearsOfExperience,
    validateDiscount,
    validatePinCode,
    validateIndianMobile,
  };
}
