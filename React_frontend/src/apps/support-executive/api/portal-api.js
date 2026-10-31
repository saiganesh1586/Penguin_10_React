/* ===== EventFlow source: api.js ===== */
// ═══════════════════════════════════════════════════════════════
// CENTRAL API UTILITY — EventFlow Backend Integration
// All backend calls are routed through this file.
// Backend: http://localhost:3001/api
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = 'http://localhost:3001/api';
const SESSION_KEY = 'ef_cu';

// ─── Role Normalisation ─────────────────────────────────────────
// Maps frontend role strings → backend x-role header values
const ROLE_MAP = {
  superuser:       'super_admin',
  super_admin:     'super_admin',
  'super-user':    'super_admin',
  admin:           'super_admin',
  organizer:       'event_organizer',
  event_organizer: 'event_organizer',
  'event-organizer': 'event_organizer',
  client:          'client',
  attendee:        'attendee',
};

function normalizeRole(role) {
  return ROLE_MAP[(role || '').toLowerCase()] || (role || '').toLowerCase();
}

// ─── Session Helpers ─────────────────────────────────────────────
function getCurrentUser() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) { return null; }
}

function setCurrentUser(user) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch (e) {}
}

function clearCurrentUser() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}

// ─── Header Helpers ──────────────────────────────────────────────
function getRoleHeader() {
  const u = getCurrentUser();
  return u ? normalizeRole(u.role || u.userRole || '') : '';
}

function getUserIdHeader() {
  const u = getCurrentUser();
  return u ? (u.userId || u.id || '') : '';
}

function getAuthHeader() {
  const u = getCurrentUser();
  return u && u.token ? `Bearer ${u.token}` : '';
}

