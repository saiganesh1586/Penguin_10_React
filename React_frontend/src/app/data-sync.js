// Refresh the legacy browser model from the API without replacing forms the user is editing.
// Sequence and epoch counters prevent older responses from overwriting a newer account or refresh.
(() => {
  const roleNames = {
    super_admin: 'superuser',
    event_organizer: 'organizer',
  };
  const key = 'eventflow-data-change';
  const state = {
    identity: '',
    snapshot: null,
    flight: null,
    pending: false,
    rendering: 0,
    sequence: 0,
    epoch: 0,
    editedElement: null,
    disposed: false,
  };
  const payload = response => response?.data ?? response;
  const date = value => (value ? String(value).slice(0, 10) : '');
  const esc = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      char =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[char])
    );
  const current = () => (typeof CU !== 'undefined' ? CU : null);
  const database = () => (typeof DB !== 'undefined' ? DB : null);
  const field = id => document.getElementById(id)?.value?.trim() || '';
  const userId = user => user?.userId || user?.id;
  const identity = user => `${userId(user)}:${user?.token || ''}`;
  async function request(user, route, options = {}) {
    if (!user?.token && route !== '/auth/register')
      throw new Error('Sign in again to load your account data.');
    const response = await fetch((window.API_BASE_URL || 'http://localhost:3001/api') + route, {
      ...options,
      headers: {
        ...(user?.token
          ? {
              Authorization: `Bearer ${user.token}`,
            }
          : {}),
        ...(options.body instanceof FormData
          ? {}
          : {
              'Content-Type': 'application/json',
            }),
        ...options.headers,
      },
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        Array.isArray(result.message)
          ? result.message.join(', ')
          : result.message || 'The server could not save this change.'
      );
    return payload(result);
  }
  function normalizeUser(user) {
    return {
      ...user.profile,
      ...user,
      id: user.userId,
      role: roleNames[user.userRole] || user.userRole,
      employeeType:
        user.employeeType === 'FINANCE_EXECUTIVE' ? 'SUPPORT_FINANCE' : user.employeeType,
      phone: user.phoneNo || '',
      joined: date(user.createdAt),
      avatar: user.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      service: String(
        user.profile?.service || (user.employeeType ? 'Employee' : 'Event Organizer')
      ),
      eventTypes: String(user.profile?.eventCategories || '')
        .split(',')
        .filter(Boolean),
      rating: user.rating || 0,
    };
  }
  function apply(snapshot, user, db) {
    db.users = snapshot.users.map(item => normalizeUser(item));
    db.events = snapshot.events.map(event => ({
      ...event,
      id: event.eventId,
      title: event.name,
      price: event.ticketPrice,
      venue: event.location,
      organizer: event.organizerUserId,
      backendClientId: event.clientId,
      clientId: event.clientUserId,
      backendStatus: event.status,
      status:
        event.status === 'published'
          ? 'upcoming'
          : event.status === 'draft'
          ? 'pending'
          : event.status,
      emoji: '📅',
      color: '#7c6ff7',
      description: event.description || '',
    }));
    db.registrations = snapshot.registrations.map(registration => ({
      ...registration,
      id: registration.registrationId,
      backendAttendeeId: registration.attendeeId,
      attendeeId: registration.attendee?.userId || registration.attendeeId,
      date: registration.registrationDate,
      backendStatus: registration.status,
      status: registration.status === 'registered' ? 'confirmed' : registration.status,
      payment:
        registration.payment?.status === 'completed'
          ? 'paid'
          : registration.payment?.status ||
            (registration.event?.ticketPrice === 0 ? 'free' : 'pending'),
      amount: registration.payment?.amount || 0,
      verified: registration.reviewStatus === 'approved' || registration.status === 'attended',
      verificationStatus:
        registration.status === 'rejected'
          ? 'Rejected'
          : registration.reviewStatus === 'approved' || registration.status === 'attended'
          ? 'Verified'
          : registration.status === 'cancelled'
          ? 'Cancelled'
          : registration.status === 'no-show'
          ? 'No Show'
          : 'Pending Review',
      ticketId: registration.verificationId || registration.registrationId,
      checkedIn: registration.checkInStatus === 'checked-in' || registration.status === 'attended',
    }));
    db.eventRequests = snapshot.eventRequests.map(item => ({
      ...item,
      id: item.requestId,
      clientId: item.clientUserId,
      organizer: item.organizerUserId,
      title: item.eventName,
      type: item.eventType,
      date: item.eventDate,
      guests: item.capacity,
      desc: item.requirements,
      created: date(item.createdAt),
    }));
    db.eventPlans = snapshot.eventPlans.map(item => ({
      ...item,
      id: item.eventPlanId,
    }));
    db.notifications = snapshot.notifications.map(item => ({
      ...item,
      id: item.notificationId,
      notificationType: item.type,
      title:
        typeof notificationTitle === 'function'
          ? notificationTitle(item.type)
          : item.type.replaceAll('_', ' '),
      msg: item.message,
      time: new Date(item.dateTime).toLocaleString(),
      icon: '🔔',
    }));
    db.supportRequests = snapshot.supportTickets.map(item => ({
      ...item,
      id: item.ticketId,
      subject: item.concern,
      status: {
        open: 'Pending',
        in_progress: 'In Progress',
        resolved: 'Resolved',
      }[item.status],
      date: date(item.createdAt),
      updated: new Date(item.updatedAt).toLocaleString(),
    }));
    db.userQueries = [];
    db.eventOperationsTasks = db.supportRequests
      .filter(item => item.requestType === 'Event Related Issues')
      .map(item => ({
        ...item,
        backendTicket: true,
        type: item.concern,
        eventTitle: 'Event support',
        updated: item.updated,
      }));
    db.eventOpsRequests = [];
    db.financeTransactions = snapshot.payments.map(payment => {
      const registration = db.registrations.find(item => item.id === payment.registrationId);
      return {
        ...payment,
        kind: 'ticket',
        id: payment.paymentId,
        userId: registration?.attendeeId,
        eventId: registration?.eventId,
        status: {
          completed: 'Successful',
          pending: 'Pending',
          failed: 'Failed',
          refunded: 'Refunded',
        }[payment.status],
        date: payment.paymentDate,
        method: payment.paymentMethod,
      };
    });
    db.eventWorkflowPayments = snapshot.eventWorkflowPayments;
    db.financeTransactions.push(
      ...snapshot.eventWorkflowPayments.map(payment => ({
        ...payment,
        kind: 'event',
        id: payment.paymentId,
        userId: db.users.find(user => user.clientId === payment.clientId)?.id,
        status: payment.status === 'completed' ? 'Successful' : payment.status,
        date: payment.paymentDate,
        method: payment.paymentMethod,
      }))
    );
    db.financeRefunds = snapshot.refunds.map(refund => {
      const registration = db.registrations.find(item => item.id === refund.registrationId);
      return {
        ...refund,
        id: refund.refundId,
        userId: registration?.attendeeId,
        eventId: registration?.eventId,
        status: {
          pending: 'Requested',
          completed: 'Completed',
          failed: 'Failed',
          not_applicable: 'Not applicable',
        }[refund.status],
        date: date(refund.requestedAt),
      };
    });
    db.financeRefunds.push(
      ...(snapshot.eventWorkflowRefunds || []).map(refund => ({
        ...refund,
        id: refund.refundId,
        userId: db.users.find(user => user.clientId === refund.clientId)?.id,
        status: 'Requested',
        date: date(refund.requestedAt),
      }))
    );
    db.reports = [];
    db.operationalReports = snapshot.supportReports.map(report => ({
      ...report,
      id: report.reportId,
      backendReportId: report.reportId,
      type: report.category,
      owner: report.author,
      status: {
        draft: 'Draft',
        submitted: 'Submitted',
        reviewed: 'Reviewed',
      }[report.status],
      updated: date(report.updatedAt),
    }));
    const profile = normalizeUser(snapshot.currentUser);
    const previousType = user.employeeType;
    Object.assign(user, profile);
    if (
      previousType !== user.employeeType &&
      user.employeeType &&
      typeof buildEmployeeNav === 'function'
    )
      buildEmployeeNav(user.employeeType);
    try {
      sessionStorage.setItem('ef_cu', JSON.stringify(user));
    } catch {}
    if (typeof updateNotifDot === 'function') updateNotifDot();
    if (typeof updateHeaderUser === 'function') updateHeaderUser();
    const sidebarName = document.getElementById('sb-name');
    if (sidebarName && !user.employeeType) sidebarName.textContent = user.name;
  }
  async function sync(user = current(), db = database(), { force = true } = {}) {
    if (state.disposed || !user?.token || !db) return false;
    const session = identity(user);
    if (state.identity !== session)
      Object.assign(state, {
        identity: session,
        snapshot: null,
        flight: null,
        pending: false,
      });
    if (!force && state.snapshot) {
      apply(state.snapshot, user, db);
      return false;
    }
    if (!state.flight || state.flight.epoch !== state.epoch) {
      const flight = {
        promise: request(user, '/workspace'),
        epoch: state.epoch,
      };
      state.flight = flight;
      flight.promise
        .finally(() => {
          if (state.flight === flight) state.flight = null;
        })
        .catch(() => {});
    }
    const flight = state.flight;
    const snapshot = await flight.promise;
    if (
      state.disposed ||
      state.identity !== session ||
      !current() ||
      identity(current()) !== session
    )
      return false;
    if (flight.epoch !== state.epoch) return sync(user, db);
    const changed = state.snapshot?.version !== snapshot.version;
    state.snapshot = snapshot;
    apply(snapshot, user, db);
    return changed;
  }
  function invalidate() {
    state.epoch++;
    state.pending = true;
    try {
      localStorage.setItem(key, `${Date.now()}:${Math.random()}`);
    } catch {}
  }
  function editing() {
    return (
      state.editedElement?.isConnected ||
      document.querySelector(
        '#modal-overlay.open, #modal-overlay.show, #drawer-overlay.open, #confirm-overlay.open, .support-modal-overlay:not([hidden])'
      ) ||
      document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')
    );
  }
  async function refresh() {
    if (state.disposed || !current()?.token || document.hidden || state.rendering) return;
    try {
      // Do not replace form state while the user is editing or reviewing a report.
      if (editing()) {
        state.pending = true;
        return;
      }
      const changed = await sync();
      if (state.disposed) return;
      state.pending ||= changed;
      if (state.pending && typeof _currentPage !== 'undefined' && _currentPage) {
        state.pending = false;
        await window.renderPage(_currentPage, {
          cached: true,
        });
      }
    } catch (error) {
      if (state.disposed) return;
      const notice = document.getElementById('data-sync-notice');
      if (notice) notice.textContent = error.message;
    }
  }
  const mutations = new Set();
  async function registerAccount(user) {
    if (mutations.has('register')) return;
    mutations.add('register');
    try {
      const profileFields = [
        'dateOfBirth',
        'gender',
        'city',
        'interests',
        'organizationType',
        'organizationName',
        'organizationAddress',
        'yearsExperience',
        'eventCategories',
        'service',
        'previousExperience',
      ];
      const registered = await request(null, '/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          password: user.password,
          userRole:
            {
              organizer: 'event_organizer',
            }[user.role] || user.role,
          ...(user.phone
            ? {
                phoneNo: user.phone,
              }
            : {}),
          ...(user.address
            ? {
                address: user.address,
              }
            : {}),
          profile: Object.fromEntries(
            profileFields.filter(key => user[key] !== undefined).map(key => [key, user[key]])
          ),
        }),
      });
      invalidate();
      closeModal();
      if (registered.token) {
        CU = normalizeUser(registered);
        sessionStorage.setItem('ef_cu', JSON.stringify(CU));
        toast(`Account created! Welcome, ${CU.name}!`, 'success');
        if (!routeToRoleWorkspace(CU)) {
          initApp();
          showPage('app');
        }
      } else {
        openModal(
          'Registration Submitted',
          '<p>Your account was saved and is awaiting admin approval. You can sign in once it is activated.</p>',
          [
            {
              lbl: 'Sign In',
              cls: 'btn-primary',
              fn: "closeModal();showPage('login')",
            },
          ],
          false
        );
      }
      return registered;
    } finally {
      mutations.delete('register');
    }
  }
  async function mutate(id, action, message, { close = true, page } = {}) {
    if (mutations.has(id)) return;
    mutations.add(id);
    let saved = false;
    try {
      const result = await action();
      saved = true;
      if (state.disposed || !current()?.token) return result;
      state.editedElement = null;
      invalidate();
      if (close && typeof closeModal === 'function') closeModal();
      await sync();
      await window.renderPage(page || _currentPage, {
        cached: true,
      });
      if (typeof toast === 'function') toast(message, 'success');
      return result;
    } catch (error) {
      if (typeof toast === 'function')
        toast(
          saved ? `Saved, but the page could not refresh: ${error.message}` : error.message,
          'error'
        );
    } finally {
      mutations.delete(id);
    }
  }
  function patch(name, handler) {
    if (typeof window[name] === 'function') window[name] = handler;
  }
  const send = (route, method, body) =>
    request(current(), route, {
      method,
      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    });
  const findUser = id => database().users.find(user => String(user.id) === String(id));
  const isSupport = () => window.EventFlowAccountPolicy.isSupportExecutiveAccount(current());
  function customerRoute(id) {
    return `${isSupport() ? '/workspace/customers' : '/users'}/${encodeURIComponent(id)}`;
  }
  function manageUser(id, fields) {
    const target = findUser(id);
    if (!window.EventFlowAccountPolicy.canManageAccount(current(), target))
      return toast('Only an admin can change employee or admin accounts.', 'error');
    if (fields.role && fields.role !== target.role)
      return toast('Account roles cannot be changed from this form.', 'error');
    if (!fields.name || !fields.email?.includes('@'))
      return toast('Enter a name and valid email.', 'error');
    return mutate(
      `user:${id}`,
      () =>
        send(customerRoute(id), 'PATCH', {
          name: fields.name,
          email: fields.email,
          ...(fields.phone
            ? {
                phoneNo: fields.phone,
              }
            : {}),
          ...(fields.status
            ? {
                status: fields.status === 'deactivated' ? 'inactive' : fields.status,
              }
            : {}),
        }),
      'User details updated'
    );
  }
  function install() {
    const render = window.renderPage;
    if (render)
      window.renderPage = async function (pg, { cached = false } = {}) {
        if (state.disposed) return;
        const sequence = ++state.sequence;
        state.rendering++;
        _currentPage = pg;
        const session = current() ? identity(current()) : '';
        try {
          if (current() && !current().token)
            throw new Error('Sign in again to load your account data.');
          await sync(current(), database(), {
            force: !cached,
          });
          if (
            state.disposed ||
            sequence !== state.sequence ||
            _currentPage !== pg ||
            (session && (!current() || identity(current()) !== session))
          )
            return;
          await render(pg);
        } catch (error) {
          if (state.disposed || sequence !== state.sequence || _currentPage !== pg) return;
          const container = document.getElementById('page-content');
          window.EventFlowReactPages?.clear(container);
          if (container)
            container.innerHTML = `<div class="empty"><div class="empty-title">Data could not be loaded</div><p class="empty-desc" id="data-sync-notice" role="status">${esc(
              error.message
            )}</p><button class="btn btn-primary" type="button" data-sync-retry>Try Again</button></div>`;
          container
            ?.querySelector('[data-sync-retry]')
            ?.addEventListener('click', () => window.renderPage(pg));
        } finally {
          state.rendering--;
        }
      };
    patch('saveEditUser', id =>
      manageUser(id, {
        name: field('edit-usr-name'),
        email: field('edit-usr-email'),
        phone: field('edit-usr-phone'),
        role: field('edit-usr-role'),
      })
    );
    patch('saveUser', id =>
      manageUser(id, {
        name: field('um-edit-name'),
        email: field('um-edit-email'),
        phone: field('um-edit-phone'),
        role: field('um-edit-role'),
        status: field('um-edit-status'),
      })
    );
    patch('toggleUserStatus', id => {
      const target = findUser(id);
      if (!window.EventFlowAccountPolicy.canManageAccount(current(), target))
        return toast('Only an admin can change employee or admin accounts.', 'error');
      return mutate(
        `user:${id}`,
        () =>
          send(customerRoute(id), 'PATCH', {
            status: target.status === 'active' ? 'inactive' : 'active',
          }),
        'Account status updated',
        {
          close: false,
        }
      );
    });
    for (const name of ['deleteUserOps', 'removeUser'])
      patch(name, id => {
        if (!window.EventFlowAccountPolicy.canManageAccount(current(), findUser(id)))
          return toast('Only an admin can change employee or admin accounts.', 'error');
        confirm2('Delete User', 'Permanently delete this user account?', () =>
          mutate(`user:${id}`, () => send(customerRoute(id), 'DELETE'), 'User deleted', {
            close: false,
          })
        );
      });
    patch('saveSettings', () => {
      const name = field('st-name');
      const email = field('st-email');
      const phone = field('st-phone');
      if (!name || !email.includes('@')) return toast('Enter a name and valid email.', 'error');
      return mutate(
        'profile',
        () =>
          send(`/users/${encodeURIComponent(userId(current()))}`, 'PATCH', {
            name,
            email,
            bio: field('st-bio'),
            ...(phone
              ? {
                  phoneNo: phone,
                }
              : {}),
          }),
        'Settings saved successfully',
        {
          close: false,
        }
      );
    });
    patch('changePass', () => {
      const currentPassword = field('st-cur');
      const newPassword = field('st-new');
      if (!currentPassword || newPassword.length < 6)
        return toast(
          'Enter your current password and a new password of at least 6 characters.',
          'error'
        );
      if (newPassword !== field('st-conf')) return toast('Passwords do not match.', 'error');
      return mutate(
        'password',
        () =>
          send('/auth/password', 'POST', {
            currentPassword,
            newPassword,
          }),
        'Password changed successfully',
        {
          close: false,
        }
      );
    });
    function review(id, decision, reason) {
      return mutate(
        `registration:${id}`,
        () =>
          send(`/registrations/${encodeURIComponent(id)}/review`, 'PATCH', {
            decision,
            ...(reason
              ? {
                  reason,
                }
              : {}),
          }),
        'Registration review saved'
      );
    }
    for (const name of ['approveRegistrationDirect', 'approveVerificationDirect'])
      patch(name, id => review(id, 'approved'));
    patch('confirmRejectRegistration', id => {
      const reason = field('reject-reason-custom') || field('reject-reason-preset');
      if (reason.length < 10)
        return toast('Explain the decline in at least 10 characters.', 'error');
      return review(id, 'rejected', reason);
    });
    patch('rejectRegistrationDirect', id => openRejectRegistrationWithReasonModal(id));
    const eventStatus = value =>
      ({
        Pending: 'draft',
        pending: 'draft',
        Active: 'published',
        upcoming: 'published',
        full: 'published',
        Completed: 'completed',
        Cancelled: 'cancelled',
      }[value] || value);
    const eventRoute = id =>
      `${isSupport() ? '/workspace/events' : '/events'}/${encodeURIComponent(id)}`;
    patch('setEventOpsStatus', (id, status) =>
      mutate(
        `event:${id}`,
        () =>
          send(eventRoute(id), isSupport() ? 'PATCH' : 'PUT', {
            status: eventStatus(status),
          }),
        'Event status updated',
        {
          close: false,
        }
      )
    );
    patch('approveEventOpsDirect', id => window.setEventOpsStatus(id, 'published'));
    patch('rejectEventOpsDirect', id =>
      confirm2('Cancel Event', 'Cancel this event and notify affected attendees?', () =>
        window.setEventOpsStatus(id, 'cancelled')
      )
    );
    patch('saveNewEvent', () => {
      const name = field('ne-title');
      const venue = field('ne-venue');
      const date = field('ne-date');
      const capacity = Number(field('ne-cap'));
      if (!name || !venue || !date || capacity < 1)
        return toast('Enter the title, venue, date, and a valid capacity.', 'error');
      const dateError = EventFlowEventDates.validateEventLeadTime(date);
      if (dateError) return toast(dateError, 'error');
      return mutate(
        'new-event',
        () =>
          send('/events', 'POST', {
            name,
            date,
            location: venue,
            capacity,
            time: field('ne-time') || '09:00',
            category: field('ne-cat') || 'Conference',
            city: field('ne-city'),
            ticketPrice: Number(field('ne-price')) || 0,
            visibility: field('ne-visibility') || 'public',
            status: eventStatus(field('ne-status') || 'published'),
            description: field('ne-desc'),
            organizerId: current().organizerId || userId(current()),
          }),
        'Event created'
      );
    });
    patch('saveEditEvent', id =>
      mutate(
        `event:${id}`,
        () =>
          send(eventRoute(id), isSupport() ? 'PATCH' : 'PUT', {
            name: field('ee-title'),
            date: field('ee-date'),
            time: field('ee-time'),
            location: field('ee-venue'),
            category: field('ee-category') || undefined,
            capacity: Number(field('ee-cap')),
            ticketPrice: Number(field('ee-price')),
            ...(field('ee-status')
              ? {
                  status: eventStatus(field('ee-status')),
                }
              : {}),
            description: field('ee-desc'),
          }),
        'Event updated'
      )
    );
    for (const name of ['deleteEvent', 'deleteEventOps']) {
      patch(name, id => {
        if (typeof window.handleOrganizerDeleteEvent === 'function') {
          return window.handleOrganizerDeleteEvent(id);
        }
        const db = database();
        const ev = (db?.events || []).find(
          event => String(event.id) === String(id) || String(event.eventId) === String(id)
        );
        const isDraft =
          ev && (ev.backendStatus === 'draft' || ev.status === 'draft' || ev.status === 'pending');
        const regCount = (db?.registrations || []).filter(
          registration =>
            String(registration.eventId) === String(id) ||
            String(registration.eventId) === String(ev?.id) ||
            String(registration.eventId) === String(ev?.eventId)
        ).length;
        if (ev && (!isDraft || regCount > 0)) {
          if (typeof window.openOrganizerEventCancellationModal === 'function') {
            return window.openOrganizerEventCancellationModal(id);
          }
          return toast(
            'Only draft events without registrations can be deleted; cancel an active event instead.',
            'error'
          );
        }
        const evName = ev?.title || ev?.name || 'Draft Event';
        if (typeof openModal === 'function') {
          openModal(
            'Delete Draft Event',
            `
            <div style="font-size:13.5px;color:var(--text);margin-bottom:12px;line-height:1.6">
              Are you sure you want to permanently delete the draft event <strong>${esc(
                evName
              )}</strong>?
            </div>
            <div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;color:var(--text2);margin-bottom:12px">
              <div><strong>Event:</strong> ${esc(evName)}</div>
              <div><strong>Status:</strong> <span class="badge badge-amber">Draft</span></div>
              <div><strong>Registrations:</strong> 0</div>
              <div style="margin-top:6px;font-size:12px;color:var(--text3)">
                This draft event has no registrations or ticket history and can be safely deleted. This action cannot be undone.
              </div>
            </div>
          `,
            [
              {
                lbl: 'Keep Event',
                cls: 'btn-ghost',
                fn: 'closeModal()',
              },
              {
                lbl: 'Delete Event',
                cls: 'btn-danger',
                fn: `confirmDeleteDraftEvent('${encodeURIComponent(id)}')`,
              },
            ]
          );
        } else {
          confirm2('Delete Draft Event', `Permanently delete draft event "${evName}"?`, () =>
            mutate(
              `event:${id}`,
              () => send(`/events/${encodeURIComponent(id)}`, 'DELETE'),
              'Draft event deleted',
              {
                close: false,
              }
            )
          );
        }
      });
    }
    patch('confirmDeleteDraftEvent', id =>
      mutate(
        `event:${id}`,
        () => send(`/events/${encodeURIComponent(id)}`, 'DELETE'),
        'Draft event deleted successfully',
        {
          close: true,
        }
      )
    );
    patch('markNotifRead', id =>
      mutate(
        `notification:${id}`,
        () => send(`/notifications/${encodeURIComponent(id)}/read`, 'PATCH'),
        'Notification marked as read',
        {
          close: false,
        }
      )
    );
    patch('markAllRead', () =>
      mutate(
        'notifications',
        () => send('/notifications/read-all', 'PATCH'),
        'Notifications marked as read',
        {
          close: false,
        }
      )
    );
    let operationalReference;
    function saveOperational(submitted) {
      const title = field(submitted ? 'op-submit-title' : 'op-report-title');
      if (!title) return toast('Enter a report title.', 'error');
      operationalReference ||= `form:operational:${crypto.randomUUID()}`;
      const db = database();
      const revenue = db.financeTransactions
        .filter(item => item.status === 'Successful')
        .reduce((sum, item) => sum + item.amount, 0);
      return mutate(
        'operational-report',
        async () => {
          const result = await send('/reports/operational', 'POST', {
            title,
            category: field(submitted ? 'op-submit-type' : 'op-report-type'),
            scope: 'Platform Wide',
            period: new Date().toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            }),
            summary: `Registration revenue: ₹${revenue.toLocaleString('en-IN')}. ${
              db.financeTransactions.length
            } payment records and ${db.financeRefunds.length} refund records. ${
              db.supportRequests.filter(item => item.status !== 'Resolved').length
            } open customer requests.`,
            status: submitted ? 'submitted' : 'draft',
            sourceReference: operationalReference,
          });
          operationalReference = null;
          return result;
        },
        submitted ? 'Report submitted to admin' : 'Report saved as draft'
      );
    }
    patch('saveOperationalReport', () => saveOperational(false));
    patch('submitNewOperationalReport', () => saveOperational(true));
    patch('submitOperationalReport', id =>
      mutate(
        `report:${id}`,
        () => send(`/reports/operational/${encodeURIComponent(id)}/submit`, 'POST'),
        'Report submitted to admin'
      )
    );
    patch('verifyRegisterOtp', async () => {
      if (!pendingRegistration || Date.now() > pendingRegistration.expiresAt)
        return toast('OTP expired. Please create your account again.', 'error');
      if (field('rg-otp') !== pendingRegistration.otp)
        return toast('Incorrect OTP. Please try again.', 'error');
      try {
        const registered = await registerAccount(pendingRegistration.user);
        if (registered) pendingRegistration = null;
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  }
  function dispose() {
    state.disposed = true;
    state.sequence++;
    clearInterval(timer);
    document.removeEventListener('input', onInput);
    window.removeEventListener('focus', refresh);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('storage', onStorage);
  }
  window.EventFlowData = {
    sync,
    invalidate,
    refresh,
    request,
    apply,
    mutate,
    registerAccount,
    normalizeUser,
    dispose,
  };
  install();
  function onInput(event) {
    const target = event.target;
    if (
      target?.closest?.('#page-content') &&
      !target.closest('.support-modal, #modal-overlay') &&
      target.type !== 'search' &&
      !/search|filter|query|(?:^|-)q$/i.test(`${target.id || ''} ${target.placeholder || ''}`)
    )
      state.editedElement = target;
  }
  function onVisibility() {
    if (!document.hidden) refresh();
  }
  function onStorage(event) {
    if (event.key === key) {
      state.pending = true;
      refresh();
    }
  }
  document.addEventListener('input', onInput);
  const timer = setInterval(refresh, 8000);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('storage', onStorage);
})();
