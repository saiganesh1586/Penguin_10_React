const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Import backend validation rules and DTO validators
const {
  EVENTFLOW_NUMERIC_LIMITS,
  validateEventBudget,
  validateTicketPrice,
  validateCapacity,
  validateTicketQuantity,
  validateYearsOfExperience,
  validateDiscount,
  validatePinCode,
  validateIndianMobile,
} = require(path.join(__dirname, '../dist/common/validation-rules'));

const { CreateEventRequestDto } = require(path.join(__dirname, '../dist/modules/event-requests/dto/event-request.dto'));
const { CreateEventDto } = require(path.join(__dirname, '../dist/modules/events/dtos/event.dto'));
const { CreatePaymentDto } = require(path.join(__dirname, '../dist/modules/payments/dto/payment.dto'));
const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { DataStore } = require(path.join(__dirname, '../dist/common/data-store'));
const { PaymentsService } = require(path.join(__dirname, '../dist/modules/payments/payments.service'));
const { UserRole } = require(path.join(__dirname, '../dist/common/constants'));

test('Numeric Validation: Event Budget Limits (₹1,000 to ₹1,00,00,000)', () => {
  // Valid boundaries
  assert.equal(validateEventBudget(1000), null, 'Min budget 1,000 should be valid');
  assert.equal(validateEventBudget(10000000), null, 'Max budget 10,000,000 should be valid');
  assert.equal(validateEventBudget(50000.50), null, 'Valid 2-decimal budget should be valid');

  // Below minimum
  assert.equal(validateEventBudget(999), EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_MIN);
  assert.equal(validateEventBudget(0), EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_MIN);
  assert.equal(validateEventBudget(-500), EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_MIN);

  // Above maximum
  assert.equal(validateEventBudget(10000001), EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_MAX);
  assert.equal(validateEventBudget(50000000), EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_MAX);

  // Invalid precision (> 2 decimal places)
  assert.equal(validateEventBudget(1500.555), EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_DECIMAL);

  // Empty / Malformed
  assert.equal(validateEventBudget(''), EVENTFLOW_NUMERIC_LIMITS.BUDGET.ERROR_REQUIRED);
  assert.equal(validateEventBudget('abc'), 'Enter a valid numeric budget');
});

test('Numeric Validation: Ticket Price Limits (₹0 to ₹1,00,000)', () => {
  // Valid values
  assert.equal(validateTicketPrice(0), null, 'Free event (₹0) should be valid');
  assert.equal(validateTicketPrice(499.50), null, '₹499.50 should be valid');
  assert.equal(validateTicketPrice(100000), null, 'Max price ₹1,00,000 should be valid');

  // Below minimum (negative)
  assert.equal(validateTicketPrice(-1), EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_MIN);
  assert.equal(validateTicketPrice(-100), EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_MIN);

  // Above maximum
  assert.equal(validateTicketPrice(100001), EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_MAX);

  // Invalid precision
  assert.equal(validateTicketPrice(49.999), EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.ERROR_DECIMAL);

  // Optional empty value
  assert.equal(validateTicketPrice('', false), null);
  assert.equal(validateTicketPrice('invalid'), 'Enter a valid numeric ticket price');
});

test('Numeric Validation: Expected Guests & Event Capacity (1 to 50,000 integers)', () => {
  // Valid boundaries
  assert.equal(validateCapacity(1), null, 'Min capacity 1 should be valid');
  assert.equal(validateCapacity(500), null, 'Capacity 500 should be valid');
  assert.equal(validateCapacity(50000), null, 'Max capacity 50,000 should be valid');

  // Non-integers (decimals)
  assert.equal(validateCapacity(10.5), EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_INTEGER);

  // Below minimum / zero / negative
  assert.equal(validateCapacity(0), EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_MIN);
  assert.equal(validateCapacity(-5), EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_MIN);

  // Above maximum
  assert.equal(validateCapacity(50001), EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_MAX);

  // Empty / Malformed
  assert.equal(validateCapacity(''), EVENTFLOW_NUMERIC_LIMITS.CAPACITY.ERROR_REQUIRED);
  assert.equal(validateCapacity('ten'), 'Enter a valid numeric capacity');
});

