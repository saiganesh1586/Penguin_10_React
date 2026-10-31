import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function renderWorkflowRequestDetails(id) {
      const r = DB.eventRequests.find(request => String(request.id) === String(id));
      const el = g('page-content');
      if (!r || !el) {
        if (el) el.innerHTML = '<div class="empty"><div class="empty-title">Request not found</div><button class="btn btn-primary mt-16" onclick="goNav(\'request-status\')">Back to requests</button></div>';
        return;
      }
      const plan = (DB.eventPlans || []).find(item => item.eventPlanId === r.activeEventPlanId)
        || (DB.eventPlans || []).filter(item => item.requestId === r.requestId).sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];
      const organizerRole = CU.role === 'organizer';
      const timeline = [
        ['Request sent', true],
        ['Organizer review', !['submitted', 'pending'].includes(r.status)],
        ['Budget and date agreed', ['planning', 'plan_submitted', 'plan_revision_requested', 'confirmed'].includes(r.status)],
        ['Event plan submitted', ['plan_submitted', 'plan_revision_requested', 'confirmed'].includes(r.status)],
        ['Plan approved', ['confirmed', 'approved', 'completed'].includes(r.status)],
        ['Ongoing event', ['confirmed', 'approved', 'completed'].includes(r.status)],
        ['Event completed', r.status === 'completed'],
      ];
      const currentChange = [...(r.negotiations || [])].reverse().find(item => item.action === 'changes_requested');
      const pendingCounteroffer = [...(r.negotiations || [])].reverse().find(item => item.action === 'counteroffer');
      const plans = (DB.eventPlans || []).filter(item => item.requestId === r.requestId).sort((a, b) => (a.revision || 0) - (b.revision || 0));
      const organizerActions = ['submitted', 'pending', 'under_review', 'info_requested'].includes(r.status)
        ? `<div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-success w-full" onclick="acceptWorkflowRequest('${r.id}')">Accept</button><button class="btn btn-danger w-full" onclick="openWorkflowRejectModal('${r.id}')">Reject</button></div>`
        : r.status === 'counteroffer_received'
        ? `<div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-success w-full" onclick="acceptWorkflowCounteroffer('${r.id}')">Accept Counteroffer</button><button class="btn btn-danger w-full" onclick="openWorkflowRejectModal('${r.id}')">Reject / Propose Changes</button></div>`
        : ['planning', 'plan_revision_requested'].includes(r.status)
        ? `<button class="btn btn-primary w-full" style="margin-top:16px" onclick="openWorkflowPlanModal('${r.id}')">${r.status === 'plan_revision_requested' ? 'Edit and Resubmit Plan' : 'Create Event Plan'}</button>`
        : '';
      const clientActions = r.status === 'changes_requested'
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-success" onclick="respondToWorkflowChanges('${r.id}','accept_changes')">Accept Changes</button><button class="btn btn-danger" onclick="respondToWorkflowChanges('${r.id}','reject_changes')">Reject Changes</button><button class="btn btn-primary" onclick="openWorkflowCounterofferModal('${r.id}')">Send Counteroffer</button></div>`
        : r.status === 'plan_submitted' && plan?.approvalStatus === 'pending'
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-success" onclick="reviewWorkflowPlan('${plan.eventPlanId}','approved','${r.id}')">Accept Plan</button><button class="btn btn-primary" onclick="openWorkflowPlanRevisionModal('${plan.eventPlanId}','${r.id}')">Request New Plan</button></div>`
        : '';
      const negotiationHtml = (r.negotiations || []).map(item => `<div style="padding:10px;border-left:3px solid var(--accent);background:var(--surface2);border-radius:6px;margin-top:8px"><strong>${workflowHtml(String(item.action || '').replaceAll('_', ' '))}</strong><div style="font-size:12px;color:var(--text2);margin-top:4px">${workflowHtml(item.reason)}${item.budget ? ` · Budget ₹${Number(item.budget).toLocaleString()}` : ''}${item.eventDate ? ` · Date ${workflowHtml(item.eventDate)}` : ''}</div></div>`).join('');
      const planHtml = plan ? `<div style="margin-top:12px;padding:14px;background:var(--surface2);border-radius:10px">
        <div style="display:flex;justify-content:space-between;gap:8px"><strong>${workflowHtml(plan.title)} · Revision ${plan.revision || 1}</strong><span class="badge badge-${plan.approvalStatus === 'approved' ? 'green' : plan.approvalStatus === 'revision_requested' ? 'yellow' : 'blue'}">${workflowHtml(String(plan.approvalStatus || 'pending').replaceAll('_', ' '))}</span></div>
        <p style="font-size:13px;color:var(--text2);line-height:1.6">${workflowHtml(plan.description)}</p>
        <div class="info-row"><span class="info-label">Budget</span><span class="info-value">₹${Number(plan.budget || 0).toLocaleString()}</span></div>
        <div style="margin-top:12px;padding:14px;border:1px solid var(--border);border-radius:8px">
          <strong>Event plan document</strong>
          ${plan.documentFileName ? `<div style="margin-top:6px;color:var(--text2)">${workflowHtml(plan.documentName || 'Event plan PDF')}</div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="openEventPlanPdf('${plan.eventPlanId}','${encodeURIComponent(plan.documentName || 'event-plan.pdf')}',true)">View PDF</button><button class="btn btn-primary btn-sm" onclick="openEventPlanPdf('${plan.eventPlanId}','${encodeURIComponent(plan.documentName || 'event-plan.pdf')}',false)">Download PDF</button></div>` : '<p style="font-size:13px;color:var(--text3)">No PDF was attached to this plan.</p>'}
        </div>
        ${plan.revisionReason ? `<div style="font-size:12px;color:var(--yellow);margin-top:8px">Requested revision: ${workflowHtml(plan.revisionReason)}</div>` : ''}
        ${plans.length > 1 ? `<details style="margin-top:10px"><summary>Plan revision history (${plans.length})</summary>${plans.map(item => `<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--border2)">Revision ${item.revision || 1}: ${workflowHtml(item.title)} — ${workflowHtml(String(item.approvalStatus).replaceAll('_', ' '))}</div>`).join('')}</details>` : ''}
      </div>` : `<p style="color:var(--text3);font-size:13px">The organizer has not submitted an event plan yet.</p>`;

      const eventId = r.eventId;
      const event = eventId && DB.events.find(item => String(item.eventId || item.id) === String(eventId));
      const completionReport = (DB.eventCompletionReports || []).find(item => item.eventId === eventId);
      const isPaid = r.paymentStatus === 'fully_paid';
      const eventDatePassed = new Date(`${r.eventDate || r.date}T23:59:59`) <= new Date();
      const reportPhotos = (completionReport?.photos || []).map(photo => `<button class="btn btn-ghost btn-xs" onclick="openEventCompletionPhoto('${eventId}','${encodeURIComponent(photo.fileName)}')">View ${workflowHtml(photo.originalName)}</button>`).join(' ');
      const completionReportHtml = completionReport ? `<div style="margin-top:16px;padding:16px;border:1px solid var(--border);border-radius:10px">
        <h3 style="margin:0 0 10px">Event Completion Report</h3>
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">${workflowHtml(completionReport.eventName)} · ${workflowHtml(completionReport.eventDate)}</span></div>
        <div class="info-row"><span class="info-label">Venue</span><span class="info-value">${workflowHtml(completionReport.venue || '—')}</span></div>
        <div style="margin-top:10px"><strong>Services provided</strong><p style="white-space:pre-wrap;color:var(--text2)">${workflowHtml(completionReport.servicesProvided)}</p></div>
        <div style="margin-top:10px"><strong>Expenses</strong><p style="white-space:pre-wrap;color:var(--text2)">${workflowHtml(completionReport.expenses)}</p></div>
        <div style="margin-top:10px"><strong>Completion notes</strong><p style="white-space:pre-wrap;color:var(--text2)">${workflowHtml(completionReport.completionNotes)}</p></div>
        ${reportPhotos ? `<div style="margin-top:10px"><strong>Photos</strong><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${reportPhotos}</div></div>` : ''}
      </div>` : '';
      const lifecycleActions = event?.status === 'ongoing'
        ? isPaid
          ? eventDatePassed
            ? `<button class="btn btn-primary" style="margin-top:10px" onclick="completeWorkflowEvent('${eventId}','${r.id}')">Mark Event as Completed</button>`
            : '<p style="margin-top:10px;color:var(--text3)">Completion is available after the event date.</p>'
          : '<p style="margin-top:10px;color:var(--yellow)">The client must complete full payment before the event can be marked completed.</p>'
        : '';
      const completionReportAction = event?.status === 'completed' && !completionReport
        ? `<button class="btn btn-primary" style="margin-top:12px" onclick="openCompletionReportModal('${eventId}','${r.id}','${workflowHtml(r.title)}')">Create Event Completion Report</button>`
        : '';
      const lifecycleHtml = eventId && event ? `<section style="margin-top:18px;padding:16px;background:var(--surface2);border-radius:10px">
        <h3 style="margin:0 0 10px">Ongoing Event Workflow</h3>
        <div class="info-row"><span class="info-label">Event status</span><span class="info-value">${workflowHtml(event.status)}</span></div>
        <div class="info-row"><span class="info-label">Payment status</span><span class="info-value" style="color:${isPaid ? 'var(--green)' : 'var(--yellow)'}">${isPaid ? 'Paid' : 'Unpaid'}</span></div>
        ${lifecycleActions}${completionReportAction}${completionReportHtml}
        ${renderWorkflowFileReports(eventId)}
        ${renderWorkflowCancellation(r.cancellation || event.cancellation)}
      </section>` : '';

      el.innerHTML = `<div class="page-hd">
        <div class="page-hd-left"><button class="btn btn-ghost btn-sm" onclick="goNav('${_workflowReturnPage}')">← Back to ${_workflowReturnPage === 'my-events' ? 'Events' : _workflowReturnPage === 'ongoing-events' ? 'Ongoing Events' : _workflowReturnPage === 'completed-events' ? 'Completed Events' : _workflowReturnPage === 'event-requests' ? 'Event Requests' : _workflowReturnPage === 'dashboard' ? 'Dashboard' : 'Request Status'}</button><div class="page-title" style="margin-top:12px">${workflowHtml(r.title)}</div><div class="page-sub">Request details, workflow progress, negotiation, and event plan</div></div>
      </div>
      <div class="card" style="max-width:1000px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="badge badge-${reqBadge(r.status)}" style="text-transform:capitalize">${String(r.status).replaceAll('_', ' ')}</span>
          <span style="font-size:12px;color:var(--text3)">Request ID: ${workflowHtml(r.requestId)}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0">
          ${timeline.map(([label, complete]) => `<div style="flex:1;min-width:105px;padding:8px;border-radius:8px;background:${complete ? 'var(--accent-dim)' : 'var(--surface2)'};color:${complete ? 'var(--accent)' : 'var(--text3)'};font-size:11px;font-weight:600">${complete ? '✓ ' : '○ '}${label}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="info-row"><span class="info-label">Event date</span><span class="info-value">${workflowHtml(r.eventDate || r.date)}</span></div>
          <div class="info-row"><span class="info-label">Budget</span><span class="info-value">₹${Number(r.budget || 0).toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Ticket price per attendee</span><span class="info-value">${Number(r.ticketPrice || 0) === 0 ? 'Free' : '₹' + Number(r.ticketPrice).toLocaleString('en-IN')}</span></div>
          <div class="info-row"><span class="info-label">Event access</span><span class="info-value">${r.visibility === 'private' ? 'Private — approval before payment' : 'Public — direct registration'}</span></div>
          <div class="info-row"><span class="info-label">Guests</span><span class="info-value">${r.capacity || r.guests}</span></div>
          <div class="info-row"><span class="info-label">Event type</span><span class="info-value">${workflowHtml(r.eventType || r.type)}</span></div>
        </div>
        <div style="margin:12px 0"><strong>Event details</strong><p style="white-space:pre-wrap;color:var(--text2);line-height:1.6">${workflowHtml(r.requirements || r.desc || '—')}</p></div>
        ${r.status === 'rejected' && r.rejectionReason ? `<div style="padding:12px;background:var(--red-dim);margin:12px 0"><strong>Reason for declining</strong><p style="margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere">${workflowHtml(r.rejectionReason)}</p></div>` : ''}
        ${currentChange ? `<div style="padding:12px;border-radius:8px;background:rgba(245,158,11,.1);margin:12px 0"><strong>Organizer requested changes</strong><div style="font-size:13px;margin-top:5px">${workflowHtml(currentChange.reason)}</div>${currentChange.budget ? `<div>Proposed budget: ₹${Number(currentChange.budget).toLocaleString()}</div>` : ''}${currentChange.eventDate ? `<div>Proposed date: ${workflowHtml(currentChange.eventDate)}</div>` : ''}</div>` : ''}
        ${r.status === 'counteroffer_received' && pendingCounteroffer ? `<div style="padding:12px;border-radius:8px;background:rgba(124,111,247,.1);margin:12px 0"><strong>Client counteroffer — review proposed event details</strong>${pendingCounteroffer.reason ? `<div style="font-size:13px;margin-top:5px">${workflowHtml(pendingCounteroffer.reason)}</div>` : ''}<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;font-size:13px">${pendingCounteroffer.eventName ? `<div><strong>Event:</strong> ${workflowHtml(pendingCounteroffer.eventName)}</div>` : ''}${pendingCounteroffer.eventType ? `<div><strong>Type:</strong> ${workflowHtml(pendingCounteroffer.eventType)}</div>` : ''}${pendingCounteroffer.eventDate ? `<div><strong>Date:</strong> ${workflowHtml(pendingCounteroffer.eventDate)}</div>` : ''}${pendingCounteroffer.budget ? `<div><strong>Budget:</strong> ₹${Number(pendingCounteroffer.budget).toLocaleString()}</div>` : ''}${pendingCounteroffer.capacity !== undefined ? `<div><strong>Guests:</strong> ${pendingCounteroffer.capacity}</div>` : ''}${pendingCounteroffer.venue !== undefined ? `<div><strong>Venue:</strong> ${workflowHtml(pendingCounteroffer.venue || 'Not specified')}</div>` : ''}</div>${pendingCounteroffer.requirements !== undefined ? `<div style="margin-top:8px"><strong>Requirements:</strong><div style="white-space:pre-wrap">${workflowHtml(pendingCounteroffer.requirements || 'Not specified')}</div></div>` : ''}</div>` : ''}
        <div style="margin-top:16px"><strong>Event plan</strong>${planHtml}</div>
        ${renderWorkflowEventPolicy(r.policySnapshot || workflowEventPolicy)}
        <p class="small">Client acknowledgement: ${workflowHtml(workflowPolicyDate(r.clientPolicyAcceptedAt))}<br>Organizer acknowledgement: ${workflowHtml(workflowPolicyDate(r.organizerPolicyAcceptedAt))}</p>
        ${organizerRole ? organizerActions : clientActions}
        ${lifecycleHtml}
        ${negotiationHtml ? `<div style="margin-top:18px"><strong>Negotiation history</strong>${negotiationHtml}</div>` : ''}
        <div style="margin-top:18px"><strong>Progress history</strong>${(r.auditHistory || []).slice().reverse().map(entry => `<div style="padding:8px 0;border-bottom:1px solid var(--border2);font-size:12px"><strong>${workflowHtml(entry.action)}</strong><div style="color:var(--text3)">${entry.timestamp ? workflowHtml(String(entry.timestamp).replace('T', ' ').slice(0, 16)) : ''} · ${workflowHtml(entry.role)}</div></div>`).join('') || '<div style="font-size:12px;color:var(--text3)">No workflow actions yet.</div>'}</div>
      </div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function RequestDetailsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
