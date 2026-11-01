import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function renderWorkflowRequestDetails(id) {
      const r = DB.eventRequests.find(request => String(request.id) === String(id) || String(request.requestId) === String(id) || (request.eventId && String(request.eventId) === String(id)));
      if (r && CU && CU.role === 'client' && !isClientOwner(r, CU)) {
        const el = g('page-content');
        if (el) el.innerHTML = '<div class="alert alert-danger" style="margin:24px 0;padding:16px;border-radius:8px"><strong>Access Denied:</strong> You are not authorized to view the details of this event request.<br><button class="btn btn-primary mt-16" onclick="goNav(\'request-status\')">Back to requests</button></div>';
        return;
      }
      const el = g('page-content');
      if (!r || !el) {
        if (el) el.innerHTML = '<div class="empty"><div class="empty-title">Request not found</div><button class="btn btn-primary mt-16" onclick="goNav(\'request-status\')">Back to requests</button></div>';
        return;
      }
      const plan = (DB.eventPlans || []).find(item => item.eventPlanId === r.activeEventPlanId)
        || (DB.eventPlans || []).filter(item => item.requestId === r.requestId).sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];
      const organizerRole = CU.role === 'organizer';
      const isNegotiating = ['counteroffer_received', 'changes_requested', 'plan_revision_requested'].includes(r.status) || (r.negotiations && r.negotiations.length > 0);
      const isAccepted = ['awaiting_client', 'confirmed', 'completed'].includes(r.status) || (r.proposals && r.proposals.some(p => p.status === 'accepted'));
      const isPaymentPending = ['awaiting_client'].includes(r.status) || r.paymentStatus === 'deposit_pending' || r.paymentStatus === 'deposit_paid';
      const isConfirmed = ['confirmed', 'completed'].includes(r.status);
      const isCompleted = r.status === 'completed';

      const timeline = [
        ['1. Submitted', true],
        ['2. Under Review', !['submitted', 'pending'].includes(r.status)],
        ['3. Proposal Sent', ['proposal_sent', 'planning', 'awaiting_client', 'confirmed', 'completed'].includes(r.status) || (r.proposals && r.proposals.length > 0)],
        ['4. Negotiation', isNegotiating],
        ['5. Accepted', isAccepted],
        ['6. Payment Pending', isPaymentPending || isConfirmed],
        ['7. Confirmed', isConfirmed],
        ['8. Completed', isCompleted],
      ];

      const currentChange = [...(r.negotiations || [])].reverse().find(item => item.action === 'changes_requested');
      const plans = (DB.eventPlans || []).filter(item => item.requestId === r.requestId).sort((a, b) => (b.revision || 0) - (a.revision || 0));
      const latestProposal = (r.proposals && r.proposals.length > 0) ? r.proposals[r.proposals.length - 1] : null;
      const agreedProposal = getClientAcceptedProposal(r) || latestProposal;
      const planDeposit = Number(agreedProposal?.depositRequired ?? Math.round(Number(plan?.budget || r.budget || 0) * 0.3));
      const planBalance = Math.max(0, Number(plan?.budget || agreedProposal?.amount || r.budget || 0) - planDeposit);
      const organizer = (DB.organizers || []).find(item => String(item.organizerId || item.id) === String(r.organizerId || r.organizer))
        || (DB.users || []).find(item => String(item.id || item.userId) === String(r.organizerId || r.organizer));
      const organizerActions = ['submitted', 'pending', 'under_review', 'info_requested'].includes(r.status)
        ? `<div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-success w-full" onclick="acceptWorkflowRequest('${r.id}')">Accept</button><button class="btn btn-danger w-full" onclick="openWorkflowRejectModal('${r.id}')">Reject</button></div>`
        : r.status === 'counteroffer_received'
        ? `<div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-success w-full" onclick="acceptWorkflowCounteroffer('${r.id}')">Accept Counteroffer</button><button class="btn btn-danger w-full" onclick="openWorkflowRejectModal('${r.id}')">Reject / Propose Changes</button></div>`
        : ['planning', 'plan_revision_requested'].includes(r.status)
        ? `<button class="btn btn-primary w-full" style="margin-top:16px" onclick="openWorkflowPlanModal('${r.id}')">${r.status === 'plan_revision_requested' ? 'Edit and Resubmit Plan' : 'Create Event Plan'}</button>`
        : '';
      const clientCancelBtn = (CU.role === 'client' && !['cancelled', 'withdrawn', 'rejected', 'completed'].includes(r.status) && !r.eventId)
        ? `<button class="btn btn-danger btn-sm" onclick="openClientCancelRequestModal('${r.id}')">Cancel Request</button>`
        : '';
      const clientActions = ['cancelled', 'withdrawn', 'rejected', 'expired', 'completed'].includes(r.status) ? '' : r.status === 'changes_requested'
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-success" onclick="respondToWorkflowChanges('${r.id}','accept_changes')">Accept Changes</button><button class="btn btn-danger" onclick="respondToWorkflowChanges('${r.id}','reject_changes')">Reject Changes</button><button class="btn btn-primary" onclick="openWorkflowCounterofferModal('${r.id}')">Send Counteroffer</button>${clientCancelBtn}</div>`
        : r.status === 'plan_submitted' && plan?.approvalStatus === 'pending'
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-success" onclick="openWorkflowPlanAcceptanceModal('${plan.eventPlanId}','${r.id}')">Accept Plan</button><button class="btn btn-primary" onclick="openWorkflowPlanRevisionModal('${plan.eventPlanId}','${r.id}')">Request Changes</button><button class="btn btn-danger" onclick="openWorkflowPlanRejectionModal('${plan.eventPlanId}','${r.id}')">Reject Plan</button></div>`
        : (r.status === 'awaiting_client' || (r.paymentStatus === 'deposit_pending' && (r.proposals || []).some(proposal => proposal.status === 'accepted'))) && (plan?.approvalStatus === 'approved' || (r.proposals || []).some(proposal => proposal.status === 'accepted'))
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-success" onclick="openClientPaymentModal('${workflowHtml(r.id)}')">Proceed to Payment &amp; Confirmation</button>${clientCancelBtn}</div>`
        : clientCancelBtn ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">${clientCancelBtn}</div>` : '';
      const negotiationHtml = (r.negotiations || []).map(item => `<div style="padding:10px;border-left:3px solid var(--accent);background:var(--surface2);border-radius:6px;margin-top:8px"><strong>${workflowHtml(String(item.action || '').replaceAll('_', ' '))}</strong><div style="font-size:12px;color:var(--text2);margin-top:4px">${workflowHtml(item.reason)}${item.budget ? ` · Budget ₹${Number(item.budget).toLocaleString()}` : ''}${item.eventDate ? ` · Date ${workflowHtml(item.eventDate)}` : ''}</div></div>`).join('');
      const planDocFileName = plan?.documentFileName || latestProposal?.documentFileName;
      const planDocName = plan?.documentName || latestProposal?.documentName || planDocFileName;
      const planDocType = plan?.documentType || latestProposal?.documentType || 'application/pdf';
      const planDocSize = plan?.documentSize || latestProposal?.documentSize;
      const planDocDate = plan?.uploadedAt || latestProposal?.uploadedAt || plan?.createdAt || latestProposal?.sentAt;
      const planDocUploader = plan?.uploaderName || latestProposal?.uploaderName || 'Organizer';
      const planTargetId = plan?.eventPlanId || r.requestId || r.id;

      const planDocCard = planDocFileName ? `
        <div style="margin-top:12px;padding:14px;border:1px solid var(--border);border-radius:8px;background:var(--surface)">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">📎 ${escapeHtml(planDocName || 'event-plan.pdf')}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px">
            <span>${escapeHtml(planDocType)}</span>${planDocSize ? ` · ${(Number(planDocSize)/1024).toFixed(1)} KB` : ''} &middot;
            <span>Uploaded ${planDocDate ? new Date(planDocDate).toLocaleString() : 'Recently'}</span> &middot;
            <span>Revision ${plan?.revision || latestProposal?.version || 1}</span> &middot;
            <span>By ${escapeHtml(planDocUploader)}</span>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-ghost btn-sm" onclick="openEventPlanPdf('${planTargetId}','${encodeURIComponent(planDocName || 'event-plan.pdf')}',true${latestProposal?.version ? ',' + latestProposal.version : ''})">👁️ View PDF / Preview</button>
            <button class="btn btn-primary btn-sm" onclick="openEventPlanPdf('${planTargetId}','${encodeURIComponent(planDocName || 'event-plan.pdf')}',false${latestProposal?.version ? ',' + latestProposal.version : ''})">⬇️ Download PDF</button>
          </div>
        </div>` : `
        <div style="margin-top:12px;padding:12px 14px;border:1px dashed var(--border);border-radius:8px;background:var(--surface2)">
          <div style="font-size:12.5px;color:var(--text2)">📝 <strong>Text-only plan proposal</strong> — no file attached by organizer. Proposal deliverables and terms are detailed above.</div>
        </div>`;

      const planRevisionHistoryHtml = plans.length > 1 ? `
        <details style="margin-top:12px">
          <summary style="cursor:pointer;font-weight:600;font-size:13px">Plan revision history (${plans.length} versions, newest first)</summary>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
            ${plans.map(item => `
              <div style="font-size:12px;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
                <div>
                  <strong>Revision ${item.revision || 1}:</strong> ${workflowHtml(item.title)} — <span class="badge badge-${item.approvalStatus === 'approved' ? 'green' : item.approvalStatus === 'revision_requested' ? 'yellow' : 'blue'}">${workflowHtml(String(item.approvalStatus || 'pending').replaceAll('_', ' '))}</span>
                  ${item.uploadedAt || item.createdAt ? `<div class="small" style="color:var(--text3)">Uploaded ${new Date(item.uploadedAt || item.createdAt).toLocaleString()}</div>` : ''}
                </div>
                ${item.documentFileName ? `
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-ghost btn-xs" onclick="openEventPlanPdf('${item.eventPlanId}','${encodeURIComponent(item.documentName || item.documentFileName)}',true)">Preview</button>
                    <button class="btn btn-ghost btn-xs" onclick="openEventPlanPdf('${item.eventPlanId}','${encodeURIComponent(item.documentName || item.documentFileName)}',false)">Download</button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </details>` : (r.proposals && r.proposals.length > 1 ? `
        <details style="margin-top:12px">
          <summary style="cursor:pointer;font-weight:600;font-size:13px">Proposal version history (${r.proposals.length} versions, newest first)</summary>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
            ${[...r.proposals].sort((a,b) => (b.version||0) - (a.version||0)).map(p => `
              <div style="font-size:12px;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
                <div>
                  <strong>Version ${p.version || 1}:</strong> ₹${Number(p.amount||0).toLocaleString()} — <span class="badge badge-gray">${escapeHtml(p.status || 'draft')}</span>
                  ${p.uploadedAt || p.sentAt ? `<div class="small" style="color:var(--text3)">${new Date(p.uploadedAt || p.sentAt).toLocaleString()}</div>` : ''}
                </div>
                ${(p.documentFileName || p.documentName) ? `
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-ghost btn-xs" onclick="openEventPlanPdf('${r.requestId || r.id}','${encodeURIComponent(p.documentName || p.documentFileName)}',true,${p.version})">Preview</button>
                    <button class="btn btn-ghost btn-xs" onclick="openEventPlanPdf('${r.requestId || r.id}','${encodeURIComponent(p.documentName || p.documentFileName)}',false,${p.version})">Download</button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </details>` : '');

      const planHtml = plan ? `<div style="margin-top:12px;padding:14px;background:var(--surface2);border-radius:10px">
        <div style="display:flex;justify-content:space-between;gap:8px"><strong>${workflowHtml(plan.title)} · Revision ${plan.revision || 1}</strong><span class="badge badge-${plan.approvalStatus === 'approved' ? 'green' : plan.approvalStatus === 'revision_requested' ? 'yellow' : 'blue'}">${workflowHtml(String(plan.approvalStatus || 'pending').replaceAll('_', ' '))}</span></div>
        <p style="font-size:13px;color:var(--text2);line-height:1.6">${workflowHtml(plan.description)}</p>
        <div class="info-row"><span class="info-label">Total proposal amount</span><span class="info-value">₹${Number(plan.budget || 0).toLocaleString()}</span></div>
        <div class="info-row"><span class="info-label">Advance deposit</span><span class="info-value">₹${planDeposit.toLocaleString()}</span></div>
        <div class="info-row"><span class="info-label">Remaining balance</span><span class="info-value">₹${planBalance.toLocaleString()}</span></div>
        ${plan.budgetBreakdown ? `<div style="margin-top:10px"><strong>Itemized cost breakdown</strong><p style="white-space:pre-wrap;color:var(--text2)">${workflowHtml(plan.budgetBreakdown)}</p></div>` : ''}
        ${plan.services ? `<div style="margin-top:10px"><strong>Proposed services & deliverables</strong><p style="white-space:pre-wrap;color:var(--text2)">${workflowHtml(plan.services)}</p></div>` : ''}
        ${plan.arrangements ? `<div style="margin-top:10px"><strong>Venue & execution arrangements</strong><p style="white-space:pre-wrap;color:var(--text2)">${workflowHtml(plan.arrangements)}</p></div>` : ''}
        ${plan.schedule ? `<div style="margin-top:10px"><strong>Event schedule & execution timeline</strong><p style="white-space:pre-wrap;color:var(--text2)">${workflowHtml(plan.schedule)}</p></div>` : ''}
        <div style="margin-top:10px"><strong>Payment terms</strong><p style="color:var(--text2)">${workflowHtml(agreedProposal?.paymentSchedule || agreedProposal?.paymentTerms || 'Advance deposit payable now; remaining balance follows the accepted agreement.')}</p></div>
        <div style="margin-top:10px"><strong>Cancellation policy</strong><p style="color:var(--text2)">${workflowHtml(agreedProposal?.cancellationTerms || agreedProposal?.cancellationPolicy || 'The event agreement cancellation policy applies.')}</p></div>
        <div class="small" style="color:var(--text3);margin-top:8px">Submitted ${workflowPolicyDate(plan.createdAt || plan.uploadedAt)} · Revision ${plan.revision || 1}</div>
        ${planDocCard}
        ${plan.revisionReason ? `<div style="font-size:12px;color:var(--yellow);margin-top:8px">Requested revision: ${workflowHtml(plan.revisionReason)}</div>` : ''}
        ${planRevisionHistoryHtml}
      </div>` : (latestProposal ? `<div style="margin-top:12px;padding:14px;background:var(--surface2);border-radius:10px">
        <div style="display:flex;justify-content:space-between;gap:8px"><strong>Event Proposal · Version ${latestProposal.version || 1}</strong><span class="badge badge-blue">${workflowHtml(String(latestProposal.status || 'pending_client').replaceAll('_', ' '))}</span></div>
        <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-top:6px">${workflowHtml(latestProposal.eventPlan || latestProposal.terms || 'Event proposal details.')}</p>
        <div class="info-row"><span class="info-label">Proposed Price</span><span class="info-value">₹${Number(latestProposal.amount || 0).toLocaleString()}</span></div>
        <div class="info-row"><span class="info-label">Advance Deposit</span><span class="info-value">₹${Number(latestProposal.depositRequired || Math.round((latestProposal.amount || 0) * 0.3)).toLocaleString()}</span></div>
        ${planDocCard}
        ${planRevisionHistoryHtml}
      </div>` : `<p style="color:var(--text3);font-size:13px">The organizer has not submitted an event plan yet.</p>`);

      const eventId = r.eventId;
      const event = eventId && DB.events.find(item => String(item.eventId || item.id) === String(eventId));
      const completionReport = (DB.eventCompletionReports || []).find(item => item.eventId === eventId);
      const submittedReview = (DB.clientOrganizerReviews || []).find(item => item.eventId === eventId);
      const isPaid = r.paymentStatus === 'fully_paid';
      const bookingAmounts = getClientBookingAmounts(r, plan);
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
      const reviewHtml = completionReport && !submittedReview ? `<div style="margin-top:14px;padding:16px;background:var(--surface2);border-radius:10px">
        <h3 style="margin:0 0 10px">Review the Organizer</h3>
        <div class="form-group"><label class="form-label" for="workflow-review-rating">Rating</label><select class="form-control" id="workflow-review-rating"><option value="">Choose stars</option><option value="5">★★★★★ - Excellent</option><option value="4">★★★★ - Good</option><option value="3">★★★ - Average</option><option value="2">★★ - Poor</option><option value="1">★ - Very poor</option></select></div>
        <div class="form-group"><label class="form-label" for="workflow-review-comment">Written review</label><textarea class="form-control" id="workflow-review-comment" rows="3" required></textarea></div>
        <button class="btn btn-primary" onclick="submitClientOrganizerReview('${eventId}','${r.id}')">Submit Review</button>
      </div>` : submittedReview ? '<div style="margin-top:14px;color:var(--green);font-weight:600">Thank you. Your review has been published to the organizer profile.</div>' : '';
      const lifecycleHtml = eventId && event && r.status !== 'cancelled' ? `<section style="margin-top:18px;padding:16px;background:var(--surface2);border-radius:10px">
        <h3 style="margin:0 0 10px">Ongoing Event Workflow</h3>
        <div class="info-row"><span class="info-label">Event status</span><span class="info-value">${workflowHtml(event.status)}</span></div>
        <div class="info-row"><span class="info-label">Payment status</span><span class="info-value" style="color:${isPaid ? 'var(--green)' : 'var(--yellow)'}">${isPaid ? 'Paid' : r.paymentStatus === 'deposit_paid' ? 'Deposit Paid' : 'Unpaid'}</span></div>
        ${event.status === 'ongoing' && !isPaid && bookingAmounts.remainingAmount > 0 ? `<div style="margin-top:10px"><strong>Final agreed amount: ₹${bookingAmounts.totalAmount.toLocaleString()}</strong><div style="margin-top:6px">Remaining amount: ₹${bookingAmounts.remainingAmount.toLocaleString()}</div><div style="display:flex;gap:10px;margin-top:8px"><button class="btn btn-primary" onclick="openClientPaymentModal('${escapeHtml(r.id)}', '${escapeHtml(eventId || '')}')">💳 Pay Remaining Amount</button></div></div>` : ''}
        ${isPaid ? `<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="openClientPaymentModal('${escapeHtml(r.id)}', '${escapeHtml(eventId || '')}')">📜 View Payment Receipt & Transactions</button></div>` : ''}
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
          ${event.status === 'ongoing' && CU.role === 'client' ? `<button class="btn btn-danger btn-sm" onclick="openClientCancelRequestModal('${workflowHtml(r.requestId || r.id)}')">Cancel Event</button>` : ''}
        </div>
        ${(r.eventModifications && r.eventModifications.length > 0) ? `
          <div style="background:var(--surface);border-radius:10px;padding:14px;border:1px solid var(--border);margin-top:14px">
            <div style="font-weight:700;font-size:13px;margin-bottom:8px">📝 Event Modifications (${r.eventModifications.length})</div>
            ${r.eventModifications.map(mod => `
              <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span style="font-weight:600">Requested by ${mod.requesterRole === 'client' ? 'Client' : 'Organizer'}</span>
                  <span class="badge badge-${mod.status === 'approved' ? 'green' : mod.status === 'rejected' ? 'red' : 'yellow'}">${mod.status.replace('_', ' ')}</span>
                </div>
                <div style="color:var(--text2);margin-bottom:4px"><strong>Reason:</strong> ${escapeHtml(mod.reason || '—')}</div>
                <div style="font-size:11px;color:var(--text3);margin-bottom:6px">Date: ${mod.newValues?.date || '—'} · Capacity: ${mod.newValues?.capacity || '—'} · Budget: ₹${(mod.newValues?.budget || 0).toLocaleString()}</div>
                ${mod.status === 'pending_approval' ? '<div style="font-size:11px;color:var(--text3)">Booked event details are locked.</div>' : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${r.status !== 'cancelled' ? renderWorkflowCancellation(r.cancellation || event.cancellation, r) : ''}
        ${renderWorkflowFileReports(eventId)}
        ${completionReportHtml}
        ${reviewHtml}
      </section>` : '';

      el.innerHTML = `<div class="page-hd">
        <div class="page-hd-left"><button class="btn btn-ghost btn-sm" onclick="goNav('${_workflowReturnPage}')">← Back to ${_workflowReturnPage === 'my-events' ? 'Events' : _workflowReturnPage === 'ongoing-events' ? 'Ongoing Events' : _workflowReturnPage === 'completed-events' ? 'Completed Events' : _workflowReturnPage === 'event-requests' ? 'Event Requests' : _workflowReturnPage === 'dashboard' ? 'Dashboard' : 'Request Status'}</button><div class="page-title" style="margin-top:12px">${r.status === 'plan_submitted' ? 'Event Plan Review — ' : ''}${workflowHtml(r.title)}</div><div class="page-sub">Original request details, organizer submission, pricing, terms, attachment, and history</div></div>
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
          <div class="info-row"><span class="info-label">Organizer</span><span class="info-value">${workflowHtml(organizer?.name || organizer?.businessName || r.organizerName || 'Assigned Organizer')}</span></div>
        </div>
        ${r.status === 'cancelled' ? renderWorkflowCancellation(r.cancellation, r) : ''}
        <div style="margin:12px 0"><strong>Event details</strong><p style="white-space:pre-wrap;color:var(--text2);line-height:1.6">${workflowHtml(r.requirements || r.desc || '—')}</p></div>
        ${r.status === 'rejected' && r.rejectionReason ? `<div style="padding:12px;background:var(--red-dim);margin:12px 0;border-radius:8px"><strong style="color:var(--red)">&#10005; Reason for declining</strong><p style="margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere">${workflowHtml(r.rejectionReason)}</p>${r.rejectionComments ? `<p style="margin:6px 0 0;font-size:12px;color:var(--text2)"><strong>Additional comments:</strong> ${workflowHtml(r.rejectionComments)}</p>` : ''}</div>` : ''}
        ${currentChange ? `<div style="padding:12px;border-radius:8px;background:rgba(245,158,11,.1);margin:12px 0"><strong>Organizer requested changes</strong><div style="font-size:13px;margin-top:5px">${workflowHtml(currentChange.reason)}</div>${currentChange.budget ? `<div>Proposed budget: ₹${Number(currentChange.budget).toLocaleString()}</div>` : ''}${currentChange.eventDate ? `<div>Proposed date: ${workflowHtml(currentChange.eventDate)}</div>` : ''}</div>` : ''}
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
