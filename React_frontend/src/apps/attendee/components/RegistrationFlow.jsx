function toggleRegTerms(checked) {
  const button =
    g('reg-proceed-btn') ||
    g('modal-foot')?.querySelector('.btn-primary, .btn-success, .btn-warning');
  if (button) {
    button.disabled = !checked;
    button.style.opacity = checked ? '1' : '0.5';
    button.style.cursor = checked ? 'pointer' : 'not-allowed';
  }
}
window.toggleRegTerms = toggleRegTerms;
function formatCardNumber(input) {
  const digits = input.value.replace(/\D/g, '').substring(0, 16);
  const parts = digits.match(/.{1,4}/g);
  input.value = parts ? parts.join(' ') : digits;
}
window.formatCardNumber = formatCardNumber;
function formatCardExp(input) {
  const digits = input.value.replace(/\D/g, '').substring(0, 4);
  if (digits.length >= 3) {
    input.value = digits.substring(0, 2) + '/' + digits.substring(2);
  } else {
    input.value = digits;
  }
}
window.formatCardExp = formatCardExp;
function switchCheckoutTab(tab) {
  const cardForm = g('checkout-card-form');
  const upiForm = g('checkout-upi-form');
  const cardBtn = g('tab-btn-card');
  const upiBtn = g('tab-btn-upi');
  if (tab === 'card') {
    if (cardForm) cardForm.style.display = 'block';
    if (upiForm) upiForm.style.display = 'none';
    if (cardBtn) cardBtn.className = 'btn btn-primary';
    if (upiBtn) upiBtn.className = 'btn btn-ghost';
    window._activeCheckoutTab = 'card';
  } else {
    if (cardForm) cardForm.style.display = 'none';
    if (upiForm) upiForm.style.display = 'block';
    if (cardBtn) cardBtn.className = 'btn btn-ghost';
    if (upiBtn) upiBtn.className = 'btn btn-primary';
    window._activeCheckoutTab = 'upi';
  }
}
window.switchCheckoutTab = switchCheckoutTab;
function applyUpiSuffix(suffix) {
  const input = g('pay-upi-id');
  if (!input) return;
  const base = input.value.split('@')[0].trim() || (CU.email ? CU.email.split('@')[0] : 'user');
  input.value = base + suffix;
  input.focus();
}
window.applyUpiSuffix = applyUpiSuffix;
function openEventPolicies(eventId) {
  const e =
    DB.events.find(event => String(event.id) === String(eventId)) ||
    (attendeeEventCatalog || []).find(
      event => String(event.id) === String(eventId) || String(event.eventId) === String(eventId)
    );
  if (!e) {
    toast('Event not found.', 'error');
    return;
  }
  const policiesHtml = `<div style="max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:18px;padding-bottom:12px">
        <section style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:18px"><div class="small muted">${escapeHtml(
          e.category || 'Event'
        )}</div><h2 style="margin:6px 0 8px">${escapeHtml(
    e.title || 'Event'
  )}</h2><div class="small muted">📅 ${escapeHtml(e.date || 'Date TBA')} · ${escapeHtml(
    e.time || 'Time TBA'
  )} · 📍 ${escapeHtml(e.venue || 'Venue TBA')}</div></section>
        <section style="border:1px solid var(--border);border-radius:12px;padding:18px"><h3>⏳ Cancellation Deadline</h3><p class="muted" style="line-height:1.7">${
          e.cancellationDeadline
            ? `${escapeHtml(e.cancellationDeadline)} (cutoff at 23:59:59 IST)`
            : 'No cancellation deadline is configured. Cancellation is available before the event starts.'
        }</p></section>
        <section style="border:1px solid var(--border);border-radius:12px;padding:18px"><h3>↩️ Refund Policy</h3><p class="muted" style="line-height:1.7">${
          e.price === 0
            ? 'This is a free registration. Cancelling releases your reserved seat; no monetary refund is due.'
            : `A full simulated refund is eligible for cancellations on or before ${escapeHtml(
                e.cancellationDeadline || 'the event date'
              )}. Cancellations after this deadline are non-refundable under the organizer policy.`
        }</p><p class="small muted">EventFlow payments are simulated demo transactions. No real currency is debited or returned.</p></section>
        <section style="border:1px solid var(--border);border-radius:12px;padding:18px"><h3>📢 Cancellation and Postponement</h3><p class="muted" style="line-height:1.7">If the organizer cancels, postpones, or reschedules this event, registered attendees will be notified by email and the platform dashboard. Any eligible simulated refunds will be initiated automatically.</p></section>
        <section style="border:1px solid var(--border);border-radius:12px;padding:18px"><h3>📌 Event Rules</h3><ul class="muted" style="line-height:1.8;padding-left:22px"><li>Present your valid digital ticket QR code at check-in.</li><li>Follow venue guidelines, safety instructions, and organizer directions.</li><li>Event schedules, speakers, or room assignments may change for operational reasons.</li>${
          e.description ? `<li>${escapeHtml(e.description)}</li>` : ''
        }</ul></section>
      </div>`;
  openModal('Event Policies & Rules', policiesHtml, [], true);
  const cancelButton = g('modal-foot')?.querySelector('.btn-ghost');
  if (cancelButton)
    cancelButton.onclick = () => {
      closeModal();
      if (typeof window.openEventReviewModal === 'function') window.openEventReviewModal(eventId);
      else if (typeof window.regForEvent === 'function') window.regForEvent(eventId);
    };
  const box = g('modal-box');
  const body = g('modal-body');
  box.style.maxHeight = '88vh';
  box.style.height = 'auto';
  box.style.overflow = 'auto';
  body.style.maxHeight = '70vh';
  body.style.overflowY = 'auto';
  body.style.overscrollBehavior = 'contain';
}
window.openEventPolicies = openEventPolicies;
function openTermsConditions(eventId = null) {
  openModal(
    'Terms and Conditions',
    `<div style="display:flex;flex-direction:column;gap:14px;font-size:13px;line-height:1.7;color:var(--text2)">
        <p><strong style="color:var(--text)">1. Admission and Identification</strong><br>Present a valid digital QR ticket at check-in. A matching photo ID may be requested.</p>
        <p><strong style="color:var(--text)">2. Non-Transferability</strong><br>Tickets are issued to the registered attendee and may not be transferred, duplicated, or resold.</p>
        <p><strong style="color:var(--text)">3. Code of Conduct</strong><br>Follow venue guidelines, safety instructions, and organizer protocols. Disruptive, illegal, or abusive conduct may result in removal without refund.</p>
        <p><strong style="color:var(--text)">4. Cancellation Compliance</strong><br>Submit cancellation requests through EventFlow before the event's stated deadline. Late cancellations may not qualify for a refund.</p>
        <p><strong style="color:var(--text)">5. Program Changes</strong><br>The organizer may adjust schedules, speakers, topics, or room assignments for operational reasons.</p>
        <p><strong style="color:var(--text)">6. Simulated Payment Notice</strong><br>Payments and refunds in EventFlow are simulated demo transactions. No real banking debits or currency exchanges occur.</p>
      </div>`,
    [],
    true
  );
  const cancelButton = g('modal-foot')?.querySelector('.btn-ghost');
  if (cancelButton)
    cancelButton.onclick = () => {
      closeModal();
      if (eventId && typeof window.openEventReviewModal === 'function')
        window.openEventReviewModal(eventId);
      else if (eventId && typeof window.regForEvent === 'function') window.regForEvent(eventId);
    };
}
window.openTermsConditions = openTermsConditions;
function regForEvent(eventId) {
  const e =
    DB.events.find(event => String(event.id) === String(eventId)) ||
    (attendeeEventCatalog || []).find(
      event => String(event.id) === String(eventId) || String(event.eventId) === String(eventId)
    );
  if (!e) {
    toast('Event not found.', 'error');
    return;
  }
  const existing =
    (attendeeRegistrationCatalog || []).find(
      r => r.status !== 'cancelled' && String(r.eventId) === String(eventId)
    ) ||
    (DB.registrations || []).find(
      registration =>
        registration.status !== 'cancelled' &&
        String(registration.attendeeId) === String(CU.id) &&
        String(registration.eventId) === String(eventId)
    );
  if (existing) {
    if (existing.status === 'waitlisted') {
      toast('Registration is unavailable for this event.', 'info');
      return;
    }
    toast('You already have an active registration for this event.', 'info');
    openViewTicketModal(existing.id || existing.registrationId);
    return;
  }

  // Revalidate event state
  if (e.status === 'cancelled') {
    toast('This event has been cancelled and is no longer accepting registrations.', 'error');
    return;
  }
  if (e.status === 'completed' || (e.date && new Date(`${e.date}T23:59:59`) < new Date())) {
    toast('This event has already concluded.', 'error');
    return;
  }
  if (e.status === 'full') {
    toast('Sorry, this event is full.', 'error');
    return;
  }
  const regThumb = e.image
    ? `
        <div style="width:52px;height:52px;border-radius:10px;overflow:hidden;flex-shrink:0;background:${
          e.color || 'var(--accent)'
        }20;position:relative">
          <img src="${e.image}" alt="${
        e.title || 'Event'
      }" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\'font-size:32px\'>${
        e.emoji || '📅'
      }</span>'">
        </div>
      `
    : `<span style="font-size:36px">${e.emoji || '📅'}</span>`;
  const isFull = e.status === 'full';
  const remainingSeats = Math.max(0, (e.capacity || 100) - (e.registered || 0));
  const reviewModalHtml = `
        <div style="display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto;padding-right:4px">
          <!-- Event Header Banner -->
          <div style="background:${e.color || 'var(--accent)'}14;border:1px solid ${
    e.color || 'var(--accent)'
  }30;border-radius:10px;padding:14px;display:flex;align-items:center;gap:14px">
            ${regThumb}
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">
                <span class="badge badge-purple">${escapeHtml(e.category || 'Event')}</span>
                <span class="badge badge-${evStatBadge(e.status)}">${e.status}</span>
                ${
                  e.price === 0
                    ? '<span class="badge badge-green">Free Admission</span>'
                    : `<span class="badge badge-blue">₹${e.price}</span>`
                }
              </div>
              <div style="font-weight:700;font-size:16px;line-height:1.3">${escapeHtml(
                e.title
              )}</div>
              <div class="small" style="color:var(--text2);margin-top:4px">📅 ${escapeHtml(
                e.date
              )} · ${escapeHtml(e.time || 'TBA')}</div>
              <div class="small" style="color:var(--text2)">📍 ${escapeHtml(e.venue)}${
    e.city ? ', ' + escapeHtml(e.city) : ''
  }</div>
            </div>
          </div>

          <!-- Event Details Grid -->
          <div style="border:1px solid var(--border);border-radius:8px;padding:10px 14px;background:var(--surface2)">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
              <div>
                <div class="label" style="font-size:11px;margin-bottom:2px">Attendee</div>
                <div style="font-weight:600">${escapeHtml(CU.name)}</div>
                <div class="small" style="color:var(--text3)">${escapeHtml(CU.email)}</div>
              </div>
              <div>
                <div class="label" style="font-size:11px;margin-bottom:2px">Availability & Capacity</div>
                <div style="font-weight:600;color:${isFull ? 'var(--yellow)' : 'var(--green)'}">
                  ${isFull ? 'Event Full' : `${remainingSeats} seats available`}
                </div>
                <div class="small" style="color:var(--text3)">Total capacity: ${
                  e.capacity || 100
                } attendees</div>
              </div>
            </div>
            ${
              e.description
                ? `
              <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
                <div class="label" style="font-size:11px;margin-bottom:2px">About This Event</div>
                <div style="font-size:12.5px;color:var(--text2);line-height:1.5">${escapeHtml(
                  e.description
                )}</div>
              </div>
            `
                : ''
            }
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button type="button" class="btn btn-ghost" onclick="openEventPolicies('${eventId}')">📋 Event Policies & Rules</button>
            <button type="button" class="btn btn-ghost" onclick="openTermsConditions()">📄 Terms and Conditions</button>
          </div>

          <!-- Required Agreement Checkbox -->
          <div style="background:var(--surface3);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;align-items:flex-start;gap:10px">
            <input type="checkbox" id="reg-terms-check" style="width:18px;height:18px;margin-top:2px;cursor:pointer;accent-color:var(--accent)" onchange="window.toggleRegTerms(this.checked)">
            <label for="reg-terms-check" style="font-size:13px;line-height:1.4;cursor:pointer;color:var(--text);font-weight:500">
              I have reviewed the event details and agree to the <strong>Terms & Conditions</strong>, <strong>Cancellation Policy</strong>, and <strong>Event Rules</strong>.
            </label>
          </div>
        </div>
      `;
  const proceedBtnLabel =
    e.visibility === 'private'
      ? 'Request Approval'
      : e.price === 0
      ? 'Confirm Free Registration'
      : 'Proceed to Payment';
  const proceedBtnClass = e.price === 0 ? 'btn-success' : 'btn-primary';
  openModal(
    `Review & Register — ${e.title}`,
    reviewModalHtml,
    [
      {
        lbl: proceedBtnLabel,
        cls: proceedBtnClass,
        fn: `proceedFromEventReview('${eventId}')`,
      },
    ],
    true
  );

  // Initially disable the proceed button until checkbox is checked
  setTimeout(() => {
    const proceedBtn = g('modal-foot')?.querySelector('.btn-primary, .btn-success, .btn-warning');
    if (proceedBtn) {
      proceedBtn.id = 'reg-proceed-btn';
      proceedBtn.disabled = true;
      proceedBtn.style.opacity = '0.5';
      proceedBtn.style.cursor = 'not-allowed';
    }
  }, 20);
}
window.regForEvent = regForEvent;
function proceedFromEventReview(eventId) {
  const termsAccepted = g('reg-terms-check')?.checked;
  if (!termsAccepted) {
    toast('Please accept the Terms & Conditions to proceed.', 'warning');
    return;
  }
  const e =
    DB.events.find(event => String(event.id) === String(eventId)) ||
    (attendeeEventCatalog || []).find(
      event => String(event.id) === String(eventId) || String(event.eventId) === String(eventId)
    );
  if (!e) {
    toast('Event not found.', 'error');
    return;
  }

  // Revalidate event availability, capacity, and registration eligibility
  if (e.status === 'cancelled') {
    toast('This event has been cancelled and is no longer accepting registrations.', 'error');
    closeModal();
    return;
  }
  if (e.status === 'completed' || (e.date && new Date(`${e.date}T23:59:59`) < new Date())) {
    toast('This event has already concluded.', 'error');
    closeModal();
    return;
  }
  if (e.status === 'full') {
    toast('This event is full.', 'error');
    closeModal();
    return;
  }
  const existing =
    (attendeeRegistrationCatalog || []).find(
      r => r.status !== 'cancelled' && String(r.eventId) === String(eventId)
    ) ||
    (DB.registrations || []).find(
      registration =>
        registration.status !== 'cancelled' &&
        String(registration.attendeeId) === String(CU.id) &&
        String(registration.eventId) === String(eventId)
    );
  if (existing) {
    toast('You already have an active registration for this event.', 'warning');
    closeModal();
    openViewTicketModal(existing.id || existing.registrationId);
    return;
  }
  const proceedBtn =
    g('reg-proceed-btn') ||
    g('modal-foot')?.querySelector('.btn-primary, .btn-success, .btn-warning');
  if (proceedBtn) {
    proceedBtn.disabled = true;
    proceedBtn.textContent =
      e.visibility === 'private'
        ? 'Sending Request…'
        : e.price > 0
        ? 'Reserving your place…'
        : 'Processing Registration…';
  }
  const attendeeId = CU.userId || CU.id;
  const backendEventIdPromise = e.eventId
    ? Promise.resolve(e.eventId)
    : apiGetEvents().then(events => {
        const match = (Array.isArray(events) ? events : []).find(
          item =>
            String(item.name || item.title || '')
              .trim()
              .toLowerCase() ===
            String(e.title || '')
              .trim()
              .toLowerCase()
        );
        if (!match)
          throw new ApiError(
            'This event is no longer available in the server catalog. Refresh events and try again.',
            404
          );
        return match.eventId || match.id;
      });
  backendEventIdPromise
    .then(id => {
      // Step 1: Call backend registration API
      return apiRegisterForEvent({
        attendeeId: String(attendeeId),
        eventId: String(id),
        ticketType: e.price === 0 ? 'free' : 'standard',
      });
    })
    .then(function (regData) {
      const registration = normalizeAttendeeRegistration(regData);
      if (registration.status === 'pending_approval') {
        closeModal();
        toast('Registration request sent for organizer approval.', 'success');
        goNav('my-tickets');
        return;
      }
      // Case A: Free Event — Skip payment after acceptance and validation
      if (registration.status === 'confirmed') {
        e.registered = Math.min((e.registered || 0) + 1, e.capacity);
        if (e.registered >= e.capacity) e.status = 'full';
        saveDB();
        closeModal();
        toast('🎉 Registration confirmed! Check your tickets.', 'success');
        goNav('my-tickets');
        return;
      }

      // Case C: Paid Event — Open checkout page with correct event ID and amount
      closeModal();
      openPaymentCheckoutModal(e, regData);
    })
    .catch(function (error) {
      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.textContent =
          e.visibility === 'private'
            ? 'Request Approval'
            : e.price > 0
            ? `Proceed to Payment (₹${e.price})`
            : 'Confirm Registration';
      }
      toast(
        error.message || 'Registration could not be completed.',
        error.status === 409 ? 'warning' : 'error'
      );
    });
}
window.proceedFromEventReview = proceedFromEventReview;
function openPaymentCheckoutModal(e, regData) {
  window._activeCheckoutTab = 'card';
  const checkoutHtml = `
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Order Summary Card -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <div>
                <div style="font-weight:700;font-size:15px">${escapeHtml(e.title)}</div>
                <div class="small" style="color:var(--text2);margin-top:2px">📅 ${escapeHtml(
                  e.date
                )} · 📍 ${escapeHtml(e.venue)}</div>
              </div>
              <span class="badge badge-yellow">Reservation Held</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--border);padding-top:10px;font-size:13px">
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">1x Standard Attendee Admission</span><span>₹${
                e.price
              }</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Processing Fee</span><span style="color:var(--green)">Free</span></div>
              <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;border-top:1px dashed var(--border);padding-top:8px;margin-top:2px">
                <span>Total Amount</span>
                <span style="color:var(--green)">₹${e.price}</span>
              </div>
            </div>
          </div>

          <!-- Payment Method Tabs -->
          <div>
            <label class="label" style="margin-bottom:8px">Select Payment Method</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
              <button type="button" class="btn btn-primary" id="tab-btn-card" onclick="window.switchCheckoutTab('card')" style="display:flex;align-items:center;justify-content:center;gap:6px">
                💳 Credit / Debit Card
              </button>
              <button type="button" class="btn btn-ghost" id="tab-btn-upi" onclick="window.switchCheckoutTab('upi')" style="display:flex;align-items:center;justify-content:center;gap:6px">
                📱 UPI ID
              </button>
            </div>

            <!-- Card Payment Form -->
            <div id="checkout-card-form">
              <div class="form-group mb-12">
                <label class="form-label">Cardholder Name</label>
                <input class="form-control" id="pay-card-name" value="${escapeHtml(
                  CU.name
                )}" placeholder="e.g. Priya Patel">
              </div>
              <div class="form-group mb-12">
                <label class="form-label">Card Number</label>
                <div class="input-group">
                  <span class="input-icon">💳</span>
                  <input class="form-control mono" id="pay-card-num" placeholder="4532 8901 2345 6789" maxlength="19" oninput="window.formatCardNumber(this)">
                </div>
              </div>
              <div class="grid-2" style="gap:10px">
                <div class="form-group">
                  <label class="form-label">Expiry Date</label>
                  <input class="form-control mono" id="pay-card-exp" placeholder="MM/YY" maxlength="5" oninput="window.formatCardExp(this)">
                </div>
                <div class="form-group">
                  <label class="form-label">CVV</label>
                  <input class="form-control mono" id="pay-card-cvv" type="password" placeholder="123" maxlength="4">
                </div>
              </div>
            </div>

            <!-- UPI Payment Form -->
            <div id="checkout-upi-form" style="display:none">
              <div class="form-group mb-12">
                <label class="form-label">Virtual Payment Address (UPI ID)</label>
                <div class="input-group">
                  <span class="input-icon">📱</span>
                  <input class="form-control mono" id="pay-upi-id" placeholder="yourname@bank (e.g. priya@okhdfcbank)">
                </div>
                <div class="small mt-4" style="color:var(--text3)">Enter your registered UPI ID to verify payment.</div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <span class="small" style="color:var(--text2)">Quick Suffix:</span>
                <button type="button" class="btn btn-ghost btn-xs" onclick="window.applyUpiSuffix('@okhdfcbank')">@okhdfcbank</button>
                <button type="button" class="btn btn-ghost btn-xs" onclick="window.applyUpiSuffix('@okicici')">@okicici</button>
                <button type="button" class="btn btn-ghost btn-xs" onclick="window.applyUpiSuffix('@oksbi')">@oksbi</button>
                <button type="button" class="btn btn-ghost btn-xs" onclick="window.applyUpiSuffix('@paytm')">@paytm</button>
              </div>
            </div>
          </div>

          <!-- Simulated Demo Notice -->
          <div style="background:var(--surface3);border-left:3px solid var(--accent);border-radius:6px;padding:10px 12px;font-size:12px;color:var(--text2)">
            🔒 <strong>Demo Environment Notice:</strong> Payments in EventFlow are simulated demonstration records. Field entries are validated for real-world format and simulated verification. No real bank debits will occur.
          </div>

          <div id="checkout-status-area" style="display:none;padding:10px;border-radius:6px;text-align:center;font-size:13px;font-weight:600"></div>
        </div>
      `;
  openModal(
    `Checkout — Pay ₹${e.price}`,
    checkoutHtml,
    [
      {
        lbl: `Pay ₹${e.price}`,
        cls: 'btn-success',
        fn: `executeCheckoutPayment('${e.id}', '${regData.registrationId}')`,
      },
    ],
    true
  );
}
window.openPaymentCheckoutModal = openPaymentCheckoutModal;
function executeCheckoutPayment(eventId, registrationId) {
  const e =
    DB.events.find(event => String(event.id) === String(eventId)) ||
    (attendeeEventCatalog || []).find(
      event => String(event.id) === String(eventId) || String(event.eventId) === String(eventId)
    );
  if (!e) {
    toast('Event details are unavailable.', 'error');
    return;
  }
  const tab = window._activeCheckoutTab || 'card';
  if (tab === 'card') {
    const name = (g('pay-card-name')?.value || '').trim();
    const num = (g('pay-card-num')?.value || '').replace(/\s+/g, '');
    const exp = (g('pay-card-exp')?.value || '').trim();
    const cvv = (g('pay-card-cvv')?.value || '').trim();
    if (name.length < 2) {
      toast('Please enter the cardholder name.', 'warning');
      g('pay-card-name')?.focus();
      return;
    }
    if (num.length !== 16 || !/^\d{16}$/.test(num)) {
      toast('Please enter a valid 16-digit card number.', 'warning');
      g('pay-card-num')?.focus();
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) {
      toast('Please enter a valid expiry date in MM/YY format.', 'warning');
      g('pay-card-exp')?.focus();
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      toast('Please enter a valid 3 or 4 digit CVV.', 'warning');
      g('pay-card-cvv')?.focus();
      return;
    }
  } else {
    const upiId = (g('pay-upi-id')?.value || '').trim();
    if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
      toast('Please enter a valid UPI ID (e.g. username@okhdfcbank).', 'warning');
      g('pay-upi-id')?.focus();
      return;
    }
  }
  const payBtn = g('modal-foot')?.querySelector('.btn-success');
  const statusArea = g('checkout-status-area');
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.textContent = 'Processing Payment…';
  }
  if (statusArea) {
    statusArea.style.display = 'block';
    statusArea.style.background = 'var(--surface2)';
    statusArea.style.color = 'var(--text)';
    statusArea.innerHTML = '⏳ Verifying with simulated banking gateway…';
  }
  apiMakePayment({
    registrationId,
    amount: e.price,
    paymentMethod: 'DEMO_PROVIDER',
    paymentDate: new Date().toISOString().split('T')[0],
  })
    .then(function (payment) {
      if (statusArea) {
        statusArea.style.background = 'var(--green-dim, rgba(34,197,94,0.15))';
        statusArea.style.color = 'var(--green)';
        statusArea.innerHTML = '✅ Payment verified! Confirming registration…';
      }
      const n = DB._nextId.regs++;
      const ticketId =
        payment.registration?.verificationId || `TKT-2026-${String(n).padStart(3, '0')}`;
      const seat =
        e.category === 'Conference'
          ? `A-${Math.floor(Math.random() * 200 + 1)
              .toString()
              .padStart(3, '0')}`
          : 'GA';
      const newReg = {
        id: n,
        registrationId,
        attendeeId: CU.id,
        eventId: e.id,
        date: today(),
        ticketId,
        status: 'confirmed',
        payment: 'completed',
        amount: e.price,
        checkedIn: false,
        seat,
        verificationId: payment.registration?.verificationId || ticketId,
        qrCode: payment.registration?.qrCode || null,
      };
      const existingIdx = DB.registrations.findIndex(
        registration => registration.registrationId === registrationId
      );
      if (existingIdx >= 0) DB.registrations[existingIdx] = newReg;
      else DB.registrations.push(newReg);
      const catIdx = (attendeeRegistrationCatalog || []).findIndex(
        r => r.registrationId === registrationId
      );
      if (catIdx >= 0)
        attendeeRegistrationCatalog[catIdx] = {
          ...attendeeRegistrationCatalog[catIdx],
          ...newReg,
        };
      else attendeeRegistrationCatalog.push(newReg);
      e.registered = Math.min((e.registered || 0) + 1, e.capacity);
      if (e.registered >= e.capacity) e.status = 'full';
      saveDB();
      setTimeout(() => {
        closeModal();
        toast('🎉 Payment verified! Registration confirmed.', 'success');
        goNav('my-tickets');
      }, 500);
    })
    .catch(function (error) {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = `Pay ₹${e.price}`;
      }
      if (statusArea) {
        statusArea.style.background = 'var(--red-dim, rgba(239,68,68,0.15))';
        statusArea.style.color = 'var(--red)';
        statusArea.innerHTML = `❌ Verification failed: ${error.message || 'Payment rejected'}`;
      }
      toast(error.message || 'Payment could not be completed.', 'error');
    });
}
window.executeCheckoutPayment = executeCheckoutPayment;
function cancelTicket(regId) {
  const r =
    (attendeeRegistrationCatalog || []).find(
      registration =>
        String(registration.id) === String(regId) ||
        String(registration.registrationId) === String(regId)
    ) ||
    (DB.registrations || []).find(
      registration =>
        String(registration.id) === String(regId) ||
        String(registration.registrationId) === String(regId)
    );
  if (!r) {
    toast('Registration record not found.', 'error');
    return;
  }

  // Prevent duplicate cancellation attempt if already cancelled
  if (r.status === 'cancelled') {
    toast('This ticket has already been cancelled.', 'warning');
    return;
  }
  if (r.checkedIn || r.status === 'attended') {
    toast('Cannot cancel an attended event.', 'error');
    return;
  }
  const e = (DB.events || []).find(
    event => String(event.id) === String(r.eventId) || String(event.eventId) === String(r.eventId)
  ) ||
    (attendeeEventCatalog || []).find(
      event => String(event.id) === String(r.eventId) || String(event.eventId) === String(r.eventId)
    ) || {
      title: 'Event',
      date: '—',
      venue: '—',
      price: 0,
      cancellationDeadline: null,
    };
  const isPaid =
    (r.payment === 'completed' || r.payment === 'paid' || r.paymentObj?.status === 'completed') &&
    r.amount > 0;
  const deadline = e.cancellationDeadline;
  let deadlinePassed = false;
  let deadlineStr = 'No cancellation deadline configured (Free cancellation prior to event)';
  if (deadline) {
    const deadlineDate = new Date(`${deadline}T23:59:59`);
    deadlinePassed = new Date() > deadlineDate;
    deadlineStr = `${deadline} ${
      deadlinePassed
        ? '<span class="badge badge-red badge-xs">Deadline Passed</span>'
        : '<span class="badge badge-green badge-xs">Active</span>'
    }`;
  }
  let refundEligibilityBadge = '';
  let refundEligibilityText = '';
  let estimatedRefundAmount = 0;
  let refundNotice = '';
  if (!isPaid && r.amount === 0) {
    refundEligibilityBadge = '<span class="badge badge-gray">Free Event Registration</span>';
    refundEligibilityText = 'This was a free event registration. No monetary charge was incurred.';
    estimatedRefundAmount = 0;
  } else if (isPaid) {
    if (!deadlinePassed) {
      estimatedRefundAmount = Number(r.amount || 0);
      refundEligibilityBadge =
        '<span class="badge badge-green">✓ Eligible for Simulated Refund</span>';
      refundEligibilityText = `Within the event's configured cancellation policy window. Eligible for full refund.`;
      refundNotice = `
            <div style="background:var(--surface3);border-left:3px solid var(--accent);padding:10px 14px;border-radius:6px;font-size:12.5px;color:var(--text)">
              <strong>ℹ️ Simulated Payment Notice:</strong> Payments in EventFlow are simulated demonstration transactions. On confirmation, a simulated refund of <strong>₹${estimatedRefundAmount}</strong> will be marked as pending. No real currency is debited or returned to any bank account.
            </div>`;
    } else {
      estimatedRefundAmount = 0;
      refundEligibilityBadge = '<span class="badge badge-red">✕ Ineligible (Policy Expired)</span>';
      refundEligibilityText = `The cancellation deadline (${deadline}) has passed. Per the event's policy, this registration is non-refundable.`;
      refundNotice = `
            <div style="background:var(--surface3);border-left:3px solid var(--yellow);padding:10px 14px;border-radius:6px;font-size:12.5px;color:var(--text)">
              <strong>⚠️ Policy Window Expired:</strong> In accordance with the organizer's configured policy, cancellations after ${deadline} are not eligible for a refund. Cancelling will release your reserved seat and invalidate your ticket without refund.
            </div>`;
    }
  } else {
    refundEligibilityBadge = '<span class="badge badge-yellow">Payment Not Finalized</span>';
    refundEligibilityText = 'No completed payment record exists for this registration.';
    estimatedRefundAmount = 0;
  }
  const modalHtml = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <!-- Event Header -->
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:8px">
            <span style="font-size:32px">${e.emoji || '🎟️'}</span>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:15px">${e.title}</div>
              <div class="small" style="color:var(--text2);margin-top:2px">📅 ${e.date || '—'}${
    e.time ? ' · ' + e.time : ''
  }${e.venue ? ' · 📍 ' + e.venue : ''}</div>
              <div class="small mt-2">Ticket ID: <code class="mono" style="background:var(--surface3);padding:1px 6px;border-radius:4px">${
                r.ticketId || '—'
              }</code></div>
            </div>
          </div>

          <!-- Policy & Eligibility Table -->
          <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
            <div style="display:grid;grid-template-columns:140px 1fr;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;align-items:center">
              <div style="color:var(--text2);font-weight:600">Cancellation Policy</div>
              <div>${deadlineStr}</div>
            </div>
            <div style="display:grid;grid-template-columns:140px 1fr;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;align-items:center">
              <div style="color:var(--text2);font-weight:600">Refund Eligibility</div>
              <div>
                ${refundEligibilityBadge}
                <div class="small mt-2" style="color:var(--text2)">${refundEligibilityText}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:140px 1fr;gap:10px;padding:10px 14px;font-size:13px;background:var(--surface2);align-items:center">
              <div style="color:var(--text2);font-weight:600">Est. Refund Amount</div>
              <div>
                <strong style="font-size:16px;color:${
                  estimatedRefundAmount > 0 ? 'var(--green)' : 'var(--text2)'
                }">
                  ${
                    estimatedRefundAmount > 0
                      ? `₹${estimatedRefundAmount} (Simulated)`
                      : '₹0 (No refund)'
                  }
                </strong>
              </div>
            </div>
          </div>

          <!-- Notice banner -->
          ${refundNotice}

          <div class="form-group" style="margin:0">
            <label class="form-label" for="cancel-reason">Reason for cancelling <span style="color:var(--red)">*</span></label>
            <select class="form-control" id="cancel-reason" required onchange="g('cancel-other-wrap').style.display=this.value==='Other'?'block':'none'">
              <option value="">Select a reason</option>
              <option value="Unable to attend">Unable to attend</option>
              <option value="Booked by mistake">Booked by mistake</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group" id="cancel-other-wrap" style="display:none;margin:0">
            <label class="form-label" for="cancel-other">Tell us a little more</label>
            <textarea class="form-control" id="cancel-other" rows="3" maxlength="500" placeholder="Share any details (optional)"></textarea>
          </div>

          <!-- Invalidation Warning -->
          <div style="font-size:12px;color:var(--text3);line-height:1.4">
            ⚠️ <strong>Ticket Invalidation:</strong> On confirmation, your registration will be cancelled, your ticket QR code will be permanently disabled, and capacity will be released. This action cannot be undone.
          </div>
        </div>
      `;
  openModal(
    'Cancel Ticket Confirmation',
    modalHtml,
    [
      {
        lbl: 'Confirm Cancellation',
        cls: 'btn-danger',
        fn: `confirmExecuteCancellation('${r.registrationId || r.id}')`,
      },
    ],
    true
  );
}
window.cancelTicket = cancelTicket;
function confirmExecuteCancellation(regId) {
  const r =
    (attendeeRegistrationCatalog || []).find(
      registration =>
        String(registration.id) === String(regId) ||
        String(registration.registrationId) === String(regId)
    ) ||
    (DB.registrations || []).find(
      registration =>
        String(registration.id) === String(regId) ||
        String(registration.registrationId) === String(regId)
    );
  if (!r) {
    toast('Registration record not found.', 'error');
    closeModal();
    return;
  }

  // Prevent duplicate cancellation attempt
  if (r.status === 'cancelled') {
    closeModal();
    toast('This ticket has already been cancelled.', 'warning');
    return;
  }
  const backendRegId = r.registrationId;
  if (!backendRegId) {
    toast('This registration record has no backend ID.', 'error');
    closeModal();
    return;
  }
  const e =
    (DB.events || []).find(
      event => String(event.id) === String(r.eventId) || String(event.eventId) === String(r.eventId)
    ) ||
    (attendeeEventCatalog || []).find(
      event => String(event.id) === String(r.eventId) || String(event.eventId) === String(r.eventId)
    );
  const reasonValue = g('cancel-reason')?.value || '';
  if (!reasonValue) {
    toast('Please select a cancellation reason.', 'warning');
    return;
  }
  const otherDetails = g('cancel-other')?.value?.trim();
  const cancellationReason =
    reasonValue === 'Other' && otherDetails ? `Other: ${otherDetails}` : reasonValue;
  const footBtn = g('modal-foot')?.querySelector('.btn-danger');
  if (footBtn) {
    footBtn.disabled = true;
    footBtn.textContent = 'Processing Cancellation…';
  }
  const heldSeat = ['confirmed', 'registered', 'pending_payment'].includes(r.status);
  apiCancelRegistration(backendRegId, cancellationReason)
    .then(function (res) {
      closeModal();
      const cancelledData = res.data || res;

      // Update registration in memory
      r.status = 'cancelled';
      r.cancelledAt = cancelledData.cancelledAt || new Date().toISOString();
      r.verificationId = '';
      if (cancelledData.refund) {
        r.refundStatus = cancelledData.refund.status;
        r.refundObj = cancelledData.refund;
        r.refundAmount = cancelledData.refund.amount;
      } else {
        r.refundStatus = 'not_applicable';
      }

      // Update in catalog
      const catItem = (attendeeRegistrationCatalog || []).find(
        item =>
          String(item.id) === String(regId) || String(item.registrationId) === String(backendRegId)
      );
      if (catItem) {
        catItem.status = 'cancelled';
        catItem.cancelledAt = r.cancelledAt;
        catItem.verificationId = '';
        catItem.refundStatus = r.refundStatus;
        catItem.refundObj = r.refundObj;
        catItem.refundAmount = r.refundAmount;
      }

      // Release capacity
      if (heldSeat && e && e.registered > 0) {
        e.registered = Math.max(0, e.registered - 1);
        if (e.status === 'full') e.status = 'upcoming';
      }

      // Track Recent Activity / Notifications
      const hasPendingRefund =
        cancelledData.refund &&
        cancelledData.refund.status === 'pending' &&
        cancelledData.refund.amount > 0;
      if (!DB.notifications) DB.notifications = [];
      DB.notifications.unshift({
        id: DB._nextId ? DB._nextId.notifs++ : Date.now(),
        title: hasPendingRefund
          ? 'Ticket Cancelled (Simulated Refund Pending)'
          : 'Ticket Cancelled',
        msg: hasPendingRefund
          ? `Cancelled registration for "${e?.title || 'Event'}". A simulated refund of ₹${
              cancelledData.refund.amount
            } has been initiated.`
          : `Cancelled registration for "${e?.title || 'Event'}".`,
        time: 'Just now',
        read: false,
        type: hasPendingRefund ? 'info' : 'warning',
        icon: '✕',
      });
      saveDB();
      renderPage(_currentPage);
      if (hasPendingRefund) {
        toast(
          `Ticket cancelled. Simulated refund of ₹${cancelledData.refund.amount} is pending.`,
          'success'
        );
      } else {
        toast('Ticket cancelled successfully.', 'info');
      }
    })
    .catch(function (error) {
      if (footBtn) {
        footBtn.disabled = false;
        footBtn.textContent = 'Confirm Cancellation';
      }
      if (error.status === 409) {
        closeModal();
        toast(
          error.message || 'This registration has changed. Reloading its latest status.',
          'warning'
        );
        renderPage(_currentPage);
      } else if (error.status === 400) {
        closeModal();
        toast(error.message || 'Cannot cancel an attended event.', 'error');
      } else {
        toast(error.message || 'Cancellation failed. Please try again.', 'error');
      }
    });
}
window.confirmExecuteCancellation = confirmExecuteCancellation;

// ════════════════════════════════════════════════
//  MY TICKETS
// ════════════════════════════════════════════════
