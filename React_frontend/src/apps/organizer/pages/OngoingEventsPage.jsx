import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageOngoingEvents(embedded = false) {
      if (!['client', 'organizer'].includes(CU.role)) {
        const publicOngoing = DB.events.filter(event => event.status === 'ongoing');
        return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Ongoing Events</div><div class="page-sub">Events currently happening right now</div></div></div><div class="events-grid">${publicOngoing.length ? publicOngoing.map(event => evCard(event, 'attendee')).join('') : '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">⏱️</div><div class="empty-title">No ongoing events</div></div>'}</div>`;
      }
      const ongoing = getOngoingWorkflowItems();

      return `${embedded ? '' : `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Ongoing Events</div>
      <div class="page-sub">Track event planning, approved client events, payment, and completion reports</div>
    </div>
  </div>`}
  <div class="events-grid">${ongoing.length === 0 ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">⏱️</div><div class="empty-title">No ongoing events</div></div>` : ongoing.map(({ event, request, isPlanning }) => {
        const paid = request?.paymentStatus === 'fully_paid';
        const depositPaid = request?.paymentStatus === 'deposit_paid';
        const paymentLabel = paid ? 'Paid' : depositPaid ? 'Deposit Paid' : 'Unpaid';
        const paymentColor = paid ? 'var(--green)' : depositPaid ? 'var(--blue)' : 'var(--yellow)';

        const isUpcoming = !isPlanning && workflowEventPhase(event) === 'upcoming';
        const stage = isPlanning ? ({
          planning: 'Planning',
          plan_submitted: 'Awaiting Client Review',
          plan_revision_requested: 'Plan Revision Requested',
          proposal_sent: 'Awaiting Client Review',
          awaiting_client: 'Awaiting Payment',
          changes_requested: 'Changes Requested',
          counteroffer_received: 'Counteroffer Received'
        }[request?.status] || 'Planning') : isUpcoming ? 'Upcoming' : 'Ongoing';
        const stageBadgeCls = isPlanning || isUpcoming ? 'blue' : 'green';

        const title = isPlanning ? (request?.eventName || request?.title || 'Event Planning') : (event?.name || event?.title || 'Ongoing Event');
        const date = isPlanning ? (request?.eventDate || request?.date || 'TBD') : (event?.date || 'TBD');
        const time = isPlanning ? (request?.eventTime || request?.time || '') : (event?.time || '');
        const venue = isPlanning ? (request?.venue || request?.location || 'Venue TBD') : (event?.location || event?.venue || 'Venue TBD');
        const category = isPlanning ? (request?.category || request?.eventType || 'Corporate') : (event?.category || 'Event');

        const budgetAmount = isPlanning ? (request?.agreedPrice || request?.budget || (request?.proposals && request.proposals.length ? request.proposals[request.proposals.length - 1].totalPrice : 0)) : (event?.price != null && event.price > 0 ? event.price : (request?.agreedPrice || request?.budget || 0));
        const priceBadge = budgetAmount ? (typeof budgetAmount === 'number' ? '₹' + budgetAmount.toLocaleString() : workflowMoney(budgetAmount)) : 'Free';

        const capacity = isPlanning ? (request?.guestCount || request?.capacity || 0) : (event?.capacity || request?.guestCount || 0);
        const registered = isPlanning ? (request?.registered || request?.confirmedAttendees || 0) : (event?.registered || 0);
        const pct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
        const regText = capacity > 0 ? `${registered}/${capacity} registered` : (isPlanning ? 'Planning in progress' : 'Ongoing Event');

        const image = (!isPlanning && event?.image) || null;
        const emoji = (!isPlanning && event?.emoji) || (isPlanning ? '📋' : '⏱️');
        const color = (!isPlanning && event?.color) || 'var(--accent)';

        const bannerContent = image ? `
          <img src="${image}" alt="${workflowHtml(title)}" class="ev-banner-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="ev-banner-fallback" style="display:none;align-items:center;justify-content:center;font-size:52px;width:100%;height:100%">${emoji}</div>
          <div class="ev-banner-overlay"></div>
        ` : `<span style="font-size:52px">${emoji}</span>`;

        const details = isPlanning ? `viewWorkflowRequestDrawer('${workflowHtml(request?.id || request?.requestId)}')`
          : `viewWorkflowEventDetails('${workflowHtml(event?.eventId || event?.id)}')`;

        return `<div class="ev-card">
    <div class="ev-banner" style="background:${color}18">
      ${bannerContent}
      <div class="ev-banner-tag"><span class="badge badge-${stageBadgeCls}">${stage}</span></div>
      <div class="ev-banner-price">${priceBadge}</div>
    </div>
    <div class="ev-body">
      <div class="ev-title">${workflowHtml(title)}</div>
      <div class="ev-meta">
        <div class="ev-meta-row"><span>📅</span>${workflowHtml(date)}${time ? ` · ${workflowHtml(time)}` : ''}</div>
        <div class="ev-meta-row"><span>📍</span>${workflowHtml(venue)}</div>
        <div class="ev-meta-row"><span>🏷️</span>${workflowHtml(category)}</div>
        <div class="ev-meta-row"><span>💳</span>Payment: <strong style="color:${paymentColor}">${paymentLabel}</strong></div>
      </div>
      <div style="margin-bottom:12px">
        <div class="flex justify-between ev-cap mb-4"><span>${regText}</span><span>${capacity > 0 ? pct + '%' : ''}</span></div>
        <div class="prog"><div class="prog-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="ev-footer">
        <button class="btn btn-ghost btn-xs w-full" onclick="${details}" title="View event details">👁️ View Details</button>
      </div>
    </div>
  </div>`;
      }).join('')}</div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function OngoingEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
