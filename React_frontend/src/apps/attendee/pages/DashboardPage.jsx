import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function attendeeRuntimeDefinitions() {
/* ATTENDEE_RUNTIME_START */    function dashAttendee() {
      const now = new Date();
      function esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
      }

      // Use authenticated attendee's actual records
      const allMyRegs = (attendeeRegistrationCatalog && attendeeRegistrationCatalog.length > 0)
        ? attendeeRegistrationCatalog
        : (DB.registrations || []).filter(r => String(r.attendeeId) === String(CU.id));
      const myRegs = allMyRegs.filter(r => r.status !== 'waitlisted');

      const allEvents = (attendeeEventCatalog && attendeeEventCatalog.length > 0)
        ? attendeeEventCatalog
        : (DB.events || []);

      function findEvent(eventId) {
        return allEvents.find(e => String(e.id) === String(eventId) || String(e.eventId) === String(eventId))
          || (DB.events || []).find(e => String(e.id) === String(eventId) || String(e.eventId) === String(eventId))
          || { id: eventId, title: 'Event', emoji: '🎟️', date: '', time: '', venue: '', price: 0, status: 'upcoming', category: 'General' };
      }

      // ─── 1. SUMMARY METRICS ───────────────────────────────────────────
      // Confirmed Registrations: confirmed / registered status
      const confirmedRegs = myRegs.filter(r => r.status === 'confirmed' || r.status === 'registered');

      // Awaiting Action: only actionable unresolved items (not expired)
      const awaitingActionRegs = myRegs.filter(r => {
        if (r.status === 'pending_payment') {
          return !r.reservationExpiresAt || new Date(r.reservationExpiresAt) > now;
        }
        return false;
      });

      // Events Attended: verified attendance
      const attendedRegs = myRegs.filter(r => r.checkedIn || r.status === 'attended');

      // Net Spent: successful payments minus completed refunds
      let totalPaid = 0;
      let totalRefunded = 0;
      myRegs.forEach(r => {
        const isPaid = r.payment === 'completed' || r.payment === 'paid' || r.paymentObj?.status === 'completed';
        if (isPaid) {
          totalPaid += Number(r.paymentObj?.amount ?? r.amount ?? 0);
        }
        const isRefunded = r.refundStatus === 'completed' || r.payment === 'refunded' || r.refundObj?.status === 'completed';
        if (isRefunded) {
          totalRefunded += Number(r.refundObj?.amount ?? r.amount ?? 0);
        }
      });
      const netSpent = Math.max(0, totalPaid - totalRefunded);

      // ─── 2. RECOMMENDED FOR YOU (Directly below summary cards) ────────
      const activeOrPendingEventIds = new Set(
        allMyRegs.filter(r => r.status !== 'cancelled').map(r => String(r.eventId))
      );

      const recommended = allEvents
        .filter(e => {
          const st = (e.status || '').toLowerCase();
          if (st === 'completed' || st === 'cancelled') return false;
          if (e.date && new Date(`${e.date}T23:59:59`) < now) return false;
          if (activeOrPendingEventIds.has(String(e.id)) || activeOrPendingEventIds.has(String(e.eventId))) return false;
          return true;
        })
        .sort((a, b) => {
          const aRemaining = a.remainingCapacity !== undefined ? a.remainingCapacity : ((a.capacity || 100) - (a.registered || 0));
          const bRemaining = b.remainingCapacity !== undefined ? b.remainingCapacity : ((b.capacity || 100) - (b.registered || 0));
          const aHasCap = aRemaining > 0 && a.status !== 'full';
          const bHasCap = bRemaining > 0 && b.status !== 'full';
          if (aHasCap && !bHasCap) return -1;
          if (!aHasCap && bHasCap) return 1;
          return new Date(a.date || 0) - new Date(b.date || 0);
        })
        .slice(0, 4);

      // ─── 3. UPCOMING EVENTS (Confirmed future registrations only) ─────
      const upcomingRegs = myRegs.filter(r => {
        if (!['confirmed', 'registered'].includes(r.status)) return false;
        if (r.checkedIn || r.status === 'attended') return false;
        const e = findEvent(r.eventId);
        return e.date && new Date(`${e.date}T23:59:59`) >= now;
      });

      function canCancelReg(r, e) {
        if (r.checkedIn || ['attended', 'cancelled', 'no-show'].includes(r.status)) return false;
        return true;
      }

      // ─── 4. NEEDS ATTENTION (Only unresolved items) ─────────────────
      const needsAttentionRegs = awaitingActionRegs;

      // ─── BUILD HTML ──────────────────────────────────────────────────
      return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">My Dashboard</div><div class="page-sub">Welcome back, ${esc(CU.name || 'Attendee')}! Here are your event highlights.</div></div>
    <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('browse-events')">🔍 Browse Events</button></div>
  </div>

  <!-- Summary Cards -->
  <div class="grid-4 mb-20">
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">🎟️</div>
      <div class="stat-value" style="color:var(--green)">${confirmedRegs.length}</div>
      <div class="stat-label">Confirmed Registrations</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>
      <div class="stat-value" style="color:var(--yellow)">${awaitingActionRegs.length}</div>
      <div class="stat-label">Awaiting Action</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--blue-dim,rgba(66,153,225,.12));color:var(--blue,#4299e1)">✅</div>
      <div class="stat-value" style="color:var(--blue,#4299e1)">${attendedRegs.length}</div>
      <div class="stat-label">Events Attended</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">💰</div>
      <div class="stat-value" style="color:var(--yellow)">₹${netSpent.toLocaleString('en-IN')}</div>
      <div class="stat-label">Net Spent</div>
    </div>
  </div>

  <!-- Recommended For You (Directly below summary cards) -->
  <div class="h4 mb-16">✨ Recommended For You</div>
  <div class="events-grid">
    ${recommended.length
      ? recommended.map(e => evCard(e, 'attendee')).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">✨</div><div class="empty-title">No recommendations right now</div><p class="empty-desc">You are up to date on all available events.</p></div>`
    }
  </div>

  <!-- Upcoming Events (Confirmed future registrations) -->
  <div class="h4 mb-16 mt-24">📅 Upcoming Events</div>
  ${upcomingRegs.length > 0 ? `
  <div style="display:flex;flex-direction:column;gap:12px">
    ${upcomingRegs.map(r => {
      const e = findEvent(r.eventId);
      const allowCancel = canCancelReg(r, e);
      return `<div class="card p-0" style="display:flex;justify-content:space-between;align-items:center;padding:16px;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
          <span style="font-size:32px;flex-shrink:0">${esc(e.emoji || '🎟️')}</span>
          <div style="min-width:0">
            <div style="font-weight:700;font-size:15px;margin-bottom:3px">${esc(e.title)}</div>
            <div class="small" style="color:var(--text2)">📅 ${esc(e.date)}${e.time ? ' · ' + esc(e.time) : ''}${e.venue ? ' · 📍 ' + esc(e.venue) : ''}</div>
            <div class="small mt-4"><span class="badge badge-green">${esc(r.ticketId || 'Confirmed')}</span></div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;align-items:center">
          <button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('${e.id}', '${r.id || r.registrationId}')">👁️ View Details</button>
          <button class="btn btn-primary btn-xs" onclick="openViewTicketModal('${r.id || r.registrationId}')">🎫 View Ticket</button>
        </div>
      </div>`;
    }).join('')}
  </div>` : `
  <div class="empty">
    <div class="empty-icon">🎟️</div>
    <div class="empty-title">No upcoming events</div>
    <div class="empty-desc">Browse and register for events to see them here.</div>
    <button class="btn btn-primary mt-16" onclick="goNav('browse-events')">Browse Events</button>
  </div>`}

  <!-- Needs Attention (Only unresolved items) -->
  ${needsAttentionRegs.length > 0 ? `
  <div class="h4 mb-12 mt-24">⚠️ Needs Attention</div>
  <div class="card p-0">
    ${needsAttentionRegs.map(r => {
      const e = findEvent(r.eventId);
      const expiry = r.reservationExpiresAt;
      const expiryStr = expiry ? ` · Expires: ${new Date(expiry).toLocaleDateString()} ${new Date(expiry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : '';
      const desc = `Payment required to confirm your reservation.${expiryStr}`;
      const actionBtn = `<button class="btn btn-primary btn-xs" onclick="completeDemoPayment('${r.registrationId || r.id}')">💳 Pay Now</button>`;
      return `<div class="flex items-center justify-between" style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:600">${esc(e.title)}</div>
          <div class="small" style="color:var(--yellow)">${desc}</div>
        </div>
        <div class="flex gap-8">
          ${actionBtn}
          <button class="btn btn-ghost btn-xs" onclick="goNav('my-tickets')">Review →</button>
        </div>
      </div>`;
    }).join('')}
  </div>` : ''}

`;
    }
    window.dashAttendee = dashAttendee;

    // ════════════════════════════════════════════════
    //  ADMIN SUBPAGE 1: USER REPORTS (BAR GRAPHS)
    // ════════════════════════════════════════════════
/* ATTENDEE_RUNTIME_END */
}

export default function DashboardPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
