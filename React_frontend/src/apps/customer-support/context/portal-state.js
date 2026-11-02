/* ===== EventFlow source: state.js ===== */
// ═══════════════════════════════════════════════════════════════
// CENTRAL STATE MANAGEMENT - EventFlow Platform
// Handles all app state, localStorage persistence, and CRUD operations
// ═══════════════════════════════════════════════════════════════

const STATE_VERSION = '2.0';
const STATE_KEY = 'eventflow_state_v2';

// Central state object
let AppState = {
  users: [],
  events: [],
  registrations: [],
  notifications: [],
  currentUser: null,
  version: STATE_VERSION,
};

// ═══════════════════ PERSISTENCE ═══════════════════

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(AppState));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}
function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with existing to preserve structure
      AppState = {
        ...AppState,
        ...parsed,
      };
      window.EventFlowAccountPolicy.migrateLegacyDemoData(AppState);
      if (Number(parsed.accountSchemaVersion || 0) < 2) saveState();
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
}
function initializeDefaultState() {
  AppState = {
    users: [
      {
        id: 'u1',
        name: 'Super Admin',
        email: 'admin@eventflow.com',
        password: 'admin123',
        role: 'superuser',
        phone: '+91 9876543210',
        status: 'active',
        joinedAt: '2024-01-01',
        avatarImage: '/assets/images/avatars/user-alex-johnson.jpg',
      },
      {
        id: 'u2',
        name: 'Priya Sharma',
        email: 'organizer@eventflow.com',
        password: 'org123',
        role: 'organizer',
        phone: '+91 9876543211',
        status: 'active',
        joinedAt: '2024-01-05',
        specialization: 'Corporate Events',
        avatarImage: '/assets/images/avatars/organizer-priya-sharma.jpg',
      },
      {
        id: 'u4',
        name: 'Sneha Reddy',
        email: 'client@eventflow.com',
        password: 'client123',
        role: 'client',
        phone: '+91 9876543213',
        status: 'active',
        joinedAt: '2024-02-01',
        company: 'TechCorp',
        avatarImage: '/assets/images/avatars/user-michael-torres.jpg',
      },
      {
        id: 'u5',
        name: 'Rahul Singh',
        email: 'attendee@eventflow.com',
        password: 'att123',
        role: 'attendee',
        phone: '+91 9876543214',
        status: 'active',
        joinedAt: '2024-02-10',
        avatarImage: '/assets/images/avatars/user-robert-singh.jpg',
      },
    ],
    events: [
      {
        id: 'e1',
        title: 'Tech Fest 2026',
        category: 'Conference',
        date: '2026-04-15',
        time: '09:00',
        location: 'Convention Center, Chennai',
        city: 'Chennai',
        capacity: 500,
        registered: 342,
        price: 499,
        status: 'upcoming',
        organizer: 'u2',
        description: 'Premier technology conference featuring AI, Cloud & DevOps workshops',
        image: '/assets/images/events/event-tech-summit.jpg',
      },
      {
        id: 'e2',
        title: 'Startup Meetup',
        category: 'Networking',
        date: '2026-04-22',
        time: '18:00',
        location: 'Innovation Hub, Bangalore',
        city: 'Bangalore',
        capacity: 150,
        registered: 98,
        price: 0,
        status: 'upcoming',
        organizer: 'u2',
        description: 'Monthly networking event for startups and investors',
        image: '/assets/images/events/event-pitch-night.jpg',
      },
      {
        id: 'e3',
        title: 'Web Dev Workshop',
        category: 'Workshop',
        date: '2026-05-01',
        time: '10:00',
        location: 'Tech Academy, Hyderabad',
        city: 'Hyderabad',
        capacity: 80,
        registered: 65,
        price: 299,
        status: 'upcoming',
        organizer: 'u2',
        description: 'Hands-on workshop on modern web development with React & Vue',
        image: '/assets/images/events/event-marketing-workshop.jpg',
      },
    ],
    registrations: [
      {
        id: 'r1',
        attendeeId: 'u5',
        eventId: 'e1',
        date: '2026-03-01',
        ticketId: 'TKT-001',
        status: 'confirmed',
        amount: 499,
        checkedIn: false,
        qr: generateQRCode(),
      },
      {
        id: 'r2',
        attendeeId: 'u5',
        eventId: 'e2',
        date: '2026-03-05',
        ticketId: 'TKT-002',
        status: 'confirmed',
        amount: 0,
        checkedIn: false,
        qr: generateQRCode(),
      },
    ],
    notifications: [
      {
        id: 'n1',
        userId: 'u5',
        message: 'Welcome to EventFlow! 🎉',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ],
    currentUser: null,
    version: STATE_VERSION,
  };
  saveState();
}

// Load state on initialization
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  if (!AppState.users || AppState.users.length === 0) {
    initializeDefaultState();
  }
});