// ─── Core Fetch Wrapper ──────────────────────────────────────────
// Authorization is handled entirely by JWT Bearer tokens.
// No client-controlled identity headers (x-role, x-user-id) are sent.
async function apiRequest(endpoint, options = {}) {
  const authorization = getAuthHeader();

  const headers = {
    'Content-Type': 'application/json',
    ...(authorization ? { Authorization: authorization } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    if (!res.ok) {
      const msg = Array.isArray(data?.message)
        ? data.message.join(', ')
        : (data?.message || `HTTP ${res.status}`);
      throw new ApiError(msg, res.status, data);
    }

    if (options.method && options.method.toUpperCase() !== 'GET') window.EventFlowData?.invalidate();
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Network error (backend offline)
    if (e.message && (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network') || e.name === 'TypeError')) {
      throw new ApiError('Backend server is offline. Please start the NestJS server on port 3001.', 0);
    }
    throw new ApiError(e.message || 'Unknown error', 0);
  }
}

// ─── API Error Class ─────────────────────────────────────────────
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ─── AUTH ────────────────────────────────────────────────────────
async function apiLogin(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // Backend returns { success, message, data: { userId, name, email, userRole, status } }
  // Unwrap the envelope so the caller gets the flat user object
  if (data && data.data) return data.data;
  return data;
}

// ─── USERS ───────────────────────────────────────────────────────
async function apiGetUsers() {
  return apiRequest('/users');
}

async function apiCreateUser(userData) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

async function apiUpdateUser(userId, updates) {
  return apiRequest(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

async function apiDeleteUser(userId) {
  return apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
}

// ─── EVENTS ──────────────────────────────────────────────────────
async function apiGetEvents() {
  return apiRequest('/events');
}

async function apiCreateEvent(eventData) {
  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

async function apiUpdateEvent(eventId, updates) {
  return apiRequest(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

async function apiDeleteEvent(eventId) {
  return apiRequest(`/events/${eventId}`, {
    method: 'DELETE',
  });
}

// ─── ANALYTICS ───────────────────────────────────────────────────
async function apiGetDashboard() {
  return apiRequest('/analytics/dashboard');
}

async function apiGetOrganizerDashboard(organizerId) {
  return apiRequest('/analytics/organizer-dashboard');
}

async function apiGetEmployeeDashboard() {
  return apiRequest('/analytics/employee-dashboard');
}

// ─── EVENT REQUESTS ──────────────────────────────────────────────
async function apiGetEventRequests() {
  return apiRequest('/event-requests');
}

async function apiGetClientRequests(clientId) {
  return apiRequest('/event-requests');
}

async function apiGetOrganizerRequests(organizerId) {
  return apiRequest('/event-requests');
}

async function apiCreateEventRequest(reqData) {
  return apiRequest('/event-requests', {
    method: 'POST',
    body: JSON.stringify(reqData),
  });
}

async function apiUpdateRequestStatus(requestId, status) {
  return apiRequest(`/event-requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ─── EVENT PLANS ─────────────────────────────────────────────────
async function apiCreateEventPlan(planData) {
  return apiRequest('/event-plans', {
    method: 'POST',
    body: JSON.stringify(planData),
  });
}

async function apiApproveEventPlan(planId, approvalStatus) {
  return apiRequest(`/event-plans/${planId}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approvalStatus }),
  });
}

// ─── REGISTRATIONS ───────────────────────────────────────────────
async function apiGetAttendeeRegistrations(attendeeId) {
  return apiRequest('/registrations');
}

async function apiRegisterForEvent(regData) {
  return apiRequest('/registrations', {
    method: 'POST',
    body: JSON.stringify(regData),
  });
}

// ─── PAYMENTS ────────────────────────────────────────────────────
async function apiMakePayment(paymentData) {
  return apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
}










// ─── ATTENDANCE ──────────────────────────────────────────────────
async function apiVerifyAttendance(verifyData) {
  return apiRequest('/attendance/verify', {
    method: 'POST',
    body: JSON.stringify(verifyData),
  });
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────
async function apiGetNotifications(userId) {
  return apiRequest('/notifications');
}

async function apiMarkAllNotificationsRead() {
  return apiRequest('/notifications/read-all', {
    method: 'PATCH',
  });
}

// ─── REPORTS ─────────────────────────────────────────────────────


async function apiCreateEventReport(reportData) {
  return apiRequest('/reports/event', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
}

// ─── REVIEWS ─────────────────────────────────────────────────────
async function apiSubmitEventReview(reviewData) {
  return apiRequest('/reviews/event', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
}

// ─── ERROR DISPLAY ───────────────────────────────────────────────
function showApiError(message) {
  if (typeof toast === 'function') {
    toast(message, 'error');
  } else {
    console.error('[API Error]', message);
  }
}

function showApiSuccess(message) {
  if (typeof toast === 'function') {
    toast(message, 'success');
  } else {
    console.log('[API Success]', message);
  }
}

// ─── Export globals ──────────────────────────────────────────────
window.API_BASE_URL = API_BASE_URL;
window.normalizeRole = normalizeRole;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.clearCurrentUser = clearCurrentUser;
window.getRoleHeader = getRoleHeader;
window.getUserIdHeader = getUserIdHeader;
window.getAuthHeader = getAuthHeader;
window.apiRequest = apiRequest;
window.ApiError = ApiError;
window.apiLogin = apiLogin;
window.apiGetUsers = apiGetUsers;
window.apiCreateUser = apiCreateUser;
window.apiUpdateUser = apiUpdateUser;
window.apiDeleteUser = apiDeleteUser;
window.apiGetEvents = apiGetEvents;
window.apiCreateEvent = apiCreateEvent;
window.apiUpdateEvent = apiUpdateEvent;
window.apiDeleteEvent = apiDeleteEvent;
window.apiGetDashboard = apiGetDashboard;
window.apiGetOrganizerDashboard = apiGetOrganizerDashboard;

window.apiGetEventRequests = apiGetEventRequests;
window.apiGetClientRequests = apiGetClientRequests;
window.apiGetOrganizerRequests = apiGetOrganizerRequests;
window.apiCreateEventRequest = apiCreateEventRequest;
window.apiUpdateRequestStatus = apiUpdateRequestStatus;
window.apiCreateEventPlan = apiCreateEventPlan;
window.apiApproveEventPlan = apiApproveEventPlan;
window.apiGetAttendeeRegistrations = apiGetAttendeeRegistrations;
window.apiRegisterForEvent = apiRegisterForEvent;
window.apiMakePayment = apiMakePayment;




window.apiVerifyAttendance = apiVerifyAttendance;
window.apiGetNotifications = apiGetNotifications;
window.apiMarkAllNotificationsRead = apiMarkAllNotificationsRead;

window.apiCreateEventReport = apiCreateEventReport;
window.apiSubmitEventReview = apiSubmitEventReview;
window.showApiError = showApiError;
window.showApiSuccess = showApiSuccess;


