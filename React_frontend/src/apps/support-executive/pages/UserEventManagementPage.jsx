import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageUserAndEventManagement() {
    const activeTab = sessionStorage.getItem('uem_active_tab') || 'users';
    const users = window.EventFlowAccountPolicy.visibleAccounts(CU, DB.users || []);
    const events = DB.events || [];
    const regs = DB.registrations || [];

    // Tab 1: Users data filtering
    const userQ = (sessionStorage.getItem('uem_user_q') || '').toLowerCase();
    const userRole = sessionStorage.getItem('uem_user_role') || '';
    const userSt = sessionStorage.getItem('uem_user_st') || '';
    const filteredUsers = users.filter(user => {
      const matchesQuery =
        !userQ ||
        `${user.name} ${user.email} ${user.phone} ${user.role} ${user.id}`
          .toLowerCase()
          .includes(userQ);
      const matchesRole = !userRole || user.role === userRole;
      const isDeactivated = user.status === 'deactivated' || user.status === 'inactive';
      const matchesStatus = !userSt || (userSt === 'active' ? !isDeactivated : isDeactivated);
      return matchesQuery && matchesRole && matchesStatus;
    });

    // Tab 2: Events & Registrations filtering
    const eventQ = (sessionStorage.getItem('uem_event_q') || '').toLowerCase();
    const eventSt = sessionStorage.getItem('uem_event_st') || '';
    const eventCat = sessionStorage.getItem('uem_event_cat') || '';
    const filteredEvents = events.filter(event => {
      const matchesQuery =
        !eventQ ||
        `${event.id} ${event.title || event.name} ${event.category} ${event.venue} ${event.city}`
          .toLowerCase()
          .includes(eventQ);
      const currentSt = formatEventStatus(event.status);
      const matchesStatus = !eventSt || currentSt === eventSt;
      const matchesCat = !eventCat || event.category === eventCat;
      return matchesQuery && matchesStatus && matchesCat;
    });
    const regQ = (sessionStorage.getItem('uem_reg_q') || '').toLowerCase();
    const regSt = sessionStorage.getItem('uem_reg_st') || '';
    const filteredRegs = regs.filter(registration => {
      const attendee = users.find(user => String(user.id) === String(registration.attendeeId)) || {
        name: '',
        email: '',
      };
      const event = events.find(
        currentEvent => String(currentEvent.id) === String(registration.eventId)
      ) || {
        title: '',
      };
      const searchStr = `${registration.id} ${registration.ticketId || ''} ${attendee.name} ${
        attendee.email
      } ${event.title}`.toLowerCase();
      const matchesQuery = !regQ || searchStr.includes(regQ);
      const currentRegSt =
        registration.verificationStatus ||
        (registration.status === 'confirmed' ? 'Verified' : 'Pending Review');
      let matchesStatus = true;
      if (regSt) {
        if (regSt === 'Pending Review') {
          matchesStatus = currentRegSt === 'Pending Review' || currentRegSt === 'Pending';
        } else if (regSt === 'Verified' || regSt === 'Confirmed') {
          matchesStatus = currentRegSt === 'Verified';
        } else if (regSt === 'Flagged') {
          matchesStatus = currentRegSt === 'Flagged';
        } else if (regSt === 'Rejected') {
          matchesStatus = currentRegSt === 'Rejected' || registration.status === 'rejected';
        } else if (regSt === 'Cancelled') {
          matchesStatus = registration.status === 'cancelled';
        }
      }
      return matchesQuery && matchesStatus;
    });
    return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">User &amp; Event Management</div>
            <div class="page-sub">Authorized account administration, event review &amp; status management, and registration verification.</div>
          </div>
        </div>

        <div class="tabs-nav flex gap-8 mb-20" style="border-bottom:1px solid var(--border);padding-bottom:12px">
          <button class="btn ${
            activeTab === 'users' ? 'btn-primary' : 'btn-ghost'
          }" onclick="setUemTab('users')">👥 Users (${users.length})</button>
          <button class="btn ${
            activeTab === 'events' ? 'btn-primary' : 'btn-ghost'
          }" onclick="setUemTab('events')">🗓️ Events &amp; Registrations (${
      events.length
    } Events · ${regs.length} Regs)</button>
        </div>

        ${
          activeTab === 'users'
            ? `
          <!-- TAB 1: USERS -->

          <div class="filter-row">
            <div class="search-box input-group">
              <span class="input-icon">🔍</span>
              <input class="form-control" id="uem-user-q" placeholder="Search users by name, email, phone, role..." value="${userQ}" oninput="refreshUemUsers()">
            </div>
            <select class="form-control filter-select" id="uem-user-role" onchange="refreshUemUsers()">
              <option value="">All Roles</option>
              <option value="attendee" ${
                userRole === 'attendee' ? 'selected' : ''
              }>Attendee</option>
              <option value="client" ${userRole === 'client' ? 'selected' : ''}>Client</option>
              <option value="organizer" ${
                userRole === 'organizer' ? 'selected' : ''
              }>Organizer</option>
              ${
                window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU)
                  ? ''
                  : `<option value="employee" ${
                      userRole === 'employee' ? 'selected' : ''
                    }>Employees</option>`
              }
            </select>
            <select class="form-control filter-select" id="uem-user-st" onchange="refreshUemUsers()">
              <option value="">All Account Statuses</option>
              <option value="active" ${userSt === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${
                userSt === 'inactive' ? 'selected' : ''
              }>Deactivated / Inactive</option>
            </select>
          </div>

          <div class="card">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User ID &amp; Name</th>
                    <th>Contact Info</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    filteredUsers
                      .map(u => {
                        const isDeactivated = u.status === 'deactivated' || u.status === 'inactive';
                        return `
                      <tr>
                        <td>
                          <div class="flex items-center gap-10">
                            <div class="av av-xs">${u.avatar || u.name[0]}</div>
                            <div>
                              <div style="font-weight:700;font-size:14px;color:var(--text)">${
                                u.name
                              }</div>
                              <div class="small muted">ID: ${u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>${u.email}</div>
                          <div class="small muted">📞 ${u.phone || '—'}</div>
                        </td>
                        <td><span class="badge badge-purple">${u.role}</span></td>
                        <td>
                          <span class="badge badge-${isDeactivated ? 'red' : 'green'}">${
                          isDeactivated ? 'Deactivated' : 'Active'
                        }</span>
                        </td>
                        <td>
                          ${
                            window.EventFlowAccountPolicy.canManageAccount(CU, u)
                              ? `<div class="flex items-center gap-6">
                            <button class="btn btn-ghost btn-xs" onclick="openEditUserModal('${
                              u.id
                            }')" title="Edit User">✏️ Edit</button>
                            <button class="btn btn-xs ${
                              isDeactivated ? 'btn-success' : 'btn-danger'
                            }" onclick="toggleUserStatus('${u.id}')" title="Toggle Account Status">
                              ${isDeactivated ? 'Activate' : 'Deactivate'}
                            </button>
                          </div>`
                              : '<span class="small muted">Admin managed</span>'
                          }
                        </td>
                      </tr>
                    `;
                      })
                      .join('') ||
                    '<tr><td colspan="5" class="text-center py-20">No matching user accounts found.</td></tr>'
                  }
                </tbody>
              </table>
            </div>
          </div>
        `
            : `
          <!-- TAB 2: EVENTS & REGISTRATIONS -->
          <!-- SECTION A: EVENT MANAGEMENT -->
          <div class="mb-24">
            <div class="flex justify-between items-center mb-12">
              <div>
                <div class="h4">Event Management</div>
                <div class="small muted">Manage event publication, venue capacity, dates, and approval workflow.</div>
              </div>
            </div>

            <div class="filter-row">
              <div class="search-box input-group">
                <span class="input-icon">🔍</span>
                <input class="form-control" id="uem-event-q" placeholder="Search events by title, venue, city..." value="${eventQ}" oninput="refreshUemEvents()">
              </div>
              <select class="form-control filter-select" id="uem-event-st" onchange="refreshUemEvents()">
                <option value="">All Event Statuses</option>
                <option value="Pending" ${
                  eventSt === 'Pending' ? 'selected' : ''
                }>Pending Approval</option>
                <option value="Active" ${
                  eventSt === 'Active' ? 'selected' : ''
                }>Active / Published</option>
                <option value="Completed" ${
                  eventSt === 'Completed' ? 'selected' : ''
                }>Completed</option>
                <option value="Cancelled" ${
                  eventSt === 'Cancelled' ? 'selected' : ''
                }>Cancelled</option>
              </select>
              <select class="form-control filter-select" id="uem-event-cat" onchange="refreshUemEvents()">
                <option value="">All Categories</option>
                ${[...new Set(events.map(event => event.category).filter(Boolean))]
                  .map(
                    cat =>
                      `<option value="${cat}" ${eventCat === cat ? 'selected' : ''}>${cat}</option>`
                  )
                  .join('')}
              </select>
            </div>

            <div class="card mb-20">
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event Title &amp; ID</th>
                      <th>Category</th>
                      <th>Date &amp; Venue</th>
                      <th>Capacity &amp; Regs</th>
                      <th>Status</th>
                      <th>Update Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      filteredEvents
                        .map(event => {
                          const currentStatus = formatEventStatus(event.status);
                          const isPending = currentStatus === 'Pending';
                          const isFull = (event.registered || 0) >= (event.capacity || 100);
                          return `
                        <tr>
                          <td>
                            <div style="font-weight:700;font-size:14px;color:var(--text)">${
                              event.title || event.name
                            }</div>
                            <div class="small muted">ID: ${event.id}</div>
                          </td>
                          <td><span class="badge badge-purple">${
                            event.category || 'General'
                          }</span></td>
                          <td>
                            <div>📅 ${event.date || 'TBD'}</div>
                            <div class="small muted">📍 ${
                              event.venue || event.location || 'TBD'
                            } (${event.city || 'India'})</div>
                          </td>
                          <td>
                            <div><strong>${event.registered || 0}</strong> / ${
                            event.capacity || 100
                          }</div>
                            <div class="small muted">${
                              isFull
                                ? '<span style="color:var(--yellow);font-weight:600">Full</span>'
                                : event.price
                                ? '₹' + event.price
                                : 'Free'
                            }</div>
                          </td>
                          <td>
                            <span class="badge badge-${eventOpsStatusBadge(
                              event.status
                            )}">${currentStatus}</span>
                          </td>
                          <td>
                            <select class="form-control form-control-sm" style="padding:4px 8px;font-size:12px" onchange="setEventOpsStatus('${
                              event.id
                            }', this.value)">
                              <option value="Pending" ${
                                currentStatus === 'Pending' ? 'selected' : ''
                              }>Pending</option>
                              <option value="Active" ${
                                currentStatus === 'Active' ? 'selected' : ''
                              }>Active</option>
                              <option value="Completed" ${
                                currentStatus === 'Completed' ? 'selected' : ''
                              }>Completed</option>
                              <option value="Cancelled" ${
                                currentStatus === 'Cancelled' ? 'selected' : ''
                              }>Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <div class="flex items-center gap-6">
                              <button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('${
                                event.id
                              }')" title="View Details">👁️</button>
                              <button class="btn btn-ghost btn-xs" onclick="openEditEventModal('${
                                event.id
                              }')" title="Edit Event">✏️</button>
                              ${
                                isPending
                                  ? `
                                <button class="btn btn-success btn-xs" onclick="approveEventOpsDirect('${event.id}')" title="Approve">✓</button>
                                <button class="btn btn-danger btn-xs" onclick="rejectEventOpsDirect('${event.id}')" title="Reject">✕</button>
                              `
                                  : ''
                              }
                            </div>
                          </td>
                        </tr>
                      `;
                        })
                        .join('') ||
                      '<tr><td colspan="7" class="text-center py-20">No matching events found.</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- SECTION B: REGISTRATIONS MANAGEMENT -->
          <div>
            <div class="flex justify-between items-center mb-12">
              <div>
                <div class="h4">Registrations &amp; Verification</div>
                <div class="small muted">Review online ticket bookings, payment status, verification documents, and approve or reject with reasons.</div>
              </div>
            </div>

            <div class="filter-row">
              <div class="search-box input-group">
                <span class="input-icon">🔍</span>
                <input class="form-control" id="uem-reg-q" placeholder="Search by Ticket ID, Attendee, or Event..." value="${regQ}" oninput="refreshUemRegistrations()">
              </div>
              <select class="form-control filter-select" id="uem-reg-st" onchange="refreshUemRegistrations()">
                <option value="">All Registration Statuses</option>
                <option value="Pending Review" ${
                  regSt === 'Pending Review' ? 'selected' : ''
                }>Pending Review</option>
                <option value="Verified" ${
                  regSt === 'Verified' ? 'selected' : ''
                }>Verified / Confirmed</option>
                <option value="Flagged" ${regSt === 'Flagged' ? 'selected' : ''}>Flagged</option>
                <option value="Rejected" ${regSt === 'Rejected' ? 'selected' : ''}>Rejected</option>
                <option value="Cancelled" ${
                  regSt === 'Cancelled' ? 'selected' : ''
                }>Cancelled</option>
              </select>
            </div>

            <div class="card">
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket / Reg ID</th>
                      <th>Attendee</th>
                      <th>Event</th>
                      <th>Document</th>
                      <th>Payment Status</th>
                      <th>Verification Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      filteredRegs
                        .map(registration => {
                          const attendee = users.find(
                            user => String(user.id) === String(registration.attendeeId)
                          ) || {
                            name: 'Attendee',
                            email: '—',
                          };
                          const event = events.find(
                            currentEvent => String(currentEvent.id) === String(registration.eventId)
                          ) || {
                            title: 'Event',
                          };
                          const isPending =
                            !registration.reviewStatus &&
                            !['rejected', 'cancelled', 'attended', 'no-show'].includes(
                              registration.status
                            ) &&
                            (registration.status === 'pending' ||
                              registration.verificationStatus === 'Pending Review');
                          const paymentStatus =
                            registration.payment === 'paid'
                              ? 'Paid'
                              : registration.amount === 0
                              ? 'Free'
                              : registration.payment || 'Pending Payment';
                          const regStatus =
                            registration.verificationStatus ||
                            (registration.status === 'confirmed' ? 'Verified' : 'Pending Review');
                          return `
                        <tr>
                          <td class="mono"><strong>${
                            registration.ticketId || registration.id
                          }</strong></td>
                          <td>
                            <div style="font-weight:700;font-size:13.5px;color:var(--text)">${
                              attendee.name
                            }</div>
                            <div class="small muted">${attendee.email}</div>
                          </td>
                          <td>
                            <div>${event.title}</div>
                            <div class="small muted">${registration.date || 'Today'}</div>
                          </td>
                          <td>
                            <div class="small"><strong>${
                              registration.docType || 'Govt ID'
                            }</strong></div>
                            <div class="small muted mono">${
                              registration.docRef || 'REF-' + registration.id
                            }</div>
                          </td>
                          <td>
                            <span class="badge badge-${
                              paymentStatus === 'Paid'
                                ? 'green'
                                : paymentStatus === 'Free'
                                ? 'blue'
                                : 'yellow'
                            }">
                              ${paymentStatus} ${
                            registration.amount ? '(₹' + registration.amount + ')' : ''
                          }
                            </span>
                          </td>
                          <td>
                            <span class="badge badge-${
                              regStatus === 'Verified'
                                ? 'green'
                                : regStatus === 'Flagged'
                                ? 'yellow'
                                : regStatus === 'Rejected'
                                ? 'red'
                                : 'purple'
                            }">
                              ${regStatus}
                            </span>
                          </td>
                          <td>
                            <div class="flex items-center gap-6">
                              <button class="btn btn-ghost btn-xs" onclick="openReviewRegistrationModal('${
                                registration.id
                              }')">Review</button>
                              ${
                                isPending
                                  ? `
                                <button class="btn btn-success btn-xs" onclick="approveRegistrationDirect('${registration.id}')" title="Approve">✓</button>
                                <button class="btn btn-danger btn-xs" onclick="openRejectRegistrationWithReasonModal('${registration.id}')" title="Reject with Reason">✕</button>
                              `
                                  : ''
                              }
                            </div>
                          </td>
                        </tr>
                      `;
                        })
                        .join('') ||
                      '<tr><td colspan="7" class="text-center py-20">No matching registrations found.</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
        }
      `;
  }
  /* PORTAL_RUNTIME_END */
}
export default function UserEventManagementPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
