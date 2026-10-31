import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function attendeeRuntimeDefinitions() {
/* ATTENDEE_RUNTIME_START */    let attendeeRegistrationCatalog = [];
    function normalizeAttendeeRegistration(registration) {
      const event = registration.event ? normalizeAttendeeEvent(registration.event) : DB.events.find(e => String(e.id) === String(registration.eventId));
      const normalized = {
        id: registration.registrationId,
        registrationId: registration.registrationId,
        attendeeId: CU.id,
        eventId: event?.id || registration.eventId,
        date: registration.registrationDate,
        ticketId: registration.verificationId || '—',
        status: registration.status === 'registered' ? 'confirmed' : registration.status,
        payment: registration.payment?.status || (event?.price === 0 && registration.status === 'registered' ? 'free' : 'not_due'),
        refundStatus: registration.refund?.status || null,
        refundObj: registration.refund || null,
        refundAmount: registration.refund?.amount ?? 0,
        amount: registration.payment?.amount ?? (registration.status === 'pending_approval' ? 0 : event?.price ?? 0),
        checkedIn: registration.checkInStatus === 'checked-in' || registration.status === 'attended',
        seat: registration.ticketType || 'General Admission',
        verificationId: registration.verificationId || '',
        cancelledAt: registration.cancelledAt,
        reviewStatus: registration.reviewStatus,
        reservationExpiresAt: registration.reservationExpiresAt,
        rejectionReason: registration.rejectionReason || '',
        reviewedAt: registration.reviewedAt,
        declineViewedAt: registration.declineViewedAt,
      };
      const index = DB.registrations.findIndex(r => r.registrationId === registration.registrationId);
      if (index >= 0) DB.registrations[index] = normalized;
      else DB.registrations.push(normalized);
      return normalized;
    }

    function filterMyTickets(filterVal) {
      sessionStorage.setItem('ticket_filter', filterVal || 'all');
      renderPage('my-tickets');
    }
    window.filterMyTickets = filterMyTickets;
    function sortMyTickets(sortVal) {
      sessionStorage.setItem('ticket_sort', sortVal === 'earliest' ? 'earliest' : 'latest');
      renderPage('my-tickets');
    }
    window.sortMyTickets = sortMyTickets;

    function showTicketTab(tab) {
      sessionStorage.setItem('ticket_tab', tab === 'other' ? 'other' : 'upcoming');
      sessionStorage.setItem('ticket_filter', 'all');
      renderPage('my-tickets');
    }
    window.showTicketTab = showTicketTab;

    function pageMyTickets() {
      const regs = attendeeRegistrationCatalog.filter(r => r.status !== 'waitlisted');
      const activeTab = sessionStorage.getItem('ticket_tab') === 'other' ? 'other' : 'upcoming';
      const savedFilter = sessionStorage.getItem('ticket_filter') || 'all';
      const activeFilter = savedFilter === 'waitlisted' || (activeTab === 'upcoming' && !['all', 'registered', 'pending_approval', 'pending_payment', 'rejected'].includes(savedFilter)) ? 'all' : savedFilter;
      const activeSort = sessionStorage.getItem('ticket_sort') === 'earliest' ? 'earliest' : 'latest';

      function ticketEvent(registration) {
        return DB.events.find(ev => String(ev.id) === String(registration.eventId) || String(ev.eventId) === String(registration.eventId))
          || attendeeEventCatalog.find(ev => String(ev.id) === String(registration.eventId) || String(ev.eventId) === String(registration.eventId))
          || { title: 'Unknown', emoji: '🎟️', color: '#7c6ff7', venue: '', date: '', time: '' };
      }

      const now = new Date();
      function isUpcomingTicket(registration) {
        if (registration.status === 'rejected') return !registration.declineViewedAt;
        if (!['confirmed', 'registered', 'booked', 'pending_approval', 'pending_payment'].includes(registration.status) || registration.checkedIn) return false;
        const event = ticketEvent(registration);
        if (['cancelled', 'completed'].includes(event.status)) return false;
        const eventEnd = Date.parse(`${event.date}T23:59:59`);
        return !Number.isNaN(eventEnd) && eventEnd >= now.getTime();
      }

      const upcomingRegs = regs.filter(isUpcomingTicket);
      const otherRegs = regs.filter(r => !isUpcomingTicket(r));
      const tabRegs = activeTab === 'upcoming' ? upcomingRegs : otherRegs;
      const allCount = tabRegs.length;
      const registeredCount = tabRegs.filter(r => ['confirmed', 'registered', 'booked'].includes(r.status)).length;
      const pendingCount = tabRegs.filter(r => r.status === 'pending_payment').length;
      const approvalCount = tabRegs.filter(r => r.status === 'pending_approval').length;
      const refundCount = tabRegs.filter(r =>
        r.refundStatus === 'pending' ||
        r.refundStatus === 'completed' ||
        r.payment === 'refunded' ||
        (r.refundObj && r.refundObj.amount > 0) ||
        (r.status === 'cancelled' && (r.amount > 0 || r.refundStatus))
      ).length;
      const cancelledCount = tabRegs.filter(r => r.status === 'cancelled').length;
      const declinedTabCount = tabRegs.filter(r => r.status === 'rejected').length;
      const checkedInCount = tabRegs.filter(r => r.checkedIn || r.status === 'attended').length;

      let filtered = tabRegs;
      if (activeFilter === 'registered') {
        filtered = tabRegs.filter(r => ['confirmed', 'registered', 'booked'].includes(r.status));
      } else if (activeFilter === 'pending_approval') {
        filtered = tabRegs.filter(r => r.status === 'pending_approval');
      } else if (activeFilter === 'pending_payment') {
        filtered = tabRegs.filter(r => r.status === 'pending_payment');
      } else if (activeFilter === 'refund') {
        filtered = tabRegs.filter(r =>
          r.refundStatus === 'pending' ||
          r.refundStatus === 'completed' ||
          r.payment === 'refunded' ||
          (r.refundObj && r.refundObj.amount > 0) ||
          (r.status === 'cancelled' && (r.amount > 0 || r.refundStatus))
        );
      } else if (activeFilter === 'cancelled') {
        filtered = tabRegs.filter(r => r.status === 'cancelled');
      } else if (activeFilter === 'rejected') {
        filtered = tabRegs.filter(r => r.status === 'rejected');
      } else if (activeFilter === 'checked-in') {
        filtered = tabRegs.filter(r => r.checkedIn || r.status === 'attended');
      }

      filtered = [...filtered].sort((a, b) => {
        const aDate = Date.parse(ticketEvent(a).date);
        const bDate = Date.parse(ticketEvent(b).date);
        if (Number.isNaN(aDate)) return Number.isNaN(bDate) ? 0 : 1;
        if (Number.isNaN(bDate)) return -1;
        return activeSort === 'earliest' ? aDate - bDate : bDate - aDate;
      });

      let emptyLabel = 'tickets';
      if (activeFilter === 'registered') emptyLabel = 'registered or confirmed event tickets';
      else if (activeFilter === 'pending_approval') emptyLabel = 'registration requests awaiting organizer approval';
      else if (activeFilter === 'pending_payment') emptyLabel = 'tickets awaiting payment';
      else if (activeFilter === 'refund') emptyLabel = 'refund-required or refunded event tickets';
      else if (activeFilter === 'cancelled') emptyLabel = 'cancelled event tickets';
      else if (activeFilter === 'rejected') emptyLabel = 'declined registrations';
      else if (activeFilter === 'checked-in') emptyLabel = 'checked-in event tickets';

      return `
  <div class="page-hd" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div class="page-hd-left">
      <div class="page-title">My Tickets</div>
      <div class="page-sub">${filtered.length} of ${allCount} ${activeTab === 'upcoming' ? 'upcoming' : 'other'} ticket(s) shown</div>
    </div>
    <div class="page-hd-right" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <label for="ticket-sort" class="small" style="font-weight:600;color:var(--text2);white-space:nowrap">Event Date:</label>
      <select class="form-control filter-select" id="ticket-sort" onchange="sortMyTickets(this.value)" style="min-width:160px">
        <option value="latest" ${activeSort === 'latest' ? 'selected' : ''}>Latest first</option>
        <option value="earliest" ${activeSort === 'earliest' ? 'selected' : ''}>Earliest first</option>
      </select>
      <label for="ticket-filter" class="small" style="font-weight:600;color:var(--text2);white-space:nowrap">Filter Tickets:</label>
      <select class="form-control filter-select" id="ticket-filter" onchange="filterMyTickets(this.value)" style="min-width:240px">
        <option value="all" ${activeFilter === 'all' ? 'selected' : ''}>All Tickets (${allCount})</option>
        <option value="registered" ${activeFilter === 'registered' ? 'selected' : ''}>Registered / Confirmed (${registeredCount})</option>
        ${activeTab === 'upcoming'
          ? `<option value="pending_approval" ${activeFilter === 'pending_approval' ? 'selected' : ''}>Approval Pending (${approvalCount})</option><option value="pending_payment" ${activeFilter === 'pending_payment' ? 'selected' : ''}>Payment Pending (${pendingCount})</option>`
          : `<option value="checked-in" ${activeFilter === 'checked-in' ? 'selected' : ''}>Checked In / Attended (${checkedInCount})</option>
             <option value="cancelled" ${activeFilter === 'cancelled' ? 'selected' : ''}>Cancelled Tickets (${cancelledCount})</option>
             <option value="refund" ${activeFilter === 'refund' ? 'selected' : ''}>Refund Status (${refundCount})</option>`}
        <option value="rejected" ${activeFilter === 'rejected' ? 'selected' : ''}>Declined Registrations (${declinedTabCount})</option>
      </select>
    </div>
  </div>
  <div role="tablist" aria-label="Ticket groups" style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
    <button type="button" role="tab" aria-selected="${activeTab === 'upcoming'}" class="btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}" onclick="showTicketTab('upcoming')">Upcoming Tickets (${upcomingRegs.length})</button>
    <button type="button" role="tab" aria-selected="${activeTab === 'other'}" class="btn ${activeTab === 'other' ? 'btn-primary' : 'btn-ghost'}" onclick="showTicketTab('other')">Other Tickets (${otherRegs.length})</button>
  </div>
  <div id="my-tickets-container" style="display:flex;flex-direction:column;gap:16px">
    ${filtered.length > 0 ? filtered.map(r => ticketCard(r, ticketEvent(r), true)).join('') : `
      <div class="empty" style="padding:40px 20px">
        <div class="empty-icon">🎟️</div>
        <div class="empty-title">No ${activeFilter === 'all' ? activeTab === 'upcoming' ? 'upcoming tickets' : 'other tickets' : emptyLabel} found</div>
        <p class="empty-desc">${activeFilter === 'all' ? activeTab === 'upcoming' ? 'Browse events to book your next ticket.' : 'Attended, declined, cancelled, and past registrations will appear here.' : 'Try choosing a different filter.'}</p>
        ${activeTab === 'upcoming' && activeFilter === 'all' ? `<button class="btn btn-primary mt-16" onclick="goNav('browse-events')">Browse Events</button>` : ''}
      </div>
    `}
  </div>`;
    }

    function ticketCard(r, e, compact = false) {
      const isCancelled = r.status === 'cancelled';
      const isDeclined = r.status === 'rejected';
      const isInactive = isCancelled || isDeclined;
      const isRegistered = ['confirmed', 'registered', 'booked'].includes(r.status);
      const awaitingApproval = r.status === 'pending_approval' || (e.visibility !== 'public' && r.reviewStatus !== 'approved' && !r.checkedIn
        && (isRegistered || (e.visibility === 'private' && r.status === 'pending_payment')));
      const canPay = r.status === 'pending_payment' && (e.visibility !== 'private' || r.reviewStatus === 'approved');
      const registrationLabel = isDeclined ? 'Declined' : isCancelled ? 'Cancelled'
        : awaitingApproval ? 'Pending Organizer Approval' : isRegistered && e.visibility === 'public' ? 'Confirmed' : isRegistered && r.reviewStatus === 'approved' ? 'Organizer Approved'
          : r.status === 'pending_payment' ? 'Payment Pending' : r.status;
      const registrationColor = isInactive ? 'red' : awaitingApproval || r.status === 'pending_payment' ? 'yellow'
        : isRegistered || r.status === 'attended' ? 'green' : 'yellow';
      const approvalNotice = awaitingApproval
        ? `<div class="small mt-12" role="status" style="padding:10px 12px;border:1px solid var(--yellow);color:var(--yellow);border-radius:8px">${r.status === 'pending_approval' || (e.visibility === 'private' && r.status === 'pending_payment') ? 'Your registration request is awaiting organizer approval. No payment is required until approval.' : (r.payment === 'completed' || r.payment === 'paid' ? 'Your payment is confirmed. ' : '') + 'Your registration is awaiting organizer approval.'}</div>` : '';
      const declineNotice = isDeclined ? `<div style="margin-top:12px;padding:12px;background:var(--red-dim);border:1px solid var(--red);border-radius:8px"><strong style="color:var(--red)">Registration declined${r.reviewedAt ? ' on ' + new Date(r.reviewedAt).toLocaleDateString() : ''}</strong><div class="small mt-8" style="color:var(--text2)">Reason from organizer</div><p style="margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.6">${escapeHtml(r.rejectionReason || 'Please contact the organizer for more information.')}</p></div>` : '';
      const hasValidTicket = !isInactive && r.status === 'confirmed' && !!r.verificationId && (e.visibility !== 'private' || r.reviewStatus === 'approved');
      const qr = hasValidTicket
        ? renderTicketQRCode(r.verificationId)
        : isInactive
          ? `<div style="text-align:center;padding:12px 8px;border:1px dashed var(--red);border-radius:8px;background:var(--red-dim, rgba(239,68,68,0.08))"><div style="font-size:24px">🚫</div><div style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:0.5px">${isDeclined ? 'Declined' : 'Cancelled'}</div><div class="small" style="font-size:10px;color:var(--text3)">QR Disabled</div></div>`
            : `<span class="small">${awaitingApproval ? 'Ticket available after approval' : 'No valid ticket'}</span>`;

      const paymentLabel = r.status === 'pending_approval' ? 'No Payment Collected' : r.refundStatus === 'completed' || r.payment === 'refunded'
        ? '↩️ Demo Refund Completed'
        : r.refundStatus === 'pending'
          ? '⏳ Demo Refund Pending'
          : r.refundStatus === 'not_applicable'
            ? 'Policy Expired (No Refund)'
            : r.payment === 'free'
              ? 'Free Ticket'
              : r.payment === 'completed' || r.payment === 'paid'
                ? '✓ Demo Payment Confirmed'
                : r.status === 'pending_payment' || r.payment === 'pending'
                  ? 'Payment Pending'
                  : 'No Payment Due';

      let refundBadge = '';
      if (r.refundStatus === 'pending') {
        refundBadge = `<span class="badge badge-yellow">↩️ Simulated Refund: Pending (₹${r.refundObj?.amount ?? r.amount})</span>`;
      } else if (r.refundStatus === 'completed') {
        refundBadge = `<span class="badge badge-blue">↩️ Simulated Refund: Completed (₹${r.refundObj?.amount ?? r.amount})</span>`;
      } else if (isCancelled && r.refundStatus === 'not_applicable') {
        refundBadge = `<span class="badge badge-gray">No Refund (Policy Expired)</span>`;
      }

      if (compact) {
        return `<div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-left:4px solid ${isInactive ? 'var(--red)' : 'var(--accent)'};flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
            <span style="font-size:28px;flex-shrink:0">${e.emoji || '🎟️'}</span>
            <div style="min-width:0;flex:1">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px"><strong style="font-size:14px">${e.title}</strong><span class="badge badge-${registrationColor}">${registrationLabel}</span>${refundBadge}</div>
              <div class="small muted">📅 ${e.date || 'Date TBD'} · 📍 ${e.venue || 'Venue TBD'} · Ticket ${r.ticketId || '—'}</div>
              ${approvalNotice}
              ${declineNotice}
              ${isDeclined && !r.declineViewedAt ? '<div class="small mt-8" style="color:var(--text2)">View Details to move this ticket to Other Tickets.</div>' : ''}
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="openViewTicketModal('${r.registrationId || r.id}')">View Details</button>
          ${canPay ? `<button class="btn btn-primary btn-sm" onclick="completeDemoPayment('${r.registrationId || r.id}')">Pay ₹${Number(e.price || 0).toLocaleString('en-IN')}</button>` : ''}
        </div>`;
      }

      return `<div class="ticket" style="${isInactive ? 'opacity:0.85;border-color:var(--border);' : ''}">
    <div class="ticket-top">
      <div class="flex justify-between items-start">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:28px">${e.emoji || '🎟️'}</span>
            <span class="badge badge-${evStatBadge(e.status)}">${e.status}</span>
            <span class="badge badge-${registrationColor}">${registrationLabel}</span>
            ${r.status === 'pending_payment' && r.reviewStatus === 'approved' && e.visibility !== 'public' ? '<span class="badge badge-green">Organizer Approved</span>' : ''}
            ${(r.checkedIn || r.status === 'attended') ? '<span class="badge badge-green">✅ Checked In</span>' : ''}
            ${refundBadge}
          </div>
          <div style="font-family:var(--font-head);font-size:17px;font-weight:700;line-height:1.3;margin-bottom:8px">${e.title}</div>
          <div class="small" style="margin-bottom:2px">📅 ${e.date} · ${e.time}</div>
          <div class="small">📍 ${e.venue}</div>
        </div>
        <div class="qr-box ticket-qr" style="margin-left:16px">${qr}</div>
      </div>
    </div>
    <div class="ticket-divider"><div class="ticket-notch-l"></div><div class="ticket-notch-r"></div></div>
    <div class="ticket-bot">
      <div class="grid-2" style="gap:8px">
        <div><div class="label mb-4">Attendee</div><div style="font-weight:500;font-size:13.5px">${CU.name}</div></div>
        <div>
          <div class="label mb-4">Ticket ID</div>
          <div class="mono" style="${isInactive ? 'text-decoration:line-through;color:var(--text3);' : ''}">${r.ticketId || '—'}</div>
        </div>
        <div><div class="label mb-4">Seat / Zone</div><div style="font-weight:500;font-size:13.5px">${r.seat || 'GA'}</div></div>
        <div><div class="label mb-4">${['pending_approval', 'pending_payment'].includes(r.status) ? 'Ticket Price' : 'Amount Paid'}</div><div style="font-weight:700;font-size:15px;color:var(--green)">${['pending_approval', 'pending_payment'].includes(r.status) ? Number(e.price || 0) === 0 ? 'Free' : '₹' + Number(e.price).toLocaleString('en-IN') : r.amount === 0 ? 'Free' : '₹' + r.amount}</div></div>
      </div>
      <div class="flex justify-between items-center mt-12 flex-wrap gap-8">
        <span class="badge badge-${r.checkedIn || r.status === 'attended' ? 'green' : isInactive ? 'red' : 'purple'}">${r.checkedIn || r.status === 'attended' ? '✅ Checked In' : isInactive ? '🚫 Ticket Invalidated' : '⏳ Not Yet Checked In'}</span>
        <span class="badge badge-${r.payment === 'completed' || r.payment === 'paid' || r.payment === 'free' ? 'green' : r.refundStatus === 'pending' ? 'yellow' : 'gray'}">${paymentLabel}</span>
      </div>
      ${approvalNotice}
      ${declineNotice}
      ${canPay && r.reservationExpiresAt ? `<p class="small mt-12">Payment deadline: ${new Date(r.reservationExpiresAt).toLocaleString('en-IN')}</p>` : ''}
      ${canPay ? `<button class="btn btn-primary btn-sm mt-12" onclick="completeDemoPayment('${r.registrationId}')">Complete Demo Payment</button>` : ''}
      ${!r.checkedIn && !['attended', 'no-show', 'cancelled'].includes(r.status) && ['confirmed', 'pending_approval', 'pending_payment'].includes(r.status) ? `<button class="btn btn-danger btn-sm mt-12" onclick="cancelTicket('${r.registrationId || r.id}')">${r.status === 'pending_approval' ? 'Cancel Request' : 'Cancel Registration'}</button>` : ''}
      ${isCancelled ? `<div class="small mt-12" style="color:var(--text3);font-style:italic">❌ Registration cancelled${r.cancelledAt ? ' on ' + new Date(r.cancelledAt).toLocaleDateString() : ''}. Ticket QR and seat capacity are invalidated.</div>` : ''}
    </div>
  </div>`;
    }
    function completeDemoPayment(registrationId) {
      const registration = (attendeeRegistrationCatalog || []).find(r => r.registrationId === registrationId || String(r.id) === String(registrationId))
        || (DB.registrations || []).find(r => r.registrationId === registrationId || String(r.id) === String(registrationId));
      const event = registration && ((attendeeEventCatalog || []).find(e => String(e.id) === String(registration.eventId) || String(e.eventId) === String(registration.eventId)) || (DB.events || []).find(e => String(e.id) === String(registration.eventId)));
      if (!registration || !event) { toast('Registration details are unavailable.', 'error'); return; }
      openPaymentCheckoutModal(event, registration);
    }
    window.completeDemoPayment = completeDemoPayment;

    function makeQR() {
      const cells = Array.from({ length: 25 }, () => Math.random() > 0.5);
      return cells.map(on => `<div class="qr-cell${on ? ' on' : ''}"></div>`).join('');
    }
    async function openViewTicketModal(regId) {
      let r = (attendeeRegistrationCatalog || []).find(reg => String(reg.id) === String(regId) || String(reg.registrationId) === String(regId))
        || (DB.registrations || []).find(reg => String(reg.id) === String(regId) || String(reg.registrationId) === String(regId));
      if (!r || r.status === 'waitlisted') return;
      try {
        const latest = await apiGetRegistration(r.registrationId || r.id);
        Object.assign(r, normalizeAttendeeRegistration(latest));
        const index = attendeeRegistrationCatalog.findIndex(reg => String(reg.registrationId || reg.id) === String(r.registrationId));
        if (index >= 0) attendeeRegistrationCatalog[index] = r;
        else attendeeRegistrationCatalog.push(r);
      } catch (error) {
        toast('Unable to load the latest ticket details. Please try again.', 'error');
        return;
      }
      const e = (attendeeEventCatalog || []).find(ev => String(ev.id) === String(r.eventId) || String(ev.eventId) === String(r.eventId))
        || (DB.events || []).find(ev => String(ev.id) === String(r.eventId) || String(ev.eventId) === String(r.eventId))
        || { title: 'Event', emoji: '🎟️', venue: '', date: '', time: '' };
      openModal('Ticket Details', ticketCard(r, e), [], false);
      if (r.status === 'rejected' && !r.declineViewedAt) {
        try {
          const updated = await apiMarkDeclineViewed(r.registrationId || r.id);
          r.declineViewedAt = updated.declineViewedAt;
          const stored = DB.registrations.find(reg => String(reg.registrationId || reg.id) === String(r.registrationId || r.id));
          if (stored) stored.declineViewedAt = updated.declineViewedAt;
          saveDB();
          if (_currentPage === 'my-tickets') await renderPage('my-tickets');
        } catch (error) {
          toast('Unable to move this ticket to Other Tickets. Please open its details again to retry.', 'error');
        }
      }
    }
    window.openViewTicketModal = openViewTicketModal;

    // ════════════════════════════════════════════════
    //  ATTENDEE MANAGEMENT
    // ════════════════════════════════════════════════
/* ATTENDEE_RUNTIME_END */
}

export default function MyTicketsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