test('Numeric Validation: Ticket Quantity Limits', () => {
  // Valid quantities
  assert.equal(validateTicketQuantity(1), null, 'Quantity 1 should be valid');
  assert.equal(validateTicketQuantity(5, 10), null, '5 within capacity 10 should be valid');

  // Non-integers
  assert.equal(validateTicketQuantity(2.5), EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_INTEGER);

  // Exceeding capacity
  assert.equal(validateTicketQuantity(15, 10), EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_MAX);

  // Negative / zero
  assert.equal(validateTicketQuantity(0), EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_MIN);
  assert.equal(validateTicketQuantity(-2), EVENTFLOW_NUMERIC_LIMITS.TICKET_QUANTITY.ERROR_MIN);
});

test('Numeric Validation: Years of Experience (0 to 60 integers)', () => {
  // Valid boundaries
  assert.equal(validateYearsOfExperience(0), null, '0 years (starting out) should be valid');
  assert.equal(validateYearsOfExperience(15), null, '15 years should be valid');
  assert.equal(validateYearsOfExperience(60), null, 'Max 60 years should be valid');

  // Non-integers
  assert.equal(validateYearsOfExperience(4.5), EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.ERROR_INTEGER);

  // Out of bounds
  assert.equal(validateYearsOfExperience(-1), EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.ERROR_MIN);
  assert.equal(validateYearsOfExperience(61), EVENTFLOW_NUMERIC_LIMITS.YEARS_EXPERIENCE.ERROR_MAX);
});

test('Numeric Validation: Discount Percentage (0 to 100%)', () => {
  // Valid
  assert.equal(validateDiscount(0), null);
  assert.equal(validateDiscount(25.5), null);
  assert.equal(validateDiscount(100), null);
  assert.equal(validateDiscount(''), null); // optional

  // Out of bounds
  assert.equal(validateDiscount(-5), EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.ERROR_MIN);
  assert.equal(validateDiscount(105), EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.ERROR_MAX);
  assert.equal(validateDiscount(15.999), EVENTFLOW_NUMERIC_LIMITS.DISCOUNT.ERROR_DECIMAL);
});

test('Numeric Validation: Indian PIN Code (exactly 6 digits)', () => {
  // Valid
  assert.equal(validatePinCode('560001'), null);
  assert.equal(validatePinCode('110001'), null);
  assert.equal(validatePinCode(400050), null);

  // Invalid length or characters
  assert.equal(validatePinCode('56000'), EVENTFLOW_NUMERIC_LIMITS.PIN_CODE.ERROR);
  assert.equal(validatePinCode('5600001'), EVENTFLOW_NUMERIC_LIMITS.PIN_CODE.ERROR);
  assert.equal(validatePinCode('56000A'), EVENTFLOW_NUMERIC_LIMITS.PIN_CODE.ERROR);
  assert.equal(validatePinCode(''), EVENTFLOW_NUMERIC_LIMITS.PIN_CODE.ERROR);
});

test('Numeric Validation: Indian Mobile Number (10 digits starting with 6-9)', () => {
  // Valid formats
  assert.equal(validateIndianMobile('9876543210'), null);
  assert.equal(validateIndianMobile('+91 9876543210'), null);
  assert.equal(validateIndianMobile('8123456789'), null);
  assert.equal(validateIndianMobile('7012345678'), null);
  assert.equal(validateIndianMobile('6234567890'), null);

  // Invalid formats (starts with 0-5, too short, too long)
  assert.equal(validateIndianMobile('5123456789'), EVENTFLOW_NUMERIC_LIMITS.MOBILE_NUMBER.ERROR);
  assert.equal(validateIndianMobile('12345'), EVENTFLOW_NUMERIC_LIMITS.MOBILE_NUMBER.ERROR);
  assert.equal(validateIndianMobile('987654321012'), EVENTFLOW_NUMERIC_LIMITS.MOBILE_NUMBER.ERROR);
  assert.equal(validateIndianMobile('abcd'), EVENTFLOW_NUMERIC_LIMITS.MOBILE_NUMBER.ERROR);
});

