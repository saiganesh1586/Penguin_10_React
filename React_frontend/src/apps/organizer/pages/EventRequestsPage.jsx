import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageEventRequests() {
      // Normalize all requests
      DB.eventRequests.forEach(normalizeEventRequest);

      const filterTab = sessionStorage.getItem('org_reqs_tab') || 'all';
      const search = (sessionStorage.getItem('org_reqs_search') || '').toLowerCase().trim();

      // Show requests relevant to this organizer (or all for superuser)
      const myReqs = DB.eventRequests.filter(r => {
        if (CU.role === 'superuser') return true;
        return String(r.organizer) === String(CU.id) || String(r.organizerId) === String(CU.id) || String(r.organizerUserId) === String(CU.id) || !r.organizer;
      });

      // 5 functional status groups per specification:
      // 1. All Requests: All requests
      // 2. Action Required: Submitted/pending requests, proposals awaiting client response, and counteroffers/requested changes requiring action
      const actionRequiredStatuses = ['submitted', 'pending', 'proposal_sent', 'awaiting_client', 'changes_requested', 'counteroffer_received', 'planning', 'plan_submitted', 'plan_revision_requested'];
      // 3. Under Review: Requests currently being reviewed by the organizer
      const underReviewStatuses = ['under_review', 'in_review', 'info_requested'];
      // 4. Confirmed Bookings: Successfully confirmed bookings only
      const confirmedStatuses = ['confirmed', 'approved'];
      // 5. Closed Requests: Withdrawn, cancelled, rejected, and expired requests
      const closedStatuses = ['withdrawn', 'cancelled', 'rejected', 'expired', 'completed'];

      const allCount = myReqs.length;
      const actionRequiredCount = myReqs.filter(r => actionRequiredStatuses.includes(r.status)).length;
      const underReviewCount = myReqs.filter(r => underReviewStatuses.includes(r.status)).length;
      const confirmedCount = myReqs.filter(r => confirmedStatuses.includes(r.status)).length;
      const closedCount = myReqs.filter(r => closedStatuses.includes(r.status)).length;

      const actionableLegacyCount = myReqs.filter(r => ['submitted', 'pending', 'changes_requested', 'counteroffer_received', 'planning', 'plan_submitted', 'plan_revision_requested'].includes(r.status)).length;
      const needsReviewLegacyCount = myReqs.filter(r => ['submitted', 'pending', 'under_review', 'info_requested'].includes(r.status)).length;
      const proposalsLegacyCount = myReqs.filter(r => ['proposal_sent', 'awaiting_client'].includes(r.status)).length;

      let filtered = myReqs.filter(r => {
        if (filterTab === 'action_required' || filterTab === 'actionable' || filterTab === 'needs_review' || filterTab === 'proposals') {
          return actionRequiredStatuses.includes(r.status);
        }
        if (filterTab === 'under_review') {
          return underReviewStatuses.includes(r.status);
        }
        if (filterTab === 'confirmed') {
          return confirmedStatuses.includes(r.status);
        }
        if (filterTab === 'closed') {
          return closedStatuses.includes(r.status);
        }
        return true;
      });

      const reqStatusFilter = sessionStorage.getItem('org_reqs_status');
      const reqTypeFilter = sessionStorage.getItem('org_reqs_type');
      const reqPaymentFilter = sessionStorage.getItem('org_reqs_payment');
      const reqDateFrom = sessionStorage.getItem('org_reqs_date_from');
      const reqDateTo = sessionStorage.getItem('org_reqs_date_to');

      if (reqStatusFilter) {
        filtered = filtered.filter(r => r.status === reqStatusFilter);
      }
      if (reqTypeFilter) {
        filtered = filtered.filter(r => (r.type || r.eventType) === reqTypeFilter);
      }
      if (reqPaymentFilter) {
        filtered = filtered.filter(r => r.paymentStatus === reqPaymentFilter);
      }
      if (reqDateFrom) {
        filtered = filtered.filter(r => (r.date || r.eventDate) >= reqDateFrom);
      }
      if (reqDateTo) {
        filtered = filtered.filter(r => (r.date || r.eventDate) <= reqDateTo);
      }

      if (search) {
        filtered = filtered.filter(r => {
          const cl = (DB.users && DB.users.find(u => String(u.id) === String(r.clientId))) || {};
          const clientDetails = r.clientDetails || {};
          return (r.title && r.title.toLowerCase().includes(search)) ||
                 (r.type && r.type.toLowerCase().includes(search)) ||
                 (r.eventType && r.eventType.toLowerCase().includes(search)) ||
                 (cl.name && cl.name.toLowerCase().includes(search)) ||
                 (cl.email && cl.email.toLowerCase().includes(search)) ||
                 (clientDetails.name && clientDetails.name.toLowerCase().includes(search)) ||
                 (clientDetails.email && clientDetails.email.toLowerCase().includes(search)) ||
                 (clientDetails.companyName && clientDetails.companyName.toLowerCase().includes(search));
        });
      }

      const getReqTime = (req) => {
        const u = req.updatedAt ? new Date(req.updatedAt).getTime() : 0;
        const c = req.createdAt ? new Date(req.createdAt).getTime() : 0;
        const cr = req.created ? new Date(req.created).getTime() : 0;
        let p = 0;
        if (Array.isArray(req.proposals) && req.proposals.length > 0) {
          const lastP = req.proposals[req.proposals.length - 1];
          p = lastP?.sentAt ? new Date(lastP.sentAt).getTime() : 0;
        }
        return Math.max(u, c, cr, p);
      };

      filtered.sort((a, b) => {
        const diff = getReqTime(b) - getReqTime(a);
        if (diff !== 0) return diff;
        return String(b.id || b.requestId || '').localeCompare(String(a.id || a.requestId || ''));
      });

      return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Event Requests</div>
      <div class="page-sub">Review incoming requests and track negotiation, event plans, and client approval.</div>
    </div>
    <div class="page-hd-right" style="display:flex;gap:10px;align-items:center">
      <div class="input-group" style="width:240px">
        <span class="input-icon">🔍</span>
        <input class="form-control" placeholder="Search requests..." value="${escapeHtml(search)}" oninput="sessionStorage.setItem('org_reqs_search', this.value);renderPage('event-requests')">
      </div>
    </div>
  </div>

  <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;align-items:center;justify-content:space-between">
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="sessionStorage.setItem('org_reqs_tab','all');renderPage('event-requests')" class="btn btn-sm ${filterTab === 'all' || !filterTab ? 'btn-primary' : 'btn-ghost'}">All Requests (${allCount})</button>
      <button onclick="sessionStorage.setItem('org_reqs_tab','action_required');renderPage('event-requests')" class="btn btn-sm ${filterTab === 'action_required' || filterTab === 'actionable' ? 'btn-primary' : 'btn-ghost'}">Action Required (${actionRequiredCount})</button>
      <button onclick="sessionStorage.setItem('org_reqs_tab','under_review');renderPage('event-requests')" class="btn btn-sm ${filterTab === 'under_review' ? 'btn-primary' : 'btn-ghost'}">Under Review (${underReviewCount})</button>
      <button onclick="sessionStorage.setItem('org_reqs_tab','confirmed');renderPage('event-requests')" class="btn btn-sm ${filterTab === 'confirmed' ? 'btn-primary' : 'btn-ghost'}">Confirmed Bookings (${confirmedCount})</button>
      <button onclick="sessionStorage.setItem('org_reqs_tab','closed');renderPage('event-requests')" class="btn btn-sm ${filterTab === 'closed' ? 'btn-primary' : 'btn-ghost'}">Closed Requests (${closedCount})</button>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <label for="org-filter-dropdown" style="font-size:12px;font-weight:600;color:var(--text3)">Filter by Status:</label>
      <select id="org-filter-dropdown" class="form-control" style="width:auto;height:32px;padding:4px 8px;font-size:12.5px" onchange="sessionStorage.setItem('org_reqs_tab', this.value);renderPage('event-requests')">
        <option value="all" ${filterTab === 'all' || !filterTab ? 'selected' : ''}>All Requests (${allCount})</option>
        <option value="action_required" ${filterTab === 'action_required' || filterTab === 'actionable' ? 'selected' : ''}>Action Required (${actionRequiredCount})</option>
        <option value="under_review" ${filterTab === 'under_review' ? 'selected' : ''}>Under Review (${underReviewCount})</option>
        <option value="confirmed" ${filterTab === 'confirmed' ? 'selected' : ''}>Confirmed Bookings (${confirmedCount})</option>
        <option value="closed" ${filterTab === 'closed' ? 'selected' : ''}>Closed Requests (${closedCount})</option>
      </select>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:13px;color:var(--text3)">
    <span>Showing ${filtered.length} of ${myReqs.length} requests</span>
    <span style="display:none">Actionable (${actionableLegacyCount}) Needs Review (${needsReviewLegacyCount}) Proposals & Client (${proposalsLegacyCount}) DEMO DATA</span>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Event Details</th>
          <th>Requested Date</th>
          <th>Budget</th>
          <th>Lifecycle Status</th>
          <th>Agreement</th>
          <th>Deposit / Payment</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text3)">No event requests match the selected view.</td></tr>` : ''}
        ${filtered.map(r => {
          const cl = (DB.users && DB.users.find(u => String(u.id) === String(r.clientId))) || (DB.users && DB.users.find(u => u.role === 'client')) || r.clientDetails || { name: 'Michael Torres', avatar: 'MT', avatarImage: '/assets/images/avatars/user-michael-torres.jpg' };
          const clientAv = cl.avatarImage ? `
            <div class="av av-xs">
              <img src="${cl.avatarImage}" alt="${cl.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
              <span style="display:none">${cl.avatar || cl.name?.[0] || 'C'}</span>
            </div>
          ` : `<div class="av av-xs">${cl.avatar || cl.name?.[0] || 'C'}</div>`;

          const ag = agreementBadgeInfo(r.agreementStatus);
          const pay = paymentBadgeInfo(r.paymentStatus);
          const stBadge = typeof reqBadgeColor === 'function' ? reqBadgeColor(r.status) : 'gray';

          return `<tr>
            <td>
              <div class="flex items-center gap-8">
                ${clientAv}
                <div>
                  <div style="font-weight:600;font-size:13.5px">${escapeHtml(cl.name || 'Client')}</div>
                  <div class="small text-muted">${escapeHtml(cl.company || cl.companyName || cl.email || '')}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-weight:700;font-size:14px;color:var(--text)">${escapeHtml(r.title || r.eventName || 'Event')}${r.demoScenario ? ' <span class="badge badge-warning" style="font-size:10px">DEMO DATA</span>' : ''}</div>
              <div class="small text-muted">${escapeHtml(r.type || r.eventType || 'Corporate')} &middot; ${r.guests || r.capacity || 100} guests</div>
            </td>
            <td>
              <div style="font-weight:600;font-size:13px;margin-bottom:3px">${escapeHtml(r.date || r.eventDate || '')}</div>
            </td>
            <td>
              <span style="color:var(--green);font-weight:700;font-size:14px">₹${(Number(r.budget) || 0).toLocaleString()}</span>
            </td>
            <td>
              <span class="badge badge-${stBadge}" style="text-transform:capitalize">${escapeHtml((r.status || 'submitted').replace(/_/g, ' '))}</span>
            </td>
            <td>
              <span class="badge badge-${ag.cls}">${escapeHtml(ag.lbl)}</span>
            </td>
            <td>
              <span class="badge badge-${pay.cls}">${escapeHtml(pay.lbl)}</span>
            </td>
            <td>
              ${renderOrganizerRowActions(r)}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function EventRequestsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