// ═══════════════════ CRUD: USERS ═══════════════════

function createUser(userData) {
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, userData)) {
    addNotification(null, 'Only an admin can manage employee or admin accounts.', 'warning');
    return null;
  }
  const email = window.EventFlowAccountPolicy.normalizeEmail(userData.email);
  if (window.EventFlowAccountPolicy.isEmailInUse(AppState.users, email)) {
    addNotification(null, 'Email already registered', 'warning');
    return null;
  }
  const newUser = {
    id: 'u' + Date.now(),
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'active',
    ...userData,
    email,
  };
  AppState.users.push(newUser);
  saveState();
  addNotification(null, `User "${newUser.name}" created successfully`, 'success');
  return newUser;
}
function updateUser(userId, updates) {
  const user = AppState.users.find(u => u.id === userId);
  if (user) {
    if (!window.EventFlowAccountPolicy.canApplyAccountUpdate(CU, user, updates)) {
      addNotification(null, 'This account change requires an admin.', 'warning');
      return null;
    }
    if (
      updates.email &&
      window.EventFlowAccountPolicy.isEmailInUse(AppState.users, updates.email, userId)
    ) {
      addNotification(null, 'Email already registered', 'warning');
      return null;
    }
    Object.assign(user, updates);
    if (updates.email) user.email = window.EventFlowAccountPolicy.normalizeEmail(updates.email);
    saveState();
    addNotification(null, `User "${user.name}" updated`, 'success');
    return user;
  }
  return null;
}
function deleteUser(userId) {
  const target = AppState.users.find(user => String(user.id) === String(userId));
  if (!window.EventFlowAccountPolicy.canManageAccount(CU, target)) {
    addNotification(null, 'Only an admin can manage employee or admin accounts.', 'warning');
    return false;
  }
  const index = AppState.users.findIndex(user => user.id === userId);
  if (index > -1) {
    const name = AppState.users[index].name;
    AppState.users.splice(index, 1);
    saveState();
    addNotification(null, `User "${name}" deleted`, 'info');
    return true;
  }
  return false;
}

// ═══════════════════ CRUD: EVENTS ═══════════════════

function createEvent(eventData) {
  const newEvent = {
    id: 'e' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0],
    registered: 0,
    status: 'upcoming',
    ...eventData,
  };
  AppState.events.push(newEvent);
  saveState();
  addNotification(null, `Event "${newEvent.title}" created`, 'success');
  return newEvent;
}
function updateEvent(eventId, updates) {
  const event = AppState.events.find(currentEvent => currentEvent.id === eventId);
  if (event) {
    Object.assign(event, updates);
    saveState();
    addNotification(null, `Event "${event.title}" updated`, 'success');
    return event;
  }
  return null;
}
function deleteEvent(eventId) {
  const index = AppState.events.findIndex(event => event.id === eventId);
  if (index > -1) {
    const title = AppState.events[index].title;
    AppState.events.splice(index, 1);
    // Also remove registrations for this event
    AppState.registrations = AppState.registrations.filter(
      registration => registration.eventId !== eventId
    );
    saveState();
    addNotification(null, `Event "${title}" deleted`, 'info');
    return true;
  }
  return false;
}

// ═══════════════════ CRUD: REGISTRATIONS ═══════════════════