test('Backend DTO Validation: CreateEventRequestDto rejects out-of-bound inputs', async () => {
  // 1. Out-of-bounds budget (< 1000)
  const invalidBudgetDto = plainToInstance(CreateEventRequestDto, {
    clientId: 'cli-001',
    organizerId: 'org-001',
    eventName: 'Annual Gala',
    eventType: 'Corporate',
    eventDate: '2026-11-20',
    budget: 500, // < 1000
    capacity: 100,
    policyAccepted: true,
    acceptedPolicyVersion: '1.0',
  });
  const budgetErrors = await validate(invalidBudgetDto);
  assert.ok(budgetErrors.some(e => e.property === 'budget'), 'Budget < 1000 should be rejected by DTO');

  // 2. Budget > 10,000,000
  const highBudgetDto = plainToInstance(CreateEventRequestDto, {
    clientId: 'cli-001',
    organizerId: 'org-001',
    eventName: 'Annual Gala',
    eventType: 'Corporate',
    eventDate: '2026-11-20',
    budget: 15000000, // > 10,000,000
    capacity: 100,
    policyAccepted: true,
    acceptedPolicyVersion: '1.0',
  });
  const highBudgetErrors = await validate(highBudgetDto);
  assert.ok(highBudgetErrors.some(e => e.property === 'budget'), 'Budget > 10,000,000 should be rejected');

  // 3. Out-of-bounds capacity (> 50,000)
  const highCapDto = plainToInstance(CreateEventRequestDto, {
    clientId: 'cli-001',
    organizerId: 'org-001',
    eventName: 'Annual Gala',
    eventType: 'Corporate',
    eventDate: '2026-11-20',
    budget: 50000,
    capacity: 60000, // > 50,000
    policyAccepted: true,
    acceptedPolicyVersion: '1.0',
  });
  const capErrors = await validate(highCapDto);
  assert.ok(capErrors.some(e => e.property === 'capacity'), 'Capacity > 50,000 should be rejected');

  // 4. Ticket price > 100,000
  const highPriceDto = plainToInstance(CreateEventRequestDto, {
    clientId: 'cli-001',
    organizerId: 'org-001',
    eventName: 'Annual Gala',
    eventType: 'Corporate',
    eventDate: '2026-11-20',
    budget: 50000,
    capacity: 100,
    ticketPrice: 150000, // > 100,000
    policyAccepted: true,
    acceptedPolicyVersion: '1.0',
  });
  const priceErrors = await validate(highPriceDto);
  assert.ok(priceErrors.some(e => e.property === 'ticketPrice'), 'Ticket price > 100,000 should be rejected');
});

