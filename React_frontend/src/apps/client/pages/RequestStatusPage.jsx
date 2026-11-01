import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageRequestStatus() {
    const isOrganizer = CU.role === 'organizer';
    if (isOrganizer) {
      const tab = sessionStorage.getItem('reqstat_tab') || 'pending';
      const myOrgId = CU.id;
      const pendingReqs = DB.eventRequests
        .filter(request => request.status === 'pending' || request.status === 'in_review')
        .sort((leftRequest, rightRequest) => {
          const tA = Math.max(
            leftRequest.updatedAt ? new Date(leftRequest.updatedAt).getTime() : 0,
            leftRequest.createdAt ? new Date(leftRequest.createdAt).getTime() : 0,
            leftRequest.created ? new Date(leftRequest.created).getTime() : 0
          );
          const tB = Math.max(
            rightRequest.updatedAt ? new Date(rightRequest.updatedAt).getTime() : 0,
            rightRequest.createdAt ? new Date(rightRequest.createdAt).getTime() : 0,
            rightRequest.created ? new Date(rightRequest.created).getTime() : 0
          );
          if (tB !== tA) return tB - tA;
          return String(rightRequest.id || '').localeCompare(String(leftRequest.id || ''));
        });
      const myEvents = DB.events
        .filter(
          event =>
            event.organizer === myOrgId &&
            (event.status === 'upcoming' ||
              event.status === 'ongoing' ||
              event.status === 'confirmed')
        )
        .sort((leftEvent, rightEvent) => {
          const tA = leftEvent.date ? new Date(leftEvent.date).getTime() : 0;
          const tB = rightEvent.date ? new Date(rightEvent.date).getTime() : 0;
          if (tB !== tA) return tB - tA;
          return String(rightEvent.id || '').localeCompare(String(leftEvent.id || ''));
        });
      const pendingHtml =
        pendingReqs.length === 0
          ? '<div class="empty"><div class="empty-icon">&#128203;</div><div class="empty-title">No pending requests</div><p class="empty-desc">New client event requests will appear here.</p></div>'
          : pendingReqs
              .map(request => {
                const cl = DB.users.find(user => String(user.id) === String(request.clientId)) ||
                  DB.users.find(user => user.role === 'client') || {
                    name: 'Michael Torres',
                  };
                return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;border-left:4px solid var(--yellow)">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="font-size:17px;font-weight:700;color:var(--text)">${request.title}</div>
              <span style="background:#FEF3C7;color:#92400E;font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px">Pending</span>
            </div>
            <div style="display:flex;gap:24px;font-size:13px;color:var(--text2);flex-wrap:wrap">
              <span>👤 ${cl.name}</span>
              <span>📅 ${request.date}</span>
              <span>📍 ${request.venue || 'TBD'}${request.city ? ', ' + request.city : ''}</span>
              <span>👥 ${request.guests} expected attendees</span>
            </div>
          </div>
          <button class="btn btn-primary" onclick="viewRequestDetail('${
            request.id
          }')" style="white-space:nowrap;border-radius:8px;padding:10px 20px">Review Request</button>
        </div>`;
              })
              .join('');
      const ongoingHtml =
        myEvents.length === 0
          ? '<div class="empty"><div class="empty-icon">&#128197;</div><div class="empty-title">No ongoing events</div><p class="empty-desc">Confirmed events will appear here once requests are approved.</p></div>'
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px">${myEvents
              .map(event => {
                const attendees = DB.registrations.filter(
                  registration => registration.eventId === event.id
                ).length;
                const isPrivate = event.access === 'private' || event.access === 'Private';
                return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <span style="background:rgba(34,197,94,0.15);color:var(--green);font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px">Confirmed</span>
              ${
                isPrivate
                  ? '<span style="background:var(--surface2);color:var(--text2);font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px">Private</span>'
                  : ''
              }
            </div>
            <div>
              <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:3px">${
                event.title
              }</div>
              <div style="font-size:12px;color:var(--text3)">${
                event.type || event.category || 'Event'
              }</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--text2)">
              <span>&#128197; ${event.date}</span>
              <span>&#128205; ${event.venue || event.location || 'TBD'}</span>
              <span>&#128101; ${attendees || event.capacity || 0} attendees</span>
            </div>
            <button class="btn btn-ghost" onclick="viewOngoingEventDetail('${
              event.id
            }')" style="width:100%;justify-content:center;border-radius:8px;font-size:13px">&#128065; View Details</button>
          </div>`;
              })
              .join('')}</div>`;
      return `<div style="padding:28px;background:var(--bg)">
      <div style="margin-bottom:28px">
        <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">${
          tab === 'pending' ? 'Pending Requests' : 'Ongoing Events'
        }</div>
        <div style="font-size:14px;color:var(--text2)">${
          tab === 'pending'
            ? 'Review and accept or decline incoming event requests.'
            : 'Manage and track your confirmed and active events.'
        }</div>
      </div>
      <div style="display:flex;gap:0;margin-bottom:28px;background:var(--surface2);border-radius:10px;padding:4px;width:fit-content">
        <button onclick="switchReqStatTab('pending')" style="padding:8px 20px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:${
          tab === 'pending' ? 'var(--accent)' : 'transparent'
        };color:${
        tab === 'pending' ? '#fff' : 'var(--text2)'
      }">Pending Requests <span style="background:${
        tab === 'pending' ? 'rgba(255,255,255,0.25)' : 'var(--border2)'
      };color:${
        tab === 'pending' ? '#fff' : 'var(--text2)'
      };padding:1px 7px;border-radius:10px;font-size:11px;margin-left:4px">${
        pendingReqs.length
      }</span></button>
        <button onclick="switchReqStatTab('ongoing')" style="padding:8px 20px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:${
          tab === 'ongoing' ? 'var(--accent)' : 'transparent'
        };color:${
        tab === 'ongoing' ? '#fff' : 'var(--text2)'
      }">Ongoing Events <span style="background:${
        tab === 'ongoing' ? 'rgba(255,255,255,0.25)' : 'var(--border2)'
      };color:${
        tab === 'ongoing' ? '#fff' : 'var(--text2)'
      };padding:1px 7px;border-radius:10px;font-size:11px;margin-left:4px">${
        myEvents.length
      }</span></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        ${tab === 'pending' ? pendingHtml : ongoingHtml}
      </div>
    </div>`;
    } else {
      // CLIENT VIEW -- Status-filter dropdown
      // ─ Label map (readable labels for all backend status values) ─────
      const CLIENT_STATUS_LABELS = {
        all: 'All',
        submitted: 'Submitted / Pending',
        pending: 'Submitted / Pending',
        under_review: 'Under Review',
        in_review: 'Under Review',
        info_requested: 'Under Review',
        proposal_sent: 'Awaiting Client Response',
        awaiting_client: 'Awaiting Client Response',
        changes_requested: 'Changes Requested / Counteroffer',
        counteroffer_received: 'Changes Requested / Counteroffer',
        confirmed: 'Confirmed',
        approved: 'Confirmed',
        withdrawn: 'Withdrawn',
        cancelled: 'Cancelled',
        rejected: 'Rejected',
        expired: 'Expired',
      };
      const CLIENT_STATUS_GROUPS = [
        {
          value: 'all',
          label: 'All Requests',
        },
        {
          value: 'submitted',
          label: 'Submitted / Pending',
        },
        {
          value: 'under_review',
          label: 'Under Review',
        },
        {
          value: 'proposal_sent',
          label: 'Awaiting Client Response',
        },
        {
          value: 'changes_requested',
          label: 'Changes Requested / Counteroffer',
        },
        {
          value: 'confirmed',
          label: 'Confirmed',
        },
        {
          value: 'withdrawn',
          label: 'Withdrawn',
        },
        {
          value: 'cancelled',
          label: 'Cancelled',
        },
        {
          value: 'rejected',
          label: 'Rejected',
        },
        {
          value: 'expired',
          label: 'Expired',
        },
      ];
      function clientStatusGroup(status) {
        const s = (status || '').toLowerCase();
        if (['submitted', 'pending'].includes(s)) return 'submitted';
        if (['under_review', 'in_review', 'info_requested'].includes(s)) return 'under_review';
        if (['proposal_sent', 'awaiting_client'].includes(s)) return 'proposal_sent';
        if (['changes_requested', 'counteroffer_received'].includes(s)) return 'changes_requested';
        if (['confirmed', 'approved'].includes(s)) return 'confirmed';
        return s || 'submitted';
      }
      function clientStatusReadable(status) {
        return (
          CLIENT_STATUS_LABELS[status] ||
          (status || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        );
      }
      function clientRequestActions(r) {
        const id = r.id;
        const s = (r.status || '').toLowerCase();
        const closed = ['cancelled', 'withdrawn', 'rejected', 'expired', 'completed'].includes(s);
        const parts = [
          s === 'cancelled'
            ? `<button class="btn btn-primary btn-sm" onclick="viewWorkflowRequestDrawer('${id}')">View Cancellation Details</button>`
            : `<button class="btn btn-ghost btn-sm" onclick="viewRequestDrawer('${id}')">View Details</button>`,
        ];
        if (['submitted', 'pending', 'under_review', 'in_review', 'info_requested'].includes(s))
          parts.push(
            `<button class="btn btn-danger btn-sm" onclick="openClientCancelRequestModal('${id}')">Withdraw Request</button>`
          );
        if (s === 'proposal_sent')
          parts.push(
            `<button class="btn btn-primary btn-sm" onclick="openClientPlanReview('${id}')">Review Plan</button>`
          );
        if (s === 'plan_submitted')
          parts.push(
            `<button class="btn btn-primary btn-sm" onclick="viewWorkflowRequestDrawer('${id}')">View Plan</button>`
          );
        if (
          !closed &&
          (s === 'awaiting_client' ||
            (r.paymentStatus === 'deposit_pending' &&
              (r.proposals || []).some(proposal => proposal.status === 'accepted')))
        )
          parts.push(
            `<button class="btn btn-success btn-sm" onclick="openClientPaymentModal('${id}')">Proceed to Payment &amp; Confirmation</button>`
          );
        if (['changes_requested', 'counteroffer_received'].includes(s))
          parts.push(
            `<button class="btn btn-primary btn-sm" onclick="openClientPlanReview('${id}')">View &amp; Respond</button>`
          );
        if (['confirmed', 'approved'].includes(s))
          parts.push(
            `<button class="btn btn-danger btn-sm" onclick="openClientCancelRequestModal('${id}')">Cancel Event</button>`
          );
        return parts.join(' ');
      }
      function clientRequestHistory(r) {
        const s = (r.status || '').toLowerCase();
        if (s === 'rejected' && r.rejectionReason)
          return `<div style="margin-top:8px;padding:8px 12px;background:var(--red-dim);border-radius:6px;font-size:12.5px"><strong style="color:var(--red)">Declined:</strong> ${escapeHtml(
            r.rejectionReason
          )}${
            r.rejectionComments
              ? `<div class="small mt-4" style="color:var(--text2)">${escapeHtml(
                  r.rejectionComments
                )}</div>`
              : ''
          }</div>`;
        if (s === 'withdrawn' && (r.withdrawalReason || r.withdrawReason))
          return `<div style="margin-top:8px;padding:8px 12px;background:var(--surface2);border-radius:6px;font-size:12.5px"><strong>Withdrawn:</strong> ${escapeHtml(
            r.withdrawalReason || r.withdrawReason
          )}</div>`;
        if (s === 'cancelled') return renderWorkflowCancellation(r.cancellation, r, true);
        if (s === 'expired')
          return `<div style="margin-top:8px;padding:8px 12px;background:var(--red-dim);border-radius:6px;font-size:12.5px"><strong style="color:var(--red)">Proposal Expired:</strong> The organizer's proposal was not accepted in time.</div>`;
        if (['changes_requested', 'counteroffer_received'].includes(s) && r.clientFeedback)
          return `<div style="margin-top:8px;padding:8px 12px;background:var(--yellow-dim);border-radius:6px;font-size:12.5px"><strong>Your feedback:</strong> ${escapeHtml(
            r.clientFeedback
          )}</div>`;
        if (['confirmed', 'approved'].includes(s) && r.cancellationPolicy) {
          const pol = r.cancellationPolicy;
          return `<div style="margin-top:8px;padding:8px 12px;background:var(--green-dim);border-radius:6px;font-size:12.5px"><strong style="color:var(--green)">\u2713 Booking Confirmed</strong>${
            r.depositAmount
              ? ` \u00b7 Deposit paid \u20b9${Number(r.depositAmount).toLocaleString()}`
              : ''
          }${
            pol.deadlineText
              ? `<div class="small mt-4" style="color:var(--text2)">Cancellation deadline: ${escapeHtml(
                  pol.deadlineText
                )}</div>`
              : ''
          }</div>`;
        }
        if (['proposal_sent', 'awaiting_client'].includes(s) && r.proposals && r.proposals.length) {
          const p = r.proposals[r.proposals.length - 1];
          return `<div style="margin-top:8px;padding:8px 12px;background:var(--accent-dim);border-radius:6px;font-size:12.5px"><strong style="color:var(--accent)">\ud83d\udcc4 Proposal v${
            p.version || 1
          }:</strong> \u20b9${Number(p.amount || 0).toLocaleString()} total${
            p.validUntil ? ` &middot; Valid until ${escapeHtml(p.validUntil)}` : ''
          }</div>`;
        }
        return '';
      }
      function getReqTimestamp(item) {
        const times = [
          item.updatedAt ? new Date(item.updatedAt).getTime() : 0,
          item.createdAt ? new Date(item.createdAt).getTime() : 0,
          item.created ? new Date(item.created).getTime() : 0,
          item.sentAt ? new Date(item.sentAt).getTime() : 0,
        ];
        if (Array.isArray(item.proposals) && item.proposals.length > 0) {
          item.proposals.forEach(proposal => {
            if (proposal.sentAt) times.push(new Date(proposal.sentAt).getTime());
            if (proposal.createdAt) times.push(new Date(proposal.createdAt).getTime());
            if (proposal.uploadedAt) times.push(new Date(proposal.uploadedAt).getTime());
          });
        }
        return Math.max(...times.filter(t => !isNaN(t) && t > 0), 0);
      }
      const allReqs = DB.eventRequests
        .filter(request => String(request.clientId) === String(CU.id))
        .sort((leftRequest, rightRequest) => {
          const diff = getReqTimestamp(rightRequest) - getReqTimestamp(leftRequest);
          if (diff !== 0) return diff;
          return String(rightRequest.id || rightRequest.requestId || '').localeCompare(
            String(leftRequest.id || leftRequest.requestId || '')
          );
        });
      const filterStatus = sessionStorage.getItem('client_req_filter') || 'all';
      const reqs =
        filterStatus === 'all'
          ? allReqs
          : allReqs.filter(request => clientStatusGroup(request.status) === filterStatus);
      const groupCounts = {};
      allReqs.forEach(request => {
        const eventRequest = clientStatusGroup(request.status);
        groupCounts[eventRequest] = (groupCounts[eventRequest] || 0) + 1;
      });
      const dropdownOptions = CLIENT_STATUS_GROUPS.map(sg => {
        const cnt = sg.value === 'all' ? allReqs.length : groupCounts[sg.value] || 0;
        return `<option value="${sg.value}" ${filterStatus === sg.value ? 'selected' : ''}>${
          sg.label
        } (${cnt})</option>`;
      }).join('');
      return `
    <div class="page-hd">
      <div class="page-hd-left"><div class="page-title">Request Status</div><div class="page-sub">${
        allReqs.length
      } event request${allReqs.length !== 1 ? 's' : ''} total</div></div>
      <div class="page-hd-right" style="display:flex;gap:10px;align-items:center">
        <select id="client-req-status-filter" class="form-control" style="width:270px;font-size:13px" onchange="sessionStorage.setItem('client_req_filter',this.value);renderPage('request-status')" aria-label="Filter requests by status">${dropdownOptions}</select>
        <button class="btn btn-primary" onclick="goNav('find-organizers')">+ New Request</button>
      </div>
    </div>
    ${
      reqs.length === 0
        ? `<div class="empty"><div class="empty-icon">&#128203;</div><div class="empty-title">No requests${
            filterStatus !== 'all' ? ' with this status' : ' yet'
          }</div><p class="empty-desc">${
            filterStatus === 'all'
              ? 'Browse organizers and send them an event request to get started.'
              : 'Try a different status filter or create a new request.'
          }</p>${
            filterStatus === 'all'
              ? '<button class="btn btn-primary mt-16" onclick="goNav(\'find-organizers\')">Find Organizers</button>'
              : "<button class=\"btn btn-ghost mt-16\" onclick=\"sessionStorage.setItem('client_req_filter','all');renderPage('request-status')\">Show All Requests</button>"
          }</div>`
        : `<div style="display:flex;flex-direction:column;gap:14px">${reqs
            .map(
              request => `<div class="card">
      <div class="flex justify-between items-start">
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;margin-bottom:5px">${escapeHtml(
            request.title
          )}</div>
          <div class="small mb-8">${escapeHtml(request.type || 'Event')} &middot; ${
                request.guests
              } guests &middot; ${request.date}</div>
          <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px">${escapeHtml(
            request.desc || ''
          )}</p>
          <span class="badge badge-${reqBadge(request.status)}">${clientStatusReadable(
                request.status
              )}</span>
          ${clientRequestHistory(request)}
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:20px">
          <div style="font-size:22px;font-weight:800;color:var(--green)">&#8377;${(
            request.budget || 0
          ).toLocaleString()}</div>
          <div class="small">Budget</div>
        </div>
      </div>
      <div class="flex gap-8 mt-14">${clientRequestActions(request)}</div>
    </div>`
            )
            .join('')}</div>`
    }`;
    }
  }
  /* PORTAL_RUNTIME_END */
}
export default function RequestStatusPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