function registerAttendee(attendeeId, eventId) {
  const event = AppState.events.find(currentEvent => currentEvent.id === eventId);
  if (!event) return null;
  if (event.registered >= event.capacity || event.status === 'full') {
    return {
      success: false,
      message: 'Event is at maximum capacity',
    };
  }

  // Check if already registered
  if (
    AppState.registrations.find(
      registration => registration.attendeeId === attendeeId && registration.eventId === eventId
    )
  ) {
    addNotification(attendeeId, "You're already registered for this event", 'warning');
    return null;
  }
  const newReg = {
    id: 'r' + Date.now(),
    attendeeId,
    eventId,
    date: new Date().toISOString().split('T')[0],
    ticketId: 'TKT-' + String(AppState.registrations.length + 1).padStart(3, '0'),
    status: 'confirmed',
    amount: event.price,
    checkedIn: false,
    qr: generateQRCode(),
  };
  AppState.registrations.push(newReg);
  event.registered = Math.min(event.registered + 1, event.capacity);
  if (event.registered >= event.capacity) {
    event.status = 'full';
  }
  saveState();
  addNotification(attendeeId, `Registered for "${event.title}" ✓`, 'success');
  return newReg;
}
function cancelRegistration(registrationId) {
  const index = AppState.registrations.findIndex(
    registration => registration.id === registrationId
  );
  if (index > -1) {
    const reg = AppState.registrations[index];
    const event = AppState.events.find(currentEvent => currentEvent.id === reg.eventId);
    if (event) {
      event.registered = Math.max(0, event.registered - 1);
      if (event.registered < event.capacity && event.status === 'full') {
        event.status = 'upcoming';
      }
    }
    AppState.registrations.splice(index, 1);
    saveState();
    addNotification(null, 'Registration cancelled', 'info');
    return true;
  }
  return false;
}
function checkInAttendee(registrationId) {
  const reg = AppState.registrations.find(registration => registration.id === registrationId);
  if (reg) {
    reg.checkedIn = true;
    saveState();
    addNotification(null, 'Attendee checked in ✓', 'success');
    return true;
  }
  return false;
}

// ═══════════════════ NOTIFICATIONS ═══════════════════

function addNotification(userId, message, type = 'info') {
  const notification = {
    id: 'n' + Date.now(),
    userId: userId || 'global',
    message,
    type,
    // "success", "error", "warning", "info"
    read: false,
    createdAt: new Date().toISOString(),
  };
  AppState.notifications.push(notification);
  // Keep only last 50 notifications
  if (AppState.notifications.length > 50) {
    AppState.notifications.shift();
  }
  saveState();
  return notification;
}
function markNotificationAsRead(notificationId) {
  const notif = AppState.notifications.find(notification => notification.id === notificationId);
  if (notif) {
    notif.read = true;
    saveState();
  }
}
function getUnreadCount() {
  return AppState.notifications.filter(notification => !notification.read).length;
}

// ═══════════════════ HELPERS ═══════════════════

function generateQRCode() {
  // Simple QR grid pattern (5x5 for demo)
  const qr = [];
  for (let i = 0; i < 25; i++) {
    qr.push(Math.random() > 0.5 ? 1 : 0);
  }
  return qr;
}
function findUser(userId) {
  return AppState.users.find(user => user.id === userId);
}
function findEvent(eventId) {
  return AppState.events.find(event => event.id === eventId);
}
function getUserEvents(userId) {
  return AppState.events.filter(event => event.organizer === userId);
}
function getUserRegistrations(userId) {
  return AppState.registrations.filter(registration => registration.attendeeId === userId);
}
function getEventRegistrations(eventId) {
  return AppState.registrations.filter(registration => registration.eventId === eventId);
}

// ═══════════════════ AUTHENTICATION ═══════════════════

function login(email, password) {
  const user = AppState.users.find(u => u.email === email && u.password === password);
  if (user) {
    AppState.currentUser = user;
    saveState();
    addNotification(user.id, `Welcome back, ${user.name}! 👋`, 'success');
    return user;
  }
  return null;
}
function logout() {
  AppState.currentUser = null;
  saveState();
}

// Make AppState global
window.AppState = AppState;
window.createUser = createUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.createEvent = createEvent;
window.updateEvent = updateEvent;
window.deleteEvent = deleteEvent;
window.registerAttendee = registerAttendee;
window.cancelRegistration = cancelRegistration;
window.checkInAttendee = checkInAttendee;
window.addNotification = addNotification;
window.markNotificationAsRead = markNotificationAsRead;
window.getUnreadCount = getUnreadCount;
window.findUser = findUser;
window.findEvent = findEvent;
window.getUserEvents = getUserEvents;
window.getUserRegistrations = getUserRegistrations;
window.getEventRegistrations = getEventRegistrations;
window.login = login;
window.logout = logout;