test('Financial Rules: Payments prevent tampering and duplicate processing', async () => {
  const ds = DataStore.getInstance();
  const paymentsService = new PaymentsService();

  // Create test event with ticket price ₹500
  const testEventId = ds.generateId('evt-test');
  const event = {
    eventId: testEventId,
    name: 'Validation Test Conference',
    category: 'Tech',
    date: '2026-12-01',
    time: '10:00 AM',
    location: 'Test Hall',
    capacity: 100,
    ticketPrice: 500,
    visibility: 'public',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  ds.events.push(event);

  // Create test registration
  const testRegId = ds.generateId('reg-test');
  const testAttendeeId = ds.generateId('att-test');
  const testUserId = ds.generateId('usr-test');
  ds.attendees.push({
    attendeeId: testAttendeeId,
    userId: testUserId,
    name: 'Test Attendee',
    email: 'attendee.test@example.com',
    createdAt: new Date(),
  });
  ds.registrations.push({
    registrationId: testRegId,
    eventId: testEventId,
    attendeeId: testAttendeeId,
    ticketType: 'General Admission',
    status: 'pending_payment',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 1. Client attempts to submit modified payment amount (tampered frontend request ₹100 instead of ₹500)
  const tamperedDto = plainToInstance(CreatePaymentDto, {
    registrationId: testRegId,
    amount: 100, // Stale/tampered client amount
    paymentMethod: 'DEMO_PROVIDER',
    paymentDate: '2026-12-01',
  });

  await assert.rejects(
    async () => {
      await paymentsService.create(tamperedDto, UserRole.ATTENDEE, testUserId);
    },
    /Payment amount does not match the ticket price/i,
    'Backend must reject payment amount that does not match persisted ticket price'
  );

  // 2. Correct payment succeeds
  const correctDto = plainToInstance(CreatePaymentDto, {
    registrationId: testRegId,
    amount: 500,
    paymentMethod: 'DEMO_PROVIDER',
    paymentDate: '2026-12-01',
  });
  const payResult = await paymentsService.create(correctDto, UserRole.ATTENDEE, testUserId);
  assert.equal(payResult.success, true);

  // 3. Duplicate payment attempt on the same registration is blocked
  await assert.rejects(
    async () => {
      await paymentsService.create(correctDto, UserRole.ATTENDEE, testUserId);
    },
    /Registration is not awaiting payment|already completed/i,
    'Backend must prevent duplicate payment processing'
  );

  // 4. Refund cannot exceed amount actually paid
  const testRefundId = ds.generateId('ref-test');
  ds.refunds.push({
    refundId: testRefundId,
    paymentId: payResult.data.paymentId,
    registrationId: testRegId,
    amount: 99999, // Exceeds paid amount ₹500
    status: 'pending',
    reason: 'Test refund exceeding payment',
    requestedAt: new Date(),
  });

  assert.throws(
    () => {
      paymentsService.processRefund(testRefundId, UserRole.SUPER_ADMIN);
    },
    /Invalid refund amount/i,
    'Refund exceeding payment amount must be rejected'
  );

  // 5. Refund with invalid precision (> 2 decimal places) must be rejected
  const testRefundPrecisionId = ds.generateId('ref-prec');
  ds.refunds.push({
    refundId: testRefundPrecisionId,
    paymentId: payResult.data.paymentId,
    registrationId: testRegId,
    amount: 250.123,
    status: 'pending',
    reason: 'Test refund invalid precision',
    requestedAt: new Date(),
  });

  assert.throws(
    () => {
      paymentsService.processRefund(testRefundPrecisionId, UserRole.SUPER_ADMIN);
    },
    /Invalid refund amount/i,
    'Refund with > 2 decimal places must be rejected'
  );

  // 6. Valid refund (up to 2 decimals, within payment amount) succeeds
  const testRefundValidId = ds.generateId('ref-valid');
  ds.refunds.push({
    refundId: testRefundValidId,
    paymentId: payResult.data.paymentId,
    registrationId: testRegId,
    amount: 250.50,
    status: 'pending',
    reason: 'Valid partial refund',
    requestedAt: new Date(),
  });

  const validRefundRes = paymentsService.processRefund(testRefundValidId, UserRole.SUPER_ADMIN);
  assert.equal(validRefundRes.success, true);
  assert.equal(validRefundRes.data.status, 'completed');

  // 7. Duplicate refund processing on already refunded payment must be rejected
  const testRefundDupId = ds.generateId('ref-dup');
  ds.refunds.push({
    refundId: testRefundDupId,
    paymentId: payResult.data.paymentId,
    registrationId: testRegId,
    amount: 200,
    status: 'pending',
    reason: 'Duplicate refund attempt',
    requestedAt: new Date(),
  });

  assert.throws(
    () => {
      paymentsService.processRefund(testRefundDupId, UserRole.SUPER_ADMIN);
    },
    /already been refunded|Completed payment not found for refund/i,
    'Duplicate refund on same payment must be blocked'
  );
});

