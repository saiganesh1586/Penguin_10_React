// Browser actions for the admin workspace. App.jsx assembles this script with API, state,
// and page sections. Keep global handler names stable because existing HTML calls them.
// DB is the legacy browser model; CU is the signed-in user.
/* PORTAL_SECTION_api */ /* PORTAL_SECTION_state */ /* ===== EventFlow source: main.js ===== */
// ═══════════════════════════════════════════════════════════════
// UI RENDERING & HELPER FUNCTIONS - EventFlow Platform
// Dynamically renders all UI components based on state
// ═══════════════════════════════════════════════════════════════

// ═══════════════════ RENDER: TABLES ═══════════════════

function renderUsersTable(containerId, users = null) {
  users = users || AppState.users;
  const container = document.getElementById(containerId);
  if (!container) return;
  const html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            user => `
          <tr class="table-row">
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge badge-${user.role}">${user.role}</span></td>
            <td>${escapeHtml(user.phone)}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td class="action-buttons">
              <button class="btn-small btn-edit" onclick="editUserHandler('${
                user.id
              }')">Edit</button>
              <button class="btn-small btn-delete" onclick="deleteUserHandler('${
                user.id
              }')">Delete</button>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
  globalThis.window?.EventFlowAdminPages?.clear(container);
  container.innerHTML = html;
}
function renderEventsTable(containerId, events = null) {
  events = events || AppState.events;
  const container = document.getElementById(containerId);
  if (!container) return;
  const html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Event Title</th>
          <th>Date</th>
          <th>City</th>
          <th>Capacity</th>
          <th>Registered</th>
          <th>Price (₹)</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${events
          .map(
            event => `
          <tr class="table-row">
            <td><strong>${escapeHtml(event.title)}</strong></td>
            <td>${event.date}</td>
            <td>${escapeHtml(event.city)}</td>
            <td>${event.capacity}</td>
            <td>${event.registered}/${event.capacity}</td>
            <td>₹${event.price}</td>
            <td><span class="status-badge status-${event.status}">${event.status}</span></td>
            <td class="action-buttons">
              <button class="btn-small btn-edit" onclick="editEventHandler('${
                event.id
              }')">Edit</button>
              <button class="btn-small btn-delete" onclick="deleteEventHandler('${
                event.id
              }')">Delete</button>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
  globalThis.window?.EventFlowAdminPages?.clear(container);
  container.innerHTML = html;
}
function renderRegistrationsTable(containerId, registrations = null) {
  registrations = registrations || AppState.registrations;
  const container = document.getElementById(containerId);
  if (!container) return;
  const html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Ticket ID</th>
          <th>Attendee</th>
          <th>Event</th>
          <th>Date</th>
          <th>Status</th>
          <th>Checked In</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${registrations
          .map(registration => {
            const attendee = findUser(registration.attendeeId);
            const event = findEvent(registration.eventId);
            return `
            <tr class="table-row">
              <td><code>${registration.ticketId}</code></td>
              <td>${escapeHtml(attendee?.name || 'Unknown')}</td>
              <td>${escapeHtml(event?.title || 'Unknown')}</td>
              <td>${registration.date}</td>
              <td><span class="status-badge status-${registration.status}">${
              registration.status
            }</span></td>
              <td>${registration.checkedIn ? '✓' : '−'}</td>
              <td class="action-buttons">
                ${
                  !registration.checkedIn
                    ? `<button class="btn-small btn-success" onclick="checkInHandler('${registration.id}')">Check In</button>`
                    : ''
                }
                <button class="btn-small btn-delete" onclick="cancelRegistrationHandler('${
                  registration.id
                }')">Cancel</button>
              </td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
    </table>
  `;
  globalThis.window?.EventFlowAdminPages?.clear(container);
  container.innerHTML = html;
}

// ═══════════════════ RENDER: EVENT CARDS ═══════════════════

function renderEventCards(containerId, events = null, isAttendee = false) {
  events = events || AppState.events;
  const container = document.getElementById(containerId);
  if (!container) return;
  const html = `
    <div class="event-cards-grid">
      ${events
        .map(event => {
          const userReg = AppState.registrations.find(
            registration =>
              registration.eventId === event.id &&
              AppState.currentUser &&
              registration.attendeeId === AppState.currentUser.id
          );
          const isFull = event.registered >= event.capacity;
          const isRegistered = !!userReg;
          return `
          <div class="event-card">
            ${
              event.image
                ? `
              <div class="event-card-banner" style="height:130px;overflow:hidden;border-radius:8px 8px 0 0;margin:-16px -16px 12px -16px;position:relative">
                <img src="${event.image}" alt="${escapeHtml(
                    event.title
                  )}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='none'">
              </div>
            `
                : ''
            }
            <div class="event-card-header">
              <h3>${escapeHtml(event.title)}</h3>
              <span class="badge badge-${(event.category || '').toLowerCase()}">${
            event.category
          }</span>
            </div>
            <div class="event-card-body">
              <p class="event-date">📅 ${event.date} at ${event.time}</p>
              <p class="event-location">📍 ${escapeHtml(event.city)}</p>
              <p class="event-description">${escapeHtml(event.description)}</p>
              <div class="event-capacity">
                <span>${event.registered}/${event.capacity} registered</span>
                <div class="progress-bar">
                  <div class="progress" style="width: ${
                    (event.registered / event.capacity) * 100
                  }%"></div>
                </div>
              </div>
              <p class="event-price"><strong>₹${event.price}</strong>${
            event.price === 0 ? ' (FREE)' : ''
          }</p>
            </div>
            <div class="event-card-footer">
              ${
                isAttendee
                  ? `
                ${
                  isRegistered
                    ? `<button class="btn btn-secondary" disabled>Registered ✓</button>`
                    : `<button class="btn btn-primary" onclick="quickRegisterHandler('${
                        event.id
                      }')" ${isFull ? 'disabled' : ''}>
                    ${isFull ? 'Event Full' : 'Register Now'}
                  </button>`
                }
              `
                  : ''
              }
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
  globalThis.window?.EventFlowAdminPages?.clear(container);
  container.innerHTML = html;
}

// ═══════════════════ RENDER: NOTIFICATIONS ═══════════════════

function renderNotificationsPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const unread = AppState.notifications.filter(notification => !notification.read);
  const html = `
    <div class="notifications-panel">
      ${
        unread.length === 0
          ? `<p class="empty-state">No new notifications</p>`
          : `
          <div class="notification-list">
            ${unread
              .map(
                n => `
              <div class="notification-item notification-${
                n.type
              }" onclick="markNotificationAsRead('${n.id}')">
                <div class="notification-icon">
                  ${
                    n.type === 'success'
                      ? '✓'
                      : n.type === 'error'
                      ? '✕'
                      : n.type === 'warning'
                      ? '⚠'
                      : 'ℹ'
                  }
                </div>
                <div class="notification-content">
                  <p>${escapeHtml(n.message)}</p>
                  <small>${getTimeAgo(n.createdAt)}</small>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `
      }
    </div>
  `;
  globalThis.window?.EventFlowAdminPages?.clear(container);
  container.innerHTML = html;

  // Update notification badge
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    const count = getUnreadCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

// ═══════════════════ MODAL: FORMS ═══════════════════

function showAddUserModal() {
  const modal = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>Add New User</h3>
          <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="addUserForm" onsubmit="submitAddUser(event)">
            <div class="form-group">
              <label for="newUserName">Name *</label>
              <input type="text" id="newUserName" required>
            </div>
            <div class="form-group">
              <label for="newUserEmail">Email *</label>
              <input type="email" id="newUserEmail" required>
            </div>
            <div class="form-group">
              <label for="newUserPassword">Password *</label>
              <input type="password" id="newUserPassword" required>
            </div>
            <div class="form-group">
              <label for="newUserRole">Role *</label>
              <select id="newUserRole" required>
                <option value="">Select a role</option>
                <option value="superuser">Super Admin</option>
                <option value="organizer">Event Organizer</option>

                <option value="client">Client</option>
                <option value="attendee">Attendee</option>
              </select>
            </div>
            <div class="form-group">
              <label for="newUserPhone">Phone *</label>
              <input type="tel" id="newUserPhone" required>
            </div>
            <div class="modal-buttons">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create User</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}
function showAddEventModal() {
  const modal = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>Create New Event</h3>
          <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="addEventForm" onsubmit="submitAddEvent(event)">
            <div class="form-row">
              <div class="form-group">
                <label for="newEventTitle">Event Title *</label>
                <input type="text" id="newEventTitle" required>
              </div>
              <div class="form-group">
                <label for="newEventCategory">Category *</label>
                <select id="newEventCategory" required>
                  <option value="">Select category</option>
                  <option value="Conference">Conference</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Networking">Networking</option>
                  <option value="Seminar">Seminar</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="newEventDate">Date *</label>
                <input type="date" id="newEventDate" required>
              </div>
              <div class="form-group">
                <label for="newEventTime">Time *</label>
                <input type="time" id="newEventTime" required>
              </div>
            </div>
            <div class="form-group">
              <label for="newEventCity">City *</label>
              <select id="newEventCity" required>
                <option value="">Select city</option>
                <option value="Chennai">Chennai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>
            <div class="form-group">
              <label for="newEventLocation">Full Location Address *</label>
              <input type="text" id="newEventLocation" placeholder="e.g., Convention Center, Chennai" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="newEventCapacity">Capacity *</label>
                <input type="number" id="newEventCapacity" min="1" required>
              </div>
              <div class="form-group">
                <label for="newEventPrice">Price (₹) *</label>
                <input type="number" id="newEventPrice" min="0" step="0.01" required>
              </div>
            </div>
            <div class="form-group">
              <label for="newEventDescription">Description</label>
              <textarea id="newEventDescription" rows="3"></textarea>
            </div>
            <div class="modal-buttons">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Event</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

// ═══════════════════ FORM HANDLERS ═══════════════════

function submitAddUser(e) {
  e.preventDefault();
  const user = {
    name: document.getElementById('newUserName').value,
    email: document.getElementById('newUserEmail').value,
    password: document.getElementById('newUserPassword').value,
    role: document.getElementById('newUserRole').value,
    phone: document.getElementById('newUserPhone').value,
  };
  if (!createUser(user)) return;
  closeModal();
  updateAllTables();
}
function submitAddEvent(e) {
  e.preventDefault();
  const event = {
    title: document.getElementById('newEventTitle').value,
    category: document.getElementById('newEventCategory').value,
    date: document.getElementById('newEventDate').value,
    time: document.getElementById('newEventTime').value,
    city: document.getElementById('newEventCity').value,
    location: document.getElementById('newEventLocation').value,
    capacity: parseInt(document.getElementById('newEventCapacity').value),
    price: parseFloat(document.getElementById('newEventPrice').value),
    description: document.getElementById('newEventDescription').value,
    organizer: AppState.currentUser?.id || 'u1',
  };
  createEvent(event);
  closeModal();
  updateAllTables();
}

// ═══════════════════ QUICK ACTION HANDLERS ═══════════════════

function editUserHandler(userId) {
  console.log('Edit user:', userId);
  const user = findUser(userId);
  if (!user) {
    alert('User not found');
    return;
  }
  // TODO: Show edit modal with user data pre-filled
  alert('Edit functionality for: ' + user.name);
}
function deleteUserHandler(userId) {
  const user = findUser(userId);
  if (!user) {
    alert('User not found');
    return;
  }
  if (confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
    deleteUser(userId);
    updateAllTables();
  }
}
function editEventHandler(eventId) {
  console.log('Edit event:', eventId);
  const event = findEvent(eventId);
  if (!event) {
    alert('Event not found');
    return;
  }
  // TODO: Show edit modal with event data pre-filled
  alert('Edit functionality for: ' + event.title);
}
function deleteEventHandler(eventId) {
  const event = findEvent(eventId);
  if (!event) {
    alert('Event not found');
    return;
  }
  if (confirm(`Delete event "${event.title}"? This will also cancel all registrations.`)) {
    deleteEvent(eventId);
    updateAllTables();
  }
}
function quickRegisterHandler(eventId) {
  if (!AppState.currentUser) {
    alert('Please log in to register for events');
    return;
  }
  const event = findEvent(eventId);
  if (!event) {
    alert('Event not found');
    return;
  }
  if (event.registered >= event.capacity) {
    alert('Event is full!');
    return;
  }
  registerAttendee(AppState.currentUser.id, eventId);
  updateAllTables();
  renderEventCards('eventsContainer', null, AppState.currentUser.role === 'attendee');
}
function checkInHandler(registrationId) {
  if (confirm('Confirm check-in for this attendee?')) {
    checkInAttendee(registrationId);
    updateAllTables();
  }
}
function cancelRegistrationHandler(registrationId) {
  if (confirm('Cancel this registration?')) {
    cancelRegistration(registrationId);
    updateAllTables();
  }
}

// ═══════════════════ UTILITY FUNCTIONS ═══════════════════

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}
function updateAllTables() {
  if (document.getElementById('usersTableContainer'))
    renderUsersTable('usersTableContainer', AppState.users);
  if (document.getElementById('eventsTableContainer'))
    renderEventsTable('eventsTableContainer', AppState.events);
  if (document.getElementById('registrationsTableContainer'))
    renderRegistrationsTable('registrationsTableContainer', AppState.registrations);
  if (document.getElementById('notificationsPanel')) renderNotificationsPanel('notificationsPanel');
}
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function getTimeAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

// Notifications are refreshed when their data changes. Replacing the panel on
// a timer remounted its DOM every five seconds and made pages visibly blink.

// Make functions global
window.renderUsersTable = renderUsersTable;
window.renderEventsTable = renderEventsTable;
window.renderRegistrationsTable = renderRegistrationsTable;
window.renderEventCards = renderEventCards;
window.renderNotificationsPanel = renderNotificationsPanel;
window.showAddUserModal = showAddUserModal;
window.showAddEventModal = showAddEventModal;
window.submitAddUser = submitAddUser;
window.submitAddEvent = submitAddEvent;
window.updateAllTables = updateAllTables;
window.closeModal = closeModal;

/* ===== EventFlow source: qr.js ===== */
// ═══════════════════════════════════════════════════════════════
// QR CODE UTILITIES FOR EVENTFLOW CHECK-IN
// Generates and displays QR codes for attendee tickets
// ═══════════════════════════════════════════════════════════════

// Generate a simple deterministic QR-like visual representation
function generateQRVisual(data, size = 20) {
  const strData = String(data);
  // Create a hash-based grid pattern
  let pattern = [];
  let hash = 0;

  // Simple string hash
  for (let i = 0; i < strData.length; i++) {
    hash = (hash << 5) - hash + strData.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate grid pattern based on hash
  for (let i = 0; i < size * size; i++) {
    hash = (hash * 9301 + 49297) % 233280;
    pattern.push(hash % 2 === 0);
  }
  return pattern;
}

// Render QR code as SVG or canvas-ready data
function renderQRAsGrid(pattern, size = 20, cellSize = 6) {
  let svg = `<svg width="${size * cellSize}" height="${
    size * cellSize
  }" xmlns="http://www.w3.org/2000/svg" style="background:#fff;border:2px solid #000">`;
  for (let i = 0; i < pattern.length; i++) {
    const row = Math.floor(i / size);
    const col = i % size;
    const x = col * cellSize;
    const y = row * cellSize;
    if (pattern[i]) {
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
    }
  }
  svg += `</svg>`;
  return svg;
}

// Simple canvas-based QR renderer
function renderQRCanvas(registrationId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 150;
  canvas.style.border = '1px solid #ccc';
  canvas.style.borderRadius = '5px';
  const ctx = canvas.getContext('2d');
  const pattern = generateQRVisual(registrationId, 15);
  const cellSize = 10;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Black pattern
  ctx.fillStyle = '#000000';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i]) {
      const row = Math.floor(i / 15);
      const col = i % 15;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  // Add registration ID text
  ctx.fillStyle = '#000000';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(String(registrationId).substring(0, 8), canvas.width / 2, canvas.height - 10);
  globalThis.window?.EventFlowAdminPages?.clear(container);
  container.innerHTML = '';
  container.appendChild(canvas);
}

// Display QR code in modal for ticket view
function showTicketQRModal(registrationId) {
  const reg = AppState.registrations.find(registration => registration.id === registrationId);
  if (!reg) {
    addNotification(null, 'Registration not found', 'error');
    return;
  }
  const event = AppState.events.find(currentEvent => currentEvent.id === reg.eventId);
  const attendee = AppState.users.find(user => user.id === reg.attendeeId);
  const modal = `
    <div id="modal-overlay" onclick="this.remove()">
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 400px">
        <div class="modal-header">
          <h3>🎟️ Ticket & QR Code</h3>
          <button class="modal-close-btn" onclick="document.getElementById('modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; padding: 20px 0">
            <div style="font-weight: 600; margin-bottom: 10px">${attendee?.name}</div>
            <div style="color: #8891b4; font-size: 12px; margin-bottom: 20px">${event?.title}</div>
            <div id="qr-canvas-container" style="display: flex; justify-content: center; margin: 20px 0"></div>
            <div style="background: #1c2135; padding: 12px; border-radius: 5px; margin: 20px 0">
              <div style="font-size: 12px; color: #8891b4">Ticket ID</div>
              <div style="font-family: monospace; font-weight: 600; color: #7c6ff7">${
                reg.ticketId
              }</div>
            </div>
            <div style="background: #1c2135; padding: 12px; border-radius: 5px; margin: 20px 0">
              <div style="font-size: 12px; color: #8891b4">Event Date</div>
              <div style="font-weight: 500">${event?.date} at ${event?.time}</div>
            </div>
            <div style="background: #1c2135; padding: 12px; border-radius: 5px; margin: 20px 0">
              <div style="font-size: 12px; color: #8891b4">Amount Paid</div>
              <div style="font-weight: 600; color: #22d3a5">₹${reg.amount}</div>
            </div>
            <div style="text-align: center; margin-top: 16px">
              <span class="badge badge-${reg.checkedIn ? 'green' : 'yellow'}">${
    reg.checkedIn ? '✓ Checked In' : 'Pending Check-in'
  }</span>
            </div>
          </div>
        </div>
        <div class="modal-buttons">
          ${
            !reg.checkedIn
              ? `<button class="btn btn-success w-full" onclick="checkInHandler('${reg.id}'); document.getElementById('modal-overlay').remove(); renderPage('attendance')">✓ Check In Now</button>`
              : ''
          }
          <button class="btn btn-ghost w-full" onclick="document.getElementById('modal-overlay').remove()">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
  setTimeout(() => renderQRCanvas(reg.id, 'qr-canvas-container'), 100);
}

// Render QR in registration row
function addQRToRegistration(registrationId, cellElement) {
  const reg = AppState.registrations.find(registration => registration.id === registrationId);
  if (!reg) return;
  const qrIcon = document.createElement('a');
  qrIcon.href = '#';
  qrIcon.style.cursor = 'pointer';
  qrIcon.style.fontSize = '16px';
  qrIcon.onclick = e => {
    e.preventDefault();
    showTicketQRModal(registrationId);
  };
  qrIcon.textContent = '📱 QR';
  qrIcon.title = 'View QR Code';
  cellElement.insertBefore(qrIcon, cellElement.firstChild);
  cellElement.insertBefore(document.createTextNode(' '), qrIcon.nextSibling);
}

// Check-in modal with QR scanner simulation
function showCheckInModal(eventId) {
  const event = AppState.events.find(currentEvent => currentEvent.id === eventId);
  if (!event) return;
  const regs = AppState.registrations.filter(
    registration => registration.eventId === eventId && !registration.checkedIn
  );
  const modal = `
    <div id="modal-overlay" onclick="this.remove()">
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 500px">
        <div class="modal-header">
          <h3>✅ Check-in Attendees — ${event.title}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 16px">
            <div style="font-size: 12px; color: #8891b4; margin-bottom: 8px">Pending Check-ins</div>
            <div style="font-size: 20px; font-weight: 700; color: #7c6ff7">${regs.length}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 300px; overflow-y: auto">
            ${regs
              .map(registration => {
                const attendee = AppState.users.find(user => user.id === registration.attendeeId);
                return `
                <div style="background: #151929; border: 1px solid #1f2640; border-radius: 8px; padding: 12px">
                  <div style="font-weight: 500; font-size: 13px; margin-bottom: 4px">${attendee?.name}</div>
                  <div style="font-size: 11px; color: #8891b4; margin-bottom: 8px">${registration.ticketId}</div>
                  <button class="btn btn-sm btn-success" onclick="checkInAttendee('${registration.id}'); refreshCheckInList('${eventId}')" style="width: 100%">✓ Check In</button>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
        <div class="modal-buttons">
          <button class="btn btn-ghost" onclick="document.getElementById('modal-overlay').remove()">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}
function refreshCheckInList(eventId) {
  // Re-render the check-in modal
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
  setTimeout(() => showCheckInModal(eventId), 100);
}

// Global access
window.generateQRVisual = generateQRVisual;
window.renderQRAsGrid = renderQRAsGrid;
window.renderQRCanvas = renderQRCanvas;
window.showTicketQRModal = showTicketQRModal;
window.addQRToRegistration = addQRToRegistration;
window.showCheckInModal = showCheckInModal;
window.refreshCheckInList = refreshCheckInList;

/* ===== EventFlow source: navigation.js ===== */
/* EventFlow navigation module.
 * Navigation module boundary. showPage/goNav/renderPage remain in app.js so all existing page IDs and workflows are unchanged.
 * This boundary is intentionally non-invasive: the working SPA runtime remains
 * centralized in app.js so no existing IDs, function names, storage keys,
 * mock-data records, validation, or button workflows are changed.
 */
window.EventFlowModules = window.EventFlowModules || {};
window.EventFlowModules['navigation'] = true;

/* ===== EventFlow source: auth.js ===== */
/* EventFlow auth module.
 * Authentication module boundary. Existing login/logout functions remain in app.js; API helpers remain in api.js.
 * This boundary is intentionally non-invasive: the working SPA runtime remains
 * centralized in app.js so no existing IDs, function names, storage keys,
 * mock-data records, validation, or button workflows are changed.
 */
window.EventFlowModules = window.EventFlowModules || {};
window.EventFlowModules['auth'] = true;

/* ===== EventFlow source: database.js ===== */
/* EventFlow database module.
 * Database module boundary. The canonical mock DB remains in app.js to preserve initialization order and exact data.
 * This boundary is intentionally non-invasive: the working SPA runtime remains
 * centralized in app.js so no existing IDs, function names, storage keys,
 * mock-data records, validation, or button workflows are changed.
 */
window.EventFlowModules = window.EventFlowModules || {};
window.EventFlowModules['database'] = true;

/* ===== EventFlow source: modals.js ===== */
/* EventFlow modals module.
 * Modal module boundary. Existing modal/drawer/confirm implementations remain in app.js.
 * This boundary is intentionally non-invasive: the working SPA runtime remains
 * centralized in app.js so no existing IDs, function names, storage keys,
 * mock-data records, validation, or button workflows are changed.
 */
window.EventFlowModules = window.EventFlowModules || {};
window.EventFlowModules['modals'] = true;

/* ===== EventFlow source: notifications.js ===== */
/* EventFlow notifications module.
 * Notifications module boundary. Existing notification state/rendering remains in app.js.
 * This boundary is intentionally non-invasive: the working SPA runtime remains
 * centralized in app.js so no existing IDs, function names, storage keys,
 * mock-data records, validation, or button workflows are changed.
 */
window.EventFlowModules = window.EventFlowModules || {};
window.EventFlowModules['notifications'] = true;

/* ===== EventFlow source: shared.js ===== */
/* EventFlow shared module.
 * Shared UI module boundary. Existing helpers and cross-page utilities remain in app.js.
 * This boundary is intentionally non-invasive: the working SPA runtime remains
 * centralized in app.js so no existing IDs, function names, storage keys,
 * mock-data records, validation, or button workflows are changed.
 */
window.EventFlowModules = window.EventFlowModules || {};
window.EventFlowModules['shared'] = true;

/* ===== EventFlow source: app.js ===== */
// ════════════════════════════════════════════════
//  MOCK DATABASE
// ════════════════════════════════════════════════
const DB = {
  users: [
    {
      id: 'usr-admin-001',
      name: 'Alex Johnson',
      email: 'superadmin@example.com',
      password: 'Admin@123',
      role: 'superuser',
      phone: '+91 9876543201',
      avatar: 'AJ',
      avatarImage: '/assets/images/avatars/user-alex-johnson.jpg',
      status: 'active',
      joined: '2024-01-15',
      bio: 'Platform administrator with full system access.',
    },
    {
      id: 'usr-org-001',
      name: 'Sarah Chen',
      email: 'organizer@example.com',
      password: 'Organizer@123',
      role: 'organizer',
      phone: '+91 9876543202',
      avatar: 'SC',
      avatarImage: '/assets/images/avatars/organizer-sarah-chen.jpg',
      status: 'active',
      joined: '2024-02-01',
      bio: 'Senior event organizer specializing in corporate events.',
      service: 'Corporate Events & Conferences',
      city: 'Bangalore',
      rating: 4.8,
      color: '#7c6ff7',
    },
    {
      id: 'usr-emp-001',
      userId: 'usr-emp-001',
      name: 'Marcus Vance',
      email: 'employee@example.com',
      password: 'Employee@123',
      role: 'employee',
      employeeType: 'EVENT_OPERATIONS',
      phone: '+91 9876543220',
      avatar: 'MV',
      avatarImage: '/assets/images/avatars/employee-marcus-vance.jpg',
      status: 'active',
      joined: '2024-01-18',
      bio: 'Senior event operations employee managing event information and live execution.',
      service: 'Corporate Conferences & Tech Summits',
      city: 'Bangalore',
      rating: 4.9,
      color: '#3b82f6',
    },
    {
      id: 'usr-emp-001c',
      userId: 'usr-emp-001',
      name: 'Marcus Vance',
      email: 'marcus.ops@eventflow.com',
      password: 'Employee@123',
      role: 'employee',
      employeeType: 'SUPPORT_FINANCE',
      phone: '+91 9876543220',
      avatar: 'MV',
      avatarImage: '/assets/images/avatars/employee-marcus-vance.jpg',
      status: 'active',
      joined: '2024-01-18',
      bio: 'Customer support and finance operations executive.',
      service: 'Support & Finance',
      city: 'Bangalore',
      rating: 4.9,
      color: '#3b82f6',
    },
    {
      id: 'usr-emp-002',
      userId: 'usr-emp-002',
      name: 'Elena Rostova',
      email: 'elena.coordinator@eventflow.com',
      password: 'Employee@123',
      role: 'employee',
      employeeType: 'EVENT_OPERATIONS',
      phone: '+91 9876543221',
      avatar: 'ER',
      avatarImage: '/assets/images/avatars/employee-elena-rostova.jpg',
      status: 'active',
      joined: '2024-02-12',
      bio: 'Event operations executive.',
      service: 'Event Operations',
      city: 'Mumbai',
      rating: 4.8,
      color: '#ec4899',
    },
    {
      id: 'usr-emp-003',
      userId: 'usr-emp-003',
      name: 'Arjun Kapoor',
      email: 'arjun.events@eventflow.com',
      password: 'Employee@123',
      role: 'employee',
      employeeType: 'REGISTRATION_VERIFICATION',
      phone: '+91 9876543222',
      avatar: 'AK',
      avatarImage: '/assets/images/avatars/employee-arjun-kapoor.jpg',
      status: 'active',
      joined: '2024-03-08',
      bio: 'Registration and attendee verification executive.',
      service: 'Registration & Verification',
      city: 'Delhi NCR',
      rating: 4.9,
      color: '#8b5cf6',
    },
    {
      id: 'usr-emp-004',
      userId: 'usr-emp-004',
      name: 'Maya Lin',
      email: 'maya.ops@eventflow.com',
      password: 'Employee@123',
      role: 'employee',
      employeeType: 'SUPPORT_FINANCE',
      phone: '+91 9876543223',
      avatar: 'ML',
      avatarImage: '/assets/images/avatars/employee-maya-lin.jpg',
      status: 'active',
      joined: '2024-03-22',
      bio: 'Customer support and finance operations executive.',
      service: 'Support & Finance',
      city: 'Hyderabad',
      rating: 4.7,
      color: '#10b981',
    },
    {
      id: 'usr-client-001',
      name: 'Michael Torres',
      email: 'client@example.com',
      password: 'Client@123',
      role: 'client',
      phone: '+91 9876543203',
      avatar: 'MT',
      avatarImage: '/assets/images/avatars/user-michael-torres.jpg',
      status: 'active',
      joined: '2024-03-10',
      bio: 'Head of Events at TechCorp Ltd.',
      company: 'TechCorp Ltd',
    },
    {
      id: 'usr-attendee-001',
      name: 'Priya Patel',
      email: 'attendee@example.com',
      password: 'Attendee@123',
      role: 'attendee',
      phone: '+91 9876543205',
      avatar: 'PP',
      avatarImage: '/assets/images/avatars/user-priya-patel.jpg',
      status: 'active',
      joined: '2024-04-01',
      bio: 'Tech enthusiast and frequent conference attendee.',
    },
    {
      id: 6,
      name: 'Emma Brown',
      email: 'emma@eventflow.com',
      password: 'org123',
      role: 'organizer',
      phone: '+91 9876543206',
      avatar: 'EB',
      avatarImage: '/assets/images/avatars/organizer-emma-brown.jpg',
      status: 'active',
      joined: '2024-02-20',
      service: 'Weddings & Social Events',
      city: 'Pune',
      rating: 4.7,
      color: '#f56565',
      bio: 'Expert in creating memorable wedding and social event experiences with meticulous attention to detail.',
    },
    {
      id: 8,
      name: 'Lisa Zhang',
      email: 'lisa@eventflow.com',
      password: 'att123',
      role: 'attendee',
      phone: '+91 9876543208',
      avatar: 'LZ',
      avatarImage: '/assets/images/avatars/user-lisa-zhang.jpg',
      status: 'active',
      joined: '2024-04-15',
    },
    {
      id: 9,
      name: 'Robert Singh',
      email: 'robert@eventflow.com',
      password: 'att123',
      role: 'attendee',
      phone: '+91 9876543209',
      avatar: 'RS',
      avatarImage: '/assets/images/avatars/user-robert-singh.jpg',
      status: 'active',
      joined: '2024-05-01',
    },
    {
      id: 11,
      name: 'Rajesh Sharma',
      email: 'rajesh@eventflow.com',
      password: 'org123',
      role: 'organizer',
      phone: '+91 9876543210',
      avatar: 'RS',
      avatarImage: '/assets/images/avatars/organizer-rajesh-sharma.jpg',
      status: 'active',
      joined: '2024-03-05',
      service: 'Weddings & Social Events',
      city: 'Delhi NCR',
      rating: 4.9,
      color: '#22d3a5',
      bio: 'Expert wedding planner with 15+ years of experience in creating stunning celebrations for families across India.',
    },
    {
      id: 12,
      name: 'TechEvents India',
      email: 'techevents@eventflow.com',
      password: 'org123',
      role: 'organizer',
      phone: '+91 9876543211',
      avatar: 'TE',
      avatarImage: '/assets/images/avatars/organizer-techevents.jpg',
      status: 'active',
      joined: '2024-01-20',
      service: 'Tech Conferences & Hackathons',
      city: 'Bangalore',
      rating: 4.6,
      color: '#ed8936',
      bio: 'Leading organizer for technology summits, conferences, and hackathons in India.',
    },
  ],
  events: [
    {
      id: 101,
      title: 'Global AI & Cloud Summit 2026',
      category: 'Conference',
      date: '2026-06-15',
      time: '09:00',
      endTime: '18:00',
      venue: 'Grand Convention Center, Hall A',
      city: 'Bangalore',
      capacity: 600,
      registered: 480,
      price: 200,
      status: 'upcoming',
      organizer: 'usr-emp-001',
      clientId: 'usr-client-001',
      description:
        'Flagship enterprise summit on Generative AI, Cloud Infrastructure, and Agentic Workflows.',
      color: '#3b82f6',
      emoji: '🤖',
      tags: ['AI', 'Cloud', 'Enterprise'],
      image: '/assets/images/events/event-ai-summit.jpg',
    },
    {
      id: 102,
      title: 'FinTech Leaders Executive Conclave',
      category: 'Corporate',
      date: '2026-06-22',
      time: '17:30',
      endTime: '22:30',
      venue: 'The Leela Palace Ballroom',
      city: 'Mumbai',
      capacity: 250,
      registered: 210,
      price: 350,
      status: 'upcoming',
      organizer: 'usr-emp-001',
      clientId: 'usr-client-001',
      description:
        'Exclusive executive dinner and keynote sessions for digital banking and FinTech innovators.',
      color: '#10b981',
      emoji: '💼',
      tags: ['FinTech', 'Banking', 'Executive'],
      image: '/assets/images/events/event-fintech.jpg',
    },
    {
      id: 103,
      title: 'Cybersecurity & Zero Trust Workshop',
      category: 'Workshop',
      date: '2026-07-05',
      time: '10:00',
      endTime: '16:00',
      venue: 'Cyber Towers — Tech Room 3',
      city: 'Hyderabad',
      capacity: 80,
      registered: 80,
      price: 120,
      status: 'full',
      organizer: 'usr-emp-001',
      clientId: 'usr-client-001',
      description:
        'Hands-on live simulation on threat modeling, Zero Trust architecture, and cloud security.',
      color: '#f59e0b',
      emoji: '🛡️',
      tags: ['Security', 'ZeroTrust', 'HandsOn'],
      image: '/assets/images/events/event-cybersecurity.jpg',
    },
    {
      id: 104,
      title: 'National Web3 & AI Hackathon 2026',
      category: 'Networking',
      date: '2026-07-18',
      time: '08:00',
      endTime: '20:00',
      venue: 'Innovation Arena, HITEC City',
      city: 'Chennai',
      capacity: 400,
      registered: 315,
      price: 0,
      status: 'upcoming',
      organizer: 'usr-emp-001',
      clientId: 'usr-client-001',
      description:
        '36-hour national developer hackathon with ?50K in prize bounties for open source AI agents.',
      color: '#8b5cf6',
      emoji: '🚀',
      tags: ['Hackathon', 'AI', 'Developers'],
      image: '/assets/images/events/event-hackathon.jpg',
    },
    {
      id: 105,
      title: 'Healthcare & Biotech Forum 2026',
      category: 'Conference',
      date: '2026-03-25',
      time: '09:00',
      endTime: '17:00',
      venue: 'Medical Research Auditorium',
      city: 'Delhi NCR',
      capacity: 350,
      registered: 350,
      price: 250,
      status: 'completed',
      organizer: 'usr-emp-001',
      clientId: 'usr-client-001',
      description:
        'International forum on AI diagnostics, clinical trials automation, and genomics data.',
      color: '#06b6d4',
      emoji: '🏥',
      tags: ['Healthcare', 'Biotech', 'Genomics'],
      image: '/assets/images/events/event-healthcare-forum.jpg',
    },
    {
      id: 1,
      title: 'Tech Innovation Summit 2026',
      category: 'Conference',
      date: '2026-04-15',
      time: '09:00',
      endTime: '18:00',
      venue: 'Grand Convention Center, Hall A',
      city: 'Chennai',
      capacity: 500,
      registered: 342,
      price: 150,
      status: 'upcoming',
      organizer: 'usr-org-001',
      clientId: 'usr-client-001',
      description:
        'Annual technology conference featuring keynotes from industry leaders, workshops on AI, blockchain, and cloud computing.',
      color: '#7c6ff7',
      emoji: '💻',
      tags: ['AI', 'Tech', 'Networking'],
      image: '/assets/images/events/event-tech-summit.jpg',
    },
    {
      id: 2,
      title: 'Corporate Annual Gala 2026',
      category: 'Corporate',
      date: '2026-04-22',
      time: '18:00',
      endTime: '23:00',
      venue: 'Grand Ballroom — Marriott Hotel',
      city: 'Tirupathi',
      capacity: 200,
      registered: 187,
      price: 250,
      status: 'upcoming',
      organizer: 'usr-org-001',
      clientId: 'usr-client-001',
      description:
        'Exclusive annual corporate dinner and awards ceremony celebrating achievements and milestones.',
      color: '#22d3a5',
      emoji: '🥂',
      tags: ['Corporate', 'Gala', 'Awards'],
      image: '/assets/images/events/event-annual-gala.jpg',
    },
    {
      id: 3,
      title: 'Spring Music Festival',
      category: 'Concert',
      date: '2026-05-01',
      time: '14:00',
      endTime: '23:00',
      venue: 'City Park Outdoor Amphitheater',
      city: 'Noida',
      capacity: 1000,
      registered: 756,
      price: 75,
      status: 'upcoming',
      organizer: 6,
      clientId: 'usr-client-001',
      description: 'Two-day outdoor music festival featuring 15+ artists across multiple genres.',
      color: '#f56565',
      emoji: '🎵',
      tags: ['Music', 'Outdoor', 'Festival'],
      image: '/assets/images/events/event-music-fest.jpg',
    },
    {
      id: 4,
      title: 'Digital Marketing Workshop',
      category: 'Workshop',
      date: '2026-05-10',
      time: '10:00',
      endTime: '16:00',
      venue: 'Business Hub — Room 201',
      city: 'Hyderabad',
      capacity: 50,
      registered: 50,
      price: 80,
      status: 'full',
      organizer: 'usr-org-001',
      clientId: 'usr-client-001',
      description:
        'Hands-on full-day workshop on modern digital marketing, SEO, social media strategy, and analytics.',
      color: '#f6c90e',
      emoji: '📱',
      tags: ['Marketing', 'Workshop', 'SEO'],
      image: '/assets/images/events/event-marketing-workshop.jpg',
    },
    {
      id: 5,
      title: 'Startup Pitch Night',
      category: 'Networking',
      date: '2026-05-15',
      time: '17:00',
      endTime: '21:00',
      venue: 'Innovation Lab — Main Hall',
      city: 'Chennai',
      capacity: 150,
      registered: 98,
      price: 0,
      status: 'upcoming',
      organizer: 6,
      clientId: 'usr-client-001',
      description:
        'Monthly startup pitch competition with panels of VC judges and networking opportunities.',
      color: '#7c6ff7',
      emoji: '🚀',
      tags: ['Startup', 'Pitch', 'VC'],
      image: '/assets/images/events/event-pitch-night.jpg',
    },
    {
      id: 6,
      title: 'Healthcare Innovation Forum',
      category: 'Conference',
      date: '2026-03-10',
      time: '08:30',
      endTime: '17:00',
      venue: 'City Medical Center Auditorium',
      city: 'Bangalore',
      capacity: 300,
      registered: 300,
      price: 200,
      status: 'completed',
      organizer: 'usr-org-001',
      clientId: 'usr-client-001',
      description: 'Forum on AI in healthcare, telemedicine, and patient data management.',
      color: '#22d3a5',
      emoji: '🏥',
      tags: ['Health', 'AI', 'Forum'],
      image: '/assets/images/events/event-medtech.jpg',
    },
    {
      id: 7,
      title: 'Photography Masterclass',
      category: 'Workshop',
      date: '2026-06-01',
      time: '10:00',
      endTime: '15:00',
      venue: 'Art Studio 5, Downtown',
      city: 'Pune',
      capacity: 30,
      registered: 12,
      price: 120,
      status: 'upcoming',
      organizer: 6,
      clientId: null,
      description:
        'Hands-on photography workshop for intermediate photographers covering lighting, composition, and post-processing.',
      color: '#ed8936',
      emoji: '📷',
      tags: ['Photography', 'Art', 'Workshop'],
      image: '/assets/images/events/event-photography.jpg',
    },
    {
      id: 8,
      title: 'Rajesh Grand Wedding Celebration',
      category: 'Wedding',
      date: '2026-05-15',
      time: '17:00',
      endTime: '23:59',
      venue: 'The Ashok Hotel, New Delhi',
      city: 'Delhi NCR',
      capacity: 800,
      registered: 750,
      price: 0,
      status: 'ongoing',
      organizer: 11,
      clientId: null,
      description:
        'Grand wedding celebration bringing together families and friends. Featuring traditional ceremonies, vibrant decorations, and festive atmosphere.',
      color: '#22d3a5',
      emoji: '💒',
      tags: ['Wedding', 'Celebration', 'Grand'],
      image: '/assets/images/events/event-wedding.jpg',
    },
  ],
  eventRequests: [
    {
      id: 101,
      clientId: 'usr-client-001',
      title: 'Torres Tech Q3 Product Launch',
      type: 'Corporate',
      date: '2026-06-01',
      guests: 350,
      budget: 35000,
      status: 'pending',
      desc: 'Global launch for next-gen enterprise suite. Require 4K live streaming, stage AV, VIP catering, and 5 photographers.',
      created: '2026-03-20',
      organizer: 'usr-emp-001',
      venue: 'Downtown Convention Center',
    },
    {
      id: 102,
      clientId: 'usr-client-001',
      title: 'Annual Leadership Strategy Retreat',
      type: 'Corporate',
      date: '2026-06-15',
      guests: 120,
      budget: 18000,
      status: 'approved',
      desc: 'Annual executive team retreat with breakout workshop sessions, keynote speaker, and outdoor networking dinner.',
      created: '2026-03-15',
      organizer: 'usr-emp-001',
      venue: 'Hilltop Mountain Resort',
    },
    {
      id: 103,
      clientId: 'usr-client-001',
      title: 'Tech Innovation Demo Day',
      type: 'Networking',
      date: '2026-07-10',
      guests: 200,
      budget: 22000,
      status: 'in_review',
      desc: 'Startup and partner showcase demo day with booth setups, investor pitch panels, and networking reception.',
      created: '2026-03-25',
      organizer: 'usr-emp-001',
      venue: 'Innovation Hub Hall 2',
    },
    {
      id: 1,
      clientId: 'usr-client-001',
      title: 'Product Launch Event',
      type: 'Corporate',
      date: '2026-06-01',
      guests: 300,
      budget: 25000,
      status: 'pending',
      desc: 'Grand product launch for our new AI-powered software suite. Need venue, catering, AV, and professional photography.',
      created: '2026-03-20',
      venue: 'Downtown Convention Center',
    },
    {
      id: 2,
      clientId: 'usr-client-001',
      title: 'Team Building Retreat',
      type: 'Corporate',
      date: '2026-06-15',
      guests: 80,
      budget: 12000,
      status: 'approved',
      desc: 'Annual team building activity with outdoor challenges, group activities, and team dinner.',
      created: '2026-03-15',
      organizer: 'usr-org-001',
      venue: 'Mountain Resort',
    },
    {
      id: 3,
      clientId: 'usr-client-001',
      title: 'Annual Client Appreciation Dinner',
      type: 'Corporate',
      date: '2026-07-10',
      guests: 120,
      budget: 18000,
      status: 'in_review',
      desc: 'Formal black-tie dinner for top 120 clients. Need premium venue, 5-course dinner, live entertainment.',
      created: '2026-03-25',
      organizer: 'usr-org-001',
      venue: 'Five Star Restaurant & Event Hall',
    },
    {
      id: 4,
      clientId: 'usr-client-001',
      title: 'Sales Training Conference',
      type: 'Conference',
      date: '2026-07-20',
      guests: 200,
      budget: 15000,
      status: 'rejected',
      desc: 'Two-day sales training conference with industry speakers and breakout sessions.',
      created: '2026-03-28',
      venue: 'City Conference Center',
    },
  ],
  reports: [
    {
      id: 'rpt-emp-002',
      eventId: 103,
      fileName: 'cybersecurity-workshop-summary.docx',
      submittedBy: 'usr-emp-001',
      submittedAt: '2026-07-06 11:20',
    },
  ],
  employeeChangeRequests: [
    {
      id: 'chg-emp-001',
      type: 'event',
      targetId: 103,
      targetName: 'Cybersecurity & Zero Trust Workshop',
      requester: 'Michael Torres',
      requestedChange: 'Move the event date to 2026-07-12 and increase capacity to 100 attendees.',
      status: 'pending',
      submittedAt: 'Today, 9:20 AM',
    },
    {
      id: 'chg-emp-002',
      type: 'user',
      targetId: 'usr-client-001',
      targetName: 'Michael Torres',
      requester: 'Michael Torres',
      requestedChange: 'Update phone number and company details on the user profile.',
      status: 'pending',
      submittedAt: 'Yesterday, 4:10 PM',
    },
    {
      id: 'chg-emp-003',
      type: 'event',
      targetId: 105,
      targetName: 'Healthcare & Biotech Forum 2026',
      requester: 'James Wilson',
      requestedChange: 'Add the final attendance count to the event record.',
      status: 'approved',
      submittedAt: '2 days ago',
    },
  ],
  registrations: [
    {
      id: 101,
      attendeeId: 'usr-attendee-001',
      eventId: 101,
      date: '2026-03-01',
      ticketId: 'TKT-EMP-101',
      status: 'confirmed',
      payment: 'paid',
      amount: 200,
      checkedIn: false,
      seat: 'VIP-12',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'Govt Aadhaar ID',
      docRef: 'ID-8849-XXXX-1029',
      notes: 'Verified via Govt ID submission.',
    },
    {
      id: 102,
      attendeeId: 'usr-client-001',
      eventId: 102,
      date: '2026-03-05',
      ticketId: 'TKT-EMP-102',
      status: 'confirmed',
      payment: 'paid',
      amount: 350,
      checkedIn: false,
      seat: 'A-01',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'Corporate Access Badge',
      docRef: 'CORP-TC-9941',
      notes: 'Executive corporate verification completed.',
    },
    {
      id: 103,
      attendeeId: 'usr-attendee-001',
      eventId: 103,
      date: '2026-03-08',
      ticketId: 'TKT-EMP-103',
      status: 'confirmed',
      payment: 'paid',
      amount: 120,
      checkedIn: true,
      seat: 'Lab-04',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'Passport Verification',
      docRef: 'PASS-Z992014',
      notes: 'Workshop credentials verified.',
    },
    {
      id: 104,
      attendeeId: 8,
      eventId: 104,
      date: '2026-03-12',
      ticketId: 'TKT-EMP-104',
      status: 'pending',
      payment: 'paid',
      amount: 0,
      checkedIn: false,
      seat: 'Desk-22',
      verificationStatus: 'Pending Review',
      verified: false,
      docType: 'Student University ID',
      docRef: 'UNI-STU-4820',
      notes: 'Student ID photo blur — pending manual review.',
    },
    {
      id: 105,
      attendeeId: 9,
      eventId: 105,
      date: '2026-03-15',
      ticketId: 'TKT-EMP-105',
      status: 'confirmed',
      payment: 'paid',
      amount: 250,
      checkedIn: true,
      seat: 'Hall-55',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'Govt Driving License',
      docRef: 'DL-MH-04-2024009',
      notes: 'Healthcare delegate identity confirmed.',
    },
    {
      id: 1,
      attendeeId: 5,
      eventId: 1,
      date: '2026-03-01',
      ticketId: 'TKT-2026-001',
      status: 'pending',
      payment: 'paid',
      amount: 150,
      checkedIn: false,
      seat: 'A-042',
      verificationStatus: 'Pending Review',
      verified: false,
      docType: 'Govt Aadhaar ID',
      docRef: 'ID-4421-XXXX-9912',
      notes: 'Identity proof uploaded, awaiting approval.',
    },
    {
      id: 2,
      attendeeId: 5,
      eventId: 2,
      date: '2026-03-05',
      ticketId: 'TKT-2026-002',
      status: 'confirmed',
      payment: 'paid',
      amount: 250,
      checkedIn: false,
      seat: 'T-015',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'Corporate Invite Pass',
      docRef: 'GALA-INV-0192',
      notes: 'Gala guest verification confirmed.',
    },
    {
      id: 3,
      attendeeId: 8,
      eventId: 1,
      date: '2026-03-02',
      ticketId: 'TKT-2026-003',
      status: 'pending',
      payment: 'paid',
      amount: 150,
      checkedIn: true,
      seat: 'A-043',
      verificationStatus: 'Flagged',
      verified: false,
      docType: 'Company ID Card',
      docRef: 'EMP-ID-MISSING',
      flagReason: 'Company ID badge image missing back side.',
      notes: 'Flagged for re-upload.',
    },
    {
      id: 4,
      attendeeId: 5,
      eventId: 3,
      date: '2026-03-10',
      ticketId: 'TKT-2026-004',
      status: 'confirmed',
      payment: 'paid',
      amount: 75,
      checkedIn: false,
      seat: 'GA',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'E-Ticket Pass',
      docRef: 'TKT-FEST-8819',
      notes: 'Festival online registration verified.',
    },
    {
      id: 5,
      attendeeId: 9,
      eventId: 1,
      date: '2026-03-03',
      ticketId: 'TKT-2026-005',
      status: 'pending',
      payment: 'paid',
      amount: 150,
      checkedIn: true,
      seat: 'A-044',
      verificationStatus: 'Pending Review',
      verified: false,
      docType: 'Govt Aadhaar ID',
      docRef: 'ID-1102-XXXX-7741',
      notes: 'Online verification pending.',
    },
    {
      id: 6,
      attendeeId: 8,
      eventId: 3,
      date: '2026-03-12',
      ticketId: 'TKT-2026-006',
      status: 'confirmed',
      payment: 'paid',
      amount: 75,
      checkedIn: false,
      seat: 'GA',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'E-Ticket Pass',
      docRef: 'TKT-FEST-8820',
      notes: 'Pass verified.',
    },
    {
      id: 7,
      attendeeId: 2,
      eventId: 1,
      date: '2026-03-14',
      ticketId: 'TKT-2026-007',
      status: 'confirmed',
      payment: 'paid',
      amount: 150,
      checkedIn: false,
      seat: 'A-045',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'Organizer VIP Access',
      docRef: 'ORG-VIP-002',
      notes: 'Organizer VIP pass verified.',
    },
    {
      id: 8,
      attendeeId: 3,
      eventId: 1,
      date: '2026-03-15',
      ticketId: 'TKT-2026-008',
      status: 'confirmed',
      payment: 'paid',
      amount: 150,
      checkedIn: false,
      seat: 'A-046',
      verificationStatus: 'Verified',
      verified: true,
      docType: 'Client Pass',
      docRef: 'CLT-PASS-104',
      notes: 'Client registration verified.',
    },
  ],
  userQueries: [
    {
      id: 'UQR-501',
      userId: 'usr-attendee-001',
      userName: 'Priya Patel',
      userEmail: 'attendee@example.com',
      type: 'Account Deletion',
      subject: 'Request permanent account deletion',
      detail:
        'User requested permanent deletion of their attendee account and associated personal data.',
      source: 'User Request',
      status: 'Pending',
      date: 'Today, 10:30 AM',
    },
    {
      id: 'UQR-502',
      userId: 'usr-client-001',
      userName: 'Michael Torres',
      userEmail: 'client@example.com',
      type: 'Email Change',
      subject: 'Update profile email address to corporate domain',
      detail: 'Requested email update from client@example.com to m.torres@techcorp.com.',
      source: 'User Request',
      status: 'In Progress',
      date: 'Yesterday, 4:15 PM',
    },
    {
      id: 'UQR-503',
      userId: 8,
      userName: 'Lisa Zhang',
      userEmail: 'lisa@eventflow.com',
      type: 'Escalated Support',
      subject: 'Verification failed for Hackathon registration badge',
      detail:
        'Escalated by Customer Support (Employee 3): Student ID upload unreadable, needs re-verification.',
      source: 'Employee 3 Escalation',
      status: 'Pending',
      date: '2 days ago',
    },
    {
      id: 'UQR-504',
      userId: 9,
      userName: 'Robert Singh',
      userEmail: 'robert@eventflow.com',
      type: 'Profile Update',
      subject: 'Contact phone number correction & name spelling',
      detail: 'Requested phone update to +91 9876543209 and correction on badge name.',
      source: 'User Request',
      status: 'Resolved',
      date: '2026-08-26',
    },
    {
      id: 'UQR-505',
      userId: 'usr-attendee-001',
      userName: 'Priya Patel',
      userEmail: 'attendee@example.com',
      type: 'Escalated Support',
      subject: 'Ticket details correction request',
      detail: 'User requested a correction to the attendee name on their Tech Summit ticket.',
      source: 'Employee 3 Escalation',
      status: 'Pending',
      date: 'Today, 8:45 AM',
    },
  ],
  notifications: [
    {
      id: 101,
      title: 'New Event Proposal',
      msg: 'Michael Torres submitted "Torres Tech Q3 Product Launch" with ₹35,000 budget.',
      time: '10 mins ago',
      read: false,
      type: 'info',
      icon: '📋',
    },
    {
      id: 103,
      title: 'Capacity Milestone Reached',
      msg: 'Cybersecurity Workshop reached 100% capacity (80/80 registered).',
      time: '3 hrs ago',
      read: true,
      type: 'warning',
      icon: '🎟️',
    },
    {
      id: 104,
      title: 'Event Request Approved',
      msg: 'Annual Leadership Strategy Retreat proposal was approved by the client.',
      time: '1 day ago',
      read: true,
      type: 'success',
      icon: '🎉',
    },
    {
      id: 1,
      title: 'New Event Request',
      msg: 'Michael Torres submitted: "Product Launch Event" — ?25,000 budget',
      time: '2 hrs ago',
      read: false,
      type: 'info',
      icon: '📋',
    },
    {
      id: 2,
      title: 'Registration Confirmed',
      msg: 'Priya Patel registered for Tech Innovation Summit 2026',
      time: '4 hrs ago',
      read: false,
      type: 'success',
      icon: '✅',
    },
    {
      id: 4,
      title: 'Event Plan Submitted',
      msg: 'Team Building Retreat plan submitted to client for review',
      time: '1 day ago',
      read: true,
      type: 'info',
      icon: '📤',
    },
    {
      id: 5,
      title: 'Event Approved',
      msg: 'Corporate Annual Gala 2026 has been approved and is now live',
      time: '2 days ago',
      read: true,
      type: 'success',
      icon: '🎉',
    },
    {
      id: 6,
      title: 'Attendee Checked In',
      msg: '3 attendees checked in at Healthcare Innovation Forum',
      time: '3 days ago',
      read: true,
      type: 'success',
      icon: '✅',
    },
    {
      id: 7,
      title: 'New Assignment',
      msg: 'Sarah Johnson assigned you as Photographer & Videographer for Corporate Annual Gala 2026 — ?1,100 fee',
      time: '1 hr ago',
      read: false,
      type: 'warning',
      icon: '📸',
    },
    {
      id: 8,
      title: 'New Assignment',
      msg: 'Sarah Johnson assigned you as Stage Photographer for Spring Music Festival — ?750 fee',
      time: '3 hrs ago',
      read: false,
      type: 'warning',
      icon: '🎵',
    },
    {
      id: 9,
      title: 'New Assignment',
      msg: 'Assigned as Event Documentarian for Startup Pitch Night — ?500 fee',
      time: '5 hrs ago',
      read: false,
      type: 'warning',
      icon: '🚀',
    },
    {
      id: 'sf-notif-001',
      employeeType: 'SUPPORT_FINANCE',
      title: 'New Support Request',
      msg: 'Michael Torres requested a payment receipt for Global AI & Cloud Summit 2026.',
      time: '12 mins ago',
      read: false,
      type: 'info',
      icon: '📩',
    },
    {
      id: 'sf-notif-002',
      employeeType: 'SUPPORT_FINANCE',
      title: 'Refund Awaiting Review',
      msg: 'Refund REF-2026-001 for ₹350 is ready for finance review.',
      time: '28 mins ago',
      read: false,
      type: 'warning',
      icon: '↩️',
    },
    {
      id: 'sf-notif-003',
      employeeType: 'SUPPORT_FINANCE',
      title: 'Transaction Completed',
      msg: 'Transaction TXN-2026-005 was completed successfully for Michael Torres.',
      time: '1 hr ago',
      read: true,
      type: 'success',
      icon: '💳',
    },
    {
      id: 'sf-notif-004',
      employeeType: 'SUPPORT_FINANCE',
      title: 'Report Reviewed',
      msg: 'August service operations was reviewed by Super Admin.',
      time: 'Yesterday',
      read: true,
      type: 'success',
      icon: '📊',
    },
  ],
  attendanceReports: {},
  // {eventId: {total, checked, pending, report}}
  supportRequests: [
    {
      id: 'sup-001',
      userId: 'usr-client-001',
      eventId: 101,
      subject: 'Payment receipt needed',
      message: 'Please resend the receipt for my summit registration.',
      status: 'Pending',
      response: '',
      created: today(),
      updated: '10 mins ago',
    },
    {
      id: 'sup-002',
      userId: 'usr-attendee-001',
      eventId: 103,
      subject: 'Unable to download ticket',
      message: 'My payment is complete but the ticket link is not opening.',
      status: 'In Progress',
      response: 'We are checking your ticket record now.',
      created: '2026-08-27',
      updated: '1 hr ago',
    },
    {
      id: 'sup-003',
      userId: 'usr-client-001',
      eventId: 102,
      subject: 'Refund request',
      message: 'Two registrations were made by mistake. Please refund one.',
      status: 'Resolved',
      response: 'Your refund request has been forwarded to finance.',
      created: '2026-08-26',
      updated: 'Yesterday',
    },
    {
      id: 'sup-004',
      userId: 'usr-attendee-001',
      eventId: 104,
      subject: 'Event location question',
      message: 'Could you confirm the venue entrance details?',
      status: 'Closed',
      response: 'Venue instructions were sent to your email.',
      created: '2026-08-25',
      updated: '2 days ago',
    },
  ],
  financeTransactions: [
    {
      id: 'TXN-2026-001',
      userId: 'usr-attendee-001',
      eventId: 101,
      amount: 200,
      status: 'Successful',
      date: today(),
    },
    {
      id: 'TXN-2026-002',
      userId: 'usr-client-001',
      eventId: 102,
      amount: 350,
      status: 'Successful',
      date: today(),
    },
    {
      id: 'TXN-2026-005',
      userId: 'usr-client-001',
      eventId: 101,
      amount: 200,
      status: 'Successful',
      date: today(),
    },
    {
      id: 'TXN-2026-003',
      userId: 'usr-attendee-001',
      eventId: 103,
      amount: 120,
      status: 'Pending',
      date: '2026-08-27',
    },
    {
      id: 'TXN-2026-004',
      userId: 'usr-client-001',
      eventId: 104,
      amount: 0,
      status: 'Failed',
      date: '2026-08-26',
    },
  ],
  financeRefunds: [
    {
      id: 'REF-2026-001',
      userId: 'usr-client-001',
      eventId: 102,
      amount: 350,
      reason: 'Duplicate registration',
      status: 'Requested',
      date: today(),
    },
    {
      id: 'REF-2026-002',
      userId: 'usr-attendee-001',
      eventId: 103,
      amount: 120,
      reason: 'Event schedule conflict',
      status: 'Processing',
      date: '2026-08-27',
    },
    {
      id: 'REF-2026-003',
      userId: 'usr-attendee-001',
      eventId: 101,
      amount: 200,
      reason: 'Cancelled attendance',
      status: 'Completed',
      date: '2026-08-25',
    },
    {
      id: 'REF-2026-004',
      userId: 'usr-client-001',
      eventId: 104,
      amount: 0,
      reason: 'Invalid request',
      status: 'Rejected',
      date: '2026-08-24',
    },
  ],
  operationalReports: [
    {
      id: 'OPR-001',
      type: 'Support Report',
      title: 'Weekly support queue',
      owner: 'Marcus Vance',
      status: 'Draft',
      updated: 'Today',
    },
    {
      id: 'OPR-002',
      type: 'Finance Report',
      title: 'Transaction reconciliation',
      owner: 'Marcus Vance',
      status: 'Submitted',
      updated: 'Yesterday',
    },
    {
      id: 'OPR-003',
      type: 'Combined Operational Report',
      title: 'August service operations',
      owner: 'Maya Lin',
      status: 'Reviewed',
      updated: '2026-08-25',
    },
  ],
  eventOperationsTasks: [
    {
      id: 'EOP-101',
      eventId: 101,
      eventTitle: 'Global AI & Cloud Summit 2026',
      type: 'Venue & Capacity Review',
      priority: 'High',
      status: 'In Progress',
      description: 'Verify Hall A seating capacity for 600 attendees and check AV setup.',
      updated: '15 mins ago',
    },
    {
      id: 'EOP-102',
      eventId: 102,
      eventTitle: 'FinTech Leaders Executive Conclave',
      type: 'Schedule Conflict',
      priority: 'Medium',
      status: 'Pending',
      description:
        'Review ballroom entrance timeline to avoid setup overlap with hotel guest event.',
      updated: '1 hr ago',
    },
    {
      id: 'EOP-103',
      eventId: 103,
      eventTitle: 'Cybersecurity & Zero Trust Workshop',
      type: 'Equipment & Tech Check',
      priority: 'Low',
      status: 'Resolved',
      description: 'Simulated threat modeling server and projector connection verified.',
      updated: 'Yesterday',
    },
    {
      id: 'EOP-104',
      eventId: 104,
      eventTitle: 'National Web3 & AI Hackathon 2026',
      type: 'Security & Access Audit',
      priority: 'High',
      status: 'Pending',
      description: 'Confirm overnight security pass authorizations and 24-hour venue access.',
      updated: '3 hrs ago',
    },
    {
      id: 'EOP-105',
      eventId: 105,
      eventTitle: 'Torres Tech Q3 Product Launch',
      type: 'Information Correction',
      priority: 'Medium',
      status: 'In Progress',
      description: 'Correct banner imagery resolution and VIP guest list count.',
      updated: 'Today',
    },
  ],
  eventOpsReports: [
    {
      id: 'EOR-001',
      type: 'Event Performance Report',
      title: 'Event Performance Summary — Q2 Summit & Conclave',
      scope: 'Global AI & Cloud Summit 2026',
      period: 'Q2 2026',
      owner: 'Elena Rostova',
      status: 'Reviewed',
      fileName: 'Q2_Performance_Summary.pdf',
      updated: '2026-08-25',
    },
    {
      id: 'EOR-002',
      type: 'Event Operations Report',
      title: 'Venue & Logistics Operations Report',
      scope: 'Main Convention Center',
      period: 'August 2026',
      owner: 'Elena Rostova',
      status: 'Pending Review',
      fileName: 'Logistics_Audit_Report.docx',
      updated: 'Yesterday',
    },
    {
      id: 'EOR-003',
      type: 'Event Activity Report',
      title: 'Monthly Event Activity Report — August 2026',
      scope: 'Platform Wide',
      period: 'August 2026',
      owner: 'Elena Rostova',
      status: 'Reviewed',
      fileName: 'August_Activity_Log.xlsx',
      updated: '2026-08-22',
    },
    {
      id: 'EOR-004',
      type: 'Event Operations Report',
      title: 'Schedule & Venue Audit Report',
      scope: 'FinTech Leaders Executive Conclave',
      period: 'August 2026',
      owner: 'Elena Rostova',
      status: 'Draft',
      fileName: null,
      updated: 'Today',
    },
    {
      id: 'EOR-005',
      type: 'Event Performance Report',
      title: 'Event Issue Resolution & Operations Report',
      scope: 'All Q3 Events',
      period: 'Q3 2026',
      owner: 'Elena Rostova',
      status: 'Submitted',
      fileName: 'Issue_Resolution_Q3.pdf',
      updated: '2 days ago',
    },
    {
      id: 'EOR-006',
      type: 'Event Activity Report',
      title: 'National Hackathon Operations & Equipment Log',
      scope: 'National Web3 & AI Hackathon 2026',
      period: 'August Week 4',
      owner: 'Elena Rostova',
      status: 'Submitted',
      fileName: 'Hackathon_Ops_Log.xlsx',
      updated: '3 days ago',
    },
  ],
  eventOpsRequests: [
    {
      id: 'EOR-REQ-001',
      eventId: 101,
      eventTitle: 'Global AI & Cloud Summit 2026',
      issue:
        'Venue capacity insufficient — attendee count exceeds Hall A limit by 85 seats. Requesting overflow arrangement.',
      source: 'User (Direct)',
      raisedBy: 'Priya Mehta',
      priority: 'High',
      status: 'In Progress',
      date: '2026-08-30 · 9:14 AM',
      notes: '',
    },
    {
      id: 'EOR-REQ-002',
      eventId: 102,
      eventTitle: 'FinTech Leaders Executive Conclave',
      issue:
        'Schedule conflict reported — keynote session overlaps with hotel ballroom booking. Attendees facing confusion.',
      source: 'Escalated by Emp 3',
      raisedBy: 'Customer Support',
      priority: 'High',
      status: 'Pending',
      date: '2026-08-30 · 8:45 AM',
      notes: '',
    },
    {
      id: 'EOR-REQ-003',
      eventId: 103,
      eventTitle: 'Cybersecurity & Zero Trust Workshop',
      issue:
        'Event banner shows wrong venue floor. Requesting information correction on registration confirmation emails.',
      source: 'User (Direct)',
      raisedBy: 'Ravi Kumar',
      priority: 'Medium',
      status: 'Pending',
      date: '2026-08-29 · 4:32 PM',
      notes: '',
    },
    {
      id: 'EOR-REQ-004',
      eventId: 104,
      eventTitle: 'National Web3 & AI Hackathon 2026',
      issue:
        'Cancellation request raised by team lead — team unable to attend due to visa delays. Refund and slot reallocation required.',
      source: 'Escalated by Emp 3',
      raisedBy: 'Customer Support',
      priority: 'High',
      status: 'Pending',
      date: '2026-08-29 · 2:10 PM',
      notes: '',
    },
    {
      id: 'EOR-REQ-005',
      eventId: 105,
      eventTitle: 'Torres Tech Q3 Product Launch',
      issue:
        'VIP seating arrangement request — 3 executives require reserved front-row access and separate registration check-in.',
      source: 'User (Direct)',
      raisedBy: 'Ananya Sharma',
      priority: 'Medium',
      status: 'Resolved',
      date: '2026-08-28 · 11:05 AM',
      notes: 'VIP arrangement confirmed with venue coordinator.',
    },
    {
      id: 'EOR-REQ-006',
      eventId: 106,
      eventTitle: 'Global Health & MedTech Expo 2026',
      issue:
        'AV equipment malfunction reported during rehearsal — projectors in Hall B not syncing with laptop output.',
      source: 'Escalated by Emp 3',
      raisedBy: 'Customer Support',
      priority: 'High',
      status: 'In Progress',
      date: '2026-08-28 · 9:30 AM',
      notes: '',
    },
    {
      id: 'EOR-REQ-007',
      eventId: 107,
      eventTitle: 'Women in Leadership Summit',
      issue:
        'Schedule update needed — opening ceremony moved 30 mins earlier. Attendees need updated confirmation with new timings.',
      source: 'User (Direct)',
      raisedBy: 'Meera Iyer',
      priority: 'Medium',
      status: 'Resolved',
      date: '2026-08-27 · 3:18 PM',
      notes: 'Updated schedule sent to all registered attendees.',
    },
    {
      id: 'EOR-REQ-008',
      eventId: 108,
      eventTitle: 'Renewable Energy Innovation Forum',
      issue:
        'Capacity oversubscription — event sold 20% over venue limit due to system error. Waiting list and capacity review needed.',
      source: 'Escalated by Emp 3',
      raisedBy: 'Customer Support',
      priority: 'High',
      status: 'Closed',
      date: '2026-08-26 · 10:50 AM',
      notes: 'Capacity expanded to secondary hall. Waitlisted attendees notified.',
    },
    {
      id: 'EOR-REQ-009',
      eventId: 101,
      eventTitle: 'Global AI & Cloud Summit 2026',
      issue:
        'Parking arrangement inquiry — group of 40 attendees from outstation require dedicated parking slots near venue entrance.',
      source: 'User (Direct)',
      raisedBy: 'Sameer Joshi',
      priority: 'Low',
      status: 'Pending',
      date: '2026-08-30 · 7:00 AM',
      notes: '',
    },
    {
      id: 'EOR-REQ-010',
      eventId: 103,
      eventTitle: 'Cybersecurity & Zero Trust Workshop',
      issue:
        'Speaker travel logistics — confirmed keynote speaker requires airport pickup and hotel arrangement from organizer side.',
      source: 'User (Direct)',
      raisedBy: 'Organizing Team',
      priority: 'Medium',
      status: 'In Progress',
      date: '2026-08-29 · 6:45 PM',
      notes: '',
    },
  ],
  regReports: [
    {
      id: 'RVR-001',
      type: 'Registration Report',
      title: 'Monthly Online Registration & Conversion Audit — August 2026',
      owner: 'Arjun Kapoor',
      status: 'Reviewed',
      period: 'August 2026',
      fileName: 'Monthly_Registration_Audit_Aug2026.pdf',
      updated: '2026-08-25',
    },
    {
      id: 'RVR-002',
      type: 'User Management Report',
      title: 'Account Access & Verification Summary — Q2 2026',
      owner: 'Arjun Kapoor',
      status: 'Submitted',
      period: 'Q2 2026 (Apr–Jun)',
      fileName: 'Account_Access_Verification_Q2_2026.docx',
      updated: 'Yesterday',
    },
    {
      id: 'RVR-003',
      type: 'Registration Activity Report',
      title: 'Q2 Attendee Registration Activity & Demographics Analysis',
      owner: 'Arjun Kapoor',
      status: 'Reviewed',
      period: 'Q2 2026 (Apr–Jun)',
      fileName: 'Q2_Registration_Activity_Demographics.xlsx',
      updated: '2026-08-20',
    },
    {
      id: 'RVR-004',
      type: 'Registration Report',
      title: 'Tech Summit 2026 — Online Registration Status & Completion Report',
      owner: 'Arjun Kapoor',
      status: 'Submitted',
      period: 'July 2026',
      fileName: 'TechSummit_Registration_Report.pdf',
      updated: '2 days ago',
    },
    {
      id: 'RVR-005',
      type: 'User Management Report',
      title: 'User Account Deactivation & Access Audit — July 2026',
      owner: 'Arjun Kapoor',
      status: 'Draft',
      period: 'July 2026',
      fileName: null,
      updated: 'Today',
    },
    {
      id: 'RVR-006',
      type: 'Registration Activity Report',
      title: 'Pending & Flagged Registrations Weekly Summary — Wk 34',
      owner: 'Arjun Kapoor',
      status: 'Draft',
      period: 'August Week 4',
      fileName: null,
      updated: 'Today',
    },
  ],
  _nextId: {
    users: 14,
    events: 9,
    reqs: 5,
    regs: 9,
    notifs: 10,
  },
};

// ════════════════════════════════════════════════
//  DATA PERSISTENCE (LOCALSTORAGE)
// ════════════════════════════════════════════════
function saveDB() {
  try {
    localStorage.setItem('ffsd_db', JSON.stringify(DB));
  } catch (e) {
    console.log('Storage quota exceeded or private mode');
  }
}
// `persist` is disabled for storage events so receiving tabs do not write the
// same data back and trigger another refresh in every open session.
function loadDB(persist = true) {
  try {
    const saved = localStorage.getItem('ffsd_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      const initialUsers = [...DB.users];
      const initialEvents = [...DB.events];
      const initialRequests = [...DB.eventRequests];
      const initialRegs = [...DB.registrations];
      const initialNotifs = [...DB.notifications];
      const initialReports = [...(DB.reports || [])];
      const initialChangeRequests = [...(DB.employeeChangeRequests || [])];
      const initialSupportRequests = [...(DB.supportRequests || [])];
      const initialFinanceTransactions = [...(DB.financeTransactions || [])];
      const initialFinanceRefunds = [...(DB.financeRefunds || [])];
      const initialOperationalReports = [...(DB.operationalReports || [])];
      const initialEventOperationsTasks = [...(DB.eventOperationsTasks || [])];
      const initialEventOpsReports = [...(DB.eventOpsReports || [])];
      const initialUserQueries = [...(DB.userQueries || [])];
      Object.assign(DB, parsed);
      window.EventFlowAccountPolicy.migrateLegacyDemoData(DB);

      // Ensure optional arrays exist

      if (!DB.reports) DB.reports = [];
      if (!DB.employeeChangeRequests) DB.employeeChangeRequests = [];
      if (!DB.attendanceReports) DB.attendanceReports = {};
      if (!DB.supportRequests) DB.supportRequests = [];
      if (!DB.financeTransactions) DB.financeTransactions = [];
      if (!DB.financeRefunds) DB.financeRefunds = [];
      if (!DB.operationalReports) DB.operationalReports = [];
      if (!DB.eventOperationsTasks) DB.eventOperationsTasks = [];
      if (!DB.eventOpsReports) DB.eventOpsReports = [];
      if (!DB.eventOpsRequests) DB.eventOpsRequests = [];
      if (!DB.userQueries) DB.userQueries = [];
      if (!DB.routedRequests) DB.routedRequests = [];

      // Sync all demo/seed users and passwords from latest build
      initialUsers.forEach(initU => {
        const existing = DB.users.find(
          user =>
            (user.email && user.email.toLowerCase() === initU.email.toLowerCase()) ||
            user.id === initU.id
        );
        if (!existing) {
          DB.users.push(initU);
        } else {
          if (!existing.settingsUpdated) existing.password = initU.password;
          existing.status = 'active';
          if (initU.role) existing.role = initU.role;
          if (initU.name && !existing.settingsUpdated) existing.name = initU.name;
          if (initU.avatarImage) existing.avatarImage = initU.avatarImage;
          if (initU.avatar) existing.avatar = initU.avatar;
          if (initU.service) existing.service = initU.service;
          if (initU.bio) existing.bio = initU.bio;
          if (initU.color) existing.color = initU.color;
        }
      });

      // Always restore missing mock events (ensuring employee events are always populated)
      initialEvents.forEach(ev => {
        const existing = DB.events.find(event => String(event.id) === String(ev.id));
        if (!existing) {
          DB.events.push(ev);
        } else {
          if (ev.image) existing.image = ev.image;
          if (ev.color) existing.color = ev.color;
          if (ev.emoji) existing.emoji = ev.emoji;
        }
      });

      // Always restore missing mock event requests & migrate legacy client IDs
      initialRequests.forEach(req => {
        const existing = DB.eventRequests.find(request => String(request.id) === String(req.id));
        if (!existing) {
          DB.eventRequests.push(req);
        } else if (
          existing.clientId === 3 ||
          existing.clientId === '3' ||
          !DB.users.find(user => String(user.id) === String(existing.clientId))
        ) {
          existing.clientId = 'usr-client-001';
        }
      });
      DB.eventRequests.forEach(request => {
        if (
          request.clientId === 3 ||
          request.clientId === '3' ||
          !DB.users.find(user => String(user.id) === String(request.clientId))
        ) {
          request.clientId = 'usr-client-001';
        }
      });

      // Always restore missing mock registrations and sync verification statuses
      initialRegs.forEach(reg => {
        const existing = DB.registrations.find(
          registration => String(registration.id) === String(reg.id)
        );
        if (!existing) {
          DB.registrations.push(reg);
        } else {
          if (reg.verificationStatus && !existing.verificationStatus)
            existing.verificationStatus = reg.verificationStatus;
          if (reg.docType && !existing.docType) existing.docType = reg.docType;
          if (reg.docRef && !existing.docRef) existing.docRef = reg.docRef;
        }
      });

      // Always restore userQueries
      initialUserQueries.forEach(query => {
        const existing = DB.userQueries.find(q => String(q.id) === String(query.id));
        if (!existing) DB.userQueries.push(query);
      });

      // Always restore missing mock notifications
      initialNotifs.forEach(notif => {
        if (!DB.notifications.find(notification => String(notification.id) === String(notif.id))) {
          DB.notifications.push(notif);
        }
      });

      // Always restore missing mock event reports
      initialReports.forEach(report => {
        if (!DB.reports.find(r => String(r.id) === String(report.id))) {
          DB.reports.push(report);
        }
      });
      initialChangeRequests.forEach(request => {
        if (!DB.employeeChangeRequests.find(r => String(r.id) === String(request.id))) {
          DB.employeeChangeRequests.push(request);
        }
      });
      initialSupportRequests.forEach(request => {
        const existing = DB.supportRequests.find(r => String(r.id) === String(request.id));
        if (!existing) DB.supportRequests.push(request);
      });
      initialFinanceTransactions.forEach(transaction => {
        const existing = DB.financeTransactions.find(
          item => String(item.id) === String(transaction.id)
        );
        if (!existing) DB.financeTransactions.push(transaction);
        else if (['TXN-2026-001', 'TXN-2026-002', 'TXN-2026-005'].includes(transaction.id))
          existing.date = transaction.date;
      });
      initialFinanceRefunds.forEach(refund => {
        const existing = DB.financeRefunds.find(item => String(item.id) === String(refund.id));
        if (!existing) DB.financeRefunds.push(refund);
        else if (['REF-2026-001'].includes(refund.id)) existing.date = refund.date;
      });
      initialOperationalReports.forEach(report => {
        if (!DB.operationalReports.find(item => String(item.id) === String(report.id)))
          DB.operationalReports.push(report);
      });
      initialEventOperationsTasks.forEach(task => {
        if (!DB.eventOperationsTasks.find(item => String(item.id) === String(task.id)))
          DB.eventOperationsTasks.push(task);
      });
      initialEventOpsReports.forEach(report => {
        if (!DB.eventOpsReports.find(item => String(item.id) === String(report.id)))
          DB.eventOpsReports.push(report);
      });
      (DB._initialEventOpsRequests || DB.eventOpsRequests.slice()).forEach(() => {});
      // Restore event ops requests from seed
      if (typeof initialEventOpsRequests !== 'undefined') {
        initialEventOpsRequests.forEach(request => {
          if (!DB.eventOpsRequests.find(item => String(item.id) === String(request.id)))
            DB.eventOpsRequests.push(request);
        });
      }

      // SAFETY: Sync _nextId with actual data max IDs to prevent collisions
      const _maxId = (arr, key) =>
        arr.length ? Math.max(0, ...arr.map(x => (isNaN(x[key]) ? 0 : parseInt(x[key])))) : 0;
      DB._nextId.users = Math.max(DB._nextId.users || 0, _maxId(DB.users, 'id') + 1);
      DB._nextId.events = Math.max(DB._nextId.events || 0, _maxId(DB.events, 'id') + 1);
      DB._nextId.regs = Math.max(DB._nextId.regs || 0, _maxId(DB.registrations, 'id') + 1);
      DB._nextId.reqs = Math.max(DB._nextId.reqs || 0, _maxId(DB.eventRequests, 'id') + 1);

      // Persist seed-data migrations only for local loads. A storage event
      // must remain read-only to avoid a cross-tab update loop.
      if (persist || Number(parsed.accountSchemaVersion || 0) < 2) saveDB();
    }
  } catch (e) {
    console.log('Could not load DB from storage');
  }
  window.EventFlowAccountPolicy.migrateLegacyDemoData(DB);
}

// ════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════
let CU = null; // current user
let _confirmCb = null;
let _currentPage = 'dashboard';
const ROLE_LABELS = {
  superuser: 'Super Administrator',
  organizer: 'Event Organizer',
  client: 'Client',
  employee: 'Employee',
  attendee: 'Attendee',
};
const ROLE_COLORS = {
  superuser: 'red',
  organizer: 'purple',
  client: 'yellow',
  employee: 'green',
  attendee: 'blue',
};
const DEMO_CREDS = {
  employee: {
    email: 'employee@example.com',
    pw: 'Employee@123',
  },
  organizer: {
    email: 'organizer@example.com',
    pw: 'Organizer@123',
  },
  client: {
    email: 'client@example.com',
    pw: 'Client@123',
  },
  attendee: {
    email: 'attendee@example.com',
    pw: 'Attendee@123',
  },
  superuser: {
    email: 'superadmin@example.com',
    pw: 'Admin@123',
  },
};
function isEmployeeAccount() {
  return (CU?.email || '').toLowerCase() === DEMO_CREDS.employee.email;
}
function isDepartmentEmployee() {
  return CU?.role === 'employee' && !!CU?.employeeType;
}

// ════════════════════════════════════════════════
//  PAGE SWITCHING
// ════════════════════════════════════════════════
function showPage(p) {
  document.getElementById('landing').style.display = p === 'landing' ? 'block' : 'none';
  document.getElementById('login').style.display = p === 'login' ? 'flex' : 'none';
  document.getElementById('find-events').style.display = p === 'find-events' ? 'block' : 'none';
  document.getElementById('gallery').style.display = p === 'gallery' ? 'block' : 'none';
  document.getElementById('about').style.display = p === 'about' ? 'block' : 'none';
  document.getElementById('contact').style.display = p === 'contact' ? 'block' : 'none';
  document.getElementById('app').style.display = p === 'app' ? 'block' : 'none';
}
function gotoLogin(role) {
  showPage('login');
}

// ════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════

function fillLogin(email, pass) {
  for (const [id, value] of [
    ['l-email', email],
    ['l-pass', pass],
  ]) {
    const input = g(id);
    if (!input) continue;
    input.value = value;
    input.dispatchEvent(
      new Event('input', {
        bubbles: true,
      })
    );
  }
  toast('Demo credentials loaded: ' + email, 'info');
}
function doLogin() {
  const email = g('l-email').value.trim();
  const pass = g('l-pass').value.trim();
  let ok = true;
  if (!email || !email.includes('@')) {
    showErr('l-email-err');
    ok = false;
  } else hideErr('l-email-err');
  if (!pass || pass.length < 3) {
    showErr('l-pass-err');
    ok = false;
  } else hideErr('l-pass-err');
  if (!ok) return;
  const button = document.querySelector('#login .btn-primary');
  if (button) {
    button.textContent = 'Signing in…';
    button.disabled = true;
  }

  // Try backend first, with instant fallback to local DB if backend is offline
  apiLogin(email, pass)
    .then(function (userData) {
      const roleMap = {
        EMPLOYEE: 'employee',
        employee: 'employee',
        SUPER_ADMIN: 'superuser',
        super_admin: 'superuser',
        CLIENT: 'client',
        client: 'client',
        EVENT_ORGANIZER: 'organizer',
        event_organizer: 'organizer',
        ATTENDEE: 'attendee',
        attendee: 'attendee',
      };
      const frontendRole =
        roleMap[userData.role || userData.userRole] ||
        (userData.role || userData.userRole || '').toLowerCase();
      CU = {
        id: userData.userId,
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        phoneNo: userData.phoneNo,
        token: userData.token,
        role: frontendRole,
        userRole: userData.role || userData.userRole,
        employeeType: userData.employeeType,
        status: userData.status,
        avatar: (userData.name || 'U')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      };
      try {
        sessionStorage.setItem('ef_cu', JSON.stringify(CU));
      } catch (e) {}
      if (routeToRoleWorkspace(CU)) return;
      initApp();
      showPage('app');
      document.documentElement.classList.remove('restoring-session');
      toast(`Welcome back, ${CU.name}! 👋`, 'success');
    })
    .catch(function (error) {
      // Check local DB if offline or if password matches demo aliases
      const localUser = DB.users.find(user => user.email.toLowerCase() === email.toLowerCase());
      const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const inNorm = norm(pass);
      const stNorm = localUser ? norm(localUser.password) : '';
      const localMatches =
        localUser &&
        !(localUser.role === 'superuser' && error.status === 401) &&
        (localUser.password === pass ||
          (!localUser.settingsUpdated &&
            (localUser.password.toLowerCase() === pass.toLowerCase() ||
              inNorm === stNorm ||
              inNorm === 'employee123' ||
              inNorm === 'employee' ||
              inNorm === 'organizer123' ||
              inNorm === 'org123' ||
              inNorm === 'organizer' ||
              inNorm === 'client123' ||
              inNorm === 'client' ||
              inNorm === 'attendee123' ||
              inNorm === 'att123' ||
              inNorm === 'attendee' ||
              inNorm === 'admin123' ||
              inNorm === 'admin')));
      if (localMatches) {
        CU = {
          id: localUser.id || localUser.userId,
          userId: localUser.userId || localUser.id,
          name: localUser.name,
          email: localUser.email,
          role: localUser.role,
          userRole: localUser.userRole || localUser.role,
          employeeType: localUser.employeeType,
          status: localUser.status || 'active',
          avatar: (localUser.name || 'U')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        };
        try {
          sessionStorage.setItem('ef_cu', JSON.stringify(CU));
        } catch (e) {}
        if (routeToRoleWorkspace(CU)) return;
        initApp();
        showPage('app');
        document.documentElement.classList.remove('restoring-session');
        toast(`Welcome back, ${CU.name}! 👋`, 'success');
      } else {
        const msg = error.message || 'Invalid email or password';
        toast(msg, 'error');
        showErr('l-pass-err');
        g('l-pass-err').textContent = msg;
      }
    })
    .finally(function () {
      if (button) {
        button.textContent = 'Sign In →';
        button.disabled = false;
      }
    });
}
function doLogout() {
  CU = null;
  try {
    sessionStorage.removeItem('ef_cu');
  } catch (e) {}
  document.documentElement.classList.remove('restoring-session');
  if (window.EventFlowRole?.key !== 'landing') {
    window.location.replace('/landing');
    return;
  }
  showPage('landing');
  toast('Signed out successfully', 'info');
}
function openRegisterModal() {
  if (
    window.EventFlowOrganizerRegistration &&
    typeof window.EventFlowOrganizerRegistration.openRegisterModal === 'function'
  ) {
    return window.EventFlowOrganizerRegistration.openRegisterModal();
  }
  openModal(
    'Create New Account',
    `
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="rg-name" placeholder="John Doe"></div>
      <div class="form-group"><label class="form-label">Email *</label><input class="form-control" id="rg-email" type="email" placeholder="you@example.com"></div>
    </div>
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Password *</label><input class="form-control" id="rg-pass" type="password" placeholder="Min 6 characters"></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="rg-phone" placeholder="+91 9876543200"></div>
    </div>
    <div class="form-group"><label class="form-label">Register As *</label>
      <select class="form-control" id="rg-role">
        <option value="attendee">🎟️ Attendee</option>
        <option value="client">💼 Client</option>

        <option value="organizer">🎯 Event Organizer</option>
      </select>
    </div>
  `,
    [
      {
        lbl: 'Create Account',
        cls: 'btn-primary',
        fn: 'submitRegister()',
      },
    ],
    false
  );
}
function submitRegister() {
  const name = v('rg-name');
  const email = v('rg-email');
  const pass = v('rg-pass');
  const phone = v('rg-phone');
  const role = v('rg-role');
  if (!name) {
    toast('Name is required', 'error');
    return;
  }
  if (!email || !email.includes('@')) {
    toast('Valid email is required', 'error');
    return;
  }
  if (!pass || pass.length < 6) {
    toast('Password must be at least 6 characters', 'error');
    return;
  }
  if (window.EventFlowAccountPolicy.isEmailInUse(DB.users, email)) {
    toast('Email already registered', 'error');
    return;
  }
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  DB.users.push({
    id: DB._nextId.users++,
    name,
    email,
    password: pass,
    role,
    phone,
    avatar: initials,
    status: 'active',
    joined: today(),
  });
  closeModal();
  toast('Account created! You can now sign in.', 'success');
  g('l-email').value = email;
  g('l-pass').value = pass;
}

// ════════════════════════════════════════════════
//  APP INIT
// ════════════════════════════════════════════════
const NAV = {
  superuser: [
    {
      ic: '📊',
      lbl: 'Dashboard',
      pg: 'dashboard',
    },
    {
      ic: '📄',
      lbl: 'Reports',
      pg: 'reports',
    },
    {
      ic: '👥',
      lbl: 'User Reports',
      pg: 'user-reports',
    },
    {
      ic: '🗓️',
      lbl: 'Event Reports',
      pg: 'event-reports',
    },
    {
      ic: '💰',
      lbl: 'Revenue Reports',
      pg: 'revenue-reports',
    },
    {
      ic: '📥',
      lbl: 'Employee Reports',
      pg: 'employee-reports',
    },
  ],
  organizer: [
    {
      ic: '📊',
      lbl: 'Dashboard',
      pg: 'dashboard',
    },
    {
      ic: '🗓️',
      lbl: 'Manage Events',
      pg: 'events',
    },
    {
      ic: '📋',
      lbl: 'Event Requests',
      pg: 'event-requests',
    },
    {
      ic: '👥',
      lbl: 'Attendee Management',
      pg: 'attendees',
    },
    {
      ic: '📈',
      lbl: 'Event Reports',
      pg: 'reports',
    },
  ],
  employee: [
    {
      ic: '📊',
      lbl: 'Dashboard',
      pg: 'dashboard',
    },
    {
      ic: '📈',
      lbl: 'Reports',
      pg: 'reports',
    },
    {
      ic: '👤',
      lbl: 'Profile',
      pg: 'profile',
    },
  ],
  client: [
    {
      ic: '📊',
      lbl: 'Dashboard',
      pg: 'dashboard',
    },
    {
      ic: '🔍',
      lbl: 'Find Organizers',
      pg: 'find-organizers',
    },
    {
      ic: '▶️',
      lbl: 'Ongoing Events',
      pg: 'ongoing-events',
    },
    {
      ic: '✅',
      lbl: 'Completed Events',
      pg: 'completed-events',
    },
    {
      ic: '📋',
      lbl: 'Request Status',
      pg: 'request-status',
    },
  ],
  attendee: [
    {
      ic: '📊',
      lbl: 'Dashboard',
      pg: 'dashboard',
    },
    {
      ic: '🔍',
      lbl: 'Browse Events',
      pg: 'browse-events',
    },
    {
      ic: '🎟️',
      lbl: 'My Tickets',
      pg: 'my-tickets',
    },
  ],
};

// ════════════════════════════════════════════════
//  ADMIN: Employee Stats & Management (superuser)
// ════════════════════════════════════════════════
let adminChartSequence = 0;
const ADMIN_CHART_COLORS = ['#559ff5', '#edb65c', '#67c4bb', '#aa9ce5'];
function adminChartText(value) {
  return escapeHtml(String(value)).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function adminChartNumber(value, options = {}) {
  const number = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1,
  }).format(value);
  return `${options.prefix || ''}${number}${options.suffix || ''}`;
}

// Monotone curves pass through the data without overshooting peaks or zero.
function adminChartLine(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const slopes = points
    .slice(1)
    .map((point, index) => (point.y - points[index].y) / (point.x - points[index].x));
  const tangents = points.map((point, index) => {
    if (!index) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    return slopes[index - 1] * slopes[index] <= 0
      ? 0
      : 2 / (1 / slopes[index - 1] + 1 / slopes[index]);
  });
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const dx = (point.x - previous.x) / 3;
    return `${path} C ${previous.x + dx} ${previous.y + tangents[index] * dx}, ${point.x - dx} ${
      point.y - tangents[index + 1] * dx
    }, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}
function buildAdminAnalyticsChart(groups, height, options = {}) {
  const data = (groups || []).map(group => ({
    label: String(group.label || ''),
    bars: (group.bars || []).map(bar => ({
      ...bar,
      value: Number.isFinite(Number(bar.value)) ? Math.max(0, Number(bar.value)) : 0,
    })),
  }));
  if (!data.length)
    return '<div class="admin-chart admin-chart--empty">No data available for this period.</div>';
  const id = `admin-chart-${++adminChartSequence}`;
  const width = 600;
  const plotHeight = 180;
  const highest = Math.max(1, ...data.flatMap(group => group.bars.map(bar => bar.value)));
  const roughStep = highest / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const step = Math.max(
    1,
    ([1, 2, 5, 10].find(value => value * magnitude >= roughStep) || 10) * magnitude
  );
  const maximum = step * 4;
  const groupWidth = width / data.length;
  const seriesCount = Math.max(1, ...data.map(group => group.bars.length));
  const color = index => ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length];
  const y = value => plotHeight - (value / maximum) * plotHeight;
  const ticks = Array.from(
    {
      length: 5,
    },
    (_, index) => maximum - index * step
  );
  const paths = Array.from(
    {
      length: seriesCount,
    },
    (_, series) =>
      data.map((group, index) => ({
        x: groupWidth * (index + 0.5),
        y: y(group.bars[series]?.value || 0),
      }))
  );
  const legend = options.legend || [];
  const marks =
    options.kind === 'line'
      ? paths
          .map((points, series) => {
            const path = adminChartLine(points);
            const area = `${path} L ${points[points.length - 1].x} ${plotHeight} L ${
              points[0].x
            } ${plotHeight} Z`;
            return `<path d="${area}" fill="url(#${id}-fill-${series})"/><path d="${path}" fill="none" stroke="${color(
              series
            )}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          ${points
            .map(
              (point, index) =>
                `<circle cx="${point.x}" cy="${point.y}" r="${
                  index === points.length - 1 ? 3 : 2
                }" fill="${
                  index === points.length - 1 ? '#edb65c' : color(series)
                }" stroke="var(--surface)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
            )
            .join('')}`;
          })
          .join('')
      : data
          .map((group, index) => {
            const barWidth = Math.min(14, groupWidth / (seriesCount * 3));
            const gap = 5;
            const start =
              groupWidth * (index + 0.5) - (seriesCount * barWidth + (seriesCount - 1) * gap) / 2;
            return group.bars
              .map(
                (bar, series) =>
                  `<rect x="${start + series * (barWidth + gap)}" y="${y(
                    bar.value
                  )}" width="${barWidth}" height="${
                    plotHeight - y(bar.value)
                  }" rx="2" fill="${color(series)}" fill-opacity="0.92"/>`
              )
              .join('');
          })
          .join('');
  return `<div class="admin-chart admin-chart--${
    options.kind || 'bar'
  }" role="group" aria-label="${adminChartText(
    options.label || 'Analytics chart'
  )}" style="--admin-chart-height:${Math.max(112, (height || 200) - 36)}px">
        ${
          legend.length
            ? `<div class="admin-chart__legend">${legend
                .map(
                  (item, index) =>
                    `<span><i style="background:${color(index)}"></i>${adminChartText(
                      item.label
                    )}</span>`
                )
                .join('')}</div>`
            : ''
        }
        <div class="admin-chart__body">
          <div class="admin-chart__axis-y" aria-hidden="true">${ticks
            .map(
              (tick, index) =>
                `<span style="top:${index * 25}%">${adminChartNumber(tick, options)}</span>`
            )
            .join('')}</div>
          <div class="admin-chart__plot">
            <svg class="admin-chart__svg" viewBox="0 0 ${width} ${plotHeight}" preserveAspectRatio="none" aria-hidden="true">
              <defs>${paths
                .map(
                  (points, series) =>
                    `<linearGradient id="${id}-fill-${series}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color(
                      series
                    )}" stop-opacity="0.2"/><stop offset="100%" stop-color="${color(
                      series
                    )}" stop-opacity="0.015"/></linearGradient>`
                )
                .join('')}</defs>
              ${ticks
                .map(
                  tick =>
                    `<line x1="0" y1="${y(tick)}" x2="${width}" y2="${y(
                      tick
                    )}" class="admin-chart__grid" vector-effect="non-scaling-stroke"/>`
                )
                .join('')}
              ${marks}
            </svg>
            <div class="admin-chart__targets">${data
              .map((group, index) => {
                const values = group.bars.map(
                  (bar, series) =>
                    `${
                      legend[series]?.label ||
                      options.label ||
                      (bar.label !== group.label ? bar.label : '') ||
                      'Total'
                    }: ${adminChartNumber(bar.value, options)}`
                );
                return `<button type="button" class="admin-chart__target" style="--point-y:${
                  (y(group.bars[0]?.value || 0) / plotHeight) * 100
                }%" aria-label="${adminChartText(`${group.label}. ${values.join('. ')}`)}">
                <span class="admin-chart__tooltip" aria-hidden="true"><strong>${adminChartText(
                  group.label
                )}</strong>${values
                  .map(
                    (value, series) =>
                      `<span><i style="background:${color(series)}"></i>${adminChartText(
                        value
                      )}</span>`
                  )
                  .join('')}</span>
                ${
                  options.kind === 'line'
                    ? '<svg class="admin-chart__focus-point" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#559ff5" fill-opacity="0.18"/><circle cx="8" cy="8" r="3.5" fill="#559ff5"/></svg>'
                    : ''
                }
              </button>`;
              })
              .join('')}</div>
          </div>
        </div>
        <div class="admin-chart__axis-x" style="grid-template-columns:repeat(${
          data.length
        },minmax(0,1fr))" aria-hidden="true">${data
    .map(group => `<span>${adminChartText(group.label)}</span>`)
    .join('')}</div>
      </div>`;
}
function buildGroupedAnalyticsBars(groups, height, legend) {
  return buildAdminAnalyticsChart(groups, height, {
    legend,
  });
}
function buildAnalyticsBars(items, height, options = {}) {
  return buildAdminAnalyticsChart(
    items.map(item => ({
      label: item.label,
      bars: [item],
    })),
    height,
    options
  );
}
function buildAnalyticsLine(items, height, options = {}) {
  return buildAnalyticsBars(items, height, {
    ...options,
    kind: 'line',
  });
}
function buildAnalyticsRings(items) {
  const circumference = 2 * Math.PI * 30;
  return `<div class="admin-chart admin-chart--rings">${items
    .map(item => {
      const value = Math.min(100, Math.max(0, Number(item.value) || 0));
      return `<div class="admin-chart__ring-item" role="img" aria-label="${adminChartText(
        `${item.label}: ${value}% active`
      )}"><div class="admin-chart__ring">
          <svg viewBox="0 0 76 76" aria-hidden="true"><circle class="admin-chart__ring-track" cx="38" cy="38" r="30"/><circle class="admin-chart__ring-value" cx="38" cy="38" r="30" stroke-dasharray="${circumference}" stroke-dashoffset="${
        circumference * (1 - value / 100)
      }"/></svg><strong>${value}%</strong>
          </div><span>${adminChartText(item.label)}</span></div>`;
    })
    .join('')}</div>`;
}
function buildAnalyticsProgress(items) {
  const total = items.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
  return `<div class="admin-chart admin-chart--progress">
    ${items
      .map(item => {
        const pct = Math.round(((item.value || 0) / total) * 100);
        const color =
          String(item.color || '').match(/#[0-9a-f]{6}/i)?.[0] ||
          (String(item.color || '').startsWith('var(') ? item.color : 'var(--blue)');
        return `<div class="admin-chart__progress-row"><div class="admin-chart__progress-label"><span>${adminChartText(
          item.label
        )}</span><span><strong>${
          item.value
        }</strong> <small>${pct}%</small></span></div><div class="admin-chart__progress-track"><div style="width:${pct}%;background:${color}"></div></div></div>`;
      })
      .join('')}
  </div>`;
}
function initApp() {
  const r = CU.role;
  const navRole = isDepartmentEmployee() ? 'employee' : r;
  const displayRole = isDepartmentEmployee()
    ? EMPLOYEE_TYPE_LABELS[CU.employeeType]
    : ROLE_LABELS[r] || r;
  g('sb-name').textContent = isDepartmentEmployee() ? displayRole : CU.name;
  g('sb-role-lbl').textContent = isDepartmentEmployee() ? 'Employee workspace' : displayRole;
  if (CU.avatarImage) {
    globalThis.window?.EventFlowAdminPages?.clear(g('sb-av'));
    g('sb-av').innerHTML = `<img src="${CU.avatarImage}" alt="${
      CU.name
    }" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.textContent='${
      CU.avatar || CU.name.charAt(0)
    }'">`;
  } else {
    g('sb-av').textContent = CU.avatar || CU.name.charAt(0);
  }
  updateNotifDot();
  buildNav(navRole);
  if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType);
  goNav('dashboard');
}
function buildEmployeeNav(employeeType) {
  const nav =
    {
      REGISTRATION_VERIFICATION: [
        {
          ic: '📊',
          lbl: 'Dashboard',
          pg: 'dashboard',
        },
        {
          ic: '📝',
          lbl: 'Registrations',
          pg: 'registrations',
        },
        {
          ic: '👥',
          lbl: 'User Management',
          pg: 'attendees',
        },
        {
          ic: '📄',
          lbl: 'Reports',
          pg: 'reports',
        },
      ],
      EVENT_OPERATIONS: [
        {
          ic: '📊',
          lbl: 'Dashboard',
          pg: 'dashboard',
        },
        {
          ic: '📅',
          lbl: 'Events',
          pg: 'events',
        },
        {
          ic: '⚙️',
          lbl: 'Event Operations',
          pg: 'event-requests',
        },
        {
          ic: '📄',
          lbl: 'Reports',
          pg: 'reports',
        },
      ],
      SUPPORT_FINANCE: [
        {
          ic: '📊',
          lbl: 'Dashboard',
          pg: 'dashboard',
        },
        {
          ic: '📩',
          lbl: 'Support Center',
          pg: 'support-center',
        },
        {
          ic: '💳',
          lbl: 'Finance',
          pg: 'finance',
        },
        {
          ic: '📋',
          lbl: 'Reports',
          pg: 'reports',
        },
      ],
    }[employeeType] || [];
  const unread = visibleNotifications().filter(n => !n.read).length;
  globalThis.window?.EventFlowAdminPages?.clear(g('sb-nav'));
  g('sb-nav').innerHTML =
    `<div class="sb-section-lbl">Menu</div>` +
    nav
      .map(
        i =>
          `<div class="sb-item" data-pg="${i.pg}" onclick="goNav('${i.pg}')"><span class="ic">${
            i.ic
          }</span><span>${i.lbl}</span>${
            i.badge && unread > 0 ? '<span class="badge-dot"></span>' : ''
          }</div>`
      )
      .join('');
}
function sendContactMessage() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  if (!name) {
    toast('Please enter your name', 'error');
    return;
  }
  if (!email) {
    toast('Please enter your email', 'error');
    return;
  }

  // Email validation regex - checks for valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast('Please enter a valid email address', 'error');
    return;
  }
  if (!message) {
    toast('Please enter a message', 'error');
    return;
  }

  // If all validations pass, show success and clear form
  toast('Thank you! We will be in touch soon.', 'success');
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-email').value = '';
  document.getElementById('contact-message').value = '';
}
function buildNav(role) {
  const items = NAV[role] || [];
  const unread = DB.notifications.filter(notification => !notification.read).length;
  globalThis.window?.EventFlowAdminPages?.clear(g('sb-nav'));
  g('sb-nav').innerHTML =
    `<div class="sb-section-lbl">Menu</div>` +
    items
      .map(
        i => `<div class="sb-item" data-pg="${i.pg}" onclick="goNav('${i.pg}')">
      <span class="ic">${i.ic}</span>
      <span>${i.lbl}</span>
      ${i.badge && unread > 0 ? `<span class="badge-dot"></span>` : ''}
    </div>`
      )
      .join('');
}
function updateNotifDot() {
  const unread = visibleNotifications().filter(n => !n.read).length;
  const dot = g('notif-count-dot');
  if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
}
const PAGE_TITLES = {
  'user-reports': 'User Reports & Analytics',
  'event-reports': 'Event Reports & Analytics',
  'revenue-reports': 'Revenue Reports & Analytics',
  dashboard: 'Dashboard',
  users: 'User Statistics',
  events: 'Events',
  'browse-events': 'Browse Events',
  'my-tickets': 'My Tickets',
  attendees: 'Attendee Management',
  reports: 'Reports',
  notifications: 'Notifications',
  attendeeVerification: 'Attendee Verification',
  'employee-stats': 'Employee Statistics',
  registrations: 'Registrations',
  'find-organizers': 'Find Event Organisers',
  'upcoming-events': 'Upcoming Events',
  'completed-events': 'Completed Events',
  'ongoing-events': 'Ongoing Events',
  settings: 'Account Settings',
  'pending-plans': 'Pending Plans',
  'request-status': 'Request Status',
  'employee-reports': 'Employee Reports',
  'new-request': 'New Event Request',
  profile: 'My Profile',
  'event-requests': 'Event Requests',
  'support-center': 'Support Center',
  finance: 'Finance',
};
function updateHeaderUser() {
  if (!CU) return;
  const displayRole = isDepartmentEmployee()
    ? EMPLOYEE_TYPE_LABELS[CU.employeeType]
    : ROLE_LABELS[CU.role] || CU.role || 'User';
  const header = g('topbar-title');
  if (!header) return;
  header.textContent = CU.name ? `${CU.name} · ${displayRole}` : displayRole;
  header.title = header.textContent;
}
function goNav(pg) {
  _currentPage = pg;
  // Keep event-request tabs associated with their parent sidebar section.
  const sidebarPage = pg;
  document
    .querySelectorAll('.sb-item')
    .forEach(element => element.classList.toggle('active', element.dataset.pg === sidebarPage));
  updateHeaderUser();
  // Read the latest shared data without writing it back. Writing during
  // navigation broadcasts a storage event and forces other open tabs to
  // rebuild their current page.
  loadDB(false);
  // renderPage may be async for pages that fetch backend data
  renderPage(pg).catch(err => console.error('Render error', err));
}

// ════════════════════════════════════════════════
//  PAGE ROUTER
// ════════════════════════════════════════════════
async function renderPage(pg) {
  const previousPage = _currentPage;
  const active = document.activeElement;
  const searchInput =
    active instanceof HTMLInputElement &&
    active.id &&
    active.hasAttribute('oninput') &&
    /search/i.test(`${active.id} ${active.placeholder}`)
      ? active
      : null;
  const restoreSearchInput = () => {
    if (searchInput && previousPage === pg && !searchInput.isConnected) {
      const replacement = g(searchInput.id);
      if (replacement) {
        replacement.replaceWith(searchInput);
        searchInput.focus({
          preventScroll: true,
        });
      }
    }
  };
  const render = renderPageContent(pg);
  restoreSearchInput();
  return render.finally(restoreSearchInput);
}
async function renderPageContent(pg) {
  _currentPage = pg;
  const element = g('page-content');
  const r = CU.role;
  if (pg === 'customer-support') {
    if (!window.EventFlowSupport.canRequestSupport(CU)) {
      if (globalThis.window?.EventFlowAdminPages?.hasPage('settings')) {
        window.EventFlowAdminPages.render(
          element,
          'settings',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageSettings();
      }
      return;
    }
    globalThis.window?.EventFlowAdminPages?.clear(element);
    element.innerHTML = await window.EventFlowSupport.render(CU);
    window.EventFlowSupport.bind(element, CU, () => goNav('settings'));
    return;
  }
  if (isDepartmentEmployee()) {
    const allowed =
      {
        REGISTRATION_VERIFICATION: [
          'dashboard',
          'registrations',
          'attendees',
          'attendeeVerification',
          'reports',
          'profile',
          'settings',
          'notifications',
        ],
        EVENT_OPERATIONS: [
          'dashboard',
          'events',
          'event-requests',
          'event-requests',
          'reports',
          'profile',
          'settings',
          'notifications',
        ],
        SUPPORT_FINANCE: [
          'dashboard',
          'support-center',
          'finance',
          'reports',
          'profile',
          'settings',
          'notifications',
        ],
      }[CU.employeeType] || [];
    if (!allowed.includes(pg)) {
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = `<div class="empty"><div class="empty-title">Access restricted</div><p class="empty-desc">This department does not have access to this area.</p></div>`;
      return;
    }
  }

  // Super Admin keeps the Finance inbox, support reports, analytics, and account pages.
  if (r === 'superuser') {
    if (pg === 'dashboard') {
      if (globalThis.window?.EventFlowAdminPages?.hasPage('dashboard')) {
        window.EventFlowAdminPages.render(
          element,
          'dashboard',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = dashAdmin();
      }
      return;
    } else if (pg === 'settings' || pg === 'profile') {
      if (pg === 'profile') {
        if (globalThis.window?.EventFlowAdminPages?.hasPage('profile')) {
          window.EventFlowAdminPages.render(
            element,
            'profile',
            window.EventFlowAdminRuntime.snapshot({})
          );
        } else {
          globalThis.window?.EventFlowAdminPages?.clear(element);
          globalThis.window?.EventFlowAdminPages?.clear(element);
          element.innerHTML = pageProfile();
        }
      } else {
        if (globalThis.window?.EventFlowAdminPages?.hasPage('settings')) {
          window.EventFlowAdminPages.render(
            element,
            'settings',
            window.EventFlowAdminRuntime.snapshot({})
          );
        } else {
          globalThis.window?.EventFlowAdminPages?.clear(element);
          globalThis.window?.EventFlowAdminPages?.clear(element);
          element.innerHTML = pageSettings();
        }
      }
      return;
    } else if (pg === 'employee-reports') {
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = '<div class="card">Loading employee reports…</div>';
      if (CU.token) {
        try {
          financeInboxReports = await apiRequest('/finance/submissions');
        } catch (error) {
          console.error('Could not load finance report submissions', error);
          financeInboxReports = [];
        }
      }
      if (globalThis.window?.EventFlowAdminPages?.hasPage('employee-reports')) {
        window.EventFlowAdminPages.render(
          element,
          'employee-reports',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageEmployeeReports();
      }
      return;
    } else if (pg === 'reports') {
      await window.EventFlowSupportReports.renderAdmin(element, CU);
      return;
    } else if (pg === 'event-reports' || pg === 'events') {
      if (globalThis.window?.EventFlowAdminPages?.hasPage('event-reports')) {
        window.EventFlowAdminPages.render(
          element,
          'event-reports',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageEventReports();
      }
      return;
    } else if (pg === 'revenue-reports' || pg === 'employee-stats') {
      if (globalThis.window?.EventFlowAdminPages?.hasPage('revenue-reports')) {
        window.EventFlowAdminPages.render(
          element,
          'revenue-reports',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageRevenueReports();
      }
      return;
    } else {
      if (globalThis.window?.EventFlowAdminPages?.hasPage('user-reports')) {
        window.EventFlowAdminPages.render(
          element,
          'user-reports',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageUserReports();
      }
      return;
    }
  }
  switch (pg) {
    case 'dashboard':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = isDepartmentEmployee()
        ? dashDepartmentEmployee()
        : (
            {
              organizer: dashOrganizer,
              client: dashClient,
              attendee: dashAttendee,
            }[r] || dashAttendee
          )();
      break;
    case 'registrations':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageRegistrationsForEmployee();
      break;
    case 'events':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML =
        isDepartmentEmployee() && CU.employeeType === 'EVENT_OPERATIONS'
          ? pageEventOpsEvents()
          : pageEvents();
      break;
    case 'event-requests':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML =
        isDepartmentEmployee() && CU.employeeType === 'EVENT_OPERATIONS'
          ? pageEventOperationsWorkspace()
          : pageEventRequests();
      break;
    case 'support-center':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML =
        isDepartmentEmployee() && CU.employeeType === 'SUPPORT_FINANCE'
          ? pageSupportCenter()
          : pageEventRequests();
      break;
    case 'finance':
      if (isDepartmentEmployee() && CU.employeeType === 'SUPPORT_FINANCE') {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageFinanceCenter();
      } else {
        if (globalThis.window?.EventFlowAdminPages?.hasPage('revenue-reports')) {
          window.EventFlowAdminPages.render(
            element,
            'revenue-reports',
            window.EventFlowAdminRuntime.snapshot({})
          );
        } else {
          globalThis.window?.EventFlowAdminPages?.clear(element);
          globalThis.window?.EventFlowAdminPages?.clear(element);
          element.innerHTML = pageRevenueReports();
        }
      }
      break;
    case 'request-status':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageRequestStatus();
      break;
    case 'attendees':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML =
        isDepartmentEmployee() && CU.employeeType === 'REGISTRATION_VERIFICATION'
          ? pageUserManagement()
          : pageAttendees();
      break;
    case 'attendeeVerification':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageAttendeeVerification();
      break;
    case 'reports':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML =
        isDepartmentEmployee() && CU.employeeType === 'REGISTRATION_VERIFICATION'
          ? pageRegVerificationReports()
          : isDepartmentEmployee() && CU.employeeType === 'EVENT_OPERATIONS'
          ? pageEventOpsReports()
          : isDepartmentEmployee() && CU.employeeType === 'SUPPORT_FINANCE'
          ? pageOperationalReports()
          : pageReports();
      break;
    case 'browse-events':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageBrowseEvents();
      break;
    case 'my-tickets':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageMyTickets();
      break;
    case 'find-organizers':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageFindOrganizers();
      break;
    case 'upcoming-events':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageUpcomingEvents();
      break;
    case 'completed-events':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageCompletedEvents();
      break;
    case 'ongoing-events':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageOngoingEvents();
      break;
    case 'notifications':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageNotifications();
      break;
    case 'profile':
      if (globalThis.window?.EventFlowAdminPages?.hasPage('profile')) {
        window.EventFlowAdminPages.render(
          element,
          'profile',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageProfile();
      }
      break;
    case 'settings':
      if (globalThis.window?.EventFlowAdminPages?.hasPage('settings')) {
        window.EventFlowAdminPages.render(
          element,
          'settings',
          window.EventFlowAdminRuntime.snapshot({})
        );
      } else {
        globalThis.window?.EventFlowAdminPages?.clear(element);
        globalThis.window?.EventFlowAdminPages?.clear(element);
        element.innerHTML = pageSettings();
      }
      window.EventFlowSupport.addSettingsEntry(element, () => goNav('customer-support'), CU);
      break;
    case 'users':
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = pageUsers();
      break;
    default:
      globalThis.window?.EventFlowAdminPages?.clear(element);
      element.innerHTML = `<div class="empty"><div class="empty-icon">🚧</div><div class="empty-title">Page not found</div><p class="empty-desc">The requested page "${pg}" could not be loaded.</p></div>`;
  }
}

// ════════════════════════════════════════════════
//  DASHBOARDS
// ════════════════════════════════════════════════

function dashAdmin() {
  const totalUsers = DB.users.length;
  const totalEvents = DB.events.length;
  const totalRegs = DB.registrations.length;
  const revenue = (DB.financeTransactions || [])
    .filter(payment => payment.status === 'Successful')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingReqs = DB.eventRequests.filter(request =>
    [
      'pending',
      'submitted',
      'planning',
      'changes_requested',
      'counteroffered',
      'plan_submitted',
      'plan_revision_requested',
    ].includes(request.status)
  ).length;
  const roleCounts = {
    employee: DB.users.filter(user => user.role === 'employee').length,
    superuser: DB.users.filter(user => user.role === 'superuser').length,
    organizer: DB.users.filter(user => user.role === 'organizer').length,
    client: DB.users.filter(user => user.role === 'client').length,
    attendee: DB.users.filter(user => user.role === 'attendee').length,
  };
  const eventStatusCounts = {
    upcoming: DB.events.filter(event => event.status === 'upcoming' || event.status === 'published')
      .length,
    ongoing: DB.events.filter(event => event.status === 'ongoing').length,
    completed: DB.events.filter(event => event.status === 'completed').length,
    draft: DB.events.filter(event => event.status === 'draft').length,
  };
  const requestStatusCounts = {
    pending: DB.eventRequests.filter(request =>
      [
        'pending',
        'submitted',
        'planning',
        'changes_requested',
        'counteroffered',
        'plan_submitted',
        'plan_revision_requested',
      ].includes(request.status)
    ).length,
    approved: DB.eventRequests.filter(request =>
      ['approved', 'confirmed', 'completed'].includes(request.status)
    ).length,
    rejected: DB.eventRequests.filter(request => request.status === 'rejected').length,
  };
  const activeEvents = eventStatusCounts.upcoming + eventStatusCounts.ongoing;
  const paidRegistrations = DB.registrations.filter(
    registration => Number(registration.amount) > 0
  ).length;
  const months = Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const records = DB.registrations.filter(
        registration =>
          String(registration.date || registration.createdAt || '').slice(0, 7) === key
      );
      return {
        label: date.toLocaleString('en-IN', {
          month: 'short',
        }),
        registrations: records.length,
        revenue: records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
      };
    }
  );

  // Refresh the overview as one set so headline figures and breakdowns agree.
  apiGetDashboard()
    .then(function (resp) {
      const d = resp && resp.data ? resp.data : resp;
      if (!d || !d.users || !d.events || !d.registrations) return;
      const patch = [
        ['adm-stat-users', d.users.total],
        ['adm-stat-events', d.events.total],
        ['adm-stat-regs', d.registrations.total],
        ['adm-stat-rev', '₹' + ((d.payments?.totalRevenue || 0) / 1000).toFixed(1) + 'K'],
        [
          'adm-users-detail',
          `${d.users.byRole?.attendee || 0} attendees · ${
            d.users.byRole?.event_organizer || 0
          } organizers`,
        ],
        [
          'adm-events-detail',
          `${(d.events.published || 0) + (d.events.ongoing || 0)} published or ongoing`,
        ],
        ['adm-regs-detail', 'Total registration records'],
        ['adm-snapshot-events', (d.events.published || 0) + (d.events.ongoing || 0)],
        ['adm-snapshot-requests', d.eventRequests?.pending || 0],
        ['adm-request-total', `${d.eventRequests?.total || 0} event requests`],
      ];
      patch.forEach(([id, val]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = val;
      });
      const pending = document.getElementById('adm-stat-pending');
      if (pending) pending.textContent = (d.eventRequests?.pending || 0) + ' requests pending';
      const roleChart = document.getElementById('adm-role-chart');
      if (roleChart) {
        globalThis.window?.EventFlowAdminPages?.clear(roleChart);
        roleChart.innerHTML = buildAnalyticsBars(
          [
            {
              label: 'Admins',
              value: d.users.byRole?.super_admin || 0,
            },
            {
              label: 'Organizers',
              value: d.users.byRole?.event_organizer || 0,
            },
            {
              label: 'Clients',
              value: d.users.byRole?.client || 0,
            },
            {
              label: 'Employees',
              value: d.users.byRole?.employee || 0,
            },
            {
              label: 'Attendees',
              value: d.users.byRole?.attendee || 0,
            },
          ],
          175
        );
      }
      const requestsChart = document.getElementById('adm-requests-chart');
      if (requestsChart) {
        globalThis.window?.EventFlowAdminPages?.clear(requestsChart);
        requestsChart.innerHTML = buildAnalyticsProgress([
          {
            label: 'Pending',
            value: d.eventRequests?.pending || 0,
            color: 'var(--yellow)',
          },
          {
            label: 'Approved',
            value: d.eventRequests?.approved || 0,
            color: 'var(--green)',
          },
          {
            label: 'Rejected',
            value: d.eventRequests?.rejected || 0,
            color: 'var(--red)',
          },
        ]);
      }
      const eventChart = document.getElementById('adm-events-chart');
      if (eventChart) {
        globalThis.window?.EventFlowAdminPages?.clear(eventChart);
        eventChart.innerHTML = buildAnalyticsBars(
          [
            {
              label: 'Published',
              value: d.events.published || 0,
            },
            {
              label: 'Ongoing',
              value: d.events.ongoing || 0,
            },
            {
              label: 'Completed',
              value: d.events.completed || 0,
            },
            {
              label: 'Draft',
              value: d.events.draft || 0,
            },
          ],
          175
        );
      }
    })
    .catch(function () {
      /* silently keep local stats */
    });
  return `
  <div class="admin-overview">
    <div class="page-hd admin-overview-head">
      <div class="page-hd-left"><div class="admin-eyebrow">EVENTFLOW / CONTROL CENTER</div><div class="page-title">Platform overview</div><div class="page-sub">Welcome back, ${adminChartText(
        CU.name
      )}. A clear view of activity across your platform.</div></div>
      <div class="page-hd-right"><button class="btn btn-ghost" onclick="goNav('user-reports')">View user reports</button><button class="btn btn-primary" onclick="goNav('revenue-reports')">Open reports ↗</button></div>
    </div>
    <div class="admin-overview-kpis">
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon">👥</span><span class="admin-kpi-tag">AUDIENCE</span></div><div class="admin-kpi-label">Total users</div><div class="admin-kpi-value" id="adm-stat-users">${totalUsers}</div><div class="admin-kpi-foot" id="adm-users-detail">${
    roleCounts.attendee
  } attendees · ${roleCounts.organizer} organizers</div></div>
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon admin-kpi-icon--green">▣</span><span class="admin-kpi-tag">EVENTS</span></div><div class="admin-kpi-label">Total events</div><div class="admin-kpi-value" id="adm-stat-events">${totalEvents}</div><div class="admin-kpi-foot" id="adm-events-detail">${activeEvents} published or ongoing</div></div>
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon admin-kpi-icon--amber">◎</span><span class="admin-kpi-tag">ACTIVITY</span></div><div class="admin-kpi-label">Registrations</div><div class="admin-kpi-value" id="adm-stat-regs">${totalRegs}</div><div class="admin-kpi-foot" id="adm-regs-detail">${paidRegistrations} with recorded amount</div></div>
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon admin-kpi-icon--violet">₹</span><span class="admin-kpi-tag">REVENUE</span></div><div class="admin-kpi-label">Recorded revenue</div><div class="admin-kpi-value" id="adm-stat-rev">₹${(
        revenue / 1000
      ).toFixed(1)}K</div><div class="admin-kpi-foot" id="adm-stat-pending">${pendingReqs} request${
    pendingReqs === 1 ? '' : 's'
  } pending</div></div>
    </div>
    <div class="admin-overview-main">
      <div class="card admin-overview-trend"><div class="admin-panel-head"><div><div class="h4">Registration trend</div><div class="small">Recorded registrations in the last six months</div></div><span class="admin-panel-chip">6 months</span></div>${buildAnalyticsLine(
        months.map(row => ({
          label: row.label,
          value: row.registrations,
        })),
        280,
        {
          label: 'Registrations',
        }
      )}</div>
      <div class="card admin-overview-snapshot"><div class="admin-panel-head"><div><div class="h4">Platform snapshot</div><div class="small">Current records</div></div></div><div class="admin-snapshot-row"><span class="admin-snapshot-mark">▣</span><span>Active events<small>Published and ongoing</small></span><strong id="adm-snapshot-events">${activeEvents}</strong></div><div class="admin-snapshot-row"><span class="admin-snapshot-mark admin-snapshot-mark--amber">◷</span><span>Pending requests<small>Awaiting review</small></span><strong id="adm-snapshot-requests">${
    requestStatusCounts.pending
  }</strong></div><button class="admin-panel-link" onclick="goNav('event-reports')">Explore event reports <span>→</span></button></div>
    </div>
    <div class="admin-overview-lower">
      <div class="card"><div class="admin-panel-head"><div><div class="h4">User mix</div><div class="small">Accounts by platform role</div></div><button class="admin-panel-link" onclick="goNav('user-reports')">View details →</button></div><div id="adm-role-chart">${buildAnalyticsBars(
        [
          {
            label: 'Admins',
            value: roleCounts.superuser,
          },
          {
            label: 'Organizers',
            value: roleCounts.organizer,
          },
          {
            label: 'Clients',
            value: roleCounts.client,
          },
          {
            label: 'Employees',
            value: roleCounts.employee,
          },
          {
            label: 'Attendees',
            value: roleCounts.attendee,
          },
        ],
        175
      )}</div></div>
      <div class="card"><div class="admin-panel-head"><div><div class="h4">Request pipeline</div><div class="small" id="adm-request-total">${
        requestStatusCounts.pending + requestStatusCounts.approved + requestStatusCounts.rejected
      } event requests</div></div></div><div id="adm-requests-chart">${buildAnalyticsProgress([
    {
      label: 'Pending',
      value: requestStatusCounts.pending,
      color: 'var(--yellow)',
    },
    {
      label: 'Approved',
      value: requestStatusCounts.approved,
      color: 'var(--green)',
    },
    {
      label: 'Rejected',
      value: requestStatusCounts.rejected,
      color: 'var(--red)',
    },
  ])}</div></div>
      <div class="card"><div class="admin-panel-head"><div><div class="h4">Event coverage</div><div class="small">Events by current status</div></div></div><div id="adm-events-chart">${buildAnalyticsBars(
        [
          {
            label: 'Published',
            value: eventStatusCounts.upcoming,
          },
          {
            label: 'Ongoing',
            value: eventStatusCounts.ongoing,
          },
          {
            label: 'Completed',
            value: eventStatusCounts.completed,
          },
          {
            label: 'Draft',
            value: eventStatusCounts.draft,
          },
        ],
        175
      )}</div></div>
    </div>
  </div>`;
}
let employeeReportFilter = 'all';
let financeInboxReports = [];
function receivedEmployeeReports() {
  const sources = [
    ['regReports', 'Registration Executive'],
    ['eventOpsReports', 'Event Operations Executive'],
    ['operationalReports', 'Support & Finance Executive'],
    ['supportExecReports', 'Support Executive'],
  ];
  const local = sources.flatMap(([key, department]) =>
    (DB[key] || [])
      .filter(report =>
        ['Submitted', 'Pending Review', 'Pending', 'Reviewed'].includes(report.status)
      )
      .map(report => ({
        report,
        department,
      }))
  );
  return [
    ...local,
    ...financeInboxReports.map(report => ({
      report: {
        ...report,
        owner: report.userName,
        type: 'Finance Report',
        updated: report.reviewedAt || report.createdAt,
        reviewFeedback: report.feedback,
      },
      department: 'Finance Executive',
      backend: true,
    })),
  ];
}
function setEmployeeReportFilter(value) {
  employeeReportFilter = ['all', 'open', 'reviewed'].includes(value) ? value : 'all';
  renderPage('employee-reports');
}
function pageEmployeeReports() {
  const reports = receivedEmployeeReports();
  const open = reports.filter(item => item.report.status !== 'Reviewed').length;
  const visible = reports
    .map((item, index) => ({
      ...item,
      index,
    }))
    .filter(
      item =>
        employeeReportFilter === 'all' ||
        (employeeReportFilter === 'reviewed'
          ? item.report.status === 'Reviewed'
          : item.report.status !== 'Reviewed')
    );
  return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Employee Reports</div><div class="page-sub">Reports submitted by registration, event operations, support, and finance employees.</div></div></div>
        <div class="grid-3 mb-20">
          <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📥</div><div class="stat-value">${
            reports.length
          }</div><div class="stat-label">Received Reports</div></div>
          <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">◷</div><div class="stat-value">${open}</div><div class="stat-label">Awaiting Review</div></div>
          <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✓</div><div class="stat-value">${
            reports.length - open
          }</div><div class="stat-label">Reviewed</div></div>
        </div>
        <div class="card"><div class="flex justify-between items-center mb-16"><div class="h4">Received submissions</div><select class="form-control" style="width:auto" aria-label="Filter employee reports" onchange="setEmployeeReportFilter(this.value)"><option value="all" ${
          employeeReportFilter === 'all' ? 'selected' : ''
        }>All reports</option><option value="open" ${
    employeeReportFilter === 'open' ? 'selected' : ''
  }>Awaiting review</option><option value="reviewed" ${
    employeeReportFilter === 'reviewed' ? 'selected' : ''
  }>Reviewed</option></select></div>
          ${
            visible.length
              ? `<div class="table-wrap"><table><thead><tr><th>Report</th><th>Employee</th><th>Department</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>${visible
                  .map(
                    ({ report, department, index }) =>
                      `<tr><td><strong>${adminChartText(
                        report.title || report.type || 'Untitled report'
                      )}</strong><div class="small">${adminChartText(
                        report.type || report.category || report.id || ''
                      )}</div></td><td>${adminChartText(
                        report.owner || report.author || 'Employee'
                      )}</td><td>${adminChartText(department)}</td><td><span class="badge badge-${
                        report.status === 'Reviewed' ? 'green' : 'purple'
                      }">${adminChartText(report.status)}</span></td><td>${adminChartText(
                        report.updated || report.submittedAt || '—'
                      )}</td><td><button class="btn btn-ghost btn-xs" onclick="viewEmployeeReport(${index})">View report</button></td></tr>`
                  )
                  .join('')}</tbody></table></div>`
              : '<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">No reports in this view</div><div class="empty-desc">Submitted employee reports will appear here.</div></div>'
          }</div>`;
}
function viewEmployeeReport(index) {
  const item = receivedEmployeeReports()[index];
  if (!item) return;
  const report = item.report;
  openModal(
    'Employee Report',
    `<div class="info-row"><span class="info-label">Title</span><span class="info-value">${adminChartText(
      report.title || report.type || 'Untitled report'
    )}</span></div><div class="info-row"><span class="info-label">Submitted by</span><span class="info-value">${adminChartText(
      report.owner || report.author || 'Employee'
    )} · ${adminChartText(
      item.department
    )}</span></div><div class="info-row"><span class="info-label">Type</span><span class="info-value">${adminChartText(
      report.type || report.category || 'Report'
    )}</span></div><div class="info-row"><span class="info-label">Status</span><span class="info-value">${adminChartText(
      report.status
    )}</span></div>${
      report.period
        ? `<div class="info-row"><span class="info-label">Period</span><span class="info-value">${adminChartText(
            report.period
          )}</span></div>`
        : ''
    }${
      report.scope
        ? `<div class="info-row"><span class="info-label">Scope</span><span class="info-value">${adminChartText(
            report.scope
          )}</span></div>`
        : ''
    }${
      report.fileName
        ? `<div class="info-row"><span class="info-label">File reference</span><span class="info-value">${adminChartText(
            report.fileName
          )}</span></div>`
        : ''
    }${
      report.metrics
        ? `<div class="info-row"><span class="info-label">Saved records</span><span class="info-value">${
            Number(report.metrics.recordCount) || 0
          }</span></div>`
        : ''
    }<div class="card mt-16"><div class="h4 mb-8">Summary</div><p class="small">${adminChartText(
      report.summary ||
        report.description ||
        report.details ||
        'No written summary was included with this report.'
    )}</p></div>${
      report.status !== 'Reviewed'
        ? `<label class="form-label mt-16">Review feedback<textarea class="form-control" id="employee-report-feedback" rows="3" placeholder="Optional feedback for the employee"></textarea></label><button class="btn btn-primary mt-16" onclick="markEmployeeReportReviewed(${index})">Mark as reviewed</button>`
        : `<div class="card mt-16"><div class="h4 mb-8">Review feedback</div><p class="small">${adminChartText(
            report.reviewFeedback || 'Reviewed by Super Admin'
          )}</p></div>`
    }`
  );
}
async function markEmployeeReportReviewed(index) {
  const item = receivedEmployeeReports()[index];
  if (!item || item.report.status === 'Reviewed') return;
  const feedback = v('employee-report-feedback');
  if (item.backend) {
    try {
      await apiRequest(`/finance/submissions/${encodeURIComponent(item.report.id)}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          feedback,
        }),
      });
    } catch (error) {
      toast(error.message || 'Could not review report', 'error');
      return;
    }
    closeModal();
    renderPage('employee-reports');
    toast('Report marked as reviewed', 'success');
    return;
  }
  item.report.status = 'Reviewed';
  item.report.reviewFeedback = feedback || 'Reviewed by Super Admin';
  item.report.updated = today();
  saveDB();
  closeModal();
  renderPage('employee-reports');
  toast('Report marked as reviewed', 'success');
}
function dashEmployee() {
  const changesQuery = (sessionStorage.getItem('employee_changes_search') || '').toLowerCase();
  const changes = DB.notifications
    .filter(item => {
      const text = `${item.title || ''} ${item.msg || ''} ${item.time || ''}`.toLowerCase();
      return !changesQuery || text.includes(changesQuery);
    })
    .slice(0, 12);
  const requests = (DB.employeeChangeRequests || []).filter(
    request => request.status === 'pending'
  );
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Employee Dashboard</div><div class="page-sub">Track recent changes and review requests from users.</div></div>
  </div>
  <div class="grid-3 mb-20">
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🔄</div><div class="stat-value" style="color:var(--accent)">${
      changes.length
    }</div><div class="stat-label">Recent Changes</div><div class="stat-sub neutral">Matching activity</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📩</div><div class="stat-value" style="color:var(--yellow)">${
      requests.length
    }</div><div class="stat-label">Change Requests</div><div class="stat-sub neutral">Awaiting review</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">👥</div><div class="stat-value" style="color:var(--green)">${
      DB.users.filter(user => user.role !== 'superuser').length
    }</div><div class="stat-label">Managed Users</div><div class="stat-sub neutral">Account records</div></div>
  </div>
  <div class="grid-2" style="gap:20px;align-items:start">
    <div>
      <div class="h4 mb-12">Recent Changes</div>
      <div class="search-box input-group" style="margin-bottom:14px"><span class="input-icon">🔍</span><input class="form-control" id="employee-changes-search" placeholder="Search recent changes…" value="${changesQuery}" oninput="searchEmployeeChanges(this.value)"></div>
      <div id="employee-recent-changes" style="display:flex;flex-direction:column;gap:10px;max-height:520px;overflow-y:auto;padding-right:6px">${buildEmployeeChanges(
        changes
      )}</div>
    </div>
    <div>
      <div class="h4 mb-12">Requests To Change Details</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${
          requests.length === 0
            ? `<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">No pending requests</div><p class="empty-desc">Requests to change event or user details will appear here.</p></div>`
            : requests
                .map(
                  request => `<div class="card" style="border-left:3px solid var(--yellow)">
          <div class="flex justify-between items-start gap-8"><div><div style="font-weight:700;color:var(--text)">${
            request.type === 'event' ? '📅 Event Details' : '👤 User Details'
          }</div><div class="small" style="margin-top:4px">${
                    request.targetName
                  }</div></div><span class="badge badge-yellow">Pending</span></div>
          <div style="font-size:13px;color:var(--text2);line-height:1.6;margin:12px 0">${
            request.requestedChange
          }</div>
          <div class="small" style="color:var(--text3);margin-bottom:12px">Requested by ${
            request.requester
          } · ${request.submittedAt}</div>
          <button class="btn btn-success btn-sm" onclick="completeEmployeeChangeRequest('${
            request.id
          }')">✓ Mark Done</button>
        </div>`
                )
                .join('')
        }
      </div>
    </div>
  </div>`;
}
function dashDepartmentEmployee() {
  const type = CU.employeeType;
  if (type === 'SUPPORT_FINANCE') return dashSupportFinance();
  if (type === 'EVENT_OPERATIONS') return dashEventOperations();
  if (type === 'REGISTRATION_VERIFICATION') return dashRegistrationVerification();
  return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Employee Dashboard</div></div></div>`;
}

// ════════════════════════════════════════════════
//  EMPLOYEE 1: REGISTRATION & VERIFICATION EXECUTIVE
// ════════════════════════════════════════════════

function dashRegistrationVerification() {
  const regs = DB.registrations || [];
  const users = DB.users || [];
  const userQueries = DB.userQueries || [];
  const totalRegs = regs.length;
  const pendingRegs = regs.filter(
    registration =>
      registration.status === 'pending' ||
      registration.verificationStatus === 'Pending Review' ||
      registration.verificationStatus === 'Pending' ||
      !registration.verified
  ).length;
  const confirmedRegs = regs.filter(
    registration =>
      registration.status === 'confirmed' || registration.verificationStatus === 'Verified'
  ).length;
  const registeredUsers = users.filter(user => user.role !== 'superuser').length;
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Registration &amp; User Management Dashboard</div>
            <div class="page-sub">Online attendee registration, user account management, and support request tracking for ${
              CU.name
            }.</div>
          </div>
        </div>

        <div class="grid-4 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📝</div>
            <div class="stat-value" style="color:var(--accent)">${totalRegs}</div>
            <div class="stat-label">Total Registrations</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>
            <div class="stat-value" style="color:var(--yellow)">${pendingRegs}</div>
            <div class="stat-label">Pending Registrations</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>
            <div class="stat-value" style="color:var(--green)">${confirmedRegs}</div>
            <div class="stat-label">Confirmed Registrations</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">👥</div>
            <div class="stat-value" style="color:var(--blue)">${registeredUsers}</div>
            <div class="stat-label">Registered Users</div>
          </div>
        </div>

        <div class="grid-2 gap-20">
          <div class="card">
            <div class="flex justify-between items-center mb-14">
              <div class="h4">Recent Online Registrations</div>
              <button class="btn btn-ghost btn-xs" onclick="goNav('registrations')">View All →</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${
                regs
                  .slice(0, 5)
                  .map(registration => {
                    const eventRegistration = users.find(
                      user => String(user.id) === String(registration.attendeeId)
                    ) || {
                      name: 'Attendee',
                    };
                    const e = DB.events.find(
                      event => String(event.id) === String(registration.eventId)
                    ) || {
                      title: 'Event',
                    };
                    const verifStatus =
                      registration.verificationStatus ||
                      (registration.status === 'confirmed' ? 'Verified' : 'Pending Review');
                    return `
                  <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)" class="flex justify-between items-center">
                    <div>
                      <div style="font-weight:700;font-size:13.5px;color:var(--text)">${
                        eventRegistration.name
                      }</div>
                      <div class="small muted">${e.title} · ${
                      registration.ticketId || registration.id
                    }</div>
                    </div>
                    <span class="badge badge-${
                      verifStatus === 'Verified'
                        ? 'green'
                        : verifStatus === 'Flagged'
                        ? 'yellow'
                        : 'purple'
                    }">${verifStatus}</span>
                  </div>
                `;
                  })
                  .join('') || '<div class="empty">No registrations found</div>'
              }
            </div>
          </div>

          <div class="card">
            <div class="flex justify-between items-center mb-14">
              <div class="h4">User Queries &amp; Support Escalations</div>
              <button class="btn btn-ghost btn-xs" onclick="openUserQueriesModal()">Manage Requests →</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${
                userQueries
                  .slice(0, 5)
                  .map(
                    q => `
                <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)" class="flex justify-between items-center gap-10">
                  <div class="flex items-center gap-10" style="flex:1;min-width:0">
                    <span style="font-size:18px">${
                      q.type === 'Account Deletion'
                        ? '🗑️'
                        : q.type === 'Email Change'
                        ? '✉️'
                        : q.type === 'Escalated Support'
                        ? '🎧'
                        : '👤'
                    }</span>
                    <div style="flex:1;min-width:0">
                      <div class="flex items-center gap-6 mb-2">
                        <span style="font-weight:700;font-size:13px;color:var(--text)" class="truncate">${
                          q.userName
                        }</span>
                        <span class="badge badge-${
                          q.type === 'Account Deletion'
                            ? 'red'
                            : q.type === 'Email Change'
                            ? 'blue'
                            : q.type === 'Escalated Support'
                            ? 'purple'
                            : 'gray'
                        }" style="font-size:10px;padding:1px 6px">${q.type}</span>
                      </div>
                      <div class="small muted truncate">${q.subject}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-8" style="flex-shrink:0">
                    <span class="badge badge-${
                      q.status === 'Resolved'
                        ? 'green'
                        : q.status === 'In Progress'
                        ? 'purple'
                        : 'yellow'
                    }">${q.status}</span>
                    <button class="btn btn-ghost btn-xs" onclick="openQueryActionModal('${
                      q.id
                    }')">Review</button>
                  </div>
                </div>
              `
                  )
                  .join('') || '<div class="empty">No user queries or support escalations</div>'
              }
            </div>
          </div>
        </div>
      `;
}
function openUserQueriesModal() {
  const userQueries = DB.userQueries || [];
  openModal(
    'Manage User Requests & Support Escalations',
    `
        <div class="small muted mb-14">Review user profile queries, account modification/deletion requests, and escalated tickets from Employee 3 (Customer Support).</div>
        <div style="display:flex;flex-direction:column;gap:12px;max-height:420px;overflow-y:auto;padding-right:4px">
          ${
            userQueries
              .map(
                q => `
            <div style="padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface2)">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <div style="font-weight:700;font-size:14px;color:var(--text)">${
                    q.userName
                  } <span class="small muted">(${q.userEmail})</span></div>
                  <div class="small muted">Source: <strong>${q.source}</strong> · ${q.date}</div>
                </div>
                <span class="badge badge-${
                  q.status === 'Resolved'
                    ? 'green'
                    : q.status === 'In Progress'
                    ? 'purple'
                    : 'yellow'
                }">${q.status}</span>
              </div>
              <div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:4px">🏷️ ${
                q.type
              }: ${q.subject}</div>
              <p style="font-size:12.5px;color:var(--text2);margin-bottom:10px;line-height:1.5">${
                q.detail
              }</p>
              <div class="flex justify-between items-center">
                <div class="small mono muted">ID: ${q.id}</div>
                <div class="flex gap-6">
                  ${
                    q.status !== 'Resolved'
                      ? `
                    <button class="btn btn-success btn-xs" onclick="closeModal();resolveQueryDirect('${q.id}')">✓ Mark Solved</button>
                    <button class="btn btn-danger btn-xs" onclick="closeModal();rejectQueryDirect('${q.id}')">✕ Reject</button>
                  `
                      : '<span class="small muted">Resolved</span>'
                  }
                </div>
              </div>
            </div>
          `
              )
              .join('') || '<div class="empty">No user queries found.</div>'
          }
        </div>
      `,
    []
  );
}
function openQueryActionModal(queryId) {
  const q = (DB.userQueries || []).find(item => item.id === queryId);
  if (!q) return;
  openModal(
    `Request ${q.id}: ${q.type}`,
    `
        <div class="info-row"><span class="info-label">User Name</span><span class="info-value"><strong>${
          q.userName
        }</strong></span></div>
        <div class="info-row"><span class="info-label">Email Address</span><span class="info-value">${
          q.userEmail
        }</span></div>
        <div class="info-row"><span class="info-label">Source</span><span class="info-value">${
          q.source
        }</span></div>
        <div class="info-row"><span class="info-label">Request Type</span><span class="info-value"><span class="badge badge-purple">${
          q.type
        }</span></span></div>
        <div class="info-row"><span class="info-label">Current Status</span><span class="info-value"><span class="badge badge-${
          q.status === 'Resolved' ? 'green' : 'yellow'
        }">${q.status}</span></span></div>
        <div class="info-row"><span class="info-label">Submitted On</span><span class="info-value">${
          q.date
        }</span></div>
        <div class="mt-14">
          <div class="label mb-6">Request Description / Escalation Notes</div>
          <p style="font-size:13.5px;color:var(--text2);line-height:1.6;background:var(--surface2);padding:12px;border-radius:8px;border:1px solid var(--border)">
            ${q.detail}
          </p>
        </div>
      `,
    q.status !== 'Resolved'
      ? [
          {
            lbl: 'Mark Solved / Resolve',
            cls: 'btn-success',
            fn: `closeModal();resolveQueryDirect('${q.id}')`,
          },
          {
            lbl: 'Reject Request',
            cls: 'btn-danger',
            fn: `closeModal();rejectQueryDirect('${q.id}')`,
          },
        ]
      : []
  );
}
function resolveQueryDirect(queryId) {
  const q = (DB.userQueries || []).find(item => item.id === queryId);
  if (!q) return;
  q.status = 'Resolved';
  saveDB();
  renderPage('dashboard');
  toast('User request marked as solved and resolved!', 'success');
}
function rejectQueryDirect(queryId) {
  confirm2('Reject Request', 'Are you sure you want to reject this request?', () => {
    const q = (DB.userQueries || []).find(item => item.id === queryId);
    if (!q) return;
    q.status = 'Rejected';
    saveDB();
    renderPage('dashboard');
    toast('User request rejected.', 'info');
  });
}

// ════════════════════════════════════════════════
//  EVENT OPERATIONS EXECUTIVE (EMPLOYEE 2)
// ════════════════════════════════════════════════

function dashEventOperations() {
  const events = DB.events || [];
  const tasks = DB.eventOperationsTasks || [];
  const reports = DB.eventOpsReports || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const totalEvents = events.length;

  // Active events: published/active/ongoing/upcoming AND not cancelled/completed
  const activeEvents = events.filter(event => {
    const st = (event.status || '').toLowerCase();
    return ['published', 'active', 'ongoing', 'upcoming'].includes(st);
  }).length;

  // Pending events: pending or draft
  const pendingEvents = events.filter(event => {
    const st = (event.status || '').toLowerCase();
    return st === 'pending' || st === 'draft';
  }).length;

  // Upcoming events list: active/upcoming events sorted by date
  const upcomingEventsList = events.filter(event => {
    const st = (event.status || '').toLowerCase();
    return ['upcoming', 'published', 'active', 'ongoing'].includes(st);
  });

  // Realistic mix of activities
  const eventActivities = events.map(event => ({
    title: `Event Approved / Status: ${formatEventStatus(event.status)}`,
    detail: `${event.title || event.name} · Category: ${event.category || 'General'} · Date: ${
      event.date
    }`,
    icon: '🗓️',
    time: 'Recently',
  }));
  const taskActivities = tasks.map(task => ({
    title: `Operational Issue ${task.id}: ${task.type}`,
    detail: `${task.eventTitle} · Status: ${task.status} · Priority: ${task.priority}`,
    icon: '⚙️',
    time: task.updated,
  }));
  const reportActivities = reports.map(report => ({
    title: `Report Submitted: ${report.title}`,
    detail: `${report.type} · Status: ${report.status} · File: ${report.fileName || 'Report.pdf'}`,
    icon: '📄',
    time: report.updated,
  }));
  const recentActivity = [
    eventActivities[0],
    taskActivities[0],
    reportActivities[0],
    taskActivities[1],
    eventActivities[1],
  ].filter(Boolean);
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Event Operations Dashboard</div>
            <div class="page-sub">Operational overview and event management for ${CU.name}.</div>
          </div>
        </div>

        <div class="grid-4 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🗓️</div>
            <div class="stat-value" style="color:var(--accent)">${totalEvents}</div>
            <div class="stat-label">Total Events</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">▶️</div>
            <div class="stat-value" style="color:var(--green)">${activeEvents}</div>
            <div class="stat-label">Active Events</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>
            <div class="stat-value" style="color:var(--yellow)">${pendingEvents}</div>
            <div class="stat-label">Pending Events</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📅</div>
            <div class="stat-value" style="color:var(--blue)">${upcomingEventsList.length}</div>
            <div class="stat-label">Upcoming Events</div>
          </div>
        </div>

        <div class="grid-2 gap-20">
          <div class="card">
            <div class="flex justify-between items-center mb-14">
              <div class="h4">Upcoming Events (${upcomingEventsList.length})</div>
              <button class="btn btn-ghost btn-xs" onclick="goNav('events')">View All Events →</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;max-height:420px;overflow-y:auto;padding-right:4px">
              ${
                upcomingEventsList
                  .slice(0, 6)
                  .map(e => {
                    const isFull = (e.registered || 0) >= (e.capacity || 100);
                    return `
                  <div style="padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--surface2)">
                    <div class="flex justify-between items-start mb-6">
                      <div style="font-weight:700;font-size:14px;color:var(--text)">${
                        e.title || e.name
                      }</div>
                      <span class="badge badge-${eventOpsStatusBadge(
                        e.status
                      )}">${formatEventStatus(e.status)}</span>
                    </div>
                    <div class="small muted mb-8">📍 ${e.venue || e.location || 'TBD'} (${
                      e.city || 'Main Hall'
                    }) · 📅 ${e.date} · 🏷️ ${e.category || 'General'}</div>
                    <div class="flex justify-between items-center">
                      <div class="small">Capacity: <strong>${e.registered || 0}/${
                      e.capacity || 100
                    }</strong> ${
                      isFull
                        ? '<span class="badge badge-yellow" style="font-size:10px;padding:2px 6px;margin-left:4px">Registration Full</span>'
                        : ''
                    }</div>
                      <button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('${
                        e.id
                      }')">View Details</button>
                    </div>
                  </div>
                `;
                  })
                  .join('') || '<div class="empty">No upcoming events found</div>'
              }
            </div>
          </div>

          <div class="card">
            <div class="h4 mb-14">Recent Event Activity</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${
                recentActivity
                  .map(
                    act => `
                <div class="flex items-center gap-10" style="padding:10px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:20px">${act.icon}</span>
                  <div style="flex:1">
                    <div style="font-weight:600;font-size:13px">${act.title}</div>
                    <div class="small muted">${act.detail}</div>
                  </div>
                  <span class="small muted" style="white-space:nowrap">${act.time}</span>
                </div>
              `
                  )
                  .join('') || '<div class="empty">No recent activity</div>'
              }
            </div>
          </div>
        </div>
      `;
}
function pageEventOpsEvents() {
  const query = (sessionStorage.getItem('eventops_events_query') || '').toLowerCase();
  const statusFilter = sessionStorage.getItem('eventops_events_status') || '';
  const categoryFilter = sessionStorage.getItem('eventops_events_category') || '';
  const events = DB.events || [];
  const filtered = events.filter(event => {
    const title = (event.title || event.name || '').toLowerCase();
    const venue = (event.venue || event.location || '').toLowerCase();
    const city = (event.city || '').toLowerCase();
    const cat = (event.category || '').toLowerCase();
    const matchesQuery =
      !query ||
      title.includes(query) ||
      venue.includes(query) ||
      city.includes(query) ||
      cat.includes(query);
    let st = formatEventStatus(event.status).toLowerCase();
    let normFilter = statusFilter.toLowerCase();
    let matchesStatus = !normFilter || st === normFilter;
    const matchesCat = !categoryFilter || event.category === categoryFilter;
    return matchesQuery && matchesStatus && matchesCat;
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Events Management</div>
            <div class="page-sub">Review pending events, edit details, and update operational statuses.</div>
          </div>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="eventops-q" placeholder="Search events by title, venue, city..." value="${query}" oninput="refreshEventOpsEvents()">
          </div>
          <select class="form-control filter-select" id="eventops-st" onchange="refreshEventOpsEvents()">
            <option value="">All Statuses</option>
            <option value="Pending" ${statusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Active" ${statusFilter === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Completed" ${
              statusFilter === 'Completed' ? 'selected' : ''
            }>Completed</option>
            <option value="Cancelled" ${
              statusFilter === 'Cancelled' ? 'selected' : ''
            }>Cancelled</option>
          </select>
          <select class="form-control filter-select" id="eventops-cat" onchange="refreshEventOpsEvents()">
            <option value="">All Categories</option>
            <option value="Technology" ${
              categoryFilter === 'Technology' ? 'selected' : ''
            }>Technology</option>
            <option value="Conference" ${
              categoryFilter === 'Conference' ? 'selected' : ''
            }>Conference</option>
            <option value="Corporate" ${
              categoryFilter === 'Corporate' ? 'selected' : ''
            }>Corporate</option>
            <option value="Finance" ${
              categoryFilter === 'Finance' ? 'selected' : ''
            }>Finance</option>
            <option value="Workshop" ${
              categoryFilter === 'Workshop' ? 'selected' : ''
            }>Workshop</option>
          </select>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date &amp; Venue</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Change Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered
                    .map(e => {
                      const currentStatus = formatEventStatus(e.status);
                      const isPending = currentStatus === 'Pending';
                      const isFull = (e.registered || 0) >= (e.capacity || 100);
                      return `
                    <tr>
                      <td>
                        <div style="font-weight:700;font-size:14px;color:var(--text)">${
                          e.title || e.name
                        }</div>
                        <div class="small muted">ID: ${e.id}</div>
                      </td>
                      <td><span class="badge badge-purple">${e.category || 'General'}</span></td>
                      <td>
                        <div>📅 ${e.date || 'TBD'}</div>
                        <div class="small muted">📍 ${e.venue || e.location || 'TBD'} (${
                        e.city || 'India'
                      })</div>
                      </td>
                      <td>
                        <div><strong>${e.registered || 0}</strong> / ${e.capacity || 100}</div>
                        <div class="small muted">${
                          isFull
                            ? '<span style="color:var(--yellow);font-weight:600">Registration Full</span>'
                            : e.price
                            ? '₹' + e.price
                            : 'Free'
                        }</div>
                      </td>
                      <td>
                        <span class="badge badge-${eventOpsStatusBadge(
                          e.status
                        )}">${currentStatus}</span>
                      </td>
                      <td>
                        <select class="form-control form-control-sm" style="padding:4px 8px;font-size:12px" onchange="setEventOpsStatus('${
                          e.id
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
                            e.id
                          }')" title="View Details">👁️</button>
                          <button class="btn btn-ghost btn-xs" onclick="openEditEventModal('${
                            e.id
                          }')" title="Edit Event">✏️</button>
                          <button class="btn btn-xs btn-danger" onclick="deleteEventOps('${
                            e.id
                          }')" title="Delete Event">🗑️</button>
                          ${
                            isPending
                              ? `
                            <button class="btn btn-success btn-xs" onclick="approveEventOpsDirect('${e.id}')" title="Approve Event">✓</button>
                            <button class="btn btn-danger btn-xs" onclick="rejectEventOpsDirect('${e.id}')" title="Reject Event">✕</button>
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
      `;
}
function deleteEventOps(eventId) {
  confirm2('Delete Event', 'Are you sure you want to delete this event record?', () => {
    DB.events = DB.events.filter(event => String(event.id) !== String(eventId));
    saveDB();
    renderPage('events');
    toast('Event deleted successfully', 'info');
  });
}
function refreshEventOpsEvents() {
  sessionStorage.setItem('eventops_events_query', v('eventops-q'));
  sessionStorage.setItem('eventops_events_status', v('eventops-st'));
  sessionStorage.setItem('eventops_events_category', v('eventops-cat'));
  renderPage('events');
}
function eventOpsStatusBadge(status) {
  const st = (status || '').toLowerCase();
  if (st === 'pending' || st === 'draft') return 'yellow';
  if (st === 'active' || st === 'ongoing' || st === 'published' || st === 'upcoming')
    return 'green';
  if (st === 'completed') return 'purple';
  if (st === 'cancelled') return 'red';
  return 'gray';
}
function formatEventStatus(status) {
  const st = (status || '').toLowerCase();
  if (st === 'pending' || st === 'draft') return 'Pending';
  if (st === 'active' || st === 'ongoing' || st === 'published' || st === 'upcoming')
    return 'Active';
  if (st === 'completed') return 'Completed';
  if (st === 'cancelled') return 'Cancelled';
  return 'Active';
}
function setEventOpsStatus(eventId, newStatus) {
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(eventId));
  if (!event) return;
  const statusMap = {
    Pending: 'pending',
    Active: 'published',
    Completed: 'completed',
    Cancelled: 'cancelled',
  };
  event.status = statusMap[newStatus] || newStatus.toLowerCase();
  saveDB();
  renderPage('events');
  toast(`Event status updated to ${newStatus}`, 'success');
}
function approveEventOpsDirect(eventId) {
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(eventId));
  if (!event) return;
  event.status = 'published';
  saveDB();
  renderPage('events');
  toast('Event approved and set to Active!', 'success');
}
function rejectEventOpsDirect(eventId) {
  confirm2('Reject Event', 'Are you sure you want to cancel/reject this pending event?', () => {
    const event = DB.events.find(currentEvent => String(currentEvent.id) === String(eventId));
    if (!event) return;
    event.status = 'cancelled';
    saveDB();
    renderPage('events');
    toast('Event has been rejected/cancelled.', 'info');
  });
}
function pageEventOperationsWorkspace() {
  const query = (sessionStorage.getItem('eventops_tasks_query') || '').toLowerCase();
  const statusFilter = sessionStorage.getItem('eventops_tasks_status') || '';
  const priorityFilter = sessionStorage.getItem('eventops_tasks_priority') || '';
  const tasks = DB.eventOperationsTasks || [];
  const filtered = tasks.filter(task => {
    const matchesQuery =
      !query ||
      task.eventTitle.toLowerCase().includes(query) ||
      task.type.toLowerCase().includes(query) ||
      task.id.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    return matchesQuery && matchesStatus && matchesPriority;
  });
  const pendingCount = tasks.filter(task => task.status === 'Pending').length;
  const inProgressCount = tasks.filter(task => task.status === 'In Progress').length;
  const resolvedCount = tasks.filter(task => task.status === 'Resolved').length;
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Event Operations Workspace</div>
            <div class="page-sub">Review venue issues, schedule conflicts, info corrections, and operational tasks.</div>
          </div>
          <div class="page-hd-right">
            <button class="btn btn-primary" onclick="openCreateEventOpTaskModal()">➕ Add Operational Issue</button>
          </div>
        </div>

        <div class="grid-4 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">⚙️</div>
            <div class="stat-value" style="color:var(--accent)">${tasks.length}</div>
            <div class="stat-label">Total Issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>
            <div class="stat-value" style="color:var(--yellow)">${pendingCount}</div>
            <div class="stat-label">Pending Reviews</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">🔄</div>
            <div class="stat-value" style="color:var(--purple)">${inProgressCount}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>
            <div class="stat-value" style="color:var(--green)">${resolvedCount}</div>
            <div class="stat-label">Resolved Issues</div>
          </div>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="taskops-q" placeholder="Search operational issues or events..." value="${query}" oninput="refreshEventOpTasks()">
          </div>
          <select class="form-control filter-select" id="taskops-st" onchange="refreshEventOpTasks()">
            <option value="">All Statuses</option>
            <option value="Pending" ${statusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${
              statusFilter === 'In Progress' ? 'selected' : ''
            }>In Progress</option>
            <option value="Resolved" ${
              statusFilter === 'Resolved' ? 'selected' : ''
            }>Resolved</option>
          </select>
          <select class="form-control filter-select" id="taskops-pr" onchange="refreshEventOpTasks()">
            <option value="">All Priorities</option>
            <option value="High" ${priorityFilter === 'High' ? 'selected' : ''}>High</option>
            <option value="Medium" ${priorityFilter === 'Medium' ? 'selected' : ''}>Medium</option>
            <option value="Low" ${priorityFilter === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Event Title</th>
                  <th>Issue Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered
                    .map(
                      t => `
                  <tr>
                    <td class="mono"><strong>${t.id}</strong></td>
                    <td>
                      <div style="font-weight:700;font-size:13.5px;color:var(--text)">${
                        t.eventTitle
                      }</div>
                      <div class="small muted">${t.description}</div>
                    </td>
                    <td><span class="badge badge-blue">${t.type}</span></td>
                    <td>
                      <span class="badge badge-${
                        t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'yellow' : 'gray'
                      }">${t.priority}</span>
                    </td>
                    <td>
                      <span class="badge badge-${
                        t.status === 'Pending'
                          ? 'yellow'
                          : t.status === 'In Progress'
                          ? 'purple'
                          : 'green'
                      }">${t.status}</span>
                    </td>
                    <td class="small muted">${t.updated}</td>
                    <td>
                      <div class="flex items-center gap-6">
                        <button class="btn btn-ghost btn-xs" onclick="openEventOpTaskModal('${
                          t.id
                        }')">Review &amp; Update</button>
                      </div>
                    </td>
                  </tr>
                `
                    )
                    .join('') ||
                  '<tr><td colspan="7" class="text-center py-20">No operational issues found.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
}
function refreshEventOpTasks() {
  sessionStorage.setItem('eventops_tasks_query', v('taskops-q'));
  sessionStorage.setItem('eventops_tasks_status', v('taskops-st'));
  sessionStorage.setItem('eventops_tasks_priority', v('taskops-pr'));
  renderPage('event-requests');
}
function openEventOpTaskModal(taskId) {
  const t = DB.eventOperationsTasks.find(item => item.id === taskId);
  if (!t) return;
  openModal(
    `Operational Issue: ${t.id}`,
    `
        <div class="info-row"><span class="info-label">Event</span><span class="info-value"><strong>${
          t.eventTitle
        }</strong></span></div>
        <div class="info-row"><span class="info-label">Issue Type</span><span class="info-value">${
          t.type
        }</span></div>
        <div class="info-row"><span class="info-label">Priority</span><span class="info-value">${
          t.priority
        }</span></div>
        <div class="form-group mt-12">
          <label class="form-label">Issue Status</label>
          <select class="form-control" id="task-edit-status">
            <option ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option ${t.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description / Operational Notes</label>
          <textarea class="form-control" id="task-edit-desc" rows="4">${t.description}</textarea>
        </div>
      `,
    [
      {
        lbl: 'Save Changes',
        cls: 'btn-primary',
        fn: `saveEventOpTask('${t.id}')`,
      },
    ]
  );
}
function saveEventOpTask(taskId) {
  const t = DB.eventOperationsTasks.find(item => item.id === taskId);
  if (!t) return;
  t.status = v('task-edit-status');
  t.description = v('task-edit-desc');
  t.updated = 'Just now';
  saveDB();
  closeModal();
  renderPage('event-requests');
  toast('Operational issue updated successfully!', 'success');
}
function openCreateEventOpTaskModal() {
  const eventsOptions = DB.events
    .map(event => `<option value="${event.id}">${event.title || event.name}</option>`)
    .join('');
  openModal(
    'Add Operational Issue',
    `
        <div class="form-group">
          <label class="form-label">Select Event *</label>
          <select class="form-control" id="newtask-eventid">${eventsOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Issue Type *</label>
          <select class="form-control" id="newtask-type">
            <option>Venue &amp; Capacity Review</option>
            <option>Schedule Conflict</option>
            <option>Equipment &amp; Tech Check</option>
            <option>Information Correction</option>
            <option>Security &amp; Access Audit</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-control" id="newtask-priority">
            <option>High</option>
            <option selected>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description / Issue Details *</label>
          <textarea class="form-control" id="newtask-desc" placeholder="Describe the operational issue..."></textarea>
        </div>
      `,
    [
      {
        lbl: 'Add Issue',
        cls: 'btn-primary',
        fn: 'saveNewEventOpTask()',
      },
    ]
  );
}
function saveNewEventOpTask() {
  const eventId = v('newtask-eventid');
  const type = v('newtask-type');
  const priority = v('newtask-priority');
  const desc = v('newtask-desc');
  if (!desc) {
    toast('Please enter issue description', 'error');
    return;
  }
  const ev = DB.events.find(event => String(event.id) === String(eventId)) || {
    title: 'General Event',
  };
  const newTask = {
    id: `EOP-${Date.now().toString().slice(-4)}`,
    eventId: eventId,
    eventTitle: ev.title || ev.name,
    type: type,
    priority: priority,
    status: 'Pending',
    description: desc,
    updated: 'Just now',
  };
  if (!DB.eventOperationsTasks) DB.eventOperationsTasks = [];
  DB.eventOperationsTasks.unshift(newTask);
  saveDB();
  closeModal();
  renderPage('event-requests');
  toast('Operational issue created!', 'success');
}
function supportUser(request) {
  return (
    DB.users.find(user => String(user.id) === String(request.userId)) || {
      name: 'Unknown User',
      email: '—',
      phone: '—',
    }
  );
}
function supportEvent(request) {
  return (
    DB.events.find(event => String(event.id) === String(request.eventId)) || {
      title: 'Unknown Event',
      date: '—',
    }
  );
}
function supportStatusBadge(status) {
  return (
    {
      Pending: 'yellow',
      'In Progress': 'purple',
      Resolved: 'green',
      Closed: 'gray',
    }[status] || 'gray'
  );
}
function dashSupportFinance() {
  const requests = DB.supportRequests || [];
  const transactions = DB.financeTransactions || [];
  const refunds = DB.financeRefunds || [];
  const reports = DB.operationalReports || [];
  const todayStr = today();
  const todayTransactions = transactions.filter(item => item.date === todayStr).length;
  const totalTransactions = transactions.length;
  const displayTxnCount = todayTransactions > 0 ? todayTransactions : totalTransactions;
  const txnLabel = todayTransactions > 0 ? "Today's Transactions" : 'Total Transactions';

  // Build balanced activity feed: 1 item per category first, then fill from remaining
  const reqActivities = requests.map(item => ({
    label: item.subject,
    detail: `Support Request (${item.id}) · ${item.status} · ${item.updated || item.created}`,
    icon: '📩',
    sortKey: 0,
  }));
  const refActivities = refunds.map(item => ({
    label: `Refund ${item.id}`,
    detail: `Refund · ${item.status} · ₹${item.amount.toLocaleString('en-IN')} · ${item.reason}`,
    icon: '↩️',
    sortKey: 1,
  }));
  const txnActivities = transactions.map(item => ({
    label: `Transaction ${item.id}`,
    detail: `Payment · ${item.status} · ₹${item.amount.toLocaleString('en-IN')} · ${
      item.date === todayStr ? 'Today' : item.date
    }`,
    icon: '💳',
    sortKey: 2,
  }));
  const rptActivities = reports.map(item => ({
    label: `Report: ${item.title}`,
    detail: `${item.type} · ${item.status} · ${item.updated}`,
    icon: '📊',
    sortKey: 3,
  }));

  // Take 1 from each category first (balanced), then fill up to 6 with remaining
  const activity = [
    reqActivities[0],
    refActivities[0],
    txnActivities[0],
    rptActivities[0],
    reqActivities[1],
    refActivities[1],
  ]
    .filter(Boolean)
    .slice(0, 6);
  return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Customer Support &amp; Finance Dashboard</div><div class="page-sub">Operational overview for ${
    CU.name
  }.</div></div></div><div class="grid-4 mb-20">${[
    [
      '📩',
      requests.filter(item => !['Resolved', 'Closed'].includes(item.status)).length,
      'Open Support Requests',
      'var(--accent)',
    ],
    [
      '⚠️',
      requests.filter(item => item.status === 'Pending').length,
      'Pending Issues',
      'var(--yellow)',
    ],
    ['💳', displayTxnCount, txnLabel, 'var(--green)'],
    [
      '↩️',
      refunds.filter(item => item.status === 'Requested' || item.status === 'Processing').length,
      'Pending Refunds',
      'var(--blue)',
    ],
  ]
    .map(
      card =>
        `<div class="stat-card"><div class="stat-icon">${card[0]}</div><div class="stat-value" style="color:${card[3]}">${card[1]}</div><div class="stat-label">${card[2]}</div></div>`
    )
    .join(
      ''
    )}</div><div class="card"><div class="h4 mb-12">Recent Support &amp; Finance Activity</div><div style="display:flex;flex-direction:column;gap:10px">${
    activity
      .map(
        item =>
          `<div class="flex items-center gap-10" style="padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-size:20px">${item.icon}</span><div><div style="font-weight:600;font-size:13px">${item.label}</div><div class="small">${item.detail}</div></div></div>`
      )
      .join('') || '<div class="empty">No recent activity</div>'
  }</div></div>`;
}
function pageSupportCenter() {
  const query = (sessionStorage.getItem('support_query') || '').toLowerCase();
  const status = sessionStorage.getItem('support_status') || '';
  const requests = (DB.supportRequests || []).filter(item => {
    const user = supportUser(item);
    const event = supportEvent(item);
    return (
      (!status || item.status === status) &&
      (!query ||
        `${item.id} ${item.subject} ${item.message} ${user.name} ${user.email} ${event.title}`
          .toLowerCase()
          .includes(query))
    );
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Support Center</div>
            <div class="page-sub">Manage user support requests with event and payment context. Route unresolvable issues to the appropriate department.</div>
          </div>
          <div class="page-hd-right">
            <button class="btn btn-primary" onclick="openRouteRequestModal()">🔀 Route Request</button>
          </div>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="support-query" placeholder="Search requests, users, or events..." value="${query}" oninput="refreshSupportCenter()">
          </div>
          <select class="form-control filter-select" id="support-status" onchange="refreshSupportCenter()">
            <option value="">All Statuses</option>
            ${['Pending', 'In Progress', 'Resolved', 'Closed']
              .map(item => `<option ${status === item ? 'selected' : ''}>${item}</option>`)
              .join('')}
          </select>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>User</th>
                  <th>Event / Payment</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  requests
                    .map(item => {
                      const user = supportUser(item);
                      const event = supportEvent(item);
                      return `
                    <tr>
                      <td>
                        <div style="font-weight:700;font-size:13.5px;color:var(--text)">${
                          item.subject
                        }</div>
                        <div class="small muted">${item.message}</div>
                      </td>
                      <td>
                        <div style="font-weight:600">${user.name}</div>
                        <div class="small muted">${user.email}</div>
                      </td>
                      <td>
                        <div style="font-weight:600">${event.title}</div>
                        <div class="small muted">${event.date} · Related transaction available</div>
                      </td>
                      <td><span class="badge badge-${supportStatusBadge(item.status)}">${
                        item.status
                      }</span></td>
                      <td class="small muted">${item.updated}</td>
                      <td>
                        <div class="flex gap-6">
                          <button class="btn btn-ghost btn-xs" onclick="openSupportRequest('${
                            item.id
                          }')">View / Respond</button>
                          <button class="btn btn-ghost btn-xs" style="border-color:var(--purple);color:var(--purple)" onclick="openRouteRequestModal('${
                            item.id
                          }')">🔀 Route</button>
                        </div>
                      </td>
                    </tr>
                  `;
                    })
                    .join('') ||
                  '<tr><td colspan="6" class="text-center py-20 muted">No support requests found.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
}
function openRouteRequestModal(prefillId) {
  const supportReqs = DB.supportRequests || [];
  const reqOptions = supportReqs
    .map(request => {
      const eventRequest = supportUser(request);
      return `<option value="${request.id}" ${prefillId === request.id ? 'selected' : ''}>${
        request.id
      } — ${request.subject} (${eventRequest.name})</option>`;
    })
    .join('');

  // Determine prefill values if a request ID was passed
  let prefillUser = '';
  let prefillEmail = '';
  let prefillDesc = '';
  let prefillEvent = '';
  let autoRouteTo = '';
  if (prefillId) {
    const item = supportReqs.find(request => request.id === prefillId);
    if (item) {
      const u = supportUser(item);
      const e = supportEvent(item);
      prefillUser = u.name || '';
      prefillEmail = u.email || '';
      prefillDesc = item.message || '';
      prefillEvent = e.title && e.title !== 'Unknown Event' ? e.title : '';
      // Auto-suggest route based on subject keywords
      const subjectLow =
        (item.subject || '').toLowerCase() + ' ' + (item.message || '').toLowerCase();
      const emp1Keywords = [
        'registration',
        'account',
        'verification',
        'user',
        'profile',
        'email',
        'login',
        'password',
        'access',
      ];
      const emp2Keywords = [
        'event',
        'venue',
        'schedule',
        'location',
        'capacity',
        'slot',
        'cancel',
        'speaker',
        'av',
        'equipment',
      ];
      if (emp2Keywords.some(k => subjectLow.includes(k)))
        autoRouteTo = 'Employee 2 – Event Operations Executive';
      else if (emp1Keywords.some(k => subjectLow.includes(k)))
        autoRouteTo = 'Employee 1 – Registration & Verification Executive';
    }
  }
  openModal(
    '🔀 Route Support Request',
    `
        <div style="background:var(--surface2);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--text2);border-left:3px solid var(--purple)">
          <strong style="color:var(--purple)">Routing Policy:</strong> Route <strong>user/account/registration/verification</strong> issues to Employee 1. Route <strong>event/venue/schedule/operational</strong> issues to Employee 2. Finance/payment issues are handled directly by you.
        </div>

        <div class="form-group">
          <label class="form-label">Select Request ID (optional)</label>
          <select class="form-control" id="route-req-id" onchange="prefillRouteForm(this.value)">
            <option value="">— New / Manual Route —</option>
            ${reqOptions}
          </select>
        </div>

        <div class="grid-2 gap-12">
          <div class="form-group">
            <label class="form-label">User Name *</label>
            <input class="form-control" id="route-user-name" placeholder="Full name" value="${prefillUser}">
          </div>
          <div class="form-group">
            <label class="form-label">User Email *</label>
            <input class="form-control" id="route-user-email" placeholder="user@email.com" value="${prefillEmail}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Request Category *</label>
          <select class="form-control" id="route-category">
            <option>User Account Issue</option>
            <option>Registration Problem</option>
            <option>Identity Verification Issue</option>
            <option>Event Information Query</option>
            <option>Venue / Location Issue</option>
            <option>Schedule Conflict / Change</option>
            <option>Event Capacity / Slot Issue</option>
            <option>Event Cancellation / Update Request</option>
            <option>Operational Issue</option>
            <option>Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Request Description *</label>
          <textarea class="form-control" id="route-description" rows="3" placeholder="Describe the issue in detail...">${prefillDesc}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Related Event (if applicable)</label>
          <input class="form-control" id="route-event" placeholder="Event name or ID" value="${prefillEvent}">
        </div>

        <div class="grid-2 gap-12">
          <div class="form-group">
            <label class="form-label">Priority *</label>
            <select class="form-control" id="route-priority">
              <option value="Low">🟢 Low</option>
              <option value="Medium" selected>🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Route To *</label>
            <select class="form-control" id="route-to">
              <option value="Employee 1 – Registration &amp; Verification Executive" ${
                autoRouteTo === 'Employee 1 – Registration & Verification Executive'
                  ? 'selected'
                  : ''
              }>Employee 1 – Registration &amp; Verification Executive</option>
              <option value="Employee 2 – Event Operations Executive" ${
                autoRouteTo === 'Employee 2 – Event Operations Executive' ? 'selected' : ''
              }>Employee 2 – Event Operations Executive</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Internal Note (visible to recipient)</label>
          <textarea class="form-control" id="route-note" rows="2" placeholder="Add context for the receiving department..."></textarea>
        </div>
      `,
    [
      {
        lbl: 'Cancel',
        cls: 'btn-ghost',
        fn: 'closeModal()',
      },
      {
        lbl: '🔀 Route Request',
        cls: 'btn-primary',
        fn: 'saveRouteRequest()',
      },
    ]
  );
}
window.prefillRouteForm = function (reqId) {
  if (!reqId) return;
  const item = (DB.supportRequests || []).find(r => r.id === reqId);
  if (!item) return;
  const u = supportUser(item);
  const e = supportEvent(item);
  const nameEl = document.getElementById('route-user-name');
  const emailEl = document.getElementById('route-user-email');
  const descEl = document.getElementById('route-description');
  const eventEl = document.getElementById('route-event');
  const routeToEl = document.getElementById('route-to');
  if (nameEl) nameEl.value = u.name || '';
  if (emailEl) emailEl.value = u.email || '';
  if (descEl) descEl.value = item.message || '';
  if (eventEl && e.title && e.title !== 'Unknown Event') eventEl.value = e.title;
  // Auto-suggest routing
  if (routeToEl) {
    const subjectLow =
      (item.subject || '').toLowerCase() + ' ' + (item.message || '').toLowerCase();
    const emp2Keywords = [
      'event',
      'venue',
      'schedule',
      'location',
      'capacity',
      'slot',
      'cancel',
      'speaker',
      'av',
      'equipment',
    ];
    const emp1Keywords = [
      'registration',
      'account',
      'verification',
      'user',
      'profile',
      'email',
      'login',
      'password',
    ];
    if (emp2Keywords.some(k => subjectLow.includes(k)))
      routeToEl.value = 'Employee 2 – Event Operations Executive';
    else if (emp1Keywords.some(k => subjectLow.includes(k)))
      routeToEl.value = 'Employee 1 – Registration & Verification Executive';
  }
};
function saveRouteRequest() {
  const userName = v('route-user-name');
  const userEmail = v('route-user-email');
  const category = v('route-category');
  const description = v('route-description');
  const priority = v('route-priority');
  const routeTo = v('route-to');
  const note = v('route-note');
  const relatedEvent = v('route-event');
  const reqId = v('route-req-id');
  if (!userName) {
    toast('Please enter the user name', 'error');
    return;
  }
  if (!description) {
    toast('Please enter a request description', 'error');
    return;
  }
  const routedId = 'RT-' + Date.now().toString().slice(-6);
  const isEmp2 = routeTo.includes('Employee 2');
  const isEmp1 = routeTo.includes('Employee 1');

  // Build the routed request record
  const routedReq = {
    id: routedId,
    linkedRequestId: reqId || null,
    userName: userName,
    userEmail: userEmail,
    category: category,
    description: description,
    relatedEvent: relatedEvent || null,
    priority: priority,
    routeTo: routeTo,
    note: note,
    source: 'Escalated by Emp 3',
    raisedBy: 'Customer Support (Emp 3)',
    status: 'Pending',
    date:
      new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }) +
      ' · ' +
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    routedAt: 'Just now',
  };
  if (!DB.routedRequests) DB.routedRequests = [];
  DB.routedRequests.unshift(routedReq);

  // Make visible to Employee 1 (userQueries) if routed to Emp 1
  if (isEmp1) {
    if (!DB.userQueries) DB.userQueries = [];
    DB.userQueries.unshift({
      id: routedId,
      userId: null,
      userName: userName,
      userEmail: userEmail,
      type: category,
      subject: `[Routed by Emp 3] ${category}`,
      detail:
        description +
        (note ? '\n\nInternal Note: ' + note : '') +
        (relatedEvent ? '\nRelated Event: ' + relatedEvent : ''),
      source: 'Employee 3 Escalation',
      status: 'Pending',
      priority: priority,
      date: routedReq.date,
    });
  }

  // Make visible to Employee 2 (eventOpsRequests) if routed to Emp 2
  if (isEmp2) {
    if (!DB.eventOpsRequests) DB.eventOpsRequests = [];
    // find matching eventId if possible
    const matchedEvent = relatedEvent
      ? (DB.events || []).find(event =>
          (event.title || event.name || '').toLowerCase().includes(relatedEvent.toLowerCase())
        )
      : null;
    DB.eventOpsRequests.unshift({
      id: routedId,
      eventId: matchedEvent ? matchedEvent.id : null,
      eventTitle: relatedEvent || 'N/A',
      issue: description + (note ? '\n\nInternal Note: ' + note : ''),
      source: 'Escalated by Emp 3',
      raisedBy: `${userName} (via Customer Support)`,
      priority: priority,
      status: 'Pending',
      date: routedReq.date,
      notes: note || '',
    });
  }

  // Mark linked support request as In Progress if selected
  if (reqId) {
    const linked = (DB.supportRequests || []).find(r => r.id === reqId);
    if (linked && linked.status === 'Pending') {
      linked.status = 'In Progress';
      linked.response = `Routed to ${routeTo} on ${routedReq.date}. Awaiting resolution.`;
      linked.updated = 'Just now';
    }
  }
  saveDB();
  closeModal();
  renderPage('support-center');
  toast(
    `Request routed to ${
      isEmp2 ? 'Employee 2 (Event Operations)' : 'Employee 1 (Registration & Verification)'
    } successfully!`,
    'success'
  );
}
function refreshSupportCenter() {
  sessionStorage.setItem('support_query', v('support-query'));
  sessionStorage.setItem('support_status', v('support-status'));
  renderPage('support-center');
}
function openSupportRequest(id) {
  const item = DB.supportRequests.find(request => request.id === id);
  if (!item) return;
  const user = supportUser(item);
  const event = supportEvent(item);
  const transaction = (DB.financeTransactions || []).find(
    record =>
      String(record.userId) === String(item.userId) &&
      String(record.eventId) === String(item.eventId)
  );
  openModal(
    `Support Request ${item.id}`,
    `
        <div class="info-row"><span class="info-label">User</span><span class="info-value">${
          user.name
        } · ${user.email}</span></div>
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">${
          event.title
        } · ${event.date}</span></div>
        <div class="info-row"><span class="info-label">Payment</span><span class="info-value">${
          transaction
            ? `${transaction.id} · ₹${transaction.amount} · ${transaction.status}`
            : 'No matching transaction'
        }</span></div>
        <div class="info-row"><span class="info-label">Request</span><span class="info-value">${
          item.subject
        }</span></div>
        <p class="muted" style="line-height:1.6;margin:16px 0">${item.message}</p>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="support-edit-status">
            ${['Pending', 'In Progress', 'Resolved', 'Closed']
              .map(value => `<option ${value === item.status ? 'selected' : ''}>${value}</option>`)
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Response</label>
          <textarea class="form-control" id="support-response" rows="4">${
            item.response || ''
          }</textarea>
        </div>
      `,
    [
      {
        lbl: '🔀 Route This Request',
        cls: 'btn-ghost',
        fn: `closeModal();openRouteRequestModal('${id}')`,
      },
      {
        lbl: 'Save Response',
        cls: 'btn-primary',
        fn: `saveSupportRequest('${id}')`,
      },
    ]
  );
}
function saveSupportRequest(id) {
  const item = DB.supportRequests.find(request => request.id === id);
  if (!item) return;
  item.status = v('support-edit-status');
  item.response = v('support-response');
  item.updated = 'Just now';
  saveDB();
  closeModal();
  renderPage('support-center');
  toast('Support request updated', 'success');
}
function financeStatusBadge(status) {
  return (
    {
      Successful: 'green',
      Pending: 'yellow',
      Failed: 'red',
      Requested: 'yellow',
      Processing: 'purple',
      Completed: 'green',
      Rejected: 'red',
    }[status] || 'gray'
  );
}
function pageFinanceCenter() {
  const tab = sessionStorage.getItem('finance_tab') || 'transactions';
  const query = (sessionStorage.getItem('finance_query') || '').toLowerCase();
  const commissionRate = 0.15;
  const allTransactions = Array.isArray(DB.financeTransactions) ? DB.financeTransactions : [];
  const refundRecords = Array.isArray(DB.financeRefunds) ? DB.financeRefunds : [];
  const paidRegistrations = (DB.registrations || []).filter(
    registration =>
      String(registration.payment || '').toLowerCase() === 'paid' &&
      ['confirmed', 'verified'].includes(String(registration.status || '').toLowerCase())
  );
  const successfulTransactions = allTransactions.filter(tx => tx.status === 'Successful');
  const totalRevenue = successfulTransactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const platformCommission = totalRevenue * commissionRate;
  const organizerPayout = totalRevenue - platformCommission;
  const records = tab === 'transactions' ? allTransactions : refundRecords;
  const filtered = records.filter(item => {
    const user = DB.users.find(u => String(u.id) === String(item.userId)) || {};
    const event =
      DB.events.find(currentEvent => String(currentEvent.id) === String(item.eventId)) || {};
    const text = `${item.id || ''} ${user.name || ''} ${user.email || ''} ${event.title || ''} ${
      item.status || ''
    } ${item.reason || ''}`.toLowerCase();
    return !query || text.includes(query);
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Finance &amp; Revenue</div>
            <div class="page-sub">Track registration revenue, platform commission, organizer payouts, and customer payment activity.</div>
          </div>
        </div>

        <div class="grid-4 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>
            <div class="stat-value" style="color:var(--green)">₹${totalRevenue.toLocaleString(
              'en-IN'
            )}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="stat-sub neutral">Completed payment records</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>
            <div class="stat-value" style="color:var(--accent)">₹${platformCommission.toLocaleString(
              'en-IN'
            )}</div>
            <div class="stat-label">Platform Commission</div>
            <div class="stat-sub neutral">Fixed 15% fee share</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">💸</div>
            <div class="stat-value" style="color:var(--yellow)">₹${organizerPayout.toLocaleString(
              'en-IN'
            )}</div>
            <div class="stat-label">Organizer Payouts</div>
            <div class="stat-sub neutral">Net payout after commission</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">🧾</div>
            <div class="stat-value" style="color:var(--purple)">${
              successfulTransactions.length
            }</div>
            <div class="stat-label">Successful Transactions</div>
            <div class="stat-sub neutral">Monitored payment records</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:20px">
          <div class="flex justify-between items-center mb-12">
            <div class="h4">Event-wise Revenue &amp; Commission</div>
            <div class="small muted">Commission formula: registration fee × 15%</div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Payments</th>
                  <th>Gross Revenue</th>
                  <th>Platform Commission</th>
                  <th>Organizer Payout</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const eventSummary = {};
                  successfulTransactions.forEach(tx => {
                    const event = DB.events.find(
                      currentEvent => String(currentEvent.id) === String(tx.eventId)
                    ) || {
                      title: 'Unknown Event',
                    };
                    const eventKey = String(tx.eventId || event.title);
                    if (!eventSummary[eventKey]) {
                      eventSummary[eventKey] = {
                        eventTitle: event.title,
                        attendeeCount: 0,
                        revenue: 0,
                      };
                    }
                    eventSummary[eventKey].attendeeCount += 1;
                    eventSummary[eventKey].revenue += Number(tx.amount || 0);
                  });
                  const rows = Object.values(eventSummary);
                  return rows.length
                    ? rows
                        .map(row => {
                          const commission = row.revenue * commissionRate;
                          const payout = row.revenue - commission;
                          return `
                          <tr>
                            <td>${row.eventTitle}</td>
                            <td>${row.attendeeCount}</td>
                            <td style="color:var(--green);font-weight:700">₹${row.revenue}</td>
                            <td style="color:var(--accent);font-weight:700">₹${commission}</td>
                            <td style="color:var(--yellow);font-weight:700">₹${payout}</td>
                          </tr>
                        `;
                        })
                        .join('')
                    : '<tr><td colspan="5" class="text-center py-20">No successful event revenue data found.</td></tr>';
                })()}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:16px">
          <button class="btn ${
            tab === 'transactions' ? 'btn-primary' : 'btn-ghost'
          }" onclick="switchFinanceTab('transactions')">💳 Transactions</button>
          <button class="btn ${
            tab === 'refunds' ? 'btn-primary' : 'btn-ghost'
          }" onclick="switchFinanceTab('refunds')">↩️ Refunds</button>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="finance-query" placeholder="Search finance records..." value="${query}" oninput="refreshFinanceCenter()">
          </div>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                ${
                  tab === 'transactions'
                    ? '<tr><th>Transaction ID</th><th>User</th><th>Event</th><th>Amount</th><th>Payment Status</th><th>Date</th></tr>'
                    : '<tr><th>Refund ID</th><th>User</th><th>Event</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr>'
                }
              </thead>
              <tbody>
                ${
                  filtered
                    .map(item => {
                      const user = DB.users.find(u => String(u.id) === String(item.userId)) || {
                        name: 'Unknown',
                      };
                      const event = DB.events.find(
                        currentEvent => String(currentEvent.id) === String(item.eventId)
                      ) || {
                        title: 'Unknown Event',
                      };
                      return tab === 'transactions'
                        ? `<tr><td class="mono">${item.id}</td><td>${user.name}</td><td>${
                            event.title
                          }</td><td style="color:var(--green);font-weight:700">₹${
                            item.amount
                          }</td><td><span class="badge badge-${financeStatusBadge(item.status)}">${
                            item.status
                          }</span></td><td>${item.date}</td></tr>`
                        : `<tr><td class="mono">${item.id}</td><td>${user.name}</td><td>${
                            event.title
                          }</td><td style="color:var(--green);font-weight:700">₹${
                            item.amount
                          }</td><td>${
                            item.reason
                          }</td><td><span class="badge badge-${financeStatusBadge(item.status)}">${
                            item.status
                          }</span></td><td>${item.date}</td></tr>`;
                    })
                    .join('') ||
                  `<tr><td colspan="${
                    tab === 'transactions' ? 6 : 7
                  }" class="text-center py-20">No finance records found.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
}
function switchFinanceTab(tab) {
  sessionStorage.setItem('finance_tab', tab);
  renderPage('finance');
}
function refreshFinanceCenter() {
  sessionStorage.setItem('finance_query', v('finance-query'));
  renderPage('finance');
}
function pageRegistrationsForEmployee() {
  const query = (sessionStorage.getItem('emp_reg_query') || '').toLowerCase();
  const statusFilter = sessionStorage.getItem('emp_reg_status') || '';
  const regs = DB.registrations || [];
  const filtered = regs.filter(registration => {
    const attendee = DB.users.find(user => String(user.id) === String(registration.attendeeId)) || {
      name: '',
      email: '',
    };
    const event = DB.events.find(
      currentEvent => String(currentEvent.id) === String(registration.eventId)
    ) || {
      title: '',
    };
    const searchStr = `${registration.id} ${registration.ticketId || ''} ${attendee.name} ${
      attendee.email
    } ${event.title}`.toLowerCase();
    const matchesQuery = !query || searchStr.includes(query);
    const st = (registration.status || 'confirmed').toLowerCase();
    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = st === 'pending';
    else if (statusFilter === 'confirmed') matchesStatus = st === 'confirmed' || st === 'verified';
    else if (statusFilter === 'rejected') matchesStatus = st === 'rejected';
    return matchesQuery && matchesStatus;
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Registrations Management</div>
            <div class="page-sub">View, search, filter, and manage online event registrations.</div>
          </div>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="emp-reg-q" placeholder="Search by Ticket ID, Attendee, or Event..." value="${query}" oninput="refreshEmpRegistrations()">
          </div>
          <select class="form-control filter-select" id="emp-reg-st" onchange="refreshEmpRegistrations()">
            <option value="">All Statuses</option>
            <option value="confirmed" ${
              statusFilter === 'confirmed' ? 'selected' : ''
            }>Confirmed / Verified</option>
            <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="rejected" ${
              statusFilter === 'rejected' ? 'selected' : ''
            }>Rejected</option>
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
                  <th>Registration Date</th>
                  <th>Payment Status</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered
                    .map(registration => {
                      const attendee = DB.users.find(
                        user => String(user.id) === String(registration.attendeeId)
                      ) || {
                        name: 'Unknown User',
                        email: '—',
                      };
                      const event = DB.events.find(
                        currentEvent => String(currentEvent.id) === String(registration.eventId)
                      ) || {
                        title: 'Unknown Event',
                      };
                      const isPending = registration.status === 'pending';
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
                      <td>${event.title}</td>
                      <td>${registration.date || 'Today'}</td>
                      <td>
                        <span class="badge badge-${
                          registration.payment === 'paid' ? 'green' : 'yellow'
                        }">${
                        registration.payment === 'paid'
                          ? 'Paid (₹' + (registration.amount || 0) + ')'
                          : 'Pending'
                      }</span>
                      </td>
                      <td>
                        <span class="badge badge-${
                          registration.status === 'confirmed'
                            ? 'green'
                            : registration.status === 'pending'
                            ? 'yellow'
                            : 'red'
                        }">${registration.status || 'confirmed'}</span>
                      </td>
                      <td>
                        <div class="flex items-center gap-6">
                          <button class="btn btn-ghost btn-xs" onclick="openRegistrationDetailModal('${
                            registration.id
                          }')">Review</button>
                          ${
                            isPending
                              ? `
                            <button class="btn btn-success btn-xs" onclick="approveRegistrationDirect('${registration.id}')" title="Approve">✓</button>
                            <button class="btn btn-danger btn-xs" onclick="rejectRegistrationDirect('${registration.id}')" title="Reject">✕</button>
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
      `;
}
function refreshEmpRegistrations() {
  sessionStorage.setItem('emp_reg_query', v('emp-reg-q'));
  sessionStorage.setItem('emp_reg_status', v('emp-reg-st'));
  renderPage('registrations');
}
function approveRegistrationDirect(regId) {
  const registration = DB.registrations.find(item => String(item.id) === String(regId));
  if (!registration) return;
  registration.status = 'confirmed';
  registration.verificationStatus = 'Verified';
  registration.verified = true;
  saveDB();
  renderPage('registrations');
  toast('Registration approved successfully!', 'success');
}
function rejectRegistrationDirect(regId) {
  confirm2(
    'Reject Registration',
    'Are you sure you want to reject this online registration?',
    () => {
      const registration = DB.registrations.find(item => String(item.id) === String(regId));
      if (!registration) return;
      registration.status = 'rejected';
      registration.verificationStatus = 'Rejected';
      saveDB();
      renderPage('registrations');
      toast('Registration rejected.', 'info');
    }
  );
}
function openRegistrationDetailModal(regId) {
  const registration = DB.registrations.find(item => String(item.id) === String(regId));
  if (!registration) return;
  const attendee = DB.users.find(user => String(user.id) === String(registration.attendeeId)) || {
    name: 'Unknown User',
    email: '—',
    phone: '—',
  };
  const event = DB.events.find(
    currentEvent => String(currentEvent.id) === String(registration.eventId)
  ) || {
    title: 'Unknown Event',
  };
  openModal(
    `Registration Details: ${registration.ticketId || registration.id}`,
    `
        <div class="info-row"><span class="info-label">Ticket ID</span><span class="info-value mono">${
          registration.ticketId || registration.id
        }</span></div>
        <div class="info-row"><span class="info-label">Attendee Name</span><span class="info-value"><strong>${
          attendee.name
        }</strong></span></div>
        <div class="info-row"><span class="info-label">Attendee Email</span><span class="info-value">${
          attendee.email
        }</span></div>
        <div class="info-row"><span class="info-label">Contact Phone</span><span class="info-value">${
          attendee.phone || '—'
        }</span></div>
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">${
          event.title
        }</span></div>
        <div class="info-row"><span class="info-label">Registration Date</span><span class="info-value">${
          registration.date || 'Today'
        }</span></div>
        <div class="info-row"><span class="info-label">Payment Amount</span><span class="info-value" style="color:var(--green);font-weight:700">₹${
          registration.amount || 0
        } (${registration.payment || 'paid'})</span></div>
        <div class="info-row"><span class="info-label">Verification Status</span><span class="info-value"><span class="badge badge-${
          registration.status === 'confirmed' ? 'green' : 'yellow'
        }">${
      registration.verificationStatus || registration.status || 'confirmed'
    }</span></span></div>
      `,
    [
      {
        lbl: 'Approve',
        cls: 'btn-success',
        fn: `closeModal();approveRegistrationDirect('${registration.id}')`,
      },
      {
        lbl: 'Reject',
        cls: 'btn-danger',
        fn: `closeModal();rejectRegistrationDirect('${registration.id}')`,
      },
    ]
  );
}
function pageUserManagement() {
  const query = (sessionStorage.getItem('usrmgt_query') || '').toLowerCase();
  const roleFilter = sessionStorage.getItem('usrmgt_role') || '';
  const users = window.EventFlowAccountPolicy.visibleAccounts(CU, DB.users || []);
  const filtered = users.filter(user => {
    const matchesQuery =
      !query ||
      `${user.name} ${user.email} ${user.phone} ${user.role} ${user.id}`
        .toLowerCase()
        .includes(query);
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesQuery && matchesRole;
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">User Management</div>
            <div class="page-sub">View, update, and manage platform users and account access.</div>
          </div>
        </div>


        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="usrmgt-q" placeholder="Search users by name, email, phone, role..." value="${query}" oninput="refreshUserManagement()">
          </div>
          <select class="form-control filter-select" id="usrmgt-role" onchange="refreshUserManagement()">
            <option value="">All Roles</option>
            <option value="attendee" ${
              roleFilter === 'attendee' ? 'selected' : ''
            }>Attendee</option>
            <option value="client" ${roleFilter === 'client' ? 'selected' : ''}>Client</option>
            <option value="organizer" ${
              roleFilter === 'organizer' ? 'selected' : ''
            }>Organizer</option>
            ${
              window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU)
                ? ''
                : `<option value="employee" ${
                    roleFilter === 'employee' ? 'selected' : ''
                  }>Employees</option>`
            }
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
                  <th>Verification</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered
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
                        <span class="badge badge-${u.status === 'active' ? 'green' : 'yellow'}">${
                        u.status === 'active' ? 'Verified' : 'Pending'
                      }</span>
                      </td>
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
                          }')" title="Edit Details">✏️ Edit</button>
                          <button class="btn btn-ghost btn-xs" onclick="toggleUserStatus('${
                            u.id
                          }')" title="Deactivate/Activate">${
                                isDeactivated ? '🔓 Activate' : '🔒 Deactivate'
                              }</button>
                          <button class="btn btn-xs btn-danger" onclick="deleteUserOps('${
                            u.id
                          }')" title="Delete User">🗑️</button>
                        </div>`
                            : '<span class="small muted">Admin managed</span>'
                        }
                      </td>
                    </tr>
                  `;
                    })
                    .join('') ||
                  '<tr><td colspan="6" class="text-center py-20">No matching users found.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
}
function refreshUserManagement() {
  sessionStorage.setItem('usrmgt_query', v('usrmgt-q'));
  sessionStorage.setItem('usrmgt_role', v('usrmgt-role'));
  renderPage('attendees');
}
function openEditUserModal(userId) {
  const u = DB.users.find(user => String(user.id) === String(userId));
  if (!u) return;
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, u)) {
    toast('Only an admin can change employee or admin accounts.', 'error');
    return;
  }
  openModal(
    `Edit User: ${u.name}`,
    `
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-control" id="edit-usr-name" value="${u.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input class="form-control" id="edit-usr-email" value="${u.email}">
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input class="form-control" id="edit-usr-phone" value="${u.phone || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">User Role</label>
          <select class="form-control" id="edit-usr-role" ${
            window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU) ? 'disabled' : ''
          }>
            <option value="attendee" ${u.role === 'attendee' ? 'selected' : ''}>Attendee</option>
            <option value="client" ${u.role === 'client' ? 'selected' : ''}>Client</option>
            <option value="organizer" ${u.role === 'organizer' ? 'selected' : ''}>Organizer</option>
            ${
              window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU)
                ? ''
                : `<option value="employee" ${
                    u.role === 'employee' ? 'selected' : ''
                  }>Employees</option>`
            }
          </select>
        </div>
      `,
    [
      {
        lbl: 'Save Changes',
        cls: 'btn-primary',
        fn: `saveEditUser('${u.id}')`,
      },
    ]
  );
}
function saveEditUser(userId) {
  const u = DB.users.find(user => String(user.id) === String(userId));
  if (!u) return;
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, u)) {
    toast('Only an admin can change employee or admin accounts.', 'error');
    return;
  }
  const name = v('edit-usr-name');
  const email = v('edit-usr-email');
  if (!name || !email) {
    toast('Name and email are required', 'error');
    return;
  }
  if (window.EventFlowAccountPolicy.isEmailInUse(DB.users, email, userId)) {
    toast('Email already registered', 'error');
    return;
  }
  if (
    !window.EventFlowAccountPolicy.canApplyAccountUpdate(CU, u, {
      role: v('edit-usr-role'),
    })
  ) {
    toast('Only an admin can change account roles.', 'error');
    return;
  }
  u.name = name;
  u.email = email;
  u.phone = v('edit-usr-phone');
  u.role = v('edit-usr-role');
  saveDB();
  closeModal();
  renderPage('attendees');
  toast('User details updated!', 'success');
}
function toggleUserStatus(userId) {
  const u = DB.users.find(user => String(user.id) === String(userId));
  if (!u) return;
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, u)) {
    toast('Only an admin can change employee or admin accounts.', 'error');
    return;
  }
  const newStatus =
    u.status === 'deactivated' || u.status === 'inactive' ? 'active' : 'deactivated';
  u.status = newStatus;
  saveDB();
  renderPage('attendees');
  toast(`User status changed to ${newStatus}`, 'info');
}
function deleteUserOps(userId) {
  const target = DB.users.find(user => String(user.id) === String(userId));
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, target)) {
    toast('Only an admin can change employee or admin accounts.', 'error');
    return;
  }
  confirm2('Delete User', 'Are you sure you want to permanently delete this user record?', () => {
    const current = DB.users.find(user => String(user.id) === String(userId));
    if (!window.EventFlowAccountPolicy.canManageAccount(CU, current)) {
      toast('This account can only be managed by an admin.', 'error');
      return;
    }
    DB.users = DB.users.filter(user => String(user.id) !== String(userId));
    saveDB();
    renderPage('attendees');
    toast('User deleted successfully', 'info');
  });
}
function pageAttendeeVerification() {
  const query = (sessionStorage.getItem('verif_query') || '').toLowerCase();
  const statusFilter = sessionStorage.getItem('verif_status') || '';
  const regs = DB.registrations || [];
  const filtered = regs.filter(registration => {
    const attendee = DB.users.find(user => String(user.id) === String(registration.attendeeId)) || {
      name: '',
      email: '',
    };
    const event = DB.events.find(
      currentEvent => String(currentEvent.id) === String(registration.eventId)
    ) || {
      title: '',
    };
    const searchStr = `${registration.id} ${registration.ticketId || ''} ${attendee.name} ${
      attendee.email
    } ${event.title}`.toLowerCase();
    const matchesQuery = !query || searchStr.includes(query);
    const verifStatus =
      registration.verificationStatus ||
      (registration.status === 'confirmed' ? 'Verified' : 'Pending Review');
    let matchesStatus = !statusFilter || verifStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Online Registration Verification</div>
            <div class="page-sub">Review submitted registration details, approve identity verifications online, and flag incomplete submissions.</div>
          </div>
        </div>

        <div style="padding:12px 16px;background:var(--accent-dim);border:1px solid var(--accent);border-radius:8px;margin-bottom:20px;font-size:13px;color:var(--text)" class="flex items-center gap-10">
          <span>ℹ️</span>
          <span>Online Admin Workspace: Focuses strictly on online identity and registration detail verification. Physical check-in and venue scanning are handled on-site.</span>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="verif-q" placeholder="Search by Ticket ID, Attendee Name, or Event..." value="${query}" oninput="refreshVerificationPage()">
          </div>
          <select class="form-control filter-select" id="verif-st" onchange="refreshVerificationPage()">
            <option value="">All Verification Statuses</option>
            <option value="Pending Review" ${
              statusFilter === 'Pending Review' ? 'selected' : ''
            }>Pending Review</option>
            <option value="Verified" ${
              statusFilter === 'Verified' ? 'selected' : ''
            }>Verified</option>
            <option value="Flagged" ${
              statusFilter === 'Flagged' ? 'selected' : ''
            }>Flagged / Incomplete</option>
            <option value="Rejected" ${
              statusFilter === 'Rejected' ? 'selected' : ''
            }>Rejected</option>
          </select>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Registration ID</th>
                  <th>Attendee Info</th>
                  <th>Event</th>
                  <th>Submitted Proof / ID Document</th>
                  <th>Verification Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered
                    .map(r => {
                      const attendee = DB.users.find(
                        user => String(user.id) === String(r.attendeeId)
                      ) || {
                        name: 'Unknown User',
                        email: '—',
                        phone: '—',
                      };
                      const event = DB.events.find(
                        currentEvent => String(currentEvent.id) === String(r.eventId)
                      ) || {
                        title: 'Unknown Event',
                      };
                      const currentVerif =
                        r.verificationStatus ||
                        (r.status === 'confirmed' ? 'Verified' : 'Pending Review');
                      const isPending =
                        currentVerif === 'Pending Review' || currentVerif === 'Pending';
                      const docType = r.docType || 'Govt Aadhaar / Passport ID';
                      const docRef = r.docRef || 'REF-' + String(r.id).padStart(4, '0');
                      return `
                    <tr>
                      <td class="mono"><strong>${r.ticketId || r.id}</strong></td>
                      <td>
                        <div style="font-weight:700;font-size:13.5px;color:var(--text)">${
                          attendee.name
                        }</div>
                        <div class="small muted">${attendee.email}</div>
                      </td>
                      <td>${event.title}</td>
                      <td>
                        <div style="font-weight:600;font-size:13px;color:var(--accent)">📄 ${docType}</div>
                        <div class="small mono muted">Ref: ${docRef}</div>
                      </td>
                      <td>
                        <span class="badge badge-${
                          currentVerif === 'Verified'
                            ? 'green'
                            : currentVerif === 'Flagged'
                            ? 'yellow'
                            : currentVerif === 'Rejected'
                            ? 'red'
                            : 'purple'
                        }">${currentVerif}</span>
                      </td>
                      <td>
                        <div class="flex items-center gap-6">
                          <button class="btn btn-ghost btn-xs" onclick="openVerificationReviewModal('${
                            r.id
                          }')">Review</button>
                          ${
                            isPending
                              ? `
                            <button class="btn btn-success btn-xs" onclick="approveVerificationDirect('${r.id}')" title="Verify Online">✓ Verify</button>
                            <button class="btn btn-warning btn-xs" onclick="flagVerificationModal('${r.id}')" title="Flag Incomplete">🚩 Flag</button>
                          `
                              : ''
                          }
                        </div>
                      </td>
                    </tr>
                  `;
                    })
                    .join('') ||
                  '<tr><td colspan="6" class="text-center py-20">No registration verification records found.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
}
function refreshVerificationPage() {
  sessionStorage.setItem('verif_query', v('verif-q'));
  sessionStorage.setItem('verif_status', v('verif-st'));
  renderPage('attendeeVerification');
}
function approveVerificationDirect(regId) {
  const registration = DB.registrations.find(item => String(item.id) === String(regId));
  if (!registration) return;
  registration.verificationStatus = 'Verified';
  registration.status = 'confirmed';
  registration.verified = true;
  saveDB();
  renderPage('attendeeVerification');
  toast('Online registration verified successfully!', 'success');
}
function flagVerificationModal(regId) {
  const registration = DB.registrations.find(item => String(item.id) === String(regId));
  if (!registration) return;
  openModal(
    `Flag Registration Details: ${registration.ticketId || registration.id}`,
    `
        <div class="form-group">
          <label class="form-label">Flag Reason / Missing Details *</label>
          <textarea class="form-control" id="flag-reason" rows="4" placeholder="Specify incomplete or incorrect registration information..."></textarea>
        </div>
      `,
    [
      {
        lbl: 'Submit Flag',
        cls: 'btn-warning',
        fn: `saveFlagVerification('${registration.id}')`,
      },
    ]
  );
}
function saveFlagVerification(regId) {
  const registration = DB.registrations.find(item => String(item.id) === String(regId));
  if (!registration) return;
  const reason = v('flag-reason');
  if (!reason) {
    toast('Please enter a flag reason', 'error');
    return;
  }
  registration.verificationStatus = 'Flagged';
  registration.flagReason = reason;
  saveDB();
  closeModal();
  renderPage('attendeeVerification');
  toast('Registration flagged for review!', 'warning');
}
function openVerificationReviewModal(regId) {
  const registration = DB.registrations.find(item => String(item.id) === String(regId));
  if (!registration) return;
  const attendee = DB.users.find(user => String(user.id) === String(registration.attendeeId)) || {
    name: 'Unknown User',
    email: '—',
    phone: '—',
  };
  const event = DB.events.find(
    currentEvent => String(currentEvent.id) === String(registration.eventId)
  ) || {
    title: 'Unknown Event',
  };
  const docType = registration.docType || 'Govt Aadhaar / Passport ID';
  const docRef = registration.docRef || 'REF-' + String(registration.id).padStart(4, '0');
  openModal(
    `Verification Review: ${registration.ticketId || registration.id}`,
    `
        <div class="info-row"><span class="info-label">Ticket ID</span><span class="info-value mono">${
          registration.ticketId || registration.id
        }</span></div>
        <div class="info-row"><span class="info-label">Attendee Name</span><span class="info-value"><strong>${
          attendee.name
        }</strong></span></div>
        <div class="info-row"><span class="info-label">Attendee Email</span><span class="info-value">${
          attendee.email
        }</span></div>
        <div class="info-row"><span class="info-label">Contact Phone</span><span class="info-value">${
          attendee.phone || '—'
        }</span></div>
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">${
          event.title
        }</span></div>
        <div class="info-row"><span class="info-label">Submitted Document</span><span class="info-value" style="color:var(--accent);font-weight:700">📄 ${docType} (${docRef})</span></div>
        <div class="info-row"><span class="info-label">Verification Status</span><span class="info-value"><span class="badge badge-purple">${
          registration.verificationStatus || 'Pending Review'
        }</span></span></div>
        ${
          registration.notes
            ? `<div class="mt-12"><div class="label mb-6">Verification Notes</div><div style="padding:10px;background:var(--surface2);border-radius:8px;font-size:13px">${registration.notes}</div></div>`
            : ''
        }
        ${
          registration.flagReason
            ? `<div class="mt-12"><div class="label mb-6">Flag Reason / Missing Details</div><div style="padding:10px;background:var(--surface2);border-radius:8px;color:var(--yellow);font-size:13px">${registration.flagReason}</div></div>`
            : ''
        }
      `,
    [
      {
        lbl: 'Approve & Verify',
        cls: 'btn-success',
        fn: `closeModal();approveVerificationDirect('${registration.id}')`,
      },
      {
        lbl: 'Flag Information',
        cls: 'btn-warning',
        fn: `closeModal();flagVerificationModal('${registration.id}')`,
      },
    ]
  );
}
function pageRegVerificationReports() {
  const reports = DB.regReports || [];
  const typeFilter = sessionStorage.getItem('rvr_type') || '';
  const statusFilter = sessionStorage.getItem('rvr_status') || '';
  const totalSubmitted = reports.filter(
    report => report.status === 'Submitted' || report.status === 'Reviewed'
  ).length;
  const pendingReports = reports.filter(report => report.status === 'Draft').length;
  const reviewedReports = reports.filter(report => report.status === 'Reviewed').length;
  const filtered = reports.filter(report => {
    const matchType = !typeFilter || report.type === typeFilter;
    const matchStatus = !statusFilter || report.status === statusFilter;
    return matchType && matchStatus;
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Registration &amp; User Management Reports</div>
            <div class="page-sub">Submit, view, and track registration and user management reports. Reports are submitted to Super Admin for review.</div>
          </div>
          <div class="page-hd-right">
            <button class="btn btn-primary" onclick="openCreateRegReportModal()">📤 Submit Report</button>
          </div>
        </div>

        <div class="grid-3 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">📤</div>
            <div class="stat-value" style="color:var(--green)">${totalSubmitted}</div>
            <div class="stat-label">Reports Submitted</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📝</div>
            <div class="stat-value" style="color:var(--yellow)">${pendingReports}</div>
            <div class="stat-label">Draft / Pending</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">✅</div>
            <div class="stat-value" style="color:var(--accent)">${reviewedReports}</div>
            <div class="stat-label">Reviewed by Admin</div>
          </div>
        </div>

        <div class="card">
          <div class="flex justify-between items-center mb-16">
            <div class="h4">All Reports</div>
            <div class="flex gap-8">
              <select class="form-control filter-select" id="rvr-type" onchange="refreshRvrPage()" style="width:200px">
                <option value="">All Report Types</option>
                <option value="Registration Report" ${
                  typeFilter === 'Registration Report' ? 'selected' : ''
                }>Registration Report</option>
                <option value="User Management Report" ${
                  typeFilter === 'User Management Report' ? 'selected' : ''
                }>User Management Report</option>
                <option value="Registration Activity Report" ${
                  typeFilter === 'Registration Activity Report' ? 'selected' : ''
                }>Registration Activity Report</option>
              </select>
              <select class="form-control filter-select" id="rvr-status" onchange="refreshRvrPage()" style="width:140px">
                <option value="">All Statuses</option>
                <option value="Draft" ${statusFilter === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Submitted" ${
                  statusFilter === 'Submitted' ? 'selected' : ''
                }>Submitted</option>
                <option value="Reviewed" ${
                  statusFilter === 'Reviewed' ? 'selected' : ''
                }>Reviewed</option>
              </select>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Attached File</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered.length
                    ? filtered
                        .map(
                          r => `
                  <tr>
                    <td>
                      <div style="font-weight:700;font-size:13.5px;color:var(--text)">${
                        r.title
                      }</div>
                      <div class="small muted">ID: ${r.id} · By: ${r.owner}</div>
                    </td>
                    <td>
                      <span class="badge badge-${
                        r.type === 'Registration Report'
                          ? 'purple'
                          : r.type === 'User Management Report'
                          ? 'blue'
                          : 'orange'
                      }">${r.type}</span>
                    </td>
                    <td class="small">${r.period || '—'}</td>
                    <td>
                      ${
                        r.fileName
                          ? `<span style="font-weight:600;color:var(--accent);font-size:12.5px">📄 ${r.fileName}</span>`
                          : `<span class="small muted">No file attached</span>`
                      }
                    </td>
                    <td>
                      <span class="badge badge-${
                        r.status === 'Reviewed'
                          ? 'green'
                          : r.status === 'Submitted'
                          ? 'purple'
                          : 'yellow'
                      }">${r.status}</span>
                    </td>
                    <td class="small muted">${r.updated}</td>
                    <td>
                      <div class="flex gap-6">
                        <button class="btn btn-ghost btn-xs" onclick="viewRegReportModal('${
                          r.id
                        }')">View Details</button>
                        ${
                          r.status === 'Draft'
                            ? `<button class="btn btn-primary btn-xs" onclick="submitDraftReport('${r.id}')">📤 Submit</button>`
                            : ''
                        }
                      </div>
                    </td>
                  </tr>
                `
                        )
                        .join('')
                    : '<tr><td colspan="7" class="text-center py-20 muted">No reports found matching your filters.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
}
function refreshRvrPage() {
  sessionStorage.setItem('rvr_type', v('rvr-type'));
  sessionStorage.setItem('rvr_status', v('rvr-status'));
  renderPage('reports');
}
function submitDraftReport(reportId) {
  const r = (DB.regReports || []).find(item => item.id === reportId);
  if (!r) return;
  if (!r.fileName) {
    toast('Please attach a file before submitting a draft report.', 'error');
    return;
  }
  r.status = 'Submitted';
  r.updated = 'Just now';
  saveDB();
  renderPage('reports');
  toast('Draft report submitted successfully!', 'success');
}
function viewRegReportModal(reportId) {
  const r = (DB.regReports || []).find(item => item.id === reportId);
  if (!r) return;
  openModal(
    `Report: ${r.title}`,
    `
        <div class="info-row"><span class="info-label">Report ID</span><span class="info-value mono">${
          r.id
        }</span></div>
        <div class="info-row"><span class="info-label">Report Type</span><span class="info-value"><span class="badge badge-purple">${
          r.type
        }</span></span></div>
        <div class="info-row"><span class="info-label">Reporting Period</span><span class="info-value">${
          r.period || '—'
        }</span></div>
        <div class="info-row"><span class="info-label">Submitted By</span><span class="info-value">${
          r.owner
        }</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-${
          r.status === 'Reviewed' ? 'green' : r.status === 'Submitted' ? 'purple' : 'yellow'
        }">${r.status}</span></span></div>
        <div class="info-row"><span class="info-label">Last Updated</span><span class="info-value">${
          r.updated
        }</span></div>
        <div class="info-row"><span class="info-label">Attached File</span><span class="info-value" style="color:var(--accent);font-weight:700">${
          r.fileName ? '📄 ' + r.fileName : 'No file attached'
        }</span></div>
      `,
    r.status === 'Draft'
      ? [
          {
            lbl: '📤 Submit Report',
            cls: 'btn-primary',
            fn: `closeModal();submitDraftReport('${r.id}')`,
          },
        ]
      : []
  );
}
window.handleRegReportFileSelect = function (input) {
  const preview = document.getElementById('rv-file-preview');
  if (input.files && input.files[0]) {
    const f = input.files[0];
    if (preview) {
      globalThis.window?.EventFlowAdminPages?.clear(preview);
      preview.innerHTML = `
            <div class="flex items-center justify-between" style="background:var(--accent-dim);border-radius:8px;padding:10px 14px">
              <div style="font-weight:600;color:var(--accent);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${
                f.name
              } (${(f.size / 1024).toFixed(1)} KB)</div>
              <button type="button" class="btn btn-danger btn-xs" onclick="event.stopPropagation();resetRegReportFileSelect()">✕ Remove</button>
            </div>
          `;
    }
  }
};
window.resetRegReportFileSelect = function () {
  const input = document.getElementById('rv-file');
  if (input) input.value = '';
  const preview = document.getElementById('rv-file-preview');
  if (preview) {
    globalThis.window?.EventFlowAdminPages?.clear(preview);
    preview.innerHTML = `
          <div style="font-size:24px;margin-bottom:6px">📁</div>
          <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>
          <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>
        `;
  }
};
function openCreateRegReportModal() {
  openModal(
    '📤 Submit Registration & User Management Report',
    `
        <div class="form-group">
          <label class="form-label">Report Type *</label>
          <select class="form-control" id="rv-type">
            <option value="Registration Report">Registration Report</option>
            <option value="User Management Report">User Management Report</option>
            <option value="Registration Activity Report">Registration Activity Report</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Report Title *</label>
          <input class="form-control" id="rv-title" placeholder="e.g. August 2026 Online Registration Completion Report">
        </div>
        <div class="form-group">
          <label class="form-label">Reporting Period *</label>
          <input class="form-control" id="rv-period" placeholder="e.g. August 2026, Q3 2026, Week 34">
        </div>
        <div class="form-group">
          <label class="form-label">Upload Report *</label>
          <div class="file-upload-box" style="border:2px dashed var(--border);border-radius:10px;padding:20px;text-align:center;background:var(--surface2);cursor:pointer" onclick="document.getElementById('rv-file').click()">
            <input type="file" id="rv-file" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display:none" onchange="handleRegReportFileSelect(this)">
            <div id="rv-file-preview">
              <div style="font-size:24px;margin-bottom:6px">📁</div>
              <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>
              <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>
            </div>
          </div>
        </div>
      `,
    [
      {
        lbl: 'Cancel',
        cls: 'btn-ghost',
        fn: 'closeModal()',
      },
      {
        lbl: '📤 Submit Report',
        cls: 'btn-primary',
        fn: 'saveRegReportSubmit()',
      },
    ]
  );
}
function saveRegReportSubmit() {
  const type = v('rv-type');
  const title = v('rv-title');
  const period = v('rv-period');
  const fileInput = document.getElementById('rv-file');
  if (!title) {
    toast('Please enter a report title', 'error');
    return;
  }
  if (!period) {
    toast('Please specify a reporting period', 'error');
    return;
  }
  if (!fileInput || !fileInput.files || !fileInput.files.length) {
    toast('Please upload a report file', 'error');
    return;
  }
  const file = fileInput.files[0];
  const newReport = {
    id: `RVR-${Date.now().toString().slice(-4)}`,
    type: type,
    title: title,
    period: period,
    fileName: file.name,
    owner: CU.name || 'Arjun Kapoor',
    status: 'Submitted',
    updated: 'Just now',
  };
  if (!DB.regReports) DB.regReports = [];
  DB.regReports.unshift(newReport);
  saveDB();
  closeModal();
  renderPage('reports');
  toast('Report submitted successfully!', 'success');
}
function buildEmployeeChanges(changes) {
  if (changes.length === 0)
    return `<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">No changes found</div><p class="empty-desc">Try a different search.</p></div>`;
  return changes
    .map(
      item =>
        `<div class="card" style="padding:14px 16px"><div class="flex justify-between items-start gap-8"><div style="display:flex;gap:10px;align-items:flex-start"><div class="stat-icon" style="width:30px;height:30px;min-width:30px;font-size:14px;margin:0;background:var(--accent-dim);color:var(--accent)">${
          item.icon || '•'
        }</div><div><div style="font-weight:700;color:var(--text);font-size:13.5px">${
          item.title || 'Activity update'
        }</div><div style="font-size:13px;color:var(--text2);line-height:1.5;margin-top:3px">${
          item.msg || 'A record was updated.'
        }</div></div></div><span class="small" style="white-space:nowrap;color:var(--text3)">${
          item.time || 'Recently'
        }</span></div></div>`
    )
    .join('');
}
function searchEmployeeChanges(query) {
  sessionStorage.setItem('employee_changes_search', query);
  const changesQuery = query.toLowerCase();
  const changes = DB.notifications
    .filter(item =>
      `${item.title || ''} ${item.msg || ''} ${item.time || ''}`
        .toLowerCase()
        .includes(changesQuery)
    )
    .slice(0, 12);
  globalThis.window?.EventFlowAdminPages?.clear(g('employee-recent-changes'));
  g('employee-recent-changes').innerHTML = buildEmployeeChanges(changes);
}
function completeEmployeeChangeRequest(requestId) {
  const request = (DB.employeeChangeRequests || []).find(
    item => String(item.id) === String(requestId)
  );
  if (!request) return;
  request.status = 'completed';
  request.completedAt = new Date().toLocaleString();
  saveDB();
  renderPage('dashboard');
  toast('Change request marked as done', 'success');
}
function dashOrganizer() {
  const myEv = DB.events.filter(event => String(event.organizer) === String(CU.id));
  const upcoming = myEv.filter(e => e.status === 'upcoming');
  const totalAttendees = DB.registrations.filter(registration =>
    myEv.some(e => String(e.id) === String(registration.eventId))
  ).length;
  const searchQuery = (sessionStorage.getItem('org_events_search') || '').toLowerCase();
  const filteredEvents = myEv.filter(
    e =>
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery) ||
      e.city.toLowerCase().includes(searchQuery)
  );
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">${
      isEmployeeAccount() ? 'Employee Dashboard' : 'Organizer Dashboard'
    }</div><div class="page-sub">Hello ${CU.name}, manage your events.</div></div>
    <div class="page-hd-right">${
      isEmployeeAccount()
        ? ''
        : '<button class="btn btn-primary" onclick="openAddEventModal()">+ Create Event</button>'
    }</div>
  </div>
  <div class="grid-4 mb-20">
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🗓️</div><div class="stat-value" style="color:var(--accent)">${
      myEv.length
    }</div><div class="stat-label">My Events</div><div class="stat-sub neutral">${
    upcoming.length
  } upcoming</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">👥</div><div class="stat-value" style="color:var(--green)">${totalAttendees}</div><div class="stat-label">Total Attendees</div><div class="stat-sub up">↑ 5 this week</div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📋</div><div class="stat-value" style="color:var(--blue)">${
          DB.eventRequests.filter(
            request => String(request.organizer) === String(CU.id) && request.status === 'in_review'
          ).length
        }</div><div class="stat-label">Plans in Review</div><div class="stat-sub neutral">With clients</div></div>
  </div>
  <div class="mb-16">
    <div class="mb-12 flex justify-between items-center"><span class="h4">My Events</span></div>
    <div class="search-box input-group" style="margin-bottom:16px"><span class="input-icon">🔍</span><input class="form-control" id="org-events-search" placeholder="Search by event name or city..." value="${searchQuery}" oninput="searchOrganizerEvents(this.value)"></div>
    <div class="events-grid">${
      filteredEvents.length > 0
        ? filteredEvents.map(event => evCard(event, 'organizer')).join('')
        : myEv.length > 0
        ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events match</div><p>Try adjusting your search</p></div>`
        : isEmployeeAccount()
        ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No events assigned</div><p>Assigned events will appear here.</p></div>`
        : `<div class="ev-card" style="display:flex;align-items:center;justify-content:center;min-height:240px;border-style:dashed;cursor:pointer" onclick="openAddEventModal()"><div class="text-center" style="color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">➕</div><div style="font-size:13px">Create Your First Event</div></div></div>`
    }
      ${
        myEv.length > 0 && !isEmployeeAccount()
          ? `<div class="ev-card" style="display:flex;align-items:center;justify-content:center;min-height:240px;border-style:dashed;cursor:pointer" onclick="openAddEventModal()"><div class="text-center" style="color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">➕</div><div style="font-size:13px">Create New Event</div></div></div>`
          : ''
      }
    </div>
  </div>`;
}
function searchOrganizerEvents(query) {
  sessionStorage.setItem('org_events_search', query);
  renderPage('dashboard');
}
function dashClient() {
  const myReqs = DB.eventRequests.filter(request => String(request.clientId) === String(CU.id));
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Client Dashboard</div><div class="page-sub">Track your event requests and upcoming events.</div></div>
    <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('find-organizers')">+ New Request</button></div>
  </div>
  <div class="grid-3 mb-20">
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📋</div><div class="stat-value" style="color:var(--accent)">${
      myReqs.length
    }</div><div class="stat-label">Total Requests</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div><div class="stat-value" style="color:var(--green)">${
      myReqs.filter(request => request.status === 'approved').length
    }</div><div class="stat-label">Approved</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div><div class="stat-value" style="color:var(--yellow)">${
      myReqs.filter(request => request.status === 'pending' || request.status === 'in_review')
        .length
    }</div><div class="stat-label">In Progress</div></div>
  </div>
  <div class="h4 mb-16">My Event Requests</div>
  <div style="display:flex;flex-direction:column;gap:14px">
    ${myReqs
      .map(
        request =>
          `<div class="card"><div class="flex justify-between items-start"><div style="flex:1"><div style="font-size:16px;font-weight:700;margin-bottom:5px">${
            request.title
          }</div><div class="small mb-8">${request.type} · ${request.guests} guests · ${
            request.date
          }</div><p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px">${
            request.desc
          }</p><span class="badge badge-${reqBadge(request.status)}">${
            request.status
          }</span></div><div style="text-align:right;flex-shrink:0;margin-left:20px"><div style="font-size:22px;font-weight:800;color:var(--green)">₹${request.budget.toLocaleString()}</div><div class="small">Budget</div></div></div><div class="flex gap-8 mt-14"><button class="btn btn-ghost btn-sm" onclick="viewRequestDrawer('${
            request.id
          }')">View Details</button></div></div>`
      )
      .join('')}
    ${
      myReqs.length === 0
        ? `<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">No requests yet</div><div class="empty-desc">Submit your first event request!</div><button class="btn btn-primary mt-16" onclick="goNav('request-status')">Create Request</button></div>`
        : ''
    }
  </div>`;
}
function dashAttendee() {
  const myRegs = DB.registrations.filter(
    registration => String(registration.attendeeId) === String(CU.id)
  );
  const upcoming = myRegs.filter(registration => {
    const event = DB.events.find(
      currentEvent => String(currentEvent.id) === String(registration.eventId)
    );
    return event && ['upcoming', 'full', 'ongoing'].includes(event.status);
  });
  const totalSpent = myRegs.reduce((total, registration) => total + registration.amount, 0);
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">My Dashboard</div><div class="page-sub">Welcome back, ${
      CU.name
    }! Here are your upcoming events.</div></div>
    <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('browse-events')">🔍 Browse Events</button></div>
  </div>
  <div class="grid-3 mb-20">
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🎟️</div><div class="stat-value" style="color:var(--accent)">${
      myRegs.length
    }</div><div class="stat-label">Registered Events</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">📅</div><div class="stat-value" style="color:var(--green)">${
      upcoming.length
    }</div><div class="stat-label">Upcoming</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">💳</div><div class="stat-value" style="color:var(--yellow)">₹${totalSpent}</div><div class="stat-label">Total Spent</div></div>
  </div>
  ${
    upcoming.length > 0
      ? `<div class="h4 mb-16">Upcoming Events</div>
  <div class="events-grid">${upcoming
    .map(currentEvent => {
      const event = DB.events.find(ev => String(ev.id) === String(currentEvent.eventId));
      return event ? evCard(event, 'attendee', currentEvent) : '';
    })
    .join('')}</div>
  <div style="display:flex;flex-direction:column;gap:12px;margin-top:24px">
    ${upcoming
      .map(currentEvent => {
        const event = DB.events.find(ev => String(ev.id) === String(currentEvent.eventId));
        return event
          ? `<div class="card p-0" style="display:flex;justify-content:space-between;align-items:center;padding:16px">
      <div><div style="font-weight:600">${event.title}</div><div class="small">${currentEvent.ticketId}</div></div>
      <button class="btn btn-danger btn-xs" onclick="cancelTicket('${currentEvent.id}')">✕ Cancel Ticket</button>
    </div>`
          : '';
      })
      .join('')}
  </div>`
      : `
  <div class="empty"><div class="empty-icon">🎟️</div><div class="empty-title">No upcoming events</div><div class="empty-desc">Browse and register for events to see them here.</div><button class="btn btn-primary mt-16" onclick="goNav('browse-events')">Browse Events</button></div>`
  }
  <div class="h4 mb-16 mt-24">Recommended For You</div>
  <div class="events-grid">${DB.events
    .filter(
      event =>
        event.status === 'upcoming' &&
        !myRegs.some(registration => String(registration.eventId) === String(event.id))
    )
    .slice(0, 3)
    .map(event => evCard(event, 'attendee'))
    .join('')}</div>
  ${
    myRegs.length > 0
      ? `<div class="h4 mb-12 mt-24">Recent Activity</div>
  <div class="card p-0">
    ${myRegs
      .slice(-3)
      .reverse()
      .map(registration => {
        const eventRegistration = DB.events.find(
          event => String(event.id) === String(registration.eventId)
        ) || {
          title: 'Event',
          emoji: '🎟️',
        };
        return `
      <div class="flex items-center justify-between" style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div class="flex items-center gap-10"><span style="font-size:22px">${
          eventRegistration.emoji
        }</span>
          <div><div style="font-size:13.5px;font-weight:500">${
            eventRegistration.title
          }</div><div class="small">${registration.ticketId} · ${registration.date}</div></div>
        </div>
        <div class="text-right"><div style="font-weight:600;color:var(--green)">${
          registration.amount === 0 ? 'Free' : '₹' + registration.amount
        }</div>
          <span class="badge badge-${registration.checkedIn ? 'green' : 'purple'}">${
          registration.checkedIn ? 'Attended' : 'Registered'
        }</span>
        </div>
      </div>`;
      })
      .join('')}
  </div>`
      : ''
  }`;
}

// ════════════════════════════════════════════════
//  ADMIN SUBPAGE 1: USER REPORTS (BAR GRAPHS)
// ════════════════════════════════════════════════
function filterUserReports(role) {
  sessionStorage.setItem('admin_user_filter_role', role);
  renderPage('user-reports');
}
function pageUserReports() {
  const selectedRole = sessionStorage.getItem('admin_user_filter_role') || 'all';
  const allUsers = DB.users;
  const usersToAnalyze =
    selectedRole === 'all' ? allUsers : allUsers.filter(u => u.role === selectedRole);
  const totalUsers = usersToAnalyze.length;
  const activeUsers = usersToAnalyze.filter(u => u.status === 'active').length;
  const inactiveUsers = totalUsers - activeUsers;
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const inactiveRate = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0;
  const roles = ['attendee', 'employee', 'client', 'organizer', 'superuser'];
  const roleBreakdown = roles.map(role => {
    const list = allUsers.filter(u => u.role === role);
    const active = list.filter(u => u.status === 'active').length;
    const inactive = list.length - active;
    return {
      role,
      label: ROLE_LABELS[role] || role,
      total: list.length,
      active,
      inactive,
      activePct: list.length > 0 ? Math.round((active / list.length) * 100) : 0,
    };
  });

  // 1. Monthly Joining Trends Bar Graph (Past 6 months)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlyBuckets = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyBuckets[key] = {
      label: monthNames[d.getMonth()],
      count: 0,
    };
  }
  usersToAnalyze.forEach(u => {
    const joinedStr = (u.joined || u.createdAt || '').toString();
    const match = joinedStr.match(/(\d{4}-\d{2})/);
    if (match && monthlyBuckets[match[1]]) {
      monthlyBuckets[match[1]].count++;
    }
  });
  const monthBars = Object.values(monthlyBuckets).map((m, index) => ({
    label: m.label,
    value: m.count,
    color: [
      'linear-gradient(180deg, #22c55e, #15803d)',
      'linear-gradient(180deg, #3b82f6, #1d4ed8)',
      'linear-gradient(180deg, #8b5cf6, #7c3aed)',
      'linear-gradient(180deg, #f59e0b, #d97706)',
      'linear-gradient(180deg, #06b6d4, #0891b2)',
      'linear-gradient(180deg, #ec4899, #be185d)',
    ][index % 6],
  }));

  // 2. Grouped Active vs Inactive Bar Graph by Role
  const activeInactiveGroups = roleBreakdown.map(r => ({
    label: r.label,
    bars: [
      {
        label: 'Active',
        value: r.active,
        color: 'linear-gradient(180deg, #22c55e, #15803d)',
      },
      {
        label: 'Inactive',
        value: r.inactive,
        color: 'linear-gradient(180deg, #ef4444, #b91c1c)',
      },
    ],
  }));

  // 3. User Role Distribution Bar Graph
  const roleBars = [
    {
      label: 'Attendees',
      value: allUsers.filter(u => u.role === 'attendee').length,
      color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
    },
    {
      label: 'Employees',
      value: allUsers.filter(u => u.role === 'employee').length,
      color: 'linear-gradient(180deg, #22c55e, #15803d)',
    },
    {
      label: 'Clients',
      value: allUsers.filter(u => u.role === 'client').length,
      color: 'linear-gradient(180deg, #f59e0b, #d97706)',
    },
    {
      label: 'Organizers',
      value: allUsers.filter(u => u.role === 'organizer').length,
      color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
    },
    {
      label: 'Admins',
      value: allUsers.filter(u => u.role === 'superuser').length,
      color: 'linear-gradient(180deg, #ef4444, #b91c1c)',
    },
  ];

  // 4. Role Activity Rate % Bar Graph
  const activityRateBars = roleBreakdown.map((r, index) => ({
    label: r.label,
    value: r.activePct,
    color: [
      'linear-gradient(180deg, #8b5cf6, #7c3aed)',
      'linear-gradient(180deg, #22c55e, #15803d)',
      'linear-gradient(180deg, #f59e0b, #d97706)',
      'linear-gradient(180deg, #3b82f6, #1d4ed8)',
      'linear-gradient(180deg, #ef4444, #b91c1c)',
    ][index % 5],
  }));
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">User Reports & Analytics</div>
      <div class="page-sub">Monthly registrations, account activity, and user role distribution.</div>
    </div>
    <div class="page-hd-right">
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">
        <button class="btn btn-xs ${
          selectedRole === 'all' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterUserReports('all')">All Roles</button>
        <button class="btn btn-xs ${
          selectedRole === 'attendee' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterUserReports('attendee')">Attendees</button>
        <button class="btn btn-xs ${
          selectedRole === 'employee' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterUserReports('employee')">Employees</button>
        <button class="btn btn-xs ${
          selectedRole === 'client' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterUserReports('client')">Clients</button>
        <button class="btn btn-xs ${
          selectedRole === 'organizer' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterUserReports('organizer')">Organizers</button>
      </div>
    </div>
  </div>

  <!-- Key Metric Summary Cards -->
  <div class="grid-4 mb-20">
    <div class="stat-card">
      <div class="glow" style="background:var(--accent)"></div>
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">👥</div>
      <div class="stat-value" style="color:var(--accent)">${totalUsers}</div>
      <div class="stat-label">Total ${
        selectedRole === 'all' ? 'Users' : ROLE_LABELS[selectedRole]
      }</div>
      <div class="stat-sub neutral">${
        selectedRole === 'all' ? 'Across all roles' : 'Filtered role view'
      }</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--green)"></div>
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>
      <div class="stat-value" style="color:var(--green)">${activeUsers}</div>
      <div class="stat-label">Active Users</div>
      <div class="stat-sub up">↑ ${activeRate}% active rate</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--red)"></div>
      <div class="stat-icon" style="background:var(--red-dim);color:var(--red)">⏸️</div>
      <div class="stat-value" style="color:var(--red)">${inactiveUsers}</div>
      <div class="stat-label">Inactive Users</div>
      <div class="stat-sub neutral">${inactiveRate}% inactive rate</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--yellow)"></div>
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📈</div>
      <div class="stat-value" style="color:var(--yellow)">${
        monthBars[monthBars.length - 1] ? monthBars[monthBars.length - 1].value : 0
      }</div>
      <div class="stat-label">New Joins This Month</div>
      <div class="stat-sub neutral">Recent registrations</div>
    </div>
  </div>

  <!-- Bar Graphs Row 1: Monthly Joins & Active vs Inactive Grouped Bar Chart -->
  <div class="grid-2 mb-20" style="gap:20px;align-items:start">
    <div class="card">
      <div class="h4 mb-12">Monthly Registrations</div>
      ${buildAnalyticsLine(monthBars, 180, {
        label: 'New users',
      })}
    </div>
    <div class="card">
      <div class="h4 mb-12">Active & Inactive Users</div>
      ${buildGroupedAnalyticsBars(activeInactiveGroups, 145, [
        {
          label: 'Active Users',
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Inactive Users',
          color: 'linear-gradient(180deg, #ef4444, #b91c1c)',
        },
      ])}
    </div>
  </div>

  <!-- Bar Graphs Row 2: Platform Role Breakdown & Activity Rate % -->
  <div class="grid-2" style="gap:20px;align-items:start">
    <div class="card">
      <div class="h4 mb-12">Users by Role</div>
      ${buildAnalyticsBars(roleBars, 145)}
    </div>
    <div class="card">
      <div class="h4 mb-12">Activity Rate by Role</div>
      ${buildAnalyticsRings(activityRateBars)}
      <div style="margin-top:12px;text-align:center;font-size:11.5px;color:var(--text2)">
        Percentage of accounts actively participating in each role category.
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════
//  ADMIN SUBPAGE 2: EVENT REPORTS (BAR GRAPHS)
// ════════════════════════════════════════════════
function filterEventReportsStage(stage) {
  sessionStorage.setItem('admin_event_reports_stage', stage);
  return renderPage('event-reports');
}
function pageEventReports() {
  const selectedStage = sessionStorage.getItem('admin_event_reports_stage') || 'all';
  const allEvents = DB.events;
  const ongoingEvents = allEvents.filter(event => event.status === 'ongoing');
  const upcomingEvents = allEvents.filter(
    event => event.status === 'upcoming' || event.status === 'published' || event.status === 'full'
  );
  const completedEvents = allEvents.filter(event => event.status === 'completed');
  const draftEvents = allEvents.filter(event => ['draft', 'pending'].includes(event.status));
  let eventsToAnalyze = allEvents;
  if (selectedStage === 'ongoing') eventsToAnalyze = ongoingEvents;
  else if (selectedStage === 'upcoming') eventsToAnalyze = upcomingEvents;
  else if (selectedStage === 'completed') eventsToAnalyze = completedEvents;
  const totalEvents = eventsToAnalyze.length;

  // 1. Lifecycle Stage Bar Graph
  const lifecycleBars = [
    {
      label: 'Ongoing (Now)',
      value: ongoingEvents.length,
      color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
    },
    {
      label: 'About to Happen',
      value: upcomingEvents.length,
      color: 'linear-gradient(180deg, #22c55e, #15803d)',
    },
    {
      label: 'Completed',
      value: completedEvents.length,
      color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
    },
    {
      label: 'Draft / Planning',
      value: draftEvents.length,
      color: 'linear-gradient(180deg, #64748b, #475569)',
    },
  ];

  // 2. Monthly Timeline Bar Graph
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlyBuckets = {};
  const now = new Date();
  for (let i = -2; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyBuckets[key] = {
      label: monthNames[d.getMonth()],
      count: 0,
      isPast: i < 0,
      isCurrent: i === 0,
    };
  }
  eventsToAnalyze.forEach(e => {
    const dateStr = (e.date || '').toString();
    const match = dateStr.match(/(\d{4}-\d{2})/);
    if (match && monthlyBuckets[match[1]]) {
      monthlyBuckets[match[1]].count++;
    }
  });
  const monthlyBars = Object.values(monthlyBuckets).map(m => ({
    label: m.label + (m.isCurrent ? ' (Now)' : ''),
    value: m.count,
    color: m.isCurrent
      ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)'
      : m.isPast
      ? 'linear-gradient(180deg, #8b5cf6, #7c3aed)'
      : 'linear-gradient(180deg, #22c55e, #15803d)',
  }));

  // 3. Category Distribution Bar Graph
  const catCounts = {};
  eventsToAnalyze.forEach(e => {
    const c = e.category || 'Other';
    catCounts[c] = (catCounts[c] || 0) + 1;
  });
  const catBars = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({
      label,
      value,
      color: [
        'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        'linear-gradient(180deg, #22c55e, #15803d)',
        'linear-gradient(180deg, #f59e0b, #d97706)',
        'linear-gradient(180deg, #8b5cf6, #7c3aed)',
        'linear-gradient(180deg, #ec4899, #be185d)',
        'linear-gradient(180deg, #14b8a6, #0f766e)',
      ][i % 6],
    }));

  // 4. Grouped Capacity vs Registered Bar Graph by Event Stage
  const capacityOccupancyGroups = [
    {
      label: 'Ongoing',
      bars: [
        {
          label: 'Registered',
          value: ongoingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.registered || 0),
            0
          ),
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Capacity',
          value: ongoingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.capacity || 0),
            0
          ),
          color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        },
      ],
    },
    {
      label: 'About to Happen',
      bars: [
        {
          label: 'Registered',
          value: upcomingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.registered || 0),
            0
          ),
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Capacity',
          value: upcomingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.capacity || 0),
            0
          ),
          color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        },
      ],
    },
    {
      label: 'Completed',
      bars: [
        {
          label: 'Registered',
          value: completedEvents.reduce(
            (total, currentEvent) => total + (currentEvent.registered || 0),
            0
          ),
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Capacity',
          value: completedEvents.reduce(
            (total, currentEvent) => total + (currentEvent.capacity || 0),
            0
          ),
          color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        },
      ],
    },
  ];
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Event Reports & Analytics</div>
      <div class="page-sub">Event activity, category breakdowns, and registration trends.</div>
    </div>
    <div class="page-hd-right">
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">
        <button class="btn btn-xs ${
          selectedStage === 'all' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterEventReportsStage('all')">All Stages</button>
        <button class="btn btn-xs ${
          selectedStage === 'ongoing' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterEventReportsStage('ongoing')">▶️ Ongoing</button>
        <button class="btn btn-xs ${
          selectedStage === 'upcoming' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterEventReportsStage('upcoming')">⏳ About to Happen</button>
        <button class="btn btn-xs ${
          selectedStage === 'completed' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterEventReportsStage('completed')">✅ Completed</button>
      </div>
    </div>
  </div>

  <!-- 3 Event Stage Highlight Cards -->
  <div class="grid-3 mb-20" style="gap:16px">
    <div class="stat-card" style="border-left:4px solid var(--blue)">
      <div class="glow" style="background:var(--blue)"></div>
      <div class="flex justify-between items-center mb-6">
        <span style="font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase">▶️ Ongoing Events</span>
        <span class="badge badge-blue">Happening Now</span>
      </div>
      <div class="stat-value" style="color:var(--blue);font-size:32px">${ongoingEvents.length}</div>
      <div class="stat-label">Currently in Progress</div>
      <div class="stat-sub neutral" style="margin-top:6px">${ongoingEvents.reduce(
        (total, currentEvent) => total + (currentEvent.registered || 0),
        0
      )} live attendees participating</div>
    </div>

    <div class="stat-card" style="border-left:4px solid var(--green)">
      <div class="glow" style="background:var(--green)"></div>
      <div class="flex justify-between items-center mb-6">
        <span style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase">⏳ About to Happen</span>
        <span class="badge badge-green">Scheduled</span>
      </div>
      <div class="stat-value" style="color:var(--green);font-size:32px">${
        upcomingEvents.length
      }</div>
      <div class="stat-label">Upcoming & Scheduled</div>
      <div class="stat-sub up" style="margin-top:6px">${upcomingEvents.reduce(
        (total, currentEvent) => total + (currentEvent.registered || 0),
        0
      )} reservations confirmed</div>
    </div>

    <div class="stat-card" style="border-left:4px solid var(--purple)">
      <div class="glow" style="background:var(--purple)"></div>
      <div class="flex justify-between items-center mb-6">
        <span style="font-size:12px;font-weight:700;color:var(--purple);text-transform:uppercase">✅ Completed Events</span>
        <span class="badge badge-purple">Finished</span>
      </div>
      <div class="stat-value" style="color:var(--purple);font-size:32px">${
        completedEvents.length
      }</div>
      <div class="stat-label">Concluded Events</div>
      <div class="stat-sub neutral" style="margin-top:6px">${completedEvents.reduce(
        (total, currentEvent) => total + (currentEvent.registered || 0),
        0
      )} past attendees reached</div>
    </div>
  </div>

  <!-- Bar Graphs Row 1: Lifecycle Stages Comparison & Category Breakdown -->
  <div class="grid-2 mb-20" style="gap:20px">
    <div class="card">
      <div class="h4 mb-12">Event Lifecycle</div>
      ${buildAnalyticsBars(lifecycleBars, 215)}
    </div>
    <div class="card">
      <div class="h4 mb-12">Event Categories</div>
      ${buildAnalyticsBars(
        catBars.length
          ? catBars
          : [
              {
                label: 'No Events',
                value: 0,
                color: 'linear-gradient(180deg, #64748b, #475569)',
              },
            ],
        215
      )}
    </div>
  </div>

  <!-- Bar Graphs Row 2: Monthly Timeline & Grouped Capacity vs Registrations -->
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="h4 mb-12">Monthly Event Timeline</div>
      ${buildAnalyticsLine(monthlyBars, 215, {
        label: 'Events',
      })}
    </div>
    <div class="card">
      <div class="h4 mb-12">Booked Seats & Capacity</div>
      ${buildGroupedAnalyticsBars(capacityOccupancyGroups, 215, [
        {
          label: 'Booked Seats',
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Total Capacity',
          color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        },
      ])}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════
//  ADMIN SUBPAGE 3: REVENUE REPORTS (BAR GRAPHS)
// ════════════════════════════════════════════════
function filterRevenueTimeframe(tf) {
  sessionStorage.setItem('admin_revenue_timeframe', tf);
  renderPage('revenue-reports');
}
function pageRevenueReports() {
  const timeframe = sessionStorage.getItem('admin_revenue_timeframe') || '6m';
  const allEvents = DB.events;
  const allRegs = DB.registrations;
  const ticketPayments = (DB.financeTransactions || []).filter(
    payment => payment.kind !== 'event' && payment.status === 'Successful'
  );
  const eventPayments = (DB.eventWorkflowPayments || []).filter(
    payment => payment.status === 'completed'
  );
  const actualPayments = [...ticketPayments, ...eventPayments];
  const regRevenue = ticketPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const eventRevenue = eventPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalRevenue = regRevenue + eventRevenue;
  const paidEvents = allEvents.filter(event => event.price > 0);
  const freeEvents = allEvents.filter(event => !event.price || event.price === 0);
  const totalPaidSeats = paidEvents.reduce(
    (total, currentEvent) => total + (currentEvent.registered || 0),
    0
  );
  const avgTicketPrice =
    paidEvents.length > 0
      ? Math.round(
          paidEvents.reduce((total, currentEvent) => total + (currentEvent.price || 0), 0) /
            paidEvents.length
        )
      : 0;
  const projectedPipeline = allEvents
    .filter(event => event.status === 'upcoming' || event.status === 'ongoing')
    .reduce(
      (total, currentEvent) => total + (currentEvent.capacity || 0) * (currentEvent.price || 0),
      0
    );

  // 1. Monthly Revenue Bar Graph over time (in ₹ Thousands)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlyRevenueMap = {};
  const numMonths = timeframe === '12m' ? 12 : 6;
  const now = new Date();
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenueMap[key] = {
      label: monthNames[d.getMonth()],
      amount: 0,
    };
  }
  actualPayments.forEach(payment => {
    const month = String(payment.paymentDate || payment.date || '').slice(0, 7);
    if (monthlyRevenueMap[month]) monthlyRevenueMap[month].amount += Number(payment.amount || 0);
  });
  const revenueBars = Object.values(monthlyRevenueMap).map((m, index) => ({
    label: m.label,
    value: Number((m.amount / 1000).toFixed(2)),
    color: [
      'linear-gradient(180deg, #22c55e, #15803d)',
      'linear-gradient(180deg, #10b981, #047857)',
      'linear-gradient(180deg, #3b82f6, #1d4ed8)',
      'linear-gradient(180deg, #6366f1, #4338ca)',
      'linear-gradient(180deg, #8b5cf6, #7c3aed)',
      'linear-gradient(180deg, #f59e0b, #d97706)',
    ][index % 6],
  }));

  // 2. Category Revenue Bar Graph
  const catRevenueMap = {};
  actualPayments.forEach(payment => {
    const category =
      allEvents.find(event => String(event.id) === String(payment.eventId))?.category || 'General';
    catRevenueMap[category] = (catRevenueMap[category] || 0) + Number(payment.amount || 0);
  });
  const catRevenueBars = Object.entries(catRevenueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], index) => ({
      label,
      value: Number((value / 1000).toFixed(2)),
      color: [
        'linear-gradient(180deg, #22c55e, #15803d)',
        'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        'linear-gradient(180deg, #f59e0b, #d97706)',
        'linear-gradient(180deg, #8b5cf6, #7c3aed)',
        'linear-gradient(180deg, #ec4899, #be185d)',
        'linear-gradient(180deg, #14b8a6, #0f766e)',
      ][index % 6],
    }));

  // 3. Ticket Pricing Tiers Bar Graph
  const pricingTierBars = [
    {
      label: 'Free (₹0)',
      value: freeEvents.length,
      color: 'linear-gradient(180deg, #14b8a6, #0f766e)',
    },
    {
      label: 'Budget (₹1–₹99)',
      value: allEvents.filter(event => event.price > 0 && event.price < 100).length,
      color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
    },
    {
      label: 'Mid-Tier (₹100–₹199)',
      value: allEvents.filter(event => event.price >= 100 && event.price < 200).length,
      color: 'linear-gradient(180deg, #f59e0b, #d97706)',
    },
    {
      label: 'Premium (₹200+)',
      value: allEvents.filter(event => event.price >= 200).length,
      color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
    },
  ];

  // 4. Revenue Streams Contribution Bar Graph
  const streamBars = [
    {
      label: 'Ticket Sales',
      value: Number((regRevenue / 1000).toFixed(2)),
      color: 'linear-gradient(180deg, #22c55e, #15803d)',
    },
    {
      label: 'Client Event Payments',
      value: Number((eventRevenue / 1000).toFixed(2)),
      color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
    },
  ];
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Revenue Reports & Analytics</div>
      <div class="page-sub">Revenue trends, ticket pricing, and income by event category.</div>
    </div>
    <div class="page-hd-right">
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">
        <button class="btn btn-xs ${
          timeframe === '6m' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterRevenueTimeframe('6m')">Last 6 Months</button>
        <button class="btn btn-xs ${
          timeframe === '12m' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterRevenueTimeframe('12m')">Last 12 Months</button>
      </div>
    </div>
  </div>

  <!-- Key Revenue Metric Cards -->
  <div class="grid-4 mb-20">
    <div class="stat-card">
      <div class="glow" style="background:var(--green)"></div>
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>
      <div class="stat-value" style="color:var(--green)">₹${(totalRevenue / 1000).toFixed(1)}K</div>
      <div class="stat-label">Total Platform Revenue</div>
      <div class="stat-sub neutral">Recorded payment revenue</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--accent)"></div>
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>
      <div class="stat-value" style="color:var(--accent)">₹${avgTicketPrice}</div>
      <div class="stat-label">Average Ticket Price</div>
      <div class="stat-sub neutral">Across ${paidEvents.length} paid events</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--yellow)"></div>
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">🎟️</div>
      <div class="stat-value" style="color:var(--yellow)">${totalPaidSeats}</div>
      <div class="stat-label">Paid Ticket Registrations</div>
      <div class="stat-sub neutral">Paid registrations recorded</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--blue)"></div>
      <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📊</div>
      <div class="stat-value" style="color:var(--blue)">₹${(projectedPipeline / 1000).toFixed(
        1
      )}K</div>
      <div class="stat-label">Projected Pipeline</div>
      <div class="stat-sub neutral">Upcoming capacity value</div>
    </div>
  </div>

  <!-- Bar Graphs Row 1: Revenue Over Time & Revenue by Category -->
  <div class="grid-2 mb-20" style="gap:20px">
    <div class="card">
      <div class="flex justify-between items-center mb-12">
        <span class="h4">Platform Revenue</span>
        <span class="badge badge-green">${numMonths} Months Trend</span>
      </div>
      ${buildAnalyticsLine(revenueBars, 215, {
        label: 'Revenue',
        prefix: '₹',
        suffix: 'K',
      })}
      <div style="margin-top:12px;font-size:11.5px;color:var(--text2);text-align:center">
        Monthly revenue performance trajectory in thousands (₹K).
      </div>
    </div>

    <div class="card">
      <div class="flex justify-between items-center mb-12">
        <span class="h4">Revenue by Category</span>
      </div>
      ${buildAnalyticsBars(catRevenueBars, 215, {
        label: 'Revenue',
        prefix: '₹',
        suffix: 'K',
      })}
      <div style="margin-top:12px;font-size:11.5px;color:var(--text2);text-align:center">
        Revenue breakdown by event category.
      </div>
    </div>
  </div>

  <!-- Bar Graphs Row 2: Ticket Pricing Tiers & Revenue Streams -->
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="h4 mb-12">Events by Ticket Price</div>
      ${buildAnalyticsBars(pricingTierBars, 215)}
    </div>

    <div class="card">
      <div class="h4 mb-12">Revenue Sources</div>
      ${buildAnalyticsBars(streamBars, 215, {
        label: 'Revenue',
        prefix: '₹',
        suffix: 'K',
      })}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════
//  NON-ADMIN PAGES (ORGANIZER / CLIENT / ATTENDEE)
// ════════════════════════════════════════════════
function pageUsers() {
  const users = window.EventFlowAccountPolicy.visibleAccounts(CU, DB.users).filter(
    u => u.role !== 'superuser'
  );
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">User Management</div>
      <div class="page-sub">View users and their account details.</div>
    </div>
  </div>
  <div class="filter-row">
    <div class="search-box input-group">
      <span class="input-icon">🔍</span>
      <input class="form-control" id="um-q" placeholder="Search by name or email…" oninput="refreshDirectoryUserManagement()">
    </div>
    <select class="form-control filter-select" id="um-role" onchange="refreshDirectoryUserManagement()">
      <option value="">All Users</option>
      <option value="attendee">Attendee</option>
      ${
        window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU)
          ? ''
          : `<option value="employee">Employees</option>`
      }
      <option value="organizer">Event Manager</option>
      <option value="client">Client</option>
    </select>
  </div>
  <div class="table-wrap" id="user-management-table">${buildUserManagementTable(users)}</div>`;
}
function buildUserManagementTable(users) {
  users = window.EventFlowAccountPolicy.visibleAccounts(CU, users);
  if (users.length === 0) {
    return `<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">No users found</div><p class="empty-desc">Try changing your search or role filter.</p></div>`;
  }
  return `<table>
    <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
    <tbody>${users
      .map(user => {
        const avHtml = user.avatarImage
          ? `
        <div class="av av-xs">
          <img src="${user.avatarImage}" alt="${
              user.name
            }" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
          <span style="display:none">${user.avatar || user.name?.[0] || '?'}</span>
        </div>
      `
          : `<div class="av av-xs">${user.avatar || user.name?.[0] || '?'}</div>`;
        return `<tr>
      <td><div class="flex items-center gap-8">${avHtml}<strong>${
          user.name || 'Unknown User'
        }</strong></div></td>
      <td>${user.email || '—'}</td>
      <td>${user.phone || '—'}</td>
      <td><span class="badge badge-${ROLE_COLORS[user.role] || 'blue'}">${
          user.role === 'organizer' ? 'Event Manager' : ROLE_LABELS[user.role] || user.role
        }</span></td>
      <td><span class="badge badge-${user.status === 'active' ? 'green' : 'red'}">${
          user.status || 'unknown'
        }</span></td>
      <td>${user.joined || user.createdAt || '—'}</td>
      <td>${
        window.EventFlowAccountPolicy.canManageAccount(CU, user)
          ? `<div class="actions"><button class="btn btn-ghost btn-xs" onclick="openEditUserModal('${user.id}')">Edit</button><button class="btn btn-xs btn-danger" onclick="removeUser('${user.id}')">Remove</button></div>`
          : '<span class="small muted">Admin managed</span>'
      }</td>
    </tr>`;
      })
      .join('')}</tbody>
  </table>`;
}
function refreshDirectoryUserManagement() {
  const query = (g('um-q')?.value || '').trim().toLowerCase();
  const role = g('um-role')?.value || '';
  const users = window.EventFlowAccountPolicy.visibleAccounts(CU, DB.users).filter(u => {
    const matchesRole = !role || u.role === role;
    const matchesQuery =
      !query ||
      [u.name, u.email, u.phone].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      );
    return u.role !== 'superuser' && matchesRole && matchesQuery;
  });
  globalThis.window?.EventFlowAdminPages?.clear(g('user-management-table'));
  g('user-management-table').innerHTML = buildUserManagementTable(users);
}
function openEditUserModal(userId) {
  const user = DB.users.find(u => String(u.id) === String(userId));
  if (!user) return;
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, user)) {
    toast('Only an admin can change employee or admin accounts.', 'error');
    return;
  }
  openModal(
    'Edit User',
    `
  <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="um-edit-name" value="${
    user.name || ''
  }"></div>
  <div class="form-group"><label class="form-label">Email *</label><input class="form-control" id="um-edit-email" type="email" value="${
    user.email || ''
  }"></div>
  <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="um-edit-phone" value="${
    user.phone || ''
  }"></div>
  <div class="grid-2">
    <div class="form-group"><label class="form-label">Role</label><select class="form-control" id="um-edit-role" ${
      window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU) ? 'disabled' : ''
    }><option value="attendee" ${user.role === 'attendee' ? 'selected' : ''}>Attendee</option>${
      window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU)
        ? ''
        : `<option value="employee" ${
            user.role === 'employee' ? 'selected' : ''
          }>Employees</option>`
    }<option value="organizer" ${
      user.role === 'organizer' ? 'selected' : ''
    }>Event Manager</option><option value="client" ${
      user.role === 'client' ? 'selected' : ''
    }>Client</option></select></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="um-edit-status"><option value="active" ${
      user.status === 'active' ? 'selected' : ''
    }>Active</option><option value="inactive" ${
      user.status !== 'active' ? 'selected' : ''
    }>Inactive</option></select></div>
  </div>`,
    [
      {
        lbl: 'Save Changes',
        cls: 'btn-primary',
        fn: `saveUser('${user.id}')`,
      },
    ]
  );
}
function saveUser(userId) {
  const user = DB.users.find(u => String(u.id) === String(userId));
  const name = v('um-edit-name');
  const email = v('um-edit-email');
  if (!user) return;
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, user)) {
    toast('Only an admin can change employee or admin accounts.', 'error');
    return;
  }
  if (!name) {
    toast('Name is required', 'error');
    return;
  }
  if (!email || !email.includes('@')) {
    toast('Valid email is required', 'error');
    return;
  }
  const duplicate = window.EventFlowAccountPolicy.isEmailInUse(DB.users, email, userId);
  if (duplicate) {
    toast('Email already registered', 'error');
    return;
  }
  if (
    !window.EventFlowAccountPolicy.canApplyAccountUpdate(CU, user, {
      role: v('um-edit-role'),
    })
  ) {
    toast('Only an admin can change account roles.', 'error');
    return;
  }
  user.name = name;
  user.email = email;
  user.phone = v('um-edit-phone');
  user.role = v('um-edit-role');
  user.status = v('um-edit-status');
  user.avatar = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  saveDB();
  closeModal();
  renderPage('users');
  toast('User details updated', 'success');
}
function removeUser(userId) {
  const user = DB.users.find(u => String(u.id) === String(userId));
  if (!user) return;
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, user)) {
    toast('Only an admin can change employee or admin accounts.', 'error');
    return;
  }
  confirm2('Remove User', `Remove ${user.name || 'this user'} from the user list?`, () => {
    const current = DB.users.find(user => String(user.id) === String(userId));
    if (!window.EventFlowAccountPolicy.canManageAccount(CU, current)) {
      toast('This account can only be managed by an admin.', 'error');
      return;
    }
    const index = DB.users.findIndex(u => String(u.id) === String(userId));
    if (index === -1) return;
    DB.users.splice(index, 1);
    saveDB();
    renderPage('users');
    toast('User removed', 'info');
  });
}
function pageEvents() {
  if (CU.role === 'superuser') return pageEventReports();
  if (CU.role === 'client') {
    return `<div class="empty"><div class="empty-icon">🚫</div><div class="empty-title">Access Denied</div><p class="empty-desc">This page is not available for clients. Please use Find Organizers to request events.</p><button class="btn btn-primary mt-16" onclick="goNav('find-organizers')">Find Organizers</button></div>`;
  }
  const isOrg = CU.role === 'organizer';
  const list = isOrg ? DB.events.filter(event => event.organizer === CU.id) : DB.events;
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">${
      isOrg ? 'My Events' : 'All Events'
    }</div><div class="page-sub">${list.length} event(s)</div></div>
    <div class="page-hd-right">${
      CU.role === 'organizer' && !isEmployeeAccount()
        ? `<button class="btn btn-primary" onclick="openAddEventModal()">+ Create Event</button>`
        : ''
    }</div>
  </div>
  <div class="filter-row">
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="ev-q" placeholder="Search events…" oninput="refreshEvents()"></div>
    <select class="form-control filter-select" id="ev-st" onchange="refreshEvents()">
      <option value="">All Status</option><option value="upcoming">Upcoming</option><option value="full">Full</option><option value="completed">Completed</option>
    </select>
    <select class="form-control filter-select" id="ev-cat" onchange="refreshEvents()">
      <option value="">All Categories</option><option>Conference</option><option>Corporate</option><option>Concert</option><option>Workshop</option><option>Networking</option>
    </select>
  </div>
  <div class="events-grid" id="ev-grid">${list.map(e => evCard(e, CU.role)).join('')}</div>`;
}
function refreshEvents() {
  const q = (g('ev-q') || {}).value?.toLowerCase() || '';
  const st = (g('ev-st') || {}).value || '';
  const cat = (g('ev-cat') || {}).value || '';
  const isOrg = CU.role === 'organizer';
  const list = (isOrg ? DB.events.filter(event => event.organizer === CU.id) : DB.events).filter(
    e => {
      return (
        (!q || e.title.toLowerCase().includes(q)) &&
        (!st || e.status === st) &&
        (!cat || e.category === cat)
      );
    }
  );
  globalThis.window?.EventFlowAdminPages?.clear(g('ev-grid'));
  g('ev-grid').innerHTML =
    list.map(e => evCard(e, CU.role)).join('') ||
    `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events found</div></div>`;
}
function evCard(event, role, reg = null) {
  const pct = Math.min(100, Math.round((event.registered / event.capacity) * 100));
  const regForThis =
    reg ||
    DB.registrations.find(
      registration =>
        String(registration.attendeeId) === String(CU.id) &&
        String(registration.eventId) === String(event.id)
    );
  const bannerContent = event.image
    ? `
        <img src="${event.image}" alt="${
        event.title || 'Event'
      }" class="ev-banner-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="ev-banner-fallback" style="display:none;align-items:center;justify-content:center;font-size:52px;width:100%;height:100%">${
          event.emoji || '📅'
        }</div>
        <div class="ev-banner-overlay"></div>
      `
    : `<span style="font-size:52px">${event.emoji || '📅'}</span>`;
  return `<div class="ev-card">
    <div class="ev-banner" style="background:${event.color || 'var(--accent)'}18">
      ${bannerContent}
      <div class="ev-banner-tag"><span class="badge badge-${evStatBadge(event.status)}">${
    event.status
  }</span></div>
      <div class="ev-banner-price">${event.price === 0 ? 'Free' : '₹' + event.price}</div>
    </div>
    <div class="ev-body">
      <div class="ev-title">${event.title}</div>
      <div class="ev-meta">
        <div class="ev-meta-row"><span>📅</span>${event.date} · ${event.time}</div>
        <div class="ev-meta-row"><span>📍</span>${event.venue}</div>
        <div class="ev-meta-row"><span>🏷️</span>${event.category}</div>
      </div>
      <div style="margin-bottom:12px">
        <div class="flex justify-between ev-cap mb-4"><span>${event.registered}/${
    event.capacity
  } registered</span><span>${pct}%</span></div>
        <div class="prog"><div class="prog-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="ev-footer">
        ${
          role === 'attendee'
            ? `<div class="flex gap-6" style="width:100%;justify-content:space-between"><button class="btn btn-sm ${
                regForThis ? 'btn-ghost' : 'btn-primary'
              }" onclick="regForEvent('${event.id}')" ${
                (event.status === 'full' && !regForThis) || event.status === 'completed'
                  ? 'disabled'
                  : ''
              } style="${
                (event.status === 'full' && !regForThis) || event.status === 'completed'
                  ? 'opacity:.5'
                  : ''
              }">${
                regForThis ? '✓ Registered' : event.status === 'full' ? 'Event Full' : 'Register'
              }</button><button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('${
                event.id
              }')" title="View event details">View Details</button></div>`
            : role === 'organizer'
            ? `<div class="actions"><button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('${event.id}')" title="View event details">👁️ View</button><button class="btn btn-ghost btn-xs" onclick="openEditEventModal('${event.id}')">✏️ Edit</button><button class="btn btn-xs btn-danger" onclick="deleteEvent('${event.id}')">🗑️</button></div>`
            : role === 'superuser'
            ? `<div class="actions"><button class="btn btn-ghost btn-xs w-full" onclick="openViewEventDrawer('${event.id}')" title="View event details">👁️ View</button></div>`
            : role === 'employee' || role === 'client'
            ? `<div class="flex gap-6"><button class="btn btn-ghost btn-xs w-full" onclick="openViewEventDrawer('${event.id}')" title="View event details">👁️ View Details</button></div>`
            : `<button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('${event.id}')" title="View event details">👁️ Details</button>`
        }
        <div class="tag-list" style="flex:1;justify-content:flex-end">${(event.tags || [])
          .slice(0, 2)
          .map(tag => `<span class="tag">${tag}</span>`)
          .join('')}</div>
      </div>
    </div>
  </div>`;
}
function openAddEventModal() {
  openModal(
    'Create New Event',
    `
    <div class="form-group"><label class="form-label">Event Title *</label><input class="form-control" id="ne-title" placeholder="e.g. Annual Tech Summit 2026"></div>
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Category *</label>
        <select class="form-control" id="ne-cat"><option>Conference</option><option>Corporate</option><option>Concert</option><option>Workshop</option><option>Networking</option><option>Other</option></select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="ne-status"><option value="upcoming">Upcoming</option><option value="full">Full</option></select>
      </div>
    </div>
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="ne-date" type="date" min="${EventFlowEventDates.minimumEventDate()}"><p class="small muted">Choose a date at least 7 days from today.</p></div>
      <div class="form-group"><label class="form-label">Start Time</label><input class="form-control" id="ne-time" type="time" value="09:00"></div>
    </div>
    <div class="form-group"><label class="form-label">Venue *</label><input class="form-control" id="ne-venue" placeholder="Convention Center, Hall A"></div>
    <div class="form-group"><label class="form-label">City</label><input class="form-control" id="ne-city" placeholder="Chennai"></div>
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Capacity *</label><input class="form-control" id="ne-cap" type="number" placeholder="500"></div>
      <div class="form-group"><label class="form-label">Ticket Price (₹) — 0 = Free</label><input class="form-control" id="ne-price" type="number" placeholder="0"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ne-desc" placeholder="Describe the event…"></textarea></div>
    <div class="form-group"><label class="form-label">Tags (comma-separated)</label><input class="form-control" id="ne-tags" placeholder="AI, Tech, Networking"></div>
  `,
    [
      {
        lbl: 'Create Event',
        cls: 'btn-primary',
        fn: 'saveNewEvent()',
      },
    ]
  );
}
function saveNewEvent() {
  const title = v('ne-title');
  const date = v('ne-date');
  const venue = v('ne-venue');
  const cap = v('ne-cap');
  if (!title) {
    toast('Event title is required', 'error');
    return;
  }
  if (!date) {
    toast('Event date is required', 'error');
    return;
  }
  const dateError = EventFlowEventDates.validateEventLeadTime(date);
  if (dateError) {
    toast(dateError, 'error');
    return;
  }
  if (!venue) {
    toast('Venue is required', 'error');
    return;
  }
  if (!cap || parseInt(cap) < 1) {
    toast('Enter valid capacity', 'error');
    return;
  }
  const eventPayload = {
    name: title,
    category: v('ne-cat') || 'Conference',
    date: date,
    time: v('ne-time') || '09:00',
    location: venue,
    capacity: parseInt(cap),
    ticketPrice: parseInt(v('ne-price')) || 0,
    status: v('ne-status') || 'upcoming',
    description: v('ne-desc') || '',
    organizerId: CU.userId || CU.id,
  };
  apiCreateEvent(eventPayload)
    .then(function (newEv) {
      // Add to local DB for immediate UI
      const evId = newEv.eventId || DB._nextId.events++;
      DB.events.push({
        id: evId,
        title,
        category: v('ne-cat'),
        date,
        time: v('ne-time'),
        venue,
        city: v('ne-city'),
        capacity: parseInt(cap),
        registered: 0,
        price: parseInt(v('ne-price')) || 0,
        status: v('ne-status') || 'upcoming',
        organizer: CU.id,
        description: v('ne-desc'),
        emoji: '📅',
        color: '#7c6ff7',
      });
      closeModal();
      renderPage(_currentPage);
      toast('Event created!', 'success');
    })
    .catch(function (error) {
      // Fallback: save locally
      const evId = DB._nextId ? DB._nextId.events++ : Date.now();
      DB.events.push({
        id: evId,
        title,
        category: v('ne-cat'),
        date,
        time: v('ne-time'),
        venue,
        city: v('ne-city'),
        capacity: parseInt(cap),
        registered: 0,
        price: parseInt(v('ne-price')) || 0,
        status: v('ne-status') || 'upcoming',
        organizer: CU.id,
        description: v('ne-desc'),
        emoji: '📅',
        color: '#7c6ff7',
      });
      saveDB();
      closeModal();
      renderPage(_currentPage);
      toast('Event created (local)!', 'success');
    });
}
function openEditEventModal(id) {
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(id));
  if (!event) return;
  openModal(
    `Edit — ${event.title}`,
    `
    <div class="form-group"><label class="form-label">Event Title</label><input class="form-control" id="ee-title" value="${
      event.title
    }"></div>
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="ee-date" type="date" value="${
        event.date
      }"></div>
      <div class="form-group"><label class="form-label">Time</label><input class="form-control" id="ee-time" type="time" value="${
        event.time
      }"></div>
    </div>
    <div class="form-group"><label class="form-label">Venue</label><input class="form-control" id="ee-venue" value="${
      event.venue
    }"></div>
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Capacity</label><input class="form-control" id="ee-cap" type="number" value="${
        event.capacity
      }"></div>
      <div class="form-group"><label class="form-label">Price (₹)</label><input class="form-control" id="ee-price" type="number" value="${
        event.price
      }"></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-control" id="ee-status">${['upcoming', 'full', 'completed']
        .map(s => `<option value="${s}"${event.status === s ? ' selected' : ''}>${s}</option>`)
        .join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ee-desc">${
      event.description || ''
    }</textarea></div>
  `,
    [
      {
        lbl: 'Save Changes',
        cls: 'btn-primary',
        fn: `saveEditEvent('${id}')`,
      },
    ]
  );
}
function saveEditEvent(id) {
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(id));
  if (!event) return;
  const newTitle = v('ee-title') || event.title;
  const newDate = v('ee-date') || event.date;
  const newTime = v('ee-time') || event.time;
  const newVenue = v('ee-venue') || event.venue;
  const newCap = parseInt(v('ee-cap')) || event.capacity;
  const newPrice = parseFloat(v('ee-price')) || 0;
  const newStatus = v('ee-status') || event.status;
  const newDesc = v('ee-desc');
  const backendId = event.eventId || id;
  apiUpdateEvent(backendId, {
    name: newTitle,
    date: newDate,
    time: newTime,
    location: newVenue,
    capacity: newCap,
    ticketPrice: newPrice,
    status: newStatus,
    description: newDesc,
  })
    .then(function () {
      event.title = newTitle;
      event.date = newDate;
      event.time = newTime;
      event.venue = newVenue;
      event.capacity = newCap;
      event.price = newPrice;
      event.status = newStatus;
      event.description = newDesc;
      closeModal();
      renderPage('events');
      toast('Event updated successfully', 'success');
    })
    .catch(function () {
      event.title = newTitle;
      event.date = newDate;
      event.time = newTime;
      event.venue = newVenue;
      event.capacity = newCap;
      event.price = newPrice;
      event.status = newStatus;
      event.description = newDesc;
      saveDB();
      closeModal();
      renderPage('events');
      toast('Event updated (local)', 'success');
    });
}
function deleteEvent(id) {
  if (window.event) window.event.stopPropagation();
  confirm2(
    'Delete Event',
    'This will permanently delete the event and all registrations for it.',
    () => {
      const event = DB.events.find(currentEvent => String(currentEvent.id) === String(id));
      const backendId = event ? event.eventId || id : id;
      apiDeleteEvent(backendId)
        .then(function () {
          const index = DB.events.findIndex(currentEvent => String(currentEvent.id) === String(id));
          if (index > -1) {
            DB.events.splice(index, 1);
          }
          DB.registrations = DB.registrations.filter(
            registration => String(registration.eventId) !== String(id)
          );
          renderPage(_currentPage);
          toast('Event deleted', 'info');
        })
        .catch(function () {
          const index = DB.events.findIndex(currentEvent => String(currentEvent.id) === String(id));
          if (index > -1) {
            DB.events.splice(index, 1);
            saveDB();
          }
          DB.registrations = DB.registrations.filter(
            registration => String(registration.eventId) !== String(id)
          );
          renderPage(_currentPage);
          toast('Event deleted (local)', 'info');
        });
    }
  );
}
function openViewEventDrawer(id) {
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(id));
  if (!event) return;
  const regs = DB.registrations.filter(registration => String(registration.eventId) === String(id));
  const bannerHTML = event.image
    ? `
        <div style="height:140px;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;background:${
          event.color || 'var(--accent)'
        }18">
          <img src="${event.image}" alt="${
        event.title || 'Event'
      }" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=\'font-size:52px;text-align:center;padding:30px 0\'>${
        event.emoji || '📅'
      }</div>'">
        </div>
      `
    : `<div style="font-size:52px;text-align:center;margin-bottom:16px">${
        event.emoji || '📅'
      }</div>`;
  openDrawer(
    event.title,
    `
    ${bannerHTML}
    <span class="badge badge-${evStatBadge(event.status)} mb-16">${event.status}</span>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px">
      <div class="info-row"><span class="info-label">Category</span><span class="info-value">${
        event.category
      }</span></div>
      <div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">${
        event.date
      } · ${event.time}</span></div>
      <div class="info-row"><span class="info-label">Venue</span><span class="info-value" style="max-width:200px;text-align:right">${
        event.venue
      }</span></div>
      <div class="info-row"><span class="info-label">City</span><span class="info-value">${
        event.city || '—'
      }</span></div>
      <div class="info-row"><span class="info-label">Capacity</span><span class="info-value">${
        event.registered
      } / ${event.capacity}</span></div>
      <div class="info-row"><span class="info-label">Price</span><span class="info-value" style="color:var(--green)">${
        event.price === 0 ? 'Free' : '₹' + event.price
      }</span></div>
      <div class="info-row"><span class="info-label">Registrations</span><span class="info-value">${
        regs.length
      }</span></div>

    </div>
    ${
      event.description
        ? `<div class="label mb-8">Description</div><p class="muted" style="font-size:13px;line-height:1.7">${event.description}</p>`
        : ''
    }
    ${
      (event.tags || []).length
        ? `<div class="label mt-16 mb-8">Tags</div><div class="tag-list">${event.tags
            .map(tag => `<span class="tag">${tag}</span>`)
            .join('')}</div>`
        : ''
    }
    ${
      CU.role === 'organizer'
        ? `<div class="flex gap-8 mt-20"><button class="btn btn-primary w-full" onclick="closeDrawer();openEditEventModal('${id}')">✏️ Edit Event</button></div>`
        : ''
    }
  `
  );
}
function viewPublicEventDetails(id) {
  const event = DB.events.find(currentEvent => currentEvent.id === id);
  if (!event) return;
  const regs = DB.registrations.filter(registration => registration.eventId === id);
  const org = DB.users.find(user => user.id === event.organizer) || {
    name: '—',
    avatar: '?',
  };
  const bannerHTML = event.image
    ? `
        <div style="height:140px;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;background:${
          event.color || 'var(--accent)'
        }18">
          <img src="${event.image}" alt="${
        event.title || 'Event'
      }" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=\'font-size:52px;text-align:center;padding:30px 0\'>${
        event.emoji || '📅'
      }</div>'">
        </div>
      `
    : `<div style="font-size:52px;text-align:center;margin-bottom:16px">${
        event.emoji || '📅'
      }</div>`;
  const orgAvHTML = org.avatarImage
    ? `
        <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--accent-dim);flex-shrink:0;position:relative">
          <img src="${org.avatarImage}" alt="${
        org.name
      }" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:var(--accent);font-weight:700">${
            org.avatar || org.name?.[0] || 'O'
          }</div>
        </div>
      `
    : `<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${
        org.avatar || org.name?.[0] || 'O'
      }</div>`;
  openDrawer(
    event.title,
    `
    ${bannerHTML}
    <span class="badge badge-${evStatBadge(event.status)} mb-16">${event.status}</span>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px">
      <div class="info-row"><span class="info-label">Category</span><span class="info-value">${
        event.category
      }</span></div>
      <div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">${
        event.date
      } · ${event.time}</span></div>
      <div class="info-row"><span class="info-label">Venue</span><span class="info-value" style="max-width:200px;text-align:right">${
        event.venue
      }</span></div>
      <div class="info-row"><span class="info-label">City</span><span class="info-value">${
        event.city || '—'
      }</span></div>
      <div class="info-row"><span class="info-label">Capacity</span><span class="info-value">${
        event.registered
      } / ${event.capacity}</span></div>
      <div class="info-row"><span class="info-label">Price</span><span class="info-value" style="color:var(--green)">${
        event.price === 0 ? 'Free' : '₹' + event.price
      }</span></div>
    </div>
    ${
      event.description
        ? `<div class="label mb-8">Description</div><p style="font-size:13px;line-height:1.7;color:var(--text);margin-bottom:16px">${event.description}</p>`
        : ''
    }
    <div class="label mb-8">Organizer</div>
    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:8px;margin-bottom:16px">
      ${orgAvHTML}
      <div style="flex:1;min-width:0">
        <div style="font-weight:600">${org.name}</div>
        <div class="small" style="color:var(--text2)">${
          org.service || org.bio || 'Professional Event Organizer'
        }</div>
      </div>
    </div>
    ${
      (event.tags || []).length
        ? `<div class="label mb-8">Tags</div><div class="tag-list">${event.tags
            .map(tag => `<span class="tag">${tag}</span>`)
            .join('')}</div>`
        : ''
    }
  `
  );
}
function viewEventReport(eventId) {
  const event = DB.events.find(currentEvent => currentEvent.id == eventId);
  if (!event) return;
  const regs = DB.registrations.filter(registration => registration.eventId == eventId);
  const checkedIn = regs.filter(registration => registration.checkedIn).length;
  const totalRevenue = regs.reduce((sum, registration) => sum + registration.amount, 0);
  const avgRating = 4.5;
  const reportThumb = event.image
    ? `
        <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex-shrink:0;background:${
          event.color || 'var(--accent)'
        }20;position:relative">
          <img src="${event.image}" alt="${
        event.title || 'Event'
      }" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=\'font-size:48px\'>${
        event.emoji || '📅'
      }</div>'">
        </div>
      `
    : `<div style="font-size:48px">${event.emoji || '📅'}</div>`;
  openModal(
    `Event Report - ${event.title}`,
    `
    <div style="background:linear-gradient(135deg,${event.color}20,${
      event.color
    }05);border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid ${event.color}30">
      <div style="display:flex;gap:14px;align-items:center">
        ${reportThumb}
        <div style="flex:1">
          <div style="font-weight:700;font-size:18px;margin-bottom:4px">${event.title}</div>
          <div style="font-size:13px;color:var(--text2)">📅 ${event.date} · 📍 ${event.venue}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:6px">${
            event.category
          } • Status: Completed</div>
        </div>
      </div>
    </div>
    
    <div class="grid-2" style="gap:12px;margin-bottom:20px">
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--green)">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">TOTAL REGISTRATIONS</div>
        <div style="font-size:24px;font-weight:800;color:var(--green)">${regs.length}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px">Attendees registered</div>
      </div>
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--blue)">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">CHECK-INS</div>
        <div style="font-size:24px;font-weight:800;color:var(--blue)">${checkedIn}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px">${Math.round(
          (checkedIn / regs.length) * 100
        )}% attendance rate</div>
      </div>
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--green)">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">TOTAL REVENUE</div>
        <div style="font-size:24px;font-weight:800;color:var(--green)">₹${totalRevenue.toLocaleString()}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px">From ticket sales</div>
      </div>
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--yellow)">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">RATING</div>
        <div style="font-size:24px;font-weight:800;color:var(--yellow)">⭐ ${avgRating}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px">Based on attendee reviews</div>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Event Details Summary</div>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">
          <span>Event Capacity:</span>
          <span style="font-weight:600">${event.capacity} attendees</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">
          <span>Occupancy:</span>
          <span style="font-weight:600;color:var(--green)">${Math.round(
            (regs.length / event.capacity) * 100
          )}%</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">
          <span>Ticket Price:</span>
          <span style="font-weight:600">₹${event.price}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">
          <span>Duration:</span>
          <span style="font-weight:600">${event.time} onwards</span>
        </div>
      </div>
    </div>
    
    <div style="background:var(--surface3);padding:12px;border-radius:8px;border-left:2px solid var(--accent)">
      <div style="font-size:12px;color:var(--text2);line-height:1.6">
        <strong>Report Generated:</strong> ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} at ${new Date().toLocaleTimeString()}<br>
        <strong>Event Status:</strong> Successfully Completed ✓<br>
        <strong>Next Step:</strong> Share this report with stakeholders or export as PDF
      </div>
    </div>
  `,
    [
      {
        lbl: '📥 Export PDF',
        cls: 'btn-ghost',
        fn: 'toast("PDF export feature coming soon","info")',
      },
      {
        lbl: '📧 Email Report',
        cls: 'btn-ghost',
        fn: 'toast("Report will be emailed to organizer","success")',
      },
      {
        lbl: 'Close',
        cls: 'btn-primary',
        fn: 'closeModal()',
      },
    ]
  );
}

// ════════════════════════════════════════════════
//  BROWSE EVENTS (Attendee)
// ════════════════════════════════════════════════
function pageBrowseEvents() {
  const avail = DB.events.filter(event => event.status !== 'completed');
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Browse Events</div><div class="page-sub">Discover and register for upcoming events.</div></div>
  </div>
  <div class="filter-row">
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="be-q" placeholder="Search events…" oninput="refreshBrowse()"></div>
    <select class="form-control filter-select" id="be-cat" onchange="refreshBrowse()">
      <option value="">All Categories</option><option>Conference</option><option>Corporate</option><option>Concert</option><option>Workshop</option><option>Networking</option>
    </select>
    <select class="form-control filter-select" id="be-price" onchange="refreshBrowse()">
      <option value="">Any Price</option><option value="free">Free Only</option><option value="paid">Paid Only</option>
    </select>
    <select class="form-control filter-select" id="be-city" onchange="refreshBrowse()">
      <option value="">Any City</option>
      ${[...new Set(DB.events.map(event => event.city).filter(Boolean))]
        .map(c => `<option>${c}</option>`)
        .join('')}
    </select>
  </div>
  <div class="events-grid" id="browse-grid">${avail
    .map(e => evCard(e, 'attendee'))
    .join('')}</div>`;
}
function refreshBrowse() {
  const q = (g('be-q') || {}).value?.toLowerCase() || '';
  const cat = (g('be-cat') || {}).value || '';
  const price = (g('be-price') || {}).value || '';
  const city = (g('be-city') || {}).value || '';
  const list = DB.events.filter(event => {
    if (event.status === 'completed') return false;
    return (
      (!q || event.title.toLowerCase().includes(q)) &&
      (!cat || event.category === cat) &&
      (!price ||
        (price === 'free' && event.price === 0) ||
        (price === 'paid' && event.price > 0)) &&
      (!city || event.city === city)
    );
  });
  globalThis.window?.EventFlowAdminPages?.clear(g('browse-grid'));
  g('browse-grid').innerHTML =
    list.map(e => evCard(e, 'attendee')).join('') ||
    `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events match</div><p class="empty-desc">Try adjusting your filters.</p></div>`;
}
function regForEvent(eventId) {
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(eventId));
  if (!event || event.status === 'full') {
    toast(event ? 'Sorry, this event is full' : 'Event not found', 'error');
    return;
  }
  const existing = DB.registrations.find(
    registration =>
      String(registration.attendeeId) === String(CU.id) &&
      String(registration.eventId) === String(eventId)
  );
  if (existing) {
    openViewTicketModal(existing.id);
    return;
  }
  const regThumb = event.image
    ? `
        <div style="width:48px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;background:${
          event.color || 'var(--accent)'
        }20;position:relative">
          <img src="${event.image}" alt="${
        event.title || 'Event'
      }" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\'font-size:32px\'>${
        event.emoji || '📅'
      }</span>'">
        </div>
      `
    : `<span style="font-size:32px">${event.emoji || '📅'}</span>`;

  // Show registration flow
  openModal(
    `Register — ${event.title}`,
    `
    <div style="background:${event.color}12;border:1px solid ${
      event.color
    }30;border-radius:var(--r-lg);padding:16px;margin-bottom:20px">
      <div class="flex items-center gap-12">
        ${regThumb}
        <div>
          <div style="font-weight:700;font-size:15px">${event.title}</div>
          <div class="small">📅 ${event.date} · ${event.time}</div>
          <div class="small">📍 ${event.venue}</div>
        </div>
      </div>
    </div>
    <div class="info-row" style="padding:8px 0"><span class="info-label">Attendee</span><span class="info-value">${
      CU.name
    }</span></div>
    <div class="info-row" style="padding:8px 0"><span class="info-label">Email</span><span class="info-value">${
      CU.email
    }</span></div>
    <div class="info-row" style="padding:8px 0 16px"><span class="info-label">Ticket Price</span><span class="info-value" style="color:var(--green);font-size:16px;font-weight:700">${
      event.price === 0 ? 'FREE' : '₹' + event.price
    }</span></div>
    ${
      event.price > 0
        ? `
    <div style="background:var(--surface3);border-radius:var(--r);padding:16px;border:1px solid var(--border)">
      <div class="h4 mb-12">💳 Payment Information</div>
      <div class="form-group"><label class="form-label">Cardholder Name</label><input class="form-control" id="pay-name" placeholder="Name on card" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Card Number *</label><input class="form-control" id="pay-card" placeholder="1234 5678 9012 3456" maxlength="19" oninput="fmtCard(this)"></div>
      <div class="grid-2">
        <div class="form-group"><label class="form-label">Expiry *</label><input class="form-control" id="pay-exp" placeholder="MM/YY" maxlength="5" oninput="fmtExp(this)"></div>
        <div class="form-group"><label class="form-label">CVV *</label><input class="form-control" id="pay-cvv" placeholder="123" maxlength="3" inputmode="numeric" pattern="[0-9]{3}" oninput="this.value=this.value.replace(/[^0-9]/g,'')" autocomplete="cc-csc"></div>
      </div>
    </div>`
        : `<div style="text-align:center;padding:12px;background:var(--green-dim);border-radius:var(--r);color:var(--green);font-weight:500;font-size:13.5px">✓ This is a free event — no payment required!</div>`
    }
  `,
    [
      {
        lbl: event.price === 0 ? 'Confirm Registration' : 'Pay & Register',
        cls: 'btn-success',
        fn: `confirmReg('${eventId}')`,
      },
    ]
  );
}
function fmtCard(element) {
  element.value = element.value
    .replace(/\D/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}
function fmtExp(element) {
  let v = element.value.replace(/\D/g, '');
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
  element.value = v;
}
function confirmReg(eventId) {
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(eventId));
  if (!event) return;
  if (event.price > 0) {
    const card = v('pay-card').replace(/\s/g, '');
    if (!card || card.length < 16) {
      toast('Enter a valid 16-digit card number', 'error');
      return;
    }
    const exp = v('pay-exp');
    if (!exp || exp.length < 5) {
      toast('Enter expiry date (MM/YY)', 'error');
      return;
    }
    const cvvVal = v('pay-cvv');
    if (!cvvVal || cvvVal.length < 3 || !/^[0-9]{3}$/.test(cvvVal)) {
      toast('CVV must be exactly 3 digits (numbers only)', 'error');
      return;
    }
  }

  // Call backend registration API
  const backendEventId = event.eventId || String(eventId);
  const attendeeId = CU.userId || CU.id;
  apiRegisterForEvent({
    attendeeId: String(attendeeId),
    eventId: backendEventId,
    ticketType: event.price === 0 ? 'free' : 'standard',
  })
    .then(function (regData) {
      // If paid event, also create payment
      if (event.price > 0) {
        apiMakePayment({
          registrationId: regData.registrationId,
          amount: event.price,
          paymentMethod: 'DEMO_PROVIDER',
          paymentDate: new Date().toISOString().split('T')[0],
        }).catch(function () {}); // payment fire-and-forget
      }
      // Update local DB
      const n = DB._nextId.regs++;
      const ticketId = regData.ticketId || `TKT-2026-${String(n).padStart(3, '0')}`;
      const seat =
        event.category === 'Conference'
          ? `A-${Math.floor(Math.random() * 200 + 1)
              .toString()
              .padStart(3, '0')}`
          : 'GA';
      DB.registrations.push({
        id: n,
        attendeeId: CU.id,
        eventId: event.id,
        date: today(),
        ticketId,
        status: 'confirmed',
        payment: event.price === 0 ? 'free' : 'paid',
        amount: event.price,
        checkedIn: false,
        seat,
        verificationId: regData.verificationId || ticketId,
      });
      event.registered = Math.min(event.registered + 1, event.capacity);
      if (event.registered >= event.capacity) event.status = 'full';
      saveDB();
      closeModal();
      toast('🎉 Registration confirmed! Check your tickets.', 'success');
      goNav('my-tickets');
    })
    .catch(function (error) {
      // Fallback: create locally if backend fails
      const n = DB._nextId.regs++;
      const ticketId = `TKT-2026-${String(n).padStart(3, '0')}`;
      const seat =
        event.category === 'Conference'
          ? `A-${Math.floor(Math.random() * 200 + 1)
              .toString()
              .padStart(3, '0')}`
          : 'GA';
      DB.registrations.push({
        id: n,
        attendeeId: CU.id,
        eventId: event.id,
        date: today(),
        ticketId,
        status: 'confirmed',
        payment: event.price === 0 ? 'free' : 'paid',
        amount: event.price,
        checkedIn: false,
        seat,
      });
      event.registered = Math.min(event.registered + 1, event.capacity);
      if (event.registered >= event.capacity) event.status = 'full';
      saveDB();
      closeModal();
      toast(
        error.message || '🎉 Registration confirmed (local)!',
        error.status === 409 ? 'warning' : 'success'
      );
      goNav('my-tickets');
    });
}
function cancelTicket(regId) {
  const registration = DB.registrations.find(eventRegistration => eventRegistration.id == regId);
  if (!registration) return;
  const event = DB.events.find(currentEvent => currentEvent.id === registration.eventId);
  confirm2(
    'Cancel Ticket',
    'Are you sure you want to cancel this ticket? You will receive a refund within 5-7 business days.',
    () => {
      if (event) event.registered = Math.max(0, event.registered - 1);
      const index = DB.registrations.indexOf(registration);
      if (index > -1) DB.registrations.splice(index, 1);
      saveDB();
      renderPage(_currentPage);
      toast('Ticket cancelled. Refund initiated.', 'success');
    }
  );
}

// ════════════════════════════════════════════════
//  MY TICKETS
// ════════════════════════════════════════════════
function pageMyTickets() {
  const regs = DB.registrations.filter(registration => registration.attendeeId === CU.id);
  if (!regs.length)
    return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">My Tickets</div></div></div><div class="empty"><div class="empty-icon">🎟️</div><div class="empty-title">No tickets yet</div><p class="empty-desc">Browse events and register to get your tickets here.</p><button class="btn btn-primary mt-16" onclick="goNav('browse-events')">Browse Events</button></div>`;
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">My Tickets</div><div class="page-sub">${
      regs.length
    } ticket(s)</div></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px">
    ${regs
      .map(registration => {
        const eventRegistration = DB.events.find(event => event.id === registration.eventId) || {
          title: 'Unknown',
          emoji: '🎟️',
          color: '#7c6ff7',
          venue: '',
          date: '',
          time: '',
        };
        return ticketCard(registration, eventRegistration);
      })
      .join('')}
  </div>`;
}
function ticketCard(r, e) {
  const qr = renderTicketQRCode(r.verificationId || r.ticketId);
  return `<div class="ticket">
    <div class="ticket-top">
      <div class="flex justify-between items-start">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:28px">${e.emoji}</span>
            <span class="badge badge-${evStatBadge(e.status)}">${e.status}</span>
          </div>
          <div style="font-family:var(--font-head);font-size:17px;font-weight:700;line-height:1.3;margin-bottom:8px">${
            e.title
          }</div>
          <div class="small" style="margin-bottom:2px">📅 ${e.date} · ${e.time}</div>
          <div class="small">📍 ${e.venue}</div>
        </div>
        <div class="qr-box ticket-qr" style="margin-left:16px">${qr}</div>
      </div>
    </div>
    <div class="ticket-divider"><div class="ticket-notch-l"></div><div class="ticket-notch-r"></div></div>
    <div class="ticket-bot">
      <div class="grid-2" style="gap:8px">
        <div><div class="label mb-4">Attendee</div><div style="font-weight:500;font-size:13.5px">${
          CU.name
        }</div></div>
        <div><div class="label mb-4">Ticket ID</div><div class="mono">${r.ticketId}</div></div>
        <div><div class="label mb-4">Seat / Zone</div><div style="font-weight:500;font-size:13.5px">${
          r.seat || 'GA'
        }</div></div>
        <div><div class="label mb-4">Amount</div><div style="font-weight:700;font-size:15px;color:var(--green)">${
          r.amount === 0 ? 'Free' : '₹' + r.amount
        }</div></div>
      </div>
      <div class="flex justify-between items-center mt-12">
        <span class="badge badge-${r.checkedIn ? 'green' : 'purple'}">${
    r.checkedIn ? '✅ Checked In' : '⏳ Not Yet Checked In'
  }</span>
        <span class="badge badge-green">✓ ${
          r.payment === 'free' ? 'Free Ticket' : 'Payment Confirmed'
        }</span>
      </div>
    </div>
  </div>`;
}
function makeQR() {
  const cells = Array.from(
    {
      length: 25,
    },
    () => Math.random() > 0.5
  );
  return cells.map(on => `<div class="qr-cell${on ? ' on' : ''}"></div>`).join('');
}
function openViewTicketModal(regId) {
  const r = DB.registrations.find(registration => registration.id == regId);
  if (!r) return;
  const e = DB.events.find(event => event.id === r.eventId) || {
    title: 'Event',
    emoji: '🎟️',
    venue: '',
    date: '',
    time: '',
  };
  openModal('Your Ticket', ticketCard(r, e), [], false);
}

// ════════════════════════════════════════════════
//  ATTENDEE MANAGEMENT
// ════════════════════════════════════════════════
function pageAttendees() {
  const myEvents = DB.events.filter(event => event.organizer === CU.id);
  const selectedEventId = parseInt(
    sessionStorage.getItem('org_attendees_event') || myEvents[0]?.id || ''
  );
  const selectedEvent = DB.events.find(event => event.id === selectedEventId);
  const isPrivateEvent =
    selectedEvent &&
    (selectedEvent.category === 'Wedding' || selectedEvent.tags?.includes('Private'));
  const regs =
    CU.role === 'organizer'
      ? DB.registrations.filter(registration =>
          selectedEventId
            ? registration.eventId === selectedEventId
            : selectedEvent && registration.eventId === selectedEvent.id
        )
      : CU.role === 'superuser'
      ? DB.registrations
      : DB.registrations.filter(registration => {
          const event = DB.events.find(currentEvent => currentEvent.id === registration.eventId);
          return event && event.organizer === CU.id;
        });
  const checkedIn = regs.filter(registration => registration.checkedIn).length;
  const approved = regs.filter(
    registration => registration.approved || registration.status === 'confirmed'
  ).length;
  if (CU.role === 'organizer' && myEvents.length > 0) {
    return `
    <div class="page-hd">
      <div class="page-hd-left"><div class="page-title">Attendee Management</div><div class="page-sub">${
        regs.length
      } total · ${approved} approved</div></div>
      <div class="page-hd-right">
      </div>
    </div>
    <div class="card mb-16" style="padding:16px">
      <label class="label mb-8">Select Event</label>
      <select class="form-control" onchange="switchOrganizerEvent(this.value)">
        ${myEvents
          .map(
            event =>
              `<option value="${event.id}" ${event.id === selectedEventId ? 'selected' : ''}>${
                event.title
              } (${event.registered} registered)</option>`
          )
          .join('')}
      </select>
      ${
        isPrivateEvent
          ? `<div class="badge badge-blue mt-8" style="display:inline-block">🔒 Private Event</div>`
          : ''
      } 
    </div>
    <div class="filter-row">
      <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="at-q" placeholder="Search attendees…" oninput="refreshAttendees()"></div>
      ${
        isPrivateEvent
          ? `<select class="form-control filter-select" id="at-status" onchange="refreshAttendees()">
        <option value="">All Status</option>
        <option value="approved">Approved</option>
        <option value="pending">Pending Review</option>
        <option value="rejected">Rejected</option>
      </select>`
          : ``
      }
    </div>
    <div id="attendees-tbl">${buildOrganizerAttendeesTbl(regs, selectedEvent, isPrivateEvent)}</div>
    `;
  }
  const checkedIn2 = regs.filter(registration => registration.checkedIn).length;
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Attendee Management</div><div class="page-sub">${
      regs.length
    } total · ${checkedIn2} checked in</div></div>
    <div class="page-hd-right">
      <button class="btn btn-ghost" onclick="toast('Exported to CSV','success')">📥 Export CSV</button>
    </div>
  </div>
  <div class="filter-row">
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="at-q" placeholder="Search attendees…" oninput="refreshAttendees()"></div>
    <select class="form-control filter-select" id="at-ev" onchange="refreshAttendees()">
      <option value="">All Events</option>
      ${DB.events.map(event => `<option value="${event.id}">${event.title}</option>`).join('')}
    </select>
    <select class="form-control filter-select" id="at-ci" onchange="refreshAttendees()">
      <option value="">All</option><option value="in">Checked In</option><option value="out">Not Checked In</option>
    </select>
  </div>
  <div id="attendees-tbl">${buildAttendeesTbl(regs)}</div>`;
}
function switchOrganizerEvent(eventId) {
  sessionStorage.setItem('org_attendees_event', eventId);
  renderPage('attendees');
}
function buildOrganizerAttendeesTbl(registrations, event, isPrivate) {
  const q = (g('at-q') || {}).value?.toLowerCase() || '';
  const status = (g('at-status') || {}).value || '';
  const filtered = registrations.filter(registration => {
    const eventRegistration = DB.users.find(
      user => String(user.id) === String(registration.attendeeId)
    ) || {
      name: '',
      email: '',
    };
    const matchesSearch =
      !q ||
      (eventRegistration.name + eventRegistration.email + registration.ticketId)
        .toLowerCase()
        .includes(q);
    const matchesStatus =
      !status ||
      (status === 'approved' && (registration.approved || registration.status === 'confirmed')) ||
      (status === 'pending' && !registration.approved && registration.status !== 'rejected') ||
      (status === 'rejected' && registration.status === 'rejected');
    return matchesSearch && matchesStatus;
  });
  if (!filtered.length)
    return `<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">No attendees found</div></div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Attendee</th><th>Email</th><th>Ticket ID</th><th>Amount</th><th>${
      isPrivate ? 'Approval Status' : 'Arrival'
    }</th><th>Actions</th></tr></thead>
    <tbody>${filtered
      .map(r => {
        const u = DB.users.find(user => String(user.id) === String(r.attendeeId)) || {
          name: 'Unknown',
          email: '',
          avatar: '?',
          phone: '',
        };
        const status = r.approved ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending';
        return `<tr>
        <td><div class="flex items-center gap-8"><div class="av av-xs">${
          u.avatar || u.name[0]
        }</div><div><div style="font-weight:500">${u.name}</div><div class="small">${
          u.phone || '—'
        }</div></div></div></td>
        <td class="small">${u.email}</td>
        <td><code class="mono" style="background:var(--surface3);padding:2px 6px;border-radius:5px">${
          r.ticketId
        }</code></td>
        <td style="color:var(--green);font-weight:600">${
          r.amount === 0 ? 'Free' : '₹' + r.amount
        }</td>
        <td><span class="badge badge-${
          status === 'Approved' ? 'green' : status === 'Rejected' ? 'red' : 'yellow'
        }">${status}</span></td>
        <td><div class="actions">
          ${
            status === 'Pending'
              ? `<button class="btn btn-success btn-xs" onclick="organiserApproveAttendee('${r.id}')">✓ Approve</button><button class="btn btn-danger btn-xs" onclick="organiserRejectAttendee('${r.id}')">✕ Reject</button>`
              : `<button class="btn btn-ghost btn-xs" onclick="viewAttendeeProfile('${u.id}','${u.name}','${u.email}','${u.phone}')">Profile</button>`
          }
        </div></td>
      </tr>`;
      })
      .join('')}</tbody>
  </table></div>`;
}
function organiserApproveAttendee(regId) {
  const r = DB.registrations.find(registration => String(registration.id) === String(regId));
  if (r) {
    r.approved = true;
    r.status = 'confirmed';
    saveDB();
    renderPage('attendees');
    toast('Attendee approved!', 'success');
  }
}
function organiserRejectAttendee(regId) {
  confirm2('Reject Attendee', 'Are you sure you want to reject and remove this attendee?', () => {
    const i = DB.registrations.findIndex(registration => String(registration.id) === String(regId));
    if (i > -1) {
      const ev = DB.events.find(event => String(event.id) === String(DB.registrations[i].eventId));
      if (ev && ev.registered > 0) {
        ev.registered--;
        if (ev.status === 'full') ev.status = 'upcoming';
      }
      DB.registrations.splice(i, 1);
      saveDB();
      renderPage('attendees');
      toast('Attendee rejected and removed', 'info');
    }
  });
}
function viewAttendeeProfile(userId, name, email, phone) {
  const u = DB.users.find(user => String(user.id) === String(userId)) || {};
  openDrawer(
    `${name} - Attendee Profile`,
    `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="av av-lg" style="width:80px;height:80px;font-size:32px">${
        u.avatar || name[0]
      }</div>
      <div>
        <div class="label">Name</div>
        <div style="font-weight:500">${name}</div>
      </div>
      <div>
        <div class="label">Email</div>
        <div class="small">${email}</div>
      </div>
      <div>
        <div class="label">Phone</div>
        <div class="small">${phone || '—'}</div>
      </div>
      ${
        u.bio
          ? `<div>
        <div class="label">Bio</div>
        <p class="small" style="color:var(--text2)">${u.bio}</p>
      </div>`
          : ''
      }
    </div>
  `
  );
}
function buildAttendeesTbl(registrations) {
  if (!registrations.length)
    return `<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">No registrations found</div></div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Attendee</th><th>Event</th><th>Ticket ID</th><th>Seat</th><th>Amount</th><th>Check-In</th><th>Actions</th></tr></thead>
    <tbody>${registrations
      .map(registration => {
        const eventRegistration = DB.users.find(user => user.id === registration.attendeeId) || {
          name: 'Unknown',
          email: '',
          avatar: '?',
        };
        const e = DB.events.find(event => event.id === registration.eventId) || {
          title: '—',
        };
        return `<tr>
        <td><div class="flex items-center gap-8"><div class="av av-xs">${
          eventRegistration.avatar || eventRegistration.name[0]
        }</div><div><div style="font-weight:500">${
          eventRegistration.name
        }</div><div class="small">${eventRegistration.email}</div></div></div></td>
        <td class="truncate" style="max-width:160px;font-size:13px">${e.title}</td>
        <td><code class="mono" style="background:var(--surface3);padding:2px 6px;border-radius:5px">${
          registration.ticketId
        }</code></td>
        <td class="muted">${registration.seat || 'GA'}</td>
        <td style="color:var(--green);font-weight:600">${
          registration.amount === 0 ? 'Free' : '₹' + registration.amount
        }</td>
        <td><span class="badge badge-${registration.checkedIn ? 'green' : 'gray'}">${
          registration.checkedIn ? '✓ In' : 'Pending'
        }</span></td>
        <td><div class="actions">
          ${
            !registration.checkedIn
              ? `<button class="btn btn-success btn-xs" onclick="scanQR(${registration.id},'${registration.ticketId}')">📱 Scan QR</button>`
              : '<span class="small" style="color:var(--text3)">Verified</span>'
          }
          <button class="btn btn-xs btn-danger" onclick="cancelReg('${
            registration.id
          }')">🗑️</button>
        </div></td>
      </tr>`;
      })
      .join('')}</tbody>
  </table></div>`;
}
function refreshAttendees() {
  if (CU.role === 'organizer') {
    const q = (g('at-q') || {}).value?.toLowerCase() || '';
    const status = (g('at-status') || {}).value || '';
    const selectedEventId = parseInt(sessionStorage.getItem('org_attendees_event') || '');
    const selectedEvent = DB.events.find(event => event.id === selectedEventId);
    const isPrivate =
      selectedEvent &&
      (selectedEvent.category === 'Wedding' || selectedEvent.tags?.includes('Private'));
    let regs = DB.registrations.filter(registration =>
      selectedEventId
        ? registration.eventId === selectedEventId
        : selectedEvent && registration.eventId === selectedEvent.id
    );
    regs = regs.filter(registration => {
      const eventRegistration = DB.users.find(user => user.id === registration.attendeeId) || {
        name: '',
        email: '',
      };
      const matchesSearch =
        !q ||
        (eventRegistration.name + eventRegistration.email + registration.ticketId)
          .toLowerCase()
          .includes(q);
      const matchesStatus =
        !status ||
        (status === 'approved' && (registration.approved || registration.status === 'confirmed')) ||
        (status === 'pending' && !registration.approved && registration.status !== 'rejected') ||
        (status === 'rejected' && registration.status === 'rejected');
      return matchesSearch && matchesStatus;
    });
    globalThis.window?.EventFlowAdminPages?.clear(g('attendees-tbl'));
    g('attendees-tbl').innerHTML = buildOrganizerAttendeesTbl(regs, selectedEvent, isPrivate);
  } else {
    const q = (g('at-q') || {}).value?.toLowerCase() || '';
    const evId = parseInt((g('at-ev') || {}).value) || 0;
    const ci = (g('at-ci') || {}).value || '';
    const regs = (
      CU.role === 'superuser'
        ? DB.registrations
        : DB.registrations.filter(registration => {
            const event = DB.events.find(currentEvent => currentEvent.id === registration.eventId);
            return event && event.organizer === CU.id;
          })
    ).filter(r => {
      const u = DB.users.find(user => user.id === r.attendeeId) || {
        name: '',
        email: '',
      };
      return (
        (!q || (u.name + u.email + r.ticketId).toLowerCase().includes(q)) &&
        (!evId || r.eventId === evId) &&
        (!ci || (ci === 'in' && r.checkedIn) || (ci === 'out' && !r.checkedIn))
      );
    });
    globalThis.window?.EventFlowAdminPages?.clear(g('attendees-tbl'));
    g('attendees-tbl').innerHTML = buildAttendeesTbl(regs);
  }
}
function scanQR(regId, ticketId) {
  const r = DB.registrations.find(registration => registration.id == regId);
  if (r) {
    r.checkedIn = true;
    saveDB();
    openModal(
      'QR Code Verified',
      `
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:16px">✅</div>
        <div style="font-weight:700;font-size:18px;margin-bottom:8px">Check-in Successful</div>
        <div style="color:var(--text2);margin-bottom:20px">Ticket: <code class="mono" style="background:var(--surface3);padding:4px 8px;border-radius:5px">${ticketId}</code></div>
        <div style="background:var(--green-dim);border-radius:8px;padding:12px;color:var(--green);font-weight:500">Attendee verified and checked in</div>
      </div>
    `,
      [
        {
          lbl: 'Close',
          cls: 'btn-primary',
          fn: 'closeModal()',
        },
      ]
    );
    refreshAttendees();
    toast('✅ Attendee verified via QR scan', 'success');
  }
}

// Quick verify: marks checkedIn + rerenders page (no modal, instant list move)
function quickVerify(regId) {
  const registration = DB.registrations.find(eventRegistration => eventRegistration.id == regId);
  if (!registration) {
    toast('Registration not found', 'error');
    return;
  }
  if (registration.checkedIn) {
    toast('Already verified!', 'warning');
    return;
  }
  registration.checkedIn = true;
  saveDB();
  renderPage('attendeeVerification');
  toast('✅ Attendee verified and moved to checked-in!', 'success');
}
function cancelReg(regId) {
  confirm2('Cancel Registration', 'Cancel this registration? This cannot be undone.', () => {
    const i = DB.registrations.findIndex(registration => registration.id == regId);
    if (i > -1) {
      const ev = DB.events.find(event => event.id === DB.registrations[i].eventId);
      if (ev && ev.registered > 0) {
        ev.registered--;
        if (ev.status === 'full') ev.status = 'upcoming';
      }
      DB.registrations.splice(i, 1);
      saveDB();
      refreshAttendees();
      toast('Registration cancelled', 'info');
    }
  });
}
function generateReport() {
  const regs =
    CU.role === 'superuser'
      ? DB.registrations
      : DB.registrations.filter(registration => {
          const event = DB.events.find(currentEvent => currentEvent.id === registration.eventId);
          return event && event.organizer === CU.id;
        });
  const checkedIn = regs.filter(registration => registration.checkedIn);
  const report = `
    <div style="background:var(--surface2);border-radius:12px;padding:20px;margin-bottom:16px">
      <div class="h4 mb-12">📊 Attendance Report</div>
      <div class="grid-2" style="gap:12px;margin-bottom:16px">
        <div><div class="label mb-4">Total Registrations</div><div style="font-size:24px;font-weight:800;color:var(--accent)">${
          regs.length
        }</div></div>
        <div><div class="label mb-4">Checked In</div><div style="font-size:24px;font-weight:800;color:var(--green)">${
          checkedIn.length
        }</div></div>
        <div><div class="label mb-4">No-Show</div><div style="font-size:24px;font-weight:800;color:var(--red)">${
          regs.length - checkedIn.length
        }</div></div>
        <div><div class="label mb-4">Attendance Rate</div><div style="font-size:24px;font-weight:800;color:var(--blue)">${Math.round(
          (checkedIn.length / Math.max(regs.length, 1)) * 100
        )}%</div></div>
      </div>
    </div>
    <div class="h4 mb-12">📋 Attendee List</div>
    <div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto">
      ${regs
        .map(registration => {
          const eventRegistration = DB.users.find(user => user.id === registration.attendeeId) || {
            name: 'Unknown',
            email: '',
          };
          return `<div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:8px;align-items:center">
          <div>
            <div style="font-weight:500;font-size:13px">${eventRegistration.name}</div>
            <div class="small" style="color:var(--text3)">${eventRegistration.email}</div>
          </div>
          <span class="badge badge-${registration.checkedIn ? 'green' : 'gray'}">${
            registration.checkedIn ? 'OK Present' : 'Absent'
          }</span>
        </div>`;
        })
        .join('')}
    </div>
  `;
  openDrawer('Attendance Report', report);
}

// ════════════════════════════════════════════════
// ════════════════════════════════════════════════

// ════════════════════════════════════════════════

// ════════════════════════════════════════════════

// ════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  EVENT REQUESTS
// ════════════════════════════════════════════════
function pageEventRequests() {
  return `
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">Event Requests</div><div class="page-sub">Review and manage client event requests.</div></div></div>
  <div class="table-wrap">
    <table><thead><tr><th>Client</th><th>Event</th><th>Type</th><th>Date</th><th>Guests</th><th>Budget</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${DB.eventRequests
      .map(request => {
        const cl = DB.users.find(user => String(user.id) === String(request.clientId)) ||
          DB.users.find(user => user.role === 'client') || {
            name: 'Michael Torres',
            avatar: 'MT',
            avatarImage: '/assets/images/avatars/user-michael-torres.jpg',
          };
        const clientAv = cl.avatarImage
          ? `
          <div class="av av-xs">
            <img src="${cl.avatarImage}" alt="${
              cl.name
            }" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
            <span style="display:none">${cl.avatar || cl.name?.[0] || 'C'}</span>
          </div>
        `
          : `<div class="av av-xs">${cl.avatar || cl.name?.[0] || 'C'}</div>`;
        return `<tr>
        <td><div class="flex items-center gap-8">${clientAv}<strong>${cl.name}</strong></div></td>
        <td><strong>${request.title}</strong></td><td>${request.type}</td><td>${
          request.date
        }</td><td>${request.guests}</td>
        <td style="color:var(--green);font-weight:600">₹${request.budget.toLocaleString()}</td>
        <td><span class="badge badge-${reqBadge(request.status)}">${request.status}</span></td>
        <td><div class="actions">
          <button class="btn btn-ghost btn-xs" onclick="viewRequestDrawer('${
            request.id
          }')">View</button>
          ${
            request.status === 'pending'
              ? `<button class="btn btn-success btn-xs" onclick="approveReq('${request.id}')">Accept</button><button class="btn btn-xs btn-danger" onclick="rejectReq('${request.id}')">Decline</button>`
              : ''
          }
        </div></td>
      </tr>`;
      })
      .join('')}
    </tbody></table>
  </div>`;
}
function viewRequestDrawer(id) {
  const r = DB.eventRequests.find(request => String(request.id) === String(id));
  if (!r) return;
  const org = DB.users.find(user => user.id === r.organizer) || {
    name: 'Pending Assignment',
  };
  openDrawer(
    `Request: ${r.title}`,
    `
    <span class="badge badge-${reqBadge(r.status)} mb-16">${r.status}</span>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px">
      <div class="info-row"><span class="info-label">Organizer</span><span class="info-value">${
        org.name
      }</span></div>
      <div class="info-row"><span class="info-label">Type</span><span class="info-value">${
        r.type
      }</span></div>
      <div class="info-row"><span class="info-label">Preferred Date</span><span class="info-value">${
        r.date
      }</span></div>
      <div class="info-row"><span class="info-label">Expected Guests</span><span class="info-value">${
        r.guests
      }</span></div>
      <div class="info-row"><span class="info-label">Budget</span><span class="info-value" style="color:var(--green);font-weight:700">₹${r.budget.toLocaleString()}</span></div>
      <div class="info-row"><span class="info-label">Preferred Venue</span><span class="info-value">${
        r.venue || '—'
      }</span></div>
      <div class="info-row"><span class="info-label">Submitted</span><span class="info-value">${
        r.created
      }</span></div>
    </div>
    <div class="label mb-8">Description</div>
    <p style="font-size:13.5px;color:var(--text2);line-height:1.7">${r.desc}</p>
    ${
      r.status === 'pending'
        ? `<div class="flex gap-8 mt-20"><button class="btn btn-success w-full" onclick="closeDrawer();approveReq(${r.id})">✓ Accept Event</button><button class="btn btn-danger w-full" onclick="closeDrawer();rejectReq(${r.id})">✕ Decline</button></div>`
        : ''
    }
  `
  );
}
function approveReq(id) {
  const r = DB.eventRequests.find(request => String(request.id) === String(id));
  if (r) {
    r.status = 'approved';
    r.organizer = CU.id;

    // Create new event from request
    const newEvent = {
      id: DB._nextId.events++,
      title: r.title,
      category: r.type,
      date: r.date,
      time: '10:00',
      endTime: '18:00',
      venue: r.venue || 'TBD',
      city: r.city || 'India',
      capacity: r.guests || 100,
      registered: 0,
      price: 0,
      status: 'ongoing',
      organizer: CU.id,
      clientId: r.clientId,
      description: r.desc,
      color: '#7c6ff7',
      emoji: r.type === 'Wedding' ? '💒' : r.type === 'Corporate' ? '🥂' : '📅',
      tags: [r.type],
    };
    DB.events.push(newEvent);
    saveDB();
    renderPage(_currentPage);
    toast('Event request accepted — event created!', 'success');
  }
}
function rejectReq(id) {
  confirm2('Decline Request', 'Mark this event request as declined?', () => {
    const r = DB.eventRequests.find(request => String(request.id) === String(id));
    if (r) {
      r.status = 'rejected';
      renderPage(_currentPage);
      toast('Request declined', 'info');
    }
  });
}

// ════════════════════════════════════════════════
//  UNIFIED REQUEST STATUS (CLIENT & ORGANIZER)
// ════════════════════════════════════════════════
function pageRequestStatus() {
  const isOrganizer = CU.role === 'organizer';
  if (isOrganizer) {
    const tab = sessionStorage.getItem('reqstat_tab') || 'pending';
    const myOrgId = CU.id;
    const pendingReqs = DB.eventRequests.filter(
      request => request.status === 'pending' || request.status === 'in_review'
    );
    const myEvents = DB.events.filter(
      event =>
        event.organizer === myOrgId &&
        (event.status === 'upcoming' || event.status === 'ongoing' || event.status === 'confirmed')
    );
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
    const reqs = DB.eventRequests.filter(request => String(request.clientId) === String(CU.id));
    return `
    <div class="page-hd">
      <div class="page-hd-left"><div class="page-title">Request Status</div><div class="page-sub">${
        reqs.length
      } event requests</div></div>
      <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('find-organizers')">+ New Request</button></div>
    </div>
    ${
      reqs.length === 0
        ? `<div class="empty"><div class="empty-icon">&#128203;</div><div class="empty-title">No requests yet</div><p class="empty-desc">Browse organizers and send them an event request to get started.</p></div>`
        : `
    <div style="display:flex;flex-direction:column;gap:14px">${reqs
      .map(
        request => `<div class="card">
      <div class="flex justify-between items-start">
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;margin-bottom:5px">${request.title}</div>
          <div class="small mb-8">${request.type} &middot; ${request.guests} guests &middot; ${
          request.date
        }</div>
          <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px">${
            request.desc
          }</p>
          <span class="badge badge-${reqBadge(request.status)}">${
          request.status === 'approved' ? 'Accepted' : request.status
        }</span>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:20px">
          <div style="font-size:22px;font-weight:800;color:var(--green)">&#8377;${request.budget.toLocaleString()}</div>
          <div class="small">Budget</div>
        </div>
      </div>
      <div class="flex gap-8 mt-14">
        <button class="btn btn-ghost btn-sm" onclick="viewRequestDrawer('${
          request.id
        }')">View Details</button>
        ${
          request.status === 'pending'
            ? `<button class="btn btn-danger btn-sm" onclick="cancelReq('${request.id}')">Cancel</button>`
            : ''
        }
      </div>
    </div>`
      )
      .join('')}</div>`
    }`;
  }
}
function switchReqStatTab(tab) {
  sessionStorage.setItem('reqstat_tab', tab);
  renderPage('request-status');
}
function viewRequestDetail(reqId) {
  const r = DB.eventRequests.find(request => String(request.id) === String(reqId));
  if (!r) return;
  const cl = DB.users.find(user => String(user.id) === String(r.clientId)) ||
    DB.users.find(user => user.role === 'client') || {
      name: 'Michael Torres',
      email: 'client@example.com',
      phone: '+91 9876543203',
    };
  const element = document.getElementById('page-content');
  if (!element) return;
  globalThis.window?.EventFlowAdminPages?.clear(element);
  element.innerHTML = `<div style="padding:28px;background:var(--bg);min-height:100vh">
    <button onclick="renderPage('request-status')" style="display:inline-flex;align-items:center;gap:6px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:24px;padding:0">&larr; Back to Pending Requests</button>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div style="font-size:22px;font-weight:700;color:var(--text)">${r.title}</div>
      <span style="background:#FEF9C3;color:#92400E;font-size:12px;font-weight:600;padding:3px 12px;border-radius:6px">Pending Review</span>
    </div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:28px">Review the details below and accept or decline this request.</div>
    <div style="display:flex;flex-direction:column;gap:20px;max-width:720px">

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
        <div style="font-weight:700;font-size:15px;margin-bottom:18px">&#128100; Client Information</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CLIENT NAME</div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">${cl.name}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CONTACT</div>
            <div style="font-size:13px;color:var(--text2)">${cl.email || 'â€”'}</div>
            <div style="font-size:13px;color:var(--text2)">${cl.phone || ''}</div>
          </div>
        </div>
      </div>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
        <div style="font-weight:700;font-size:15px;margin-bottom:18px">&#128197; Event Details</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">DATE</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">${r.date}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">EVENT TYPE</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">${
              r.type || 'Corporate Event'
            }</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">VENUE</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">${
              r.venue || 'To be decided'
            }</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">EXPECTED ATTENDEES</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">${r.guests}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CITY</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">${r.city || 'â€”'}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">BUDGET</div>
            <div style="font-size:14px;font-weight:600;color:var(--green)">&#8377;${
              r.budget ? r.budget.toLocaleString() : 'â€”'
            }</div>
          </div>
        </div>
      </div>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
        <div style="font-weight:700;font-size:15px;margin-bottom:6px">&#128203; Event Requirements</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">Services and setup requested by the client</div>
        <div style="background:var(--surface2);border-radius:10px;padding:16px;font-size:13px;color:var(--text);line-height:1.7">${
          r.desc || 'Standard event requirements. No special requests.'
        }</div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:8px">
        <button class="btn btn-danger" onclick="rejectReq('${
          r.id
        }');renderPage('request-status')" style="border-radius:8px;padding:10px 24px">&#x2715; Decline</button>
        <button class="btn btn-success" onclick="approveReq('${
          r.id
        }');renderPage('request-status')" style="border-radius:8px;padding:10px 24px;background:var(--green);border-color:var(--green)">&#x2713; Accept Event</button>
      </div>
    </div>
  </div>`;
}
function viewOngoingEventDetail(eventId) {
  if (window.EventFlowAccountPolicy.isSupportExecutiveAccount(CU))
    return openViewEventDrawer(eventId);
  const event = DB.events.find(currentEvent => String(currentEvent.id) === String(eventId));
  if (!event) return;
  const attendees = DB.registrations.filter(
    registration => String(registration.eventId) === String(eventId)
  );
  const element = document.getElementById('page-content');
  if (!element) return;
  globalThis.window?.EventFlowAdminPages?.clear(element);
  element.innerHTML = `<div style="padding:28px;background:var(--bg)">
    <button onclick="renderPage('request-status')" style="display:flex;align-items:center;gap:6px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:20px;padding:0">â† Back to Ongoing Events</button>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div style="font-size:22px;font-weight:700;color:var(--text)">${event.title}</div>
      <span style="background:rgba(34,197,94,0.15);color:var(--green);font-size:12px;font-weight:600;padding:3px 10px;border-radius:6px">Confirmed</span>
    </div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:28px">${
      event.description || 'Active event under management.'
    }</div>
    <div style="display:grid;grid-template-columns:1fr 320px;gap:24px">
      <div style="display:flex;flex-direction:column;gap:20px">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
          <div style="font-weight:700;font-size:15px;margin-bottom:18px">ðŸ“… Event Details</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">DATE</div><div style="font-size:14px;font-weight:500">${
              event.date
            }</div></div>
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">TYPE</div><div style="font-size:14px;font-weight:500">${
              event.type || event.category || 'Event'
            }</div></div>
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">VENUE</div><div style="font-size:14px;font-weight:500">${
              event.venue || 'TBD'
            }</div></div>
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">ATTENDEES</div><div style="font-size:14px;font-weight:500">${
              attendees.length
            }</div></div>
          </div>
        </div>

      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px">
          <div style="font-weight:700;font-size:14px;margin-bottom:16px">Timeline &amp; Milestones</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${[
              {
                label: 'Event Accepted',
                sub: 'Event approved',
                done: true,
              },
              {
                label: 'Approved by Client',
                sub: 'Event plan approved',
                done: true,
              },
              {
                label: 'Event Day',
                sub: event.date,
                done: false,
              },
            ]
              .map(
                m => `
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${
                m.done ? 'var(--green)' : 'var(--border)'
              };background:${
                  m.done ? 'rgba(34,197,94,0.1)' : 'transparent'
                };display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
                ${
                  m.done
                    ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>'
                    : ''
                }
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text)">${m.label}</div>
                <div style="font-size:11px;color:var(--text3)">${m.sub}</div>
              </div>
            </div>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function openNewRequestForm() {
  openDrawer(
    'New Event Request',
    `
    <div class="form-group"><label class="form-label">Event Title *</label><input class="form-control" id="nr-title" placeholder="e.g. Annual Client Dinner"></div>
    <div class="grid-2"><div class="form-group"><label class="form-label">Event Type *</label><select class="form-control" id="nr-type"><option>Corporate</option><option>Conference</option><option>Wedding</option><option>Concert</option><option>Workshop</option><option>Other</option></select></div><div class="form-group"><label class="form-label">Preferred Date *</label><input class="form-control" id="nr-date" type="date"></div></div>
    <div class="grid-2"><div class="form-group"><label class="form-label">Expected Guests *</label><input class="form-control" id="nr-guests" type="number" placeholder="100"></div><div class="form-group"><label class="form-label">Budget (₹) *</label><input class="form-control" id="nr-budget" type="number" placeholder="10000"></div></div>
    <div class="form-group"><label class="form-label">Preferred Venue (optional)</label><input class="form-control" id="nr-venue" placeholder="Grand Ballroom, Downtown"></div>
    <div class="form-group"><label class="form-label">Description & Requirements *</label><textarea class="form-control" id="nr-desc" style="min-height:100px" placeholder="Describe the event, theme, requirements…"></textarea></div>
    <div class="flex gap-8 mt-20"><button class="btn btn-success w-full" onclick="submitRequest()">Submit Request</button><button class="btn btn-ghost w-full" onclick="closeDrawer()">Cancel</button></div>
  `
  );
}
function cancelReq(id) {
  confirm2('Cancel Request', 'Are you sure you want to cancel this event request?', () => {
    const i = DB.eventRequests.findIndex(request => String(request.id) === String(id));
    if (i > -1) {
      DB.eventRequests.splice(i, 1);
      renderPage('request-status');
      toast('Request cancelled', 'info');
    }
  });
}
function submitRequest() {
  const title = v('nr-title');
  const date = v('nr-date');
  const guests = v('nr-guests');
  const budget = v('nr-budget');
  const desc = v('nr-desc');
  if (!title) {
    toast('Event title is required', 'error');
    return;
  }
  if (!date) {
    toast('Preferred date is required', 'error');
    return;
  }
  if (!guests || parseInt(guests) < 1) {
    toast('Enter expected number of guests', 'error');
    return;
  }
  if (!budget || parseInt(budget) < 1) {
    toast('Enter your budget', 'error');
    return;
  }
  if (!desc || desc.length < 10) {
    toast('Please provide a detailed description', 'error');
    return;
  }
  DB.eventRequests.push({
    id: DB._nextId.reqs++,
    clientId: CU.id,
    title,
    type: v('nr-type'),
    date,
    guests: parseInt(guests),
    budget: parseInt(budget),
    status: 'pending',
    desc,
    created: today(),
    venue: v('nr-venue'),
  });
  toast('Event request submitted!', 'success');
  closeDrawer();
  renderPage('request-status');
}
function submitPlan(id) {
  const r = DB.eventRequests.find(request => String(request.id) === String(id));
  if (r) {
    r.status = 'in_review';
    r.organizer = CU.id;
    renderPage('request-status');
    toast('Plan submitted to client for review!', 'success');
  }
}

// ════════════════════════════════════════════════
//  REPORTS
// ════════════════════════════════════════════════
function operationalReportBadge(status) {
  return (
    {
      Draft: 'yellow',
      Submitted: 'purple',
      Reviewed: 'green',
    }[status] || 'gray'
  );
}
function pageOperationalReports() {
  const reports = DB.operationalReports || [];
  return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Reports</div><div class="page-sub">Submit support, finance, and combined operational reports to Super Admin.</div></div><div class="page-hd-right"><button class="btn btn-primary" onclick="openSubmitOperationalReportModal()">📤 Submit Report</button></div></div><div class="grid-3 mb-20">${[
    'Support Report',
    'Finance Report',
    'Combined Operational Report',
  ]
    .map(
      type =>
        `<div class="stat-card"><div class="stat-icon">${
          type === 'Support Report' ? '📩' : type === 'Finance Report' ? '💳' : '📊'
        }</div><div class="stat-value">${
          reports.filter(item => item.type === type).length
        }</div><div class="stat-label">${type}s</div></div>`
    )
    .join(
      ''
    )}</div><div class="card"><div class="h4 mb-12">Operational Reports</div><div class="table-wrap"><table><thead><tr><th>Report</th><th>Type</th><th>Owner</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>${reports
    .map(
      item =>
        `<tr><td><strong>${item.title}</strong></td><td>${item.type}</td><td>${
          item.owner
        }</td><td><span class="badge badge-${operationalReportBadge(item.status)}">${
          item.status
        }</span></td><td>${item.updated}</td><td>${
          item.status === 'Draft'
            ? `<button class="btn btn-primary btn-xs" onclick="submitOperationalReport('${item.id}')">Submit</button>`
            : '<span class="small">Tracked</span>'
        }</td></tr>`
    )
    .join('')}</tbody></table></div></div>`;
}
function openOperationalReportModal() {
  openModal(
    'Prepare Operational Report',
    `<div class="form-group"><label class="form-label">Report Type</label><select class="form-control" id="op-report-type"><option>Support Report</option><option>Finance Report</option><option>Combined Operational Report</option></select></div><div class="form-group"><label class="form-label">Report Title</label><input class="form-control" id="op-report-title" placeholder="e.g. September support review"></div>`,
    [
      {
        lbl: 'Save Draft',
        cls: 'btn-primary',
        fn: 'saveOperationalReport()',
      },
    ]
  );
}
function saveOperationalReport() {
  const title = v('op-report-title');
  if (!title) {
    toast('Enter a report title', 'error');
    return;
  }
  DB.operationalReports.push({
    id: `OPR-${Date.now()}`,
    type: v('op-report-type'),
    title,
    owner: CU.name,
    status: 'Draft',
    updated: 'Just now',
  });
  saveDB();
  closeModal();
  renderPage('reports');
  toast('Report saved as draft', 'success');
}
function openSubmitOperationalReportModal() {
  openModal(
    'Submit Operational Report',
    `<div class="form-group"><label class="form-label">Report Type</label><select class="form-control" id="op-submit-type"><option>Support Report</option><option>Finance Report</option><option>Combined Operational Report</option></select></div><div class="form-group"><label class="form-label">Report Title</label><input class="form-control" id="op-submit-title" placeholder="e.g. September support review"></div>`,
    [
      {
        lbl: 'Submit Report',
        cls: 'btn-primary',
        fn: 'submitNewOperationalReport()',
      },
    ]
  );
}
function submitNewOperationalReport() {
  const title = v('op-submit-title');
  if (!title) {
    toast('Enter a report title', 'error');
    return;
  }
  DB.operationalReports.push({
    id: `OPR-${Date.now()}`,
    type: v('op-submit-type'),
    title,
    owner: CU.name,
    status: 'Submitted',
    updated: 'Just now',
  });
  saveDB();
  closeModal();
  renderPage('reports');
  toast('Report submitted to Super Admin', 'success');
}
function submitOperationalReport(id) {
  const report = DB.operationalReports.find(item => item.id === id);
  if (!report) return;
  report.status = 'Submitted';
  report.updated = 'Just now';
  saveDB();
  renderPage('reports');
  toast('Report submitted to Super Admin', 'success');
}
function eventOpsReportBadge(status) {
  if (status === 'Submitted') return 'purple';
  if (status === 'Pending Review' || status === 'Pending') return 'orange';
  if (status === 'Reviewed') return 'green';
  if (status === 'Draft') return 'yellow';
  return 'gray';
}
function pageEventOpsReports() {
  const reports = DB.eventOpsReports || [];
  const searchQuery = (sessionStorage.getItem('eor_search') || '').toLowerCase();
  const typeFilter = sessionStorage.getItem('eor_type') || '';
  const statusFilter = sessionStorage.getItem('eor_status') || '';
  const perfCount = reports.filter(report => report.type === 'Event Performance Report').length;
  const opsCount = reports.filter(report => report.type === 'Event Operations Report').length;
  const actCount = reports.filter(report => report.type === 'Event Activity Report').length;
  const submittedCount = reports.filter(report => report.status === 'Submitted').length;
  const pendingReviewCount = reports.filter(
    report => report.status === 'Pending Review' || report.status === 'Pending'
  ).length;
  const reviewedCount = reports.filter(report => report.status === 'Reviewed').length;
  const filtered = reports.filter(report => {
    const titleStr = (report.title || '').toLowerCase();
    const idStr = (report.id || '').toLowerCase();
    const scopeStr = (report.scope || '').toLowerCase();
    const matchesQuery =
      !searchQuery ||
      titleStr.includes(searchQuery) ||
      idStr.includes(searchQuery) ||
      scopeStr.includes(searchQuery);
    const matchesType = !typeFilter || report.type === typeFilter;
    const matchesStatus =
      !statusFilter ||
      report.status === statusFilter ||
      (statusFilter === 'Pending Review' && report.status === 'Pending');
    return matchesQuery && matchesType && matchesStatus;
  });
  return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Event Operations Reports</div>
            <div class="page-sub">Submit, view, and track operational performance, logistics, and activity reports for Super Admin review.</div>
          </div>
          <div class="page-hd-right">
            <button class="btn btn-primary" onclick="openCreateEventOpsReportModal()">📤 Submit Report</button>
          </div>
        </div>

        <div class="grid-3 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>
            <div class="stat-value" style="color:var(--accent)">${perfCount}</div>
            <div class="stat-label">Performance Reports</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">⚙️</div>
            <div class="stat-value" style="color:var(--purple)">${opsCount}</div>
            <div class="stat-label">Operations Reports</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📄</div>
            <div class="stat-value" style="color:var(--blue)">${actCount}</div>
            <div class="stat-label">Activity Reports</div>
          </div>
        </div>

        <div class="grid-3 mb-20">
          <div class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;background:var(--surface2)">
            <div>
              <div class="small muted" style="font-weight:600">Submitted Reports</div>
              <div style="font-size:20px;font-weight:800;color:var(--purple);margin-top:2px">${submittedCount}</div>
            </div>
            <span class="badge badge-purple">Submitted</span>
          </div>
          <div class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;background:var(--surface2)">
            <div>
              <div class="small muted" style="font-weight:600">Pending Review</div>
              <div style="font-size:20px;font-weight:800;color:var(--orange);margin-top:2px">${pendingReviewCount}</div>
            </div>
            <span class="badge badge-orange">In Review</span>
          </div>
          <div class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;background:var(--surface2)">
            <div>
              <div class="small muted" style="font-weight:600">Reviewed Reports</div>
              <div style="font-size:20px;font-weight:800;color:var(--green);margin-top:2px">${reviewedCount}</div>
            </div>
            <span class="badge badge-green">Approved</span>
          </div>
        </div>

        <div class="card">
          <div class="filter-row mb-16" style="display:flex;gap:12px;flex-wrap:wrap">
            <div class="search-box input-group" style="flex:1;min-width:240px">
              <span class="input-icon">🔍</span>
              <input class="form-control" id="eor-search" placeholder="Search reports by title, scope, or ID..." value="${
                sessionStorage.getItem('eor_search') || ''
              }" oninput="refreshEorPage()">
            </div>
            <select class="form-control filter-select" id="eor-type-filter" onchange="refreshEorPage()" style="width:220px">
              <option value="">All Report Types</option>
              <option value="Event Performance Report" ${
                typeFilter === 'Event Performance Report' ? 'selected' : ''
              }>Event Performance Report</option>
              <option value="Event Operations Report" ${
                typeFilter === 'Event Operations Report' ? 'selected' : ''
              }>Event Operations Report</option>
              <option value="Event Activity Report" ${
                typeFilter === 'Event Activity Report' ? 'selected' : ''
              }>Event Activity Report</option>
            </select>
            <select class="form-control filter-select" id="eor-status-filter" onchange="refreshEorPage()" style="width:170px">
              <option value="">All Statuses</option>
              <option value="Draft" ${statusFilter === 'Draft' ? 'selected' : ''}>Draft</option>
              <option value="Submitted" ${
                statusFilter === 'Submitted' ? 'selected' : ''
              }>Submitted</option>
              <option value="Pending Review" ${
                statusFilter === 'Pending Review' ? 'selected' : ''
              }>Pending Review</option>
              <option value="Reviewed" ${
                statusFilter === 'Reviewed' ? 'selected' : ''
              }>Reviewed</option>
            </select>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Report Type</th>
                  <th>Event / Scope</th>
                  <th>Attached File</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered.length
                    ? filtered
                        .map(
                          r => `
                  <tr>
                    <td>
                      <div style="font-weight:700;color:var(--text);font-size:13.5px">${
                        r.title
                      }</div>
                      <div class="small muted">ID: ${r.id} · Submitted By: ${
                            r.owner || 'Elena Rostova'
                          }</div>
                    </td>
                    <td>
                      <span class="badge badge-${
                        r.type === 'Event Performance Report'
                          ? 'purple'
                          : r.type === 'Event Operations Report'
                          ? 'blue'
                          : 'orange'
                      }">${r.type}</span>
                    </td>
                    <td class="small" style="font-weight:600;color:var(--text2)">${
                      r.scope || '—'
                    }</td>
                    <td>
                      ${
                        r.fileName
                          ? `<span style="font-weight:600;color:var(--accent);font-size:12.5px">📄 ${r.fileName}</span>`
                          : `<span class="small muted">No file attached</span>`
                      }
                    </td>
                    <td>
                      <span class="badge badge-${eventOpsReportBadge(r.status)}">${r.status}</span>
                    </td>
                    <td class="small muted">${r.updated}</td>
                    <td>
                      <div class="flex gap-6">
                        <button class="btn btn-ghost btn-xs" onclick="viewEventOpsReportModal('${
                          r.id
                        }')">View Details</button>
                        ${
                          r.status === 'Draft'
                            ? `<button class="btn btn-primary btn-xs" onclick="submitDraftEventOpsReport('${r.id}')">📤 Submit</button>`
                            : ''
                        }
                      </div>
                    </td>
                  </tr>
                `
                        )
                        .join('')
                    : '<tr><td colspan="7" class="text-center py-20 muted">No operational reports found matching your criteria.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
}
function refreshEorPage() {
  sessionStorage.setItem('eor_search', v('eor-search'));
  sessionStorage.setItem('eor_type', v('eor-type-filter'));
  sessionStorage.setItem('eor_status', v('eor-status-filter'));
  renderPage('reports');
}
function submitDraftEventOpsReport(reportId) {
  const r = (DB.eventOpsReports || []).find(item => item.id === reportId);
  if (!r) return;
  r.status = 'Submitted';
  r.updated = 'Just now';
  saveDB();
  renderPage('reports');
  toast('Report submitted to Super Admin for review!', 'success');
}
function viewEventOpsReportModal(reportId) {
  const r = (DB.eventOpsReports || []).find(item => item.id === reportId);
  if (!r) return;
  openModal(
    `Report: ${r.title}`,
    `
        <div class="info-row"><span class="info-label">Report ID</span><span class="info-value mono">${
          r.id
        }</span></div>
        <div class="info-row"><span class="info-label">Report Type</span><span class="info-value"><span class="badge badge-purple">${
          r.type
        }</span></span></div>
        <div class="info-row"><span class="info-label">Event / Scope</span><span class="info-value"><strong>${
          r.scope || '—'
        }</strong></span></div>
        <div class="info-row"><span class="info-label">Reporting Period</span><span class="info-value">${
          r.period || '—'
        }</span></div>
        <div class="info-row"><span class="info-label">Submitted By</span><span class="info-value">${
          r.owner || 'Elena Rostova'
        }</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-${eventOpsReportBadge(
          r.status
        )}">${r.status}</span></span></div>
        <div class="info-row"><span class="info-label">Last Updated</span><span class="info-value">${
          r.updated
        }</span></div>
        <div class="info-row"><span class="info-label">Attached File</span><span class="info-value" style="color:var(--accent);font-weight:700">${
          r.fileName ? '📄 ' + r.fileName : 'No file attached'
        }</span></div>
        <div class="mt-12" style="padding:12px;background:var(--surface2);border-radius:8px;font-size:12.5px;color:var(--text2)">
          ℹ️ <strong>Workflow:</strong> Submitted reports are routed to Super Admin for review and operational audit.
        </div>
      `,
    r.status === 'Draft'
      ? [
          {
            lbl: '📤 Submit to Super Admin',
            cls: 'btn-primary',
            fn: `closeModal();submitDraftEventOpsReport('${r.id}')`,
          },
        ]
      : []
  );
}
window.handleReportFileSelect = function (input) {
  const preview = document.getElementById('eor-file-preview');
  if (input.files && input.files[0]) {
    const f = input.files[0];
    if (preview) {
      globalThis.window?.EventFlowAdminPages?.clear(preview);
      preview.innerHTML = `
            <div class="flex items-center justify-between" style="background:var(--accent-dim);border-radius:8px;padding:10px 14px">
              <div style="font-weight:600;color:var(--accent);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${
                f.name
              } (${(f.size / 1024).toFixed(1)} KB)</div>
              <button type="button" class="btn btn-danger btn-xs" onclick="event.stopPropagation();resetReportFileSelect()">✕ Remove</button>
            </div>
          `;
    }
  }
};
window.resetReportFileSelect = function () {
  const input = document.getElementById('eor-file');
  if (input) input.value = '';
  const preview = document.getElementById('eor-file-preview');
  if (preview) {
    globalThis.window?.EventFlowAdminPages?.clear(preview);
    preview.innerHTML = `
          <div style="font-size:24px;margin-bottom:6px">📁</div>
          <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>
          <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>
        `;
  }
};
function openCreateEventOpsReportModal() {
  const eventsOptions = (DB.events || [])
    .map(
      event => `<option value="${event.title || event.name}">${event.title || event.name}</option>`
    )
    .join('');
  openModal(
    '📤 Submit Operational Report',
    `
        <div class="form-group">
          <label class="form-label">Report Type *</label>
          <select class="form-control" id="eor-type">
            <option value="Event Performance Report">Event Performance Report</option>
            <option value="Event Operations Report">Event Operations Report</option>
            <option value="Event Activity Report">Event Activity Report</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Report Title *</label>
          <input class="form-control" id="eor-title" placeholder="e.g. Event Performance Summary — Q3 2026">
        </div>
        <div class="form-group">
          <label class="form-label">Event / Scope *</label>
          <select class="form-control" id="eor-scope">
            <option value="Platform Wide">Platform Wide</option>
            <option value="All Q3 Events">All Q3 Events</option>
            <option value="Main Convention Center">Main Convention Center</option>
            ${eventsOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Reporting Period *</label>
          <input class="form-control" id="eor-period" placeholder="e.g. August 2026, Q3 2026, Week 34">
        </div>
        <div class="form-group">
          <label class="form-label">Upload Report *</label>
          <div class="file-upload-box" style="border:2px dashed var(--border);border-radius:10px;padding:20px;text-align:center;background:var(--surface2);cursor:pointer" onclick="document.getElementById('eor-file').click()">
            <input type="file" id="eor-file" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display:none" onchange="handleReportFileSelect(this)">
            <div id="eor-file-preview">
              <div style="font-size:24px;margin-bottom:6px">📁</div>
              <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>
              <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>
            </div>
          </div>
        </div>
      `,
    [
      {
        lbl: 'Cancel',
        cls: 'btn-ghost',
        fn: 'closeModal()',
      },
      {
        lbl: '📤 Submit Report',
        cls: 'btn-primary',
        fn: 'saveEventOpsReportSubmit()',
      },
    ]
  );
}
function saveEventOpsReportSubmit() {
  const type = v('eor-type');
  const title = v('eor-title');
  const scope = v('eor-scope');
  const period = v('eor-period');
  const fileInput = document.getElementById('eor-file');
  if (!title) {
    toast('Please enter a report title', 'error');
    return;
  }
  if (!period) {
    toast('Please specify a reporting period', 'error');
    return;
  }
  if (!fileInput || !fileInput.files || !fileInput.files.length) {
    toast('Please upload a report file', 'error');
    return;
  }
  const file = fileInput.files[0];
  const newReport = {
    id: `EOR-${Date.now().toString().slice(-4)}`,
    type: type,
    title: title,
    scope: scope,
    period: period,
    fileName: file.name,
    owner: CU.name || 'Elena Rostova',
    status: 'Submitted',
    updated: 'Just now',
  };
  if (!DB.eventOpsReports) DB.eventOpsReports = [];
  DB.eventOpsReports.unshift(newReport);
  saveDB();
  closeModal();
  renderPage('reports');
  toast('Report submitted to Super Admin for review!', 'success');
}
function pageReports() {
  if (!DB.reports) DB.reports = [];
  if (CU.role === 'employee' && CU.employeeType === 'SUPPORT_FINANCE')
    return pageOperationalReports();
  if (CU.role === 'employee' && CU.employeeType === 'EVENT_OPERATIONS')
    return pageEventOpsReports();

  // Super Admin gets dedicated analytics dashboard
  if (CU.role === 'superuser') {
    const participationData = [
      {
        label: 'Marketing',
        value: 350,
      },
      {
        label: 'Annual Gala',
        value: 620,
      },
      {
        label: 'Networking',
        value: 480,
      },
    ];
    const summaryRows = [
      {
        label: 'Total Events Created',
        value: '24',
        delta: '+8.2%',
      },
      {
        label: 'Total Registrations',
        value: '4,782',
        delta: '+15.3%',
      },
      {
        label: 'Average Rating',
        value: '4.8/5',
        delta: '+0.3',
      },
    ];
    const maxParticipation = Math.max(...participationData.map(item => item.value));
    return `
        <div style="background:#f5f0fb;min-height:100vh;padding:22px 0 28px;">
          <div style="max-width:1180px;margin:0 auto;padding:0 8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0 16px;">
              <div>
                <div style="font-size:13px;font-weight:700;color:#7c6ff7;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">Performance</div>
                <div style="font-size:28px;font-weight:800;color:#1c1830;line-height:1.2;margin-top:4px;font-family:'Syne', sans-serif;">Reports &amp; Analytics</div>
                <div style="font-size:15px;color:#7f7893;margin-top:4px;">View insights and analytics for all events</div>
              </div>
              <button type="button" onclick="toast('Export feature coming soon','info')" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#7c6ff7,#8a6cf3);border:none;color:#fff;box-shadow:0 10px 20px rgba(124,111,247,.25);cursor:pointer;font-size:20px;">⇩</button>
            </div>

            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-bottom:20px;">
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 16px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">
                <div style="font-size:13px;color:#625a78;font-weight:600;margin-bottom:14px;">Total Revenue</div>
                <div style="font-size:42px;font-weight:800;color:#1d1830;line-height:1;font-family:'Syne', sans-serif;letter-spacing:-0.06em;">?1.2M</div>
                <div style="margin-top:16px;height:5px;border-radius:99px;background:linear-gradient(90deg,#7c6ff7,#8ac8b9);width:82px;opacity:0.95;"></div>
              </div>
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 16px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">
                <div style="font-size:13px;color:#625a78;font-weight:600;margin-bottom:14px;">Average Attendance</div>
                <div style="font-size:42px;font-weight:800;color:#1d1830;line-height:1;font-family:'Syne', sans-serif;letter-spacing:-0.06em;">287</div>
                <div style="margin-top:16px;height:5px;border-radius:99px;background:linear-gradient(90deg,#7c6ff7,#8ac8b9);width:82px;opacity:0.95;"></div>
              </div>
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 16px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">
                <div style="font-size:13px;color:#625a78;font-weight:600;margin-bottom:14px;">Event Success Rate</div>
                <div style="font-size:42px;font-weight:800;color:#1d1830;line-height:1;font-family:'Syne', sans-serif;letter-spacing:-0.06em;">94%</div>
                <div style="margin-top:16px;height:5px;border-radius:99px;background:linear-gradient(90deg,#7c6ff7,#8ac8b9);width:82px;opacity:0.95;"></div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px;margin-bottom:20px;">
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 14px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                  <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Attendance Trends</div>
                  <div style="font-size:12px;color:#7d738e;">Monthly attendance overview</div>
                </div>
                <svg viewBox="0 0 520 180" width="100%" height="180" preserveAspectRatio="none" style="display:block;overflow:visible;">
                  <g stroke="#dcd4ea" stroke-width="1">
                    <line x1="18" y1="25" x2="500" y2="25" />
                    <line x1="18" y1="66" x2="500" y2="66" />
                    <line x1="18" y1="107" x2="500" y2="107" />
                    <line x1="18" y1="148" x2="500" y2="148" />
                  </g>
                  <g fill="#8a7ea6" font-size="10" font-family="DM Sans, sans-serif">
                    <text x="26" y="170">Jan</text>
                    <text x="89" y="170">Feb</text>
                    <text x="150" y="170">Mar</text>
                    <text x="211" y="170">Apr</text>
                    <text x="272" y="170">May</text>
                    <text x="333" y="170">Jun</text>
                  </g>
                  <path d="M 22 120 L 89 98 L 150 75 L 211 68 L 272 52 L 333 86 L 394 64 L 457 58 L 500 98" fill="none" stroke="#7c6ff7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                  <g fill="#7c6ff7">
                    <circle cx="22" cy="120" r="4"/>
                    <circle cx="89" cy="98" r="4"/>
                    <circle cx="150" cy="75" r="4"/>
                    <circle cx="211" cy="68" r="4"/>
                    <circle cx="272" cy="52" r="4"/>
                    <circle cx="333" cy="86" r="4"/>
                    <circle cx="394" cy="64" r="4"/>
                    <circle cx="457" cy="58" r="4"/>
                    <circle cx="500" cy="98" r="4"/>
                  </g>
                </svg>
                <div style="margin-top:6px;padding-top:12px;border-top:1px solid #eee7f6;display:flex;align-items:center;gap:8px;color:#5f5b72;font-size:12px;">
                  <span style="width:10px;height:10px;border-radius:50%;background:#7c6ff7;display:inline-block;"></span>
                  <span style="font-weight:600;color:#1d1832;">Attendees</span>
                </div>
              </div>

              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 14px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                  <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Event Participation</div>
                  <div style="font-size:12px;color:#7d738e;">Participants by event</div>
                </div>
                <div style="display:flex;align-items:end;height:170px;gap:16px;padding-top:8px;padding-left:6px;padding-right:6px;">
                  ${participationData
                    .map(
                      item => `
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:12px;height:100%;">
                      <div style="width:100%;display:flex;justify-content:center;align-items:flex-end;height:100%;">
                        <div style="width:54px;border-radius:10px 10px 0 0;background:linear-gradient(180deg,#8f6ef3,#6a4bd9);height:${
                          (item.value / maxParticipation) * 100
                        }%;min-height:36px;box-shadow:0 12px 18px rgba(124,111,247,.18);"></div>
                      </div>
                      <div style="font-size:11px;color:#7c748f;text-align:center;white-space:nowrap;">${
                        item.label
                      }</div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:18px;">
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">
                <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Event Status Distribution</div>
                <div style="font-size:12px;color:#766f8f;margin-top:4px;">Current event breakdown</div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:18px;min-height:180px;">
                  <div style="position:relative;width:210px;height:210px;border-radius:50%;background:conic-gradient(#7c6ff7 0 47%, #4ec5a5 47% 74%, #d6d2df 74% 100%);margin:8px auto;box-shadow:inset 0 2px 10px rgba(0,0,0,0.03);">
                    <div style="position:absolute;inset:30px;border-radius:50%;background:#f5f0fb;"></div>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:12px;min-width:120px;padding-right:10px;">
                    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#524d63;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#7c6ff7;"></span>Ongoing 57%</div>
                    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#524d63;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4ec5a5;"></span>Completed 28%</div>
                    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#524d63;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#d6d2df;"></span>Upcoming 15%</div>
                  </div>
                </div>
              </div>

              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 20px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">
                <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Summary Statistics</div>
                <div style="font-size:12px;color:#766f8f;margin-top:4px;">Key performance indicators</div>
                <div style="margin-top:18px;display:flex;flex-direction:column;gap:0;">
                  ${summaryRows
                    .map(
                      (row, index) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-top:${
                      index === 0 ? 'none' : '1px solid #eee7f6'
                    };font-size:15px;color:#2a2439;">
                      <span>${row.label}</span>
                      <span style="font-weight:700;color:#1d1832;margin-left:10px;">${
                        row.value
                      }</span>
                      <span style="color:${
                        row.delta.startsWith('+') ? '#2bb77b' : '#e56767'
                      };font-weight:700;font-size:12px;margin-left:8px;">${row.delta}</span>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
  }

  // ── NON-SUPERUSER: original client report view ──────
  const tab = sessionStorage.getItem('reports_tab') || 'client';
  const myEvents =
    CU.role === 'organizer' ? DB.events.filter(event => event.organizer === CU.id) : DB.events;
  const completedEvents = myEvents.filter(event => event.status === 'completed').length;
  const pendingReports = myEvents.filter(
    event => event.status === 'completed' && !DB.reports.find(report => report.eventId === event.id)
  ).length;
  const submittedReports = DB.reports.filter(report =>
    myEvents.map(event => event.id).includes(report.eventId)
  ).length;
  const clientReportContent = `
    <div class="grid-3 mb-24">
      <div class="stat-card" style="border: 1px solid var(--blue-dim); background: rgba(66, 153, 225, 0.05); padding: 16px;">
        <div class="small" style="color:var(--blue); font-weight:600; margin-bottom: 12px">Total Completed</div>
        <div style="display:flex; align-items:center; gap: 12px;">
          <div class="stat-icon" style="background:var(--blue);color:#fff;margin:0;font-size:16px;border-radius:50%">✓</div>
          <div>
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">${completedEvents}</div>
            <div class="small" style="color:var(--text2)">Total events</div>
          </div>
        </div>
      </div>
      <div class="stat-card" style="border: 1px solid var(--green-dim); background: rgba(34, 211, 165, 0.05); padding: 16px;">
        <div class="small" style="color:var(--green); font-weight:600; margin-bottom: 12px">Reports Submitted</div>
        <div style="display:flex; align-items:center; gap: 12px;">
          <div class="stat-icon" style="background:var(--green);color:#fff;margin:0;font-size:15px;border-radius:8px">📄</div>
          <div>
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">${submittedReports}</div>
            <div class="small" style="color:var(--text2)">Reports submitted</div>
          </div>
        </div>
      </div>
      <div class="stat-card" style="border: 1px solid var(--orange-dim); background: rgba(237, 137, 54, 0.05); padding: 16px;">
        <div class="small" style="color:var(--orange); font-weight:600; margin-bottom: 12px">Pending Submissions</div>
        <div style="display:flex; align-items:center; gap: 12px;">
          <div class="stat-icon" style="background:var(--orange);color:#fff;margin:0;font-size:16px;border-radius:50%">🕒</div>
          <div>
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">${pendingReports}</div>
            <div class="small" style="color:var(--text2)">Reports pending</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="h4 mb-16" style="display:flex;align-items:center;gap:8px"><span style="color:var(--orange);font-size:18px">⭕</span> Pending Submissions</div>
    <div style="display:flex;flex-direction:column;gap:16px">
      ${myEvents
        .filter(
          event =>
            event.status === 'completed' && !DB.reports.find(report => report.eventId === event.id)
        )
        .map(
          event => `
        <div class="card" style="background:var(--surface); border:1px solid var(--border); padding:20px; border-radius:12px;">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px;color:var(--text)">${
            event.title
          }</div>
          <div style="display:flex;flex-wrap:wrap;gap:24px;margin-bottom:16px;color:var(--text2);font-size:13px">
            <div style="display:flex;align-items:center;gap:6px"><span>📅</span> ${event.date}</div>
            <div style="display:flex;align-items:center;gap:6px"><span>📍</span> ${
              event.venue || event.city || 'Location'
            }</div>
            <div style="display:flex;align-items:center;gap:6px"><span>👥</span> ${
              DB.registrations.filter(registration => registration.eventId === event.id).length
            } Attendees</div>
                      </div>
          <div class="flex gap-12">
            <button class="btn btn-primary" onclick="openSubmitReportModal('${
              event.id
            }')" style="gap:6px; background:var(--accent); border-radius:8px">📤 Submit Report</button>
            <button class="btn btn-ghost" onclick="openViewEventDrawer('${
              event.id
            }')" style="color:var(--accent);border-color:var(--accent-dim);background:var(--accent-dim);gap:6px; border-radius:8px">👁 View Event Details</button>
          </div>
        </div>
      `
        )
        .join('')}
      ${
        pendingReports === 0
          ? `<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">All Reports Submitted</div><p class="empty-desc">Great job! All your completed events have reports.</p></div>`
          : ''
      }
    </div>
  `;
  const employeeReportContent = `
    <div class="page-hd">
      <div class="page-hd-left"><div class="page-title">Submitted Event Reports</div><div class="page-sub">View who submitted each report. Reports cannot be submitted or edited here.</div></div>
    </div>
    <div class="table-wrap">
      ${
        DB.reports.filter(report =>
          myEvents.some(event => String(event.id) === String(report.eventId))
        ).length === 0
          ? `<div class="empty"><div class="empty-icon">📄</div><div class="empty-title">No reports submitted</div><p class="empty-desc">Submitted event reports will appear here.</p></div>`
          : `<table><thead><tr><th>Event</th><th>File</th><th>Submitted By</th><th>Submitted At</th><th>Actions</th></tr></thead><tbody>
        ${DB.reports
          .filter(report => myEvents.some(event => String(event.id) === String(report.eventId)))
          .map(report => {
            const event = myEvents.find(item => String(item.id) === String(report.eventId));
            const submitter = DB.users.find(user => String(user.id) === String(report.submittedBy));
            return `<tr><td><strong>${event ? event.title : 'Unknown Event'}</strong></td><td>${
              report.fileName || 'Report file'
            }</td><td>${
              submitter
                ? `${submitter.name}<div class="small">${submitter.email || ''}</div>`
                : 'Unknown user'
            }</td><td>${
              report.submittedAt || '—'
            }</td><td><button class="btn btn-xs btn-danger" onclick="deleteEventReport('${
              report.id
            }')">Remove</button></td></tr>`;
          })
          .join('')}
      </tbody></table>`
      }
    </div>
  `;
  return `
  <div style="padding:24px;background:var(--bg);">
    <div class="page-hd" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div class="page-hd-left">
        <div class="page-title">Event Reports</div>
        <div class="page-sub">${
          CU.role === 'organizer'
            ? 'Review submitted reports and remove them when needed'
            : 'Manage client reports and review event submissions'
        }</div>
      </div>
      <div class="page-hd-right">
        <button class="btn" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-weight:600;padding:8px 16px;border-radius:8px;gap:8px" onclick="toast('${completedEvents} Completed Events','info')"><span style="font-size:16px;color:var(--accent)">📄</span> ${completedEvents} Completed Events</button>
      </div>
    </div>
    
    ${
      isEmployeeAccount()
        ? employeeReportContent
        : `<div style="display:flex;gap:24px;border-bottom:1px solid var(--border);margin-bottom:24px">
      <div style="padding-bottom:12px;border-bottom:2px solid ${
        tab === 'client' ? 'var(--accent)' : 'transparent'
      };color:${tab === 'client' ? 'var(--accent)' : 'var(--text2)'};font-weight:${
            tab === 'client' ? '600' : '500'
          };cursor:pointer;font-size:14px;transition:all 0.2s" onclick="switchReportTab('client')">Client Reports</div>

    </div>

    ${clientReportContent}`
    }
  </div>
  `;
}
function switchReportTab(t) {
  if (CU && CU.role === 'superuser') sessionStorage.setItem('admin_reports_tab', t);
  else sessionStorage.setItem('reports_tab', t);
  renderPage('reports');
}
function openSubmitReportModal(eventId) {
  const event = DB.events.find(currentEvent => currentEvent.id == eventId);
  if (!event) return;
  openModal(
    'Submit Event Report',
    `
    <div class="form-group" style="text-align:center; padding: 40px; border: 2px dashed var(--border); border-radius: 8px;">
      <div style="font-size: 32px; margin-bottom: 12px;">📁</div>
      <label class="form-label" style="font-size:16px">Upload Report File</label>
      <div class="small" style="color:var(--text2); margin-bottom: 16px;">PDF, DOCX, XLSX (Max 10MB)</div>
      <input type="file" id="report-file" style="display:none" onchange="document.getElementById('file-name').textContent = this.files[0] ? this.files[0].name : ''">
      <button class="btn btn-ghost" onclick="document.getElementById('report-file').click()">Select File</button>
      <div id="file-name" style="margin-top:12px; font-weight: 500; color: var(--accent);"></div>
    </div>
  `,
    [
      {
        lbl: 'Submit File',
        cls: 'btn-primary',
        fn: `submitEventReport('${eventId}')`,
      },
    ]
  );
}
function submitEventReport(eventId) {
  const fileInput = document.getElementById('report-file');
  if (!fileInput || !fileInput.files.length) {
    toast('Please select a file to submit', 'error');
    return;
  }
  const fileName = fileInput.files[0].name;
  const report = {
    id: Date.now(),
    eventId,
    fileName,
    submittedBy: CU.id,
    submittedAt: new Date().toLocaleString(),
  };
  DB.reports.push(report);
  saveDB();
  closeModal();

  // Notify organizer if not submitted by them
  const event = DB.events.find(currentEvent => currentEvent.id == eventId);
  if (event && CU.id !== event.organizer) {
    DB.notifications.push({
      id: DB._nextId.notifs++,
      userId: event.organizer,
      type: 'info',
      title: 'Event Report Received',
      msg: `A report file for ${event.title} has been submitted by ${CU.name}.`,
      read: false,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    saveDB();
    updateNotifDot();
  }
  renderPage(_currentPage);
  toast('Report file submitted successfully!', 'success');
}
function deleteEventReport(reportId) {
  const report = DB.reports.find(item => String(item.id) === String(reportId));
  if (!report) return;
  confirm2('Remove Event Report', 'Remove this submitted report?', () => {
    const index = DB.reports.findIndex(item => String(item.id) === String(reportId));
    if (index === -1) return;
    DB.reports.splice(index, 1);
    saveDB();
    renderPage('reports');
    toast('Event report removed', 'info');
  });
}

// ════════════════════════════════════════════════

// ════════════════════════════════════════════════

function downloadReport(eventId) {
  const event = DB.events.find(currentEvent => currentEvent.id == eventId);
  const eventRegs = DB.registrations.filter(registration => registration.eventId == eventId);
  const verified = eventRegs.filter(registration => registration.checkedIn);
  let csv = 'Attendee,Email,Ticket Type,Check-In Time,Status\n';
  verified.forEach(r => {
    const u = DB.users.find(user => user.id === r.attendeeId) || {
      name: 'Unknown',
      email: '',
    };
    const ticketType = r.seat === 'VIP' ? 'VIP' : r.seat === 'Premium' ? 'Premium' : 'General';
    csv += `${u.name},${u.email},${ticketType},${r.checkInTime || 'N/A'},Verified\n`;
  });
  const blob = new Blob([csv], {
    type: 'text/csv',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, '_')}_Report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  toast('Report downloaded!', 'success');
}

// ════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════
function visibleNotifications() {
  return CU?.role === 'employee' && CU.employeeType === 'SUPPORT_FINANCE'
    ? DB.notifications.filter(notification => notification.employeeType === 'SUPPORT_FINANCE')
    : DB.notifications;
}
function pageNotifications() {
  const notifications = visibleNotifications();
  const unread = notifications.filter(notification => !notification.read).length;
  return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Notifications</div><div class="page-sub">${unread} unread notification${
    unread !== 1 ? 's' : ''
  }</div></div>
    <div class="page-hd-right"><button class="btn btn-ghost btn-sm" onclick="markAllRead()">✓ Mark All Read</button></div>
  </div>
  <div class="card p-0 notif-panel">
    ${
      notifications.length === 0
        ? `<div class="empty"><div class="empty-icon">🔔</div><div class="empty-title">All caught up!</div></div>`
        : `
    ${notifications
      .map(
        notification => `
      <div class="notif-item${notification.read ? '' : ' unread'}" onclick="markNotifRead('${
          notification.id
        }')">
        <div class="notif-icon" style="background:${
          notification.type === 'success'
            ? 'var(--green-dim)'
            : notification.type === 'warning'
            ? 'var(--yellow-dim)'
            : notification.type === 'error'
            ? 'var(--red-dim)'
            : 'var(--accent-dim)'
        }">${notification.icon || '🔔'}</div>
        <div class="notif-content">
          <div class="notif-title" style="${notification.read ? '' : 'font-weight:600'}">${
          notification.title
        }</div>
          <div class="notif-msg">${notification.msg}</div>
          <div class="notif-time">${notification.time}</div>
        </div>
        ${!notification.read ? `<div class="unread-dot"></div>` : ''}
      </div>`
      )
      .join('')}`
    }
  </div>`;
}
function markNotifRead(id) {
  const n = DB.notifications.find(notification => notification.id == id);
  if (!n) return;
  n.read = true;
  saveDB();
  updateNotifDot();
  if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType);
  else buildNav(CU.role);
  renderPage('notifications');
}
function markAllRead() {
  visibleNotifications().forEach(n => (n.read = true));
  renderPage('notifications');
  updateNotifDot();
  if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType);
  else buildNav(CU.role);
  toast('All notifications marked as read', 'success');
}

// ════════════════════════════════════════════════
//  PROFILE
// ════════════════════════════════════════════════
function pageDepartmentEmployeeProfile() {
  const type = CU.employeeType;
  const profile = {
    REGISTRATION_VERIFICATION: {
      title: 'User Executive',
      purpose:
        'Protect event access by reviewing registrations, validating attendee documents, and resolving account verification issues.',
      focus: [
        'Review pending registrations and identity documents',
        'Verify attendee eligibility and ticket details',
        'Resolve account access and registration queries',
      ],
      primaryAction: "goNav('registrations')",
      primaryLabel: 'Open Registrations',
      secondaryAction: "goNav('attendees')",
      secondaryLabel: 'Manage Attendees',
    },
    EVENT_OPERATIONS: {
      title: 'Event Executive',
      purpose:
        'Coordinate event readiness and live delivery, from event information and operational plans to post-event reporting.',
      focus: [
        'Maintain event schedules, venues, and operational details',
        'Prepare and track event-operation tasks',
        'Coordinate changes with organizers and clients',
      ],
      primaryAction: "goNav('events')",
      primaryLabel: 'Manage Events',
      secondaryAction: "goNav('event-requests')",
      secondaryLabel: 'Open Operations',
    },
    SUPPORT_FINANCE: {
      title: 'Customer Support & Finance Executive',
      purpose:
        'Resolve customer requests and maintain accurate payment, refund, and service-operation records.',
      focus: [
        'Respond to customer support requests',
        'Review transactions and refund cases',
        'Maintain service and finance operational reports',
      ],
      primaryAction: "goNav('support-center')",
      primaryLabel: 'Open Support Center',
      secondaryAction: "goNav('finance')",
      secondaryLabel: 'Open Finance',
    },
  }[type];
  if (!profile) return '';
  const registrations = DB.registrations || [];
  const supportRequests = DB.supportRequests || [];
  const transactions = DB.financeTransactions || [];
  const events = DB.events || [];
  const verificationPending = registrations.filter(
    registration =>
      !registration.verified ||
      ['Pending Review', 'Flagged', 'pending'].includes(
        registration.verificationStatus || registration.status
      )
  ).length;
  const verified = registrations.filter(
    registration => registration.verified || registration.verificationStatus === 'Verified'
  ).length;
  const activeEvents = events.filter(event =>
    ['upcoming', 'ongoing'].includes(event.status)
  ).length;
  const operationalTasks = (DB.eventOperationsTasks || []).filter(
    task => !task.status || !['completed', 'done'].includes(String(task.status).toLowerCase())
  ).length;
  const openSupport = supportRequests.filter(
    request => !['Resolved', 'Closed'].includes(request.status)
  ).length;
  const refundsToReview = (DB.financeRefunds || []).filter(
    r => !['Approved', 'Completed', 'Rejected'].includes(r.status)
  ).length;
  const metrics =
    type === 'REGISTRATION_VERIFICATION'
      ? [
          ['Pending reviews', verificationPending, 'var(--yellow)'],
          ['Verified attendees', verified, 'var(--green)'],
          ['Registration records', registrations.length, 'var(--accent)'],
        ]
      : type === 'EVENT_OPERATIONS'
      ? [
          ['Active events', activeEvents, 'var(--accent)'],
          ['Open operations tasks', operationalTasks, 'var(--yellow)'],
          ['Event requests', (DB.eventRequests || []).length, 'var(--green)'],
        ]
      : [
          ['Open support requests', openSupport, 'var(--yellow)'],
          ['Transactions reviewed', transactions.length, 'var(--blue)'],
          ['Refunds awaiting review', refundsToReview, 'var(--red)'],
        ];
  return `
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">My Employee Profile</div><div class="page-sub">Your department responsibilities and work overview.</div></div><div class="page-hd-right"><button class="btn btn-ghost" onclick="goNav('settings')">Edit Profile</button></div></div>
  <div class="profile-banner">
    ${
      CU.avatarImage
        ? `<div class="av av-xl"><img src="${CU.avatarImage}" alt="${
            CU.name
          }" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">${
            CU.avatar || CU.name[0]
          }</span></div>`
        : `<div class="av av-xl">${CU.avatar || CU.name[0]}</div>`
    }
    <div class="profile-info">
      <div class="profile-name">${CU.name}</div>
      <div class="profile-role-tag">${profile.title}</div>
      <div class="small mt-4">${CU.service || EMPLOYEE_TYPE_LABELS[type]}</div>
      <span class="badge badge-green mt-8">Active employee account</span>
    </div>
  </div>
  <div class="grid-3 mb-20">
    ${metrics
      .map(
        ([label, value, color]) =>
          `<div class="card"><div class="label">${label}</div><div class="stat-value" style="color:${color};margin-top:10px">${value}</div></div>`
      )
      .join('')}
  </div>
  <div class="grid-2" style="align-items:start;gap:20px">
    <div class="card">
      <div class="h4 mb-14">Role & Responsibilities</div>
      <p style="font-size:13.5px;color:var(--text2);line-height:1.7;margin-bottom:16px">${
        profile.purpose
      }</p>
      <div class="label mb-8">Core responsibilities</div>
      <div style="display:flex;flex-direction:column;gap:10px">${profile.focus
        .map(
          item =>
            `<div style="display:flex;gap:9px;align-items:flex-start;color:var(--text2)"><span style="color:var(--green);font-weight:700">&#10003;</span><span>${item}</span></div>`
        )
        .join('')}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <div class="h4 mb-14">Employee Details</div>
        <div class="info-row"><span class="info-label">Department</span><span class="info-value">${
          EMPLOYEE_TYPE_LABELS[type]
        }</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${
          CU.email
        }</span></div>
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${
          CU.phone || 'Not set'
        }</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">${
          CU.city || 'Not set'
        }</span></div>
        <div class="info-row"><span class="info-label">Member since</span><span class="info-value">${
          CU.joined || 'Not set'
        }</span></div>
      </div>
      <div class="card">
        <div class="h4 mb-14">Work Tools</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-primary w-full" onclick="${profile.primaryAction}">${
    profile.primaryLabel
  }</button>
          <button class="btn btn-ghost w-full" onclick="${profile.secondaryAction}">${
    profile.secondaryLabel
  }</button>
          <button class="btn btn-ghost w-full" onclick="goNav('reports')">View Department Reports</button>
        </div>
      </div>
    </div>
  </div>`;
}
function pageProfile() {
  if (isDepartmentEmployee()) return pageDepartmentEmployeeProfile();
  const regs =
    CU.role === 'attendee'
      ? DB.registrations.filter(registration => registration.attendeeId === CU.id)
      : [];
  const myEvs = CU.role === 'organizer' ? DB.events.filter(event => event.organizer === CU.id) : [];
  const isSF = CU.role === 'employee' && CU.employeeType === 'SUPPORT_FINANCE';
  const sfSupportHandled = (DB.supportRequests || []).length;
  const sfResolved = (DB.supportRequests || []).filter(
    r => r.status === 'Resolved' || r.status === 'Closed'
  ).length;
  const sfTxnsReviewed = (DB.financeTransactions || []).length;
  const sfReportsSubmitted = (DB.operationalReports || []).filter(
    r => r.status === 'Submitted' || r.status === 'Reviewed'
  ).length;
  return `
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">My Profile</div></div><div class="page-hd-right"><button class="btn btn-ghost" onclick="goNav('settings')">✏️ Edit Profile</button></div></div>
  <div class="profile-banner">
    ${
      CU.avatarImage
        ? `<div class="av av-xl"><img src="${CU.avatarImage}" alt="${
            CU.name
          }" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">${
            CU.avatar || CU.name[0]
          }</span></div>`
        : `<div class="av av-xl">${CU.avatar || CU.name[0]}</div>`
    }
    <div class="profile-info">
      <div class="profile-name">${CU.name}</div>
      <div class="profile-role-tag">${
        isSF ? 'Customer Support &amp; Finance Executive' : ROLE_LABELS[CU.role]
      }</div>
      ${CU.company ? `<div class="small mt-4">${CU.company}</div>` : ''}
      ${
        CU.specialization
          ? `<div class="small mt-4">Specialization: ${CU.specialization}</div>`
          : ''
      }
      ${CU.service ? `<div class="small mt-4">Service: ${CU.service}</div>` : ''}
      <span class="badge badge-green mt-8">Active Account</span>
    </div>
  </div>
  <div class="grid-2" style="align-items:start;gap:20px">
    <div class="card">
      <div class="h4 mb-14">Contact Information</div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${
        CU.email
      }</span></div>
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${
        CU.phone || 'Not set'
      }</span></div>
      <div class="info-row"><span class="info-label">Member Since</span><span class="info-value">${
        CU.joined || '—'
      }</span></div>
      <div class="info-row"><span class="info-label">Role</span><span class="info-value"><span class="badge badge-${
        ROLE_COLORS[CU.role]
      }">${isSF ? 'Customer Support &amp; Finance Executive' : CU.role}</span></span></div>
      ${
        CU.bio
          ? `<div class="mt-14"><div class="label mb-8">Bio</div><p style="font-size:13.5px;color:var(--text2);line-height:1.7">${CU.bio}</p></div>`
          : ''
      }
    </div>
    <div>
      ${
        isSF
          ? `<div class="card mb-16">
        <div class="h4 mb-14">Work Summary</div>
        <div class="info-row"><span class="info-label">Support Requests Handled</span><span class="info-value" style="color:var(--accent);font-weight:700">${sfSupportHandled}</span></div>
        <div class="info-row"><span class="info-label">Issues Resolved</span><span class="info-value" style="color:var(--green);font-weight:700">${sfResolved}</span></div>
        <div class="info-row"><span class="info-label">Transactions Reviewed</span><span class="info-value" style="color:var(--blue);font-weight:700">${sfTxnsReviewed}</span></div>
        <div class="info-row"><span class="info-label">Reports Submitted</span><span class="info-value" style="color:var(--purple);font-weight:700">${sfReportsSubmitted}</span></div>
      </div>`
          : CU.role === 'attendee'
          ? `<div class="card mb-16">
        <div class="h4 mb-14">Activity Summary</div>
        <div class="info-row"><span class="info-label">Events Registered</span><span class="info-value">${
          regs.length
        }</span></div>
        <div class="info-row"><span class="info-label">Upcoming Events</span><span class="info-value" style="color:var(--accent)">${
          regs.filter(registration => {
            const event = DB.events.find(currentEvent => currentEvent.id === registration.eventId);
            return event && event.status === 'upcoming';
          }).length
        }</span></div>
        <div class="info-row"><span class="info-label">Events Attended</span><span class="info-value" style="color:var(--green)">${
          regs.filter(registration => registration.checkedIn).length
        }</span></div>
        <div class="info-row"><span class="info-label">Total Spent</span><span class="info-value" style="color:var(--green);font-weight:700">₹${regs.reduce(
          (total, registration) => total + registration.amount,
          0
        )}</span></div>
      </div>`
          : CU.role === 'organizer'
          ? `<div class="card mb-16">
        <div class="h4 mb-14">Event Summary</div>
        <div class="info-row"><span class="info-label">Total Events</span><span class="info-value">${
          myEvs.length
        }</span></div>
        <div class="info-row"><span class="info-label">Upcoming</span><span class="info-value" style="color:var(--accent)">${
          myEvs.filter(e => e.status === 'upcoming').length
        }</span></div>
        <div class="info-row"><span class="info-label">Completed</span><span class="info-value" style="color:var(--green)">${
          myEvs.filter(e => e.status === 'completed').length
        }</span></div>
      </div>`
          : ''
      }
      <div class="card">
        <div class="h4 mb-14">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-ghost w-full" onclick="goNav('settings')">⚙️ Account Settings</button>
          <button class="btn btn-danger w-full" onclick="doLogout()">🚪 Sign Out</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════
function pageSettings() {
  return `
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">Account Settings</div><div class="page-sub">Manage your personal information and account preferences.</div></div></div>
  <div class="grid-2" style="align-items:start;gap:20px">
    <div class="card card-lg">
      <div class="h4 mb-20">Personal Information</div>
      <div class="profile-banner" style="margin-bottom:20px;padding:18px">
        <div class="av av-lg">${adminChartText(CU.avatar || CU.name[0])}</div>
        <div><div style="font-weight:700">${adminChartText(
          CU.name
        )}</div><div class="small">${adminChartText(ROLE_LABELS[CU.role])}</div></div>
      </div>
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="st-name" value="${adminChartText(
        CU.name
      )}"></div>
      <div class="form-group"><label class="form-label">Email Address</label><input class="form-control" id="st-email" type="email" value="${adminChartText(
        CU.email
      )}"></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input class="form-control" id="st-phone" value="${adminChartText(
        CU.phone || CU.phoneNo || ''
      )}"></div>
      <div class="form-group"><label class="form-label">Bio</label><textarea class="form-control" id="st-bio" maxlength="2000">${adminChartText(
        CU.bio || ''
      )}</textarea></div>
      <button class="btn btn-primary w-full" onclick="saveSettings()" style="justify-content:center">Save Changes</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="card card-lg">
        <div class="h4 mb-20">Change Password</div>
        <div class="form-group"><label class="form-label">Current Password</label><input class="form-control" id="st-cur" type="password" placeholder="Enter current password"></div>
        <div class="form-group"><label class="form-label">New Password</label><input class="form-control" id="st-new" type="password" placeholder="Min 6 characters"></div>
        <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-control" id="st-conf" type="password" placeholder="Re-enter new password"></div>
        <button class="btn btn-primary w-full" onclick="changePass()" style="justify-content:center">Update Password</button>
      </div>
      <div class="card">
        <button class="btn btn-danger w-full mb-8" onclick="doLogout()" style="justify-content:center">Sign Out</button>
      </div>
    </div>
  </div>`;
}
async function saveSettings() {
  const name = v('st-name');
  const email = v('st-email');
  const phone = v('st-phone');
  if (!name) {
    toast('Name is required', 'error');
    return;
  }
  if (!email || !email.includes('@')) {
    toast('Enter a valid email', 'error');
    return;
  }
  if (window.EventFlowAccountPolicy?.isEmailInUse?.(DB.users, email, CU.id || CU.userId)) {
    toast('Email already registered', 'error');
    return;
  }
  const bio = v('st-bio');
  if (CU.token) {
    try {
      await apiUpdateUser(CU.userId || CU.id, {
        name,
        email,
        phoneNo: phone,
        bio,
      });
    } catch (error) {
      toast(error.message || 'Could not save settings', 'error');
      return;
    }
  }
  CU.name = name;
  CU.email = email;
  CU.phone = phone;
  CU.phoneNo = phone;
  CU.bio = bio;
  CU.avatar = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const u = DB.users.find(user => String(user.id || user.userId) === String(CU.id));
  if (u) {
    Object.assign(u, {
      name,
      email,
      phone,
      bio,
      avatar: CU.avatar,
      settingsUpdated: true,
    });
  }
  setCurrentUser(CU);
  saveDB();
  g('sb-name').textContent = name;
  updateHeaderUser();
  g('sb-av').textContent = CU.avatar;
  toast('Settings saved successfully!', 'success');
}
async function changePass() {
  const cur = v('st-cur');
  const nw = v('st-new');
  const conf = v('st-conf');
  if (!cur || !nw || !conf) {
    toast('Fill all password fields', 'error');
    return;
  }
  if (nw.length < 6) {
    toast('Password must be at least 6 characters', 'error');
    return;
  }
  if (nw !== conf) {
    toast('Passwords do not match', 'error');
    return;
  }
  if (CU.token) {
    try {
      await apiRequest('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: cur,
          newPassword: nw,
        }),
      });
    } catch (error) {
      toast(error.message || 'Could not change password', 'error');
      return;
    }
  } else {
    const u = DB.users.find(user => String(user.id) === String(CU.id));
    if (!u || cur !== u.password) {
      toast('Current password is incorrect', 'error');
      return;
    }
    u.password = nw;
    u.settingsUpdated = true;
    saveDB();
  }
  ['st-cur', 'st-new', 'st-conf'].forEach(id => {
    const element = g(id);
    if (element) element.value = '';
  });
  toast('Password changed successfully!', 'success');
}

// ════════════════════════════════════════════════
//  CLIENT PAGES
// ════════════════════════════════════════════════
function pageFindOrganizers() {
  const q = (sessionStorage.getItem('search_org_q') || '').toLowerCase();
  const rating = sessionStorage.getItem('search_org_rating') || 'all';
  const category = sessionStorage.getItem('search_org_category') || 'all';
  let organizers = DB.users.filter(user => user.role === 'organizer');
  if (q) {
    organizers = organizers.filter(
      organizer =>
        organizer.name.toLowerCase().includes(q) || organizer.service.toLowerCase().includes(q)
    );
  }
  if (category !== 'all') {
    organizers = organizers.filter(
      organizer => organizer.service === category || organizer.eventTypes?.includes(category)
    );
  }
  if (rating !== 'all') {
    const minRating = parseFloat(rating);
    organizers = organizers.filter(organizer => (organizer.rating || 0) >= minRating);
  }
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Find Event Organisers</div>
      <div class="page-sub">Discover and connect with top-rated event organizers across India</div>
    </div>
  </div>
  
  <div class="filter-row">
    <div class="search-box input-group" style="flex:1;max-width:400px">
      <span class="input-icon">🔍</span>
      <input class="form-control" id="search-org-q" placeholder="Search by organizer name or specialization..." value="${q}" oninput="searchOrganizers(this.value)">
    </div>
    <select class="form-control filter-select" id="search-org-rating" onchange="filterOrganizers()">
      <option value="all">All Ratings</option>
      <option value="4.5">4.5+ stars</option>
      <option value="4">4+ stars</option>
      <option value="3.5">3.5+ stars</option>
    </select>
    <select class="form-control filter-select" id="search-org-category" onchange="filterOrganizers()">
      <option value="all">All Categories</option>
      <option>Corporate Events</option>
      <option>Conferences</option>
      <option>Weddings & Social Events</option>
      <option>Workshops</option>
      <option>Product Launches</option>
    </select>
  </div>
  
  <div style="margin-bottom:16px;color:var(--text2);font-size:13px">Showing ${
    organizers.length
  } event organiser${organizers.length !== 1 ? 's' : ''}</div>
  
  <div class="grid-3" style="gap:16px">
    ${
      organizers.length === 0
        ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No organizers found</div><p>Try adjusting your search filters</p></div>`
        : organizers
            .map(organizer => {
              const rt = organizer.rating || 0;
              const rv = organizer.reviews || Math.floor(rt * 38) + 12;
              const event = organizer.eventsCount || Math.floor(rt * 65) + 20;
              const orgAv = organizer.avatarImage
                ? `
          <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${
            organizer.color || 'var(--accent)'
          }40;position:relative">
            <img src="${organizer.avatarImage}" alt="${
                    organizer.name
                  }" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:${
              organizer.color || 'var(--accent)'
            }20;font-size:20px;font-weight:700;color:${organizer.color || 'var(--accent)'}">${
                    organizer.avatar || organizer.name[0]
                  }</div>
          </div>
        `
                : `<div style="width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${
                    organizer.color || 'var(--accent)'
                  }15;font-size:20px;font-weight:700;color:${
                    organizer.color || 'var(--accent)'
                  };border:2px solid ${organizer.color || 'var(--accent)'}30">${
                    organizer.avatar || organizer.name[0]
                  }</div>`;
              return `
      <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:12px;transition:transform .18s,box-shadow .18s;cursor:pointer" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'" onmouseout="this.style.transform='';this.style.boxShadow=''" onclick="viewOrganizerProfile('${
        organizer.id
      }')">
        <div style="display:flex;align-items:center;gap:12px">
          ${orgAv}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              <span style="font-weight:700;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${
                organizer.name
              }</span>
              <span style="background:var(--yellow);color:#1a1400;padding:1px 7px;border-radius:10px;font-size:10.5px;font-weight:700;flex-shrink:0">⭐ ${rt.toFixed(
                1
              )}</span>
            </div>
            <div style="font-size:12px;color:var(--accent);font-weight:500;margin-bottom:2px">${
              organizer.service || 'Event Organizer'
            }</div>
            <div style="font-size:11.5px;color:var(--text3)">📍 ${organizer.city || 'India'}</div>
          </div>
        </div>
        <p style="font-size:12px;color:var(--text2);line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${
          organizer.bio || 'Professional event organizer with extensive industry experience.'
        }</p>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="background:var(--surface3);padding:3px 10px;border-radius:6px;font-size:11px;color:var(--text2)"><strong style="color:var(--text)">${event}</strong> events</span>
          <span style="background:var(--surface3);padding:3px 10px;border-radius:6px;font-size:11px;color:var(--text2)"><strong style="color:var(--text)">${rv}</strong> reviews</span>
          <span style="background:var(--green)14;padding:3px 10px;border-radius:6px;font-size:11px;color:var(--green);font-weight:600">96% satisfaction</span>
        </div>
        <button class="btn btn-primary btn-sm w-full" onclick="event.stopPropagation();viewOrganizerProfile('${
          organizer.id
        }')" style="justify-content:center;padding:8px;font-size:12.5px">View Profile & Request Event</button>
      </div>`;
            })
            .join('')
    }
  </div>`;
}
function searchOrganizers(q) {
  sessionStorage.setItem('search_org_q', q);
  renderPage('find-organizers');
}
function filterOrganizers() {
  const rating = g('search-org-rating').value;
  const category = g('search-org-category').value;
  sessionStorage.setItem('search_org_rating', rating);
  sessionStorage.setItem('search_org_category', category);
  renderPage('find-organizers');
}
function viewOrganizerProfile(organizerId) {
  const organizer = DB.users.find(user => String(user.id) === String(organizerId));
  if (!organizer) return;
  const rating = organizer.rating || 0;
  const reviews = organizer.reviewCount || 0;
  const events = organizer.eventCount || 0;
  const completedEvents = Math.floor(events * 0.9);
  const orgModalAv = organizer.avatarImage
    ? `
        <div style="width:80px;height:80px;border-radius:12px;overflow:hidden;flex-shrink:0;background:${
          organizer.color || 'var(--accent)'
        }20;position:relative">
          <img src="${organizer.avatarImage}" alt="${
        organizer.name
      }" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:60px;color:${
            organizer.color || 'var(--accent)'
          }">${organizer.avatar || organizer.name[0]}</div>
        </div>
      `
    : `<div style="font-size:60px;width:80px;height:80px;display:flex;align-items:center;justify-content:center;background:${
        organizer.color || 'var(--accent)'
      }20;border-radius:12px;flex-shrink:0">${organizer.avatar || organizer.name[0]}</div>`;
  openModal(
    `${organizer.name} - Organizer Profile`,
    `
    <div style="background:linear-gradient(135deg,${organizer.color || 'var(--accent)'}20,${
      organizer.color || 'var(--accent)'
    }05);border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid ${
      organizer.color || 'var(--accent)'
    }30">
      <div style="display:flex;gap:16px;align-items:flex-start">
        ${orgModalAv}
        <div style="flex:1">
          <div style="font-weight:700;font-size:20px;margin-bottom:4px">${organizer.name}</div>
          <div style="color:var(--accent);font-weight:500;margin-bottom:8px">${
            organizer.service || 'Event Organizer'
          }</div>
          <div style="display:flex;gap:12px;margin-bottom:8px">
            <span style="background:var(--yellow);color:#1a1400;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">⭐ ${rating.toFixed(
              1
            )}</span>
            <span style="color:var(--text2);font-size:13px">${reviews} reviews</span>
            <span style="color:var(--text2);font-size:13px">📍 ${organizer.city || 'India'}</span>
          </div>
          <div style="color:var(--text2);font-size:13px">${
            organizer.bio || 'Professional event organizer'
          }</div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom:20px">
      <div class="h4 mb-12">Statistics</div>
      <div class="grid-3" style="gap:12px;margin-bottom:16px">
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">COMPLETED EVENTS</div>
          <div style="font-size:24px;font-weight:800;color:var(--green)">${completedEvents}</div>
        </div>
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">TOTAL REVIEWS</div>
          <div style="font-size:24px;font-weight:800;color:var(--blue)">${reviews}</div>
        </div>
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">SATISFACTION RATE</div>
          <div style="font-size:24px;font-weight:800;color:var(--green)">96%</div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom:20px">
      <div class="h4 mb-12">Contact Information</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border-radius:8px">
          <span>✉️</span>
          <div>
            <div style="font-size:11px;color:var(--text3)">Email</div>
            <div style="font-weight:500">${organizer.email}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border-radius:8px">
          <span>📞</span>
          <div>
            <div style="font-size:11px;color:var(--text3)">Phone</div>
            <div style="font-weight:500">${organizer.phone || '+91 9876543210'}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border-radius:8px">
          <span>🌐</span>
          <div>
            <div style="font-size:11px;color:var(--text3)">Location</div>
            <div style="font-weight:500">${organizer.city || 'India'}</div>
          </div>
        </div>
      </div>
    </div>
  `,
    [
      {
        lbl: 'Request Event',
        cls: 'btn-primary',
        fn: `closeModal();openRequestModal('${organizerId}')`,
      },
    ],
    true
  );
}
function contactOrganizer(organizerId) {
  const organizer = DB.users.find(user => user.id === organizerId);
  if (!organizer) return;
  toast(`Opening contact form for ${organizer.name}...`, 'info');
}
function openRequestModal(organizerId) {
  const organizer = DB.users.find(user => String(user.id) === String(organizerId));
  openModal(
    `Request Event - ${organizer.name}`,
    `
    <div class="form-group"><label class="form-label">Event Title *</label><input class="form-control" id="req-title" placeholder="e.g., Product Launch 2026"></div>
    <div class="form-group"><label class="form-label">Event Type *</label><select class="form-control" id="req-type"><option>Corporate Events</option><option>Conferences</option><option>Weddings</option><option>Workshops</option></select></div>
    <div class="form-group"><label class="form-label">Expected Date *</label><input class="form-control" id="req-date" type="date"></div>
    <div class="form-group"><label class="form-label">Expected Guests</label><input class="form-control" id="req-guests" type="number" placeholder="100"></div>
    <div class="form-group"><label class="form-label">Budget (INR) *</label><input class="form-control" id="req-budget" type="number" placeholder="50000"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="req-desc" placeholder="Tell the organizer about your event..."></textarea></div>
  `,
    [
      {
        lbl: 'Send Request',
        cls: 'btn-primary',
        fn: `submitEventRequest('${organizerId}')`,
      },
    ]
  );
}
function submitEventRequest(organizerId) {
  const title = v('req-title');
  const type = v('req-type');
  const date = v('req-date');
  const guests = v('req-guests') || 0;
  const budget = parseInt(v('req-budget')) || 0;
  const desc = v('req-desc');
  if (!title || !date || budget < 1000) {
    toast('Please fill required fields', 'error');
    return;
  }
  DB.eventRequests.push({
    id: DB._nextId.reqs++,
    clientId: CU.id,
    organizer: organizerId,
    title,
    type,
    date,
    guests,
    budget,
    desc,
    status: 'pending',
    created: today(),
  });
  saveDB();
  closeModal();
  renderPage(_currentPage);
  toast('Request sent to organizer!', 'success');
}
function pageUpcomingEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = DB.events
    .filter(event => {
      const eDate = new Date(event.date);
      return eDate >= today && event.status === 'upcoming';
    })
    .sort((leftEvent, rightEvent) => new Date(leftEvent.date) - new Date(rightEvent.date));
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Upcoming Events</div>
      <div class="page-sub">Events happening soon that you might be interested in</div>
    </div>
  </div>
  <div class="events-grid">${
    upcoming.length === 0
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No upcoming events</div></div>`
      : upcoming.map(event => evCard(event, CU.role === 'client' ? 'client' : 'attendee')).join('')
  }</div>`;
}
function pageCompletedEvents() {
  const completed = DB.events
    .filter(event => event.status === 'completed')
    .sort((leftEvent, rightEvent) => new Date(rightEvent.date) - new Date(leftEvent.date));
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Completed Events</div>
      <div class="page-sub">Events that have been successfully completed</div>
    </div>
  </div>
  <div class="events-grid">${
    completed.length === 0
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">✅</div><div class="empty-title">No completed events</div></div>`
      : completed
          .map(event => {
            const bannerContent = event.image
              ? `
          <img src="${event.image}" alt="${
                  event.title || 'Event'
                }" class="ev-banner-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="ev-banner-fallback" style="display:none;align-items:center;justify-content:center;font-size:52px;width:100%;height:100%">${
            event.emoji || '📅'
          }</div>
          <div class="ev-banner-overlay"></div>
        `
              : `<span style="font-size:52px">${event.emoji || '📅'}</span>`;
            return `<div class="ev-card">
    <div class="ev-banner" style="background:${event.color || 'var(--accent)'}18">
      ${bannerContent}
      <div class="ev-banner-tag"><span class="badge badge-green">✓ Completed</span></div>
      <div class="ev-banner-price">${event.price === 0 ? 'Free' : '₹' + event.price}</div>
    </div>
    <div class="ev-body">
      <div class="ev-title">${event.title}</div>
      <div class="ev-meta">
        <div class="ev-meta-row"><span>📅</span>${event.date} · ${event.time}</div>
        <div class="ev-meta-row"><span>📍</span>${event.venue}</div>
        <div class="ev-meta-row"><span>🏷️</span>${event.category}</div>
      </div>
      <div style="margin-bottom:12px">
        <div class="flex justify-between ev-cap mb-4"><span>${event.registered}/${
              event.capacity
            } attended</span></div>
        <div style="font-size:12px;color:var(--green);margin-top:8px">✓ Event Successfully Completed</div>
      </div>
      <div class="ev-footer">
        <div class="flex gap-6" style="width:100%;justify-content:space-between">
          <button class="btn btn-ghost btn-xs w-full" onclick="openViewEventDrawer('${
            event.id
          }')" title="View event details">👁️ View Details</button>
          <button class="btn btn-primary btn-xs" onclick="viewEventReport('${
            event.id
          }')" title="View event report">📊 View Report</button>
        </div>
        <div class="tag-list" style="flex:1;justify-content:flex-end">${(event.tags || [])
          .slice(0, 2)
          .map(tag => `<span class="tag">${tag}</span>`)
          .join('')}</div>
      </div>
    </div>
  </div>`;
          })
          .join('')
  }</div>`;
}
function pageOngoingEvents() {
  const ongoing = DB.events.filter(event => event.status === 'ongoing');
  return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Ongoing Events</div>
      <div class="page-sub">Events currently happening right now</div>
    </div>
  </div>
  <div class="events-grid">${
    ongoing.length === 0
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">⏱️</div><div class="empty-title">No ongoing events</div></div>`
      : ongoing.map(event => evCard(event, CU.role === 'client' ? 'client' : 'attendee')).join('')
  }</div>`;
}

// ════════════════════════════════════════════════
//  MODAL SYSTEM
// ════════════════════════════════════════════════
function openModal(title, body, btns = [], showCancel = true) {
  g('modal-title').textContent = title;
  globalThis.window?.EventFlowAdminPages?.clear(g('modal-body'));
  g('modal-body').innerHTML = body;
  const foot = g('modal-foot');
  globalThis.window?.EventFlowAdminPages?.clear(foot);
  foot.innerHTML = '';
  let hasDismiss = false;
  const handlers = new Set();
  const actions = btns.filter(button => {
    const handler = String(button.fn || '')
      .trim()
      .replace(/;+\s*$/, '');
    const dismissesModal = /^(?:window\.)?closeModal\s*\(\s*\)$/.test(handler);
    const key = dismissesModal ? 'closeModal()' : handler;
    if (key && handlers.has(key)) return false;
    if (key) handlers.add(key);
    if (
      dismissesModal ||
      String(button.lbl || '')
        .trim()
        .toLowerCase() === 'cancel'
    )
      hasDismiss = true;
    return true;
  });
  if (showCancel && !hasDismiss) {
    const c = document.createElement('button');
    c.className = 'btn btn-ghost';
    c.textContent = 'Cancel';
    c.onclick = closeModal;
    foot.appendChild(c);
  }
  actions.forEach(b => {
    const button = document.createElement('button');
    button.className = 'btn ' + b.cls;
    button.textContent = b.lbl;
    button.setAttribute('onclick', b.fn);
    foot.appendChild(button);
  });
  if (!showCancel && !actions.length) foot.style.display = 'none';
  else foot.style.display = '';
  const ov = g('modal-overlay');
  ov.classList.remove('hidden'); // ensure visible
  requestAnimationFrame(() => ov.classList.add('open'));
}
function closeModal() {
  const ov = g('modal-overlay');
  ov.classList.remove('open');
}
function closeModalOnBg(e) {
  if (e.target === g('modal-overlay')) closeModal();
}

// DRAWER
function openDrawer(title, body) {
  g('drawer-title').textContent = title;
  globalThis.window?.EventFlowAdminPages?.clear(g('drawer-body'));
  g('drawer-body').innerHTML = body;
  g('drawer-overlay').classList.add('open');
  g('drawer').classList.add('open');
}
function closeDrawer() {
  g('drawer-overlay').classList.remove('open');
  g('drawer').classList.remove('open');
}

// CONFIRM
function confirm2(title, msg, cb) {
  g('confirm-title').textContent = title;
  g('confirm-msg').textContent = msg;
  _confirmCb = cb;
  const ov = g('confirm-overlay');
  ov.classList.remove('hidden');
  requestAnimationFrame(() => ov.classList.add('open'));
}
function closeConfirm() {
  g('confirm-overlay').classList.remove('open');
  _confirmCb = null;
}
function closeConfirmOnBg(e) {
  if (e.target === g('confirm-overlay')) closeConfirm();
}
function runConfirm() {
  if (_confirmCb) _confirmCb();
  closeConfirm();
}

// TOAST
function toast(msg, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  globalThis.window?.EventFlowAdminPages?.clear(element);
  element.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  g('toasts').appendChild(element);
  setTimeout(() => {
    element.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => element.remove(), 300);
  }, 3500);
}

// ════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════
// Legacy DOM helpers: g finds an element; v reads its trimmed form value.
function g(id) {
  return document.getElementById(id);
}
function v(id) {
  const element = g(id);
  return element ? element.value.trim() : '';
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function showErr(id) {
  const element = g(id);
  if (element) element.classList.add('show');
}
function hideErr(id) {
  const element = g(id);
  if (element) element.classList.remove('show');
}
function evStatBadge(s) {
  return (
    {
      upcoming: 'purple',
      full: 'red',
      completed: 'green',
    }[s] || 'gray'
  );
}
function reqBadge(s) {
  return (
    {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      in_review: 'purple',
    }[s] || 'gray'
  );
}

// ════════════════════════════════════════════════
//  BOOTSTRAP
// ════════════════════════════════════════════════
// CAROUSEL FUNCTIONS
// ════════════════════════════════════════════════
function scrollCarousel(direction) {
  const carousel = g('event-carousel');
  if (!carousel) return;
  const scrollAmount = 300;
  if (direction === 'left') {
    carousel.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth',
    });
  } else {
    carousel.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }
}

// Auto-enable carousel scrolling with keyboard arrows (optional)
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' && g('event-carousel')) scrollCarousel('left');
  if (e.key === 'ArrowRight' && g('event-carousel')) scrollCarousel('right');
});

// ════════════════════════════════════════════════
//  CROSS-TAB DATA SYNCHRONIZATION
// ════════════════════════════════════════════════
// The 'storage' event fires ONLY in tabs that did NOT make the change.
// We debounce re-renders to avoid blinking when multiple tabs are active.
let _syncDebounceTimer = null;
window.addEventListener('storage', function (e) {
  if (e.key !== 'ffsd_db' || !e.newValue) return;

  // Skip if the data content hasn't meaningfully changed (same length = same data)
  if (e.newValue === e.oldValue) return;

  // Clear any pending re-render and schedule a new one after a short delay.
  // This collapses rapid consecutive saves (e.g. from the other tab's own renders)
  // into a single update, eliminating the visible flicker.
  clearTimeout(_syncDebounceTimer);
  _syncDebounceTimer = setTimeout(function () {
    try {
      loadDB(false);
      if (CU && _currentPage) {
        renderPage(_currentPage);
        updateNotifDot();
      }
    } catch (err) {
      console.warn('[Sync] Failed to reload from storage event:', err);
    }
  }, 600); // 600ms debounce — imperceptible delay, eliminates flicker
});

// Local changes already update the page directly. Other browser tabs are
// handled by the storage event above, so a polling-based full re-render is
// unnecessary and caused the visible dashboard flicker after login.

// ════════════════════════════════════════════════
function getRoleWorkspace(user) {
  if (!user) return null;
  const role = String(user.role || user.userRole || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const type = String(user.employeeType || '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (role === 'employee') {
    if (['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS'].includes(type))
      return {
        key: 'employee1',
      };
    if (['SUPPORT_FINANCE', 'FINANCE_EXECUTIVE'].includes(type))
      return {
        key: 'employee2',
      };
    return {
      key: role === 'employee' ? 'employee1' : 'landing',
    };
  }
  return (
    {
      superuser: {
        key: 'super-admin',
      },
      super_admin: {
        key: 'super-admin',
      },
      organizer: {
        key: 'organizer',
      },
      event_organizer: {
        key: 'organizer',
      },
      client: {
        key: 'client',
      },
      attendee: {
        key: 'attendee',
      },
      employee1: {
        key: 'employee1',
      },
      employee2: {
        key: 'employee2',
      },
    }[role] || null
  );
}
function routeToRoleWorkspace(user) {
  const workspace = getRoleWorkspace(user);
  if (!workspace || window.EventFlowRole?.key === workspace.key) return false;
  window.location.replace(workspace.key === 'super-admin' ? '/admin' : '/' + workspace.key);
  return true;
}
document.addEventListener('DOMContentLoaded', function boot() {
  // Restore the session synchronously. Waiting on a health request caused a
  // visible landing-page-to-dashboard swap and unnecessarily logged out
  // users whenever the optional backend was offline.
  loadDB(false);
  try {
    const saved = sessionStorage.getItem('ef_cu');
    if (saved) {
      CU = window.EventFlowAccountPolicy.normalizeSavedAccount(JSON.parse(saved));
      if (!CU) throw new Error('This account is no longer available.');
      const workspace = getRoleWorkspace(CU);
      if (workspace && routeToRoleWorkspace(CU)) return;
      if (!workspace && window.EventFlowRole?.key !== 'landing') {
        window.location.replace('/landing');
        return;
      }
      initApp();
      showPage('app');
      document.documentElement.classList.remove('restoring-session');
      return;
    }
  } catch (e) {
    CU = null;
    try {
      sessionStorage.removeItem('ef_cu');
    } catch (ignore) {}
  }
  if (window.EventFlowRole?.key !== 'landing') {
    window.location.replace('/landing');
    return;
  }
  document.documentElement.classList.remove('restoring-session');
  showPage('landing');
});

/* ===== EventFlow source: validation.js ===== */
// Global Validation Script for Specified Input Fields
document.addEventListener('DOMContentLoaded', () => {
  function getErrorSpan(input) {
    let next = input.nextElementSibling;
    if (next && next.classList.contains('form-error')) return next;
    let span = document.createElement('span');
    span.className = 'form-error';
    input.parentNode.insertBefore(span, input.nextSibling);
    return span;
  }
  function validateInput(target) {
    if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.tagName !== 'TEXTAREA')
      return true;
    if (target.type === 'file' || target.type === 'checkbox' || target.type === 'radio')
      return true;
    if (target.disabled || target.readOnly) return true;
    const fg = target.closest('.form-group');
    const labelText = fg
      ? fg.querySelector('.form-label')
        ? fg.querySelector('.form-label').textContent.toLowerCase()
        : ''
      : '';
    const id = (target.id || '').toLowerCase();
    const type = (target.type || '').toLowerCase();
    // Verification codes are checked by their confirmation handler, not as contact details.
    if (id.includes('otp') || target.autocomplete === 'one-time-code') return true;

    // To support contact forms that use div labels
    let previousElement = target.previousElementSibling;
    let prevLabel =
      previousElement && previousElement.textContent
        ? previousElement.textContent.toLowerCase()
        : '';
    let fieldType = null;
    if (
      /^(full name|name|first name|last name|city|city\s*\/\s*location)$/i.test(
        labelText.replace(/\*/g, '').trim()
      ) ||
      /^(rg-name|newusername|edit-usr-name|contact-name|name)$/.test(id)
    )
      fieldType = 'name';
    else if (
      labelText.includes('email') ||
      type === 'email' ||
      id.includes('email') ||
      prevLabel.includes('email')
    )
      fieldType = 'email';
    else if (
      labelText.includes('phone') ||
      type === 'tel' ||
      id.includes('phone') ||
      prevLabel.includes('phone')
    )
      fieldType = 'phone';
    else if (labelText.includes('date') || type === 'date' || id.includes('date'))
      fieldType = 'date';
    if (!fieldType) return true;
    let val = target.value.trim();
    let isValid = true;
    let errorMsg = '';
    if (val === '') {
      if (labelText.includes('*') || target.hasAttribute('required')) {
        isValid = false;
        errorMsg = 'This field is required';
      } else {
        target.classList.remove('is-error');
        target.classList.remove('is-valid');
        const span = getErrorSpan(target);
        if (span) {
          span.classList.remove('show');
          span.textContent = '';
        }
        return true;
      }
    } else {
      if (fieldType === 'name') {
        if (!/^[\p{L}\p{M} .,'’()-]+$/u.test(val)) {
          isValid = false;
          errorMsg = 'Use letters and normal name or city characters only';
        }
      } else if (fieldType === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          isValid = false;
          errorMsg = 'Enter a valid email format';
        }
      } else if (fieldType === 'phone') {
        if (!/^\d{10}$/.test(val)) {
          isValid = false;
          errorMsg = 'Enter a mobile number with exactly 10 digits';
        }
      } else if (fieldType === 'date') {
        const selected = new Date(val);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (
          (id !== 'rg-date-of-birth' && selected < todayDate) ||
          (id === 'rg-date-of-birth' && (Number.isNaN(selected.getTime()) || selected > todayDate))
        ) {
          isValid = false;
          errorMsg =
            id === 'rg-date-of-birth'
              ? 'Date of birth cannot be in the future'
              : 'Only future dates are allowed';
        }
      }
    }
    const span = getErrorSpan(target);
    if (isValid) {
      target.classList.remove('is-error');
      target.classList.add('is-valid');
      span.classList.remove('show');
      span.textContent = '';
      return true;
    } else {
      target.classList.remove('is-valid');
      target.classList.add('is-error');
      span.classList.add('show');
      span.textContent = errorMsg;
      return false;
    }
  }
  document.addEventListener('input', e => {
    if (e.target.tagName === 'INPUT') validateInput(e.target);
  });
  document.addEventListener('change', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') validateInput(e.target);
  });
  document.addEventListener('focusout', e => {
    if (e.target.tagName === 'INPUT') validateInput(e.target);
  });
  document.addEventListener('focusin', e => {
    const target = e.target;
    if (target.tagName === 'INPUT') {
      const fg = target.closest('.form-group');
      const labelText = fg
        ? fg.querySelector('.form-label')
          ? fg.querySelector('.form-label').textContent.toLowerCase()
          : ''
        : '';
      const id = (target.id || '').toLowerCase();
      let isDateField = target.type === 'date' || labelText.includes('date') || id.includes('date');
      if (isDateField) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (target.type !== 'date') target.type = 'date';
        if (id !== 'rg-date-of-birth' && target.min !== todayStr) target.min = todayStr;
      }
    }
  });
  document.addEventListener(
    'click',
    e => {
      const button = e.target.closest('button');
      if (!button) return;
      if (button.dataset.validationScope === 'verification') return;
      if (
        button.classList.contains('btn-primary') ||
        button.classList.contains('btn-success') ||
        button.id === 'login-btn'
      ) {
        const onclickCode = button.getAttribute('onclick') || '';
        if (
          onclickCode.includes('open') ||
          onclickCode.includes('goNav') ||
          onclickCode.includes('showPage') ||
          onclickCode.includes('doLogin') ||
          onclickCode.includes('gotoLogin') ||
          onclickCode.includes('fillLogin') ||
          onclickCode.includes('selectEmployee') ||
          onclickCode.includes('doLogout')
        )
          return;

        // Scope validation exclusively to modals or explicit form containers
        const formScope = button.closest('.modal-box, form');
        if (!formScope) return;

        // Only validate inputs that are currently visible
        const inputs = formScope.querySelectorAll('input, select, textarea');
        let hasError = false;
        inputs.forEach(input => {
          if (
            input.offsetWidth > 0 ||
            input.offsetHeight > 0 ||
            input.getClientRects().length > 0
          ) {
            const isValid = validateInput(input);
            if (!isValid) hasError = true;
          }
        });
        if (hasError) {
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
          if (typeof toast === 'function')
            toast('Please fix the errors before submitting', 'error');
        }
      }
    },
    true
  );
});

/* ===== Role-owned frontend configuration ===== */
window.EventFlowRole = {
  key: 'super-admin',
  label: 'Super Admin',
};

// React pages read the same normalized data and keep the existing workflow action entry points.
window.EventFlowAdminRuntime = {
  snapshot(pageProps = {}) {
    return {
      ADMIN_CHART_COLORS:
        typeof ADMIN_CHART_COLORS === 'undefined' ? undefined : ADMIN_CHART_COLORS,
      CU: typeof CU === 'undefined' ? undefined : CU,
      DB: typeof DB === 'undefined' ? undefined : DB,
      EMPLOYEE_TYPE_LABELS:
        typeof EMPLOYEE_TYPE_LABELS === 'undefined' ? undefined : EMPLOYEE_TYPE_LABELS,
      ROLE_COLORS: typeof ROLE_COLORS === 'undefined' ? undefined : ROLE_COLORS,
      ROLE_LABELS: typeof ROLE_LABELS === 'undefined' ? undefined : ROLE_LABELS,
      adminChartLine: typeof adminChartLine === 'undefined' ? undefined : adminChartLine,
      adminChartNumber: typeof adminChartNumber === 'undefined' ? undefined : adminChartNumber,
      get adminChartSequence() {
        return adminChartSequence;
      },
      set adminChartSequence(value) {
        adminChartSequence = value;
      },
      apiGetDashboard: typeof apiGetDashboard === 'undefined' ? undefined : apiGetDashboard,
      employeeReportFilter:
        typeof employeeReportFilter === 'undefined' ? undefined : employeeReportFilter,
      isDepartmentEmployee:
        typeof isDepartmentEmployee === 'undefined' ? undefined : isDepartmentEmployee,
      receivedEmployeeReports:
        typeof receivedEmployeeReports === 'undefined' ? undefined : receivedEmployeeReports,
      pageProps,
    };
  },
};
