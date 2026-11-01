/* ===== EventFlow source: api.js ===== */
// ═══════════════════════════════════════════════════════════════
// CENTRAL API UTILITY — EventFlow Backend Integration
// All backend calls are routed through this file.
// Backend: http://localhost:3001/api
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = 'http://localhost:3001/api';
const SESSION_KEY = 'ef_cu';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
if (typeof window !== 'undefined') window.escapeHtml = escapeHtml;

function clientStatusReadable(status) {
  const map = {
    submitted: 'Submitted',
    pending: 'Pending Review',
    under_review: 'Under Review',
    in_review: 'Under Review',
    info_requested: 'Clarification Needed',
    proposal_sent: 'Proposal Received',
    awaiting_client: 'Awaiting Payment',
    changes_requested: 'Changes Requested',
    counteroffer_received: 'Counteroffer Received',
    planning: 'In Planning',
    plan_submitted: 'Plan Ready',
    plan_revision_requested: 'Plan Revision',
    confirmed: 'Confirmed',
    approved: 'Confirmed',
    completed: 'Completed',
    rejected: 'Declined',
    withdrawn: 'Withdrawn',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return (
    map[(status || '').toLowerCase()] ||
    String(status || '')
      .replace(/_/g, ' ')
      .toUpperCase()
  );
}
if (typeof window !== 'undefined') window.clientStatusReadable = clientStatusReadable;

// ─── Role Normalisation ─────────────────────────────────────────
// Maps frontend role strings → backend x-role header values
const ROLE_MAP = {
  superuser: 'super_admin',
  super_admin: 'super_admin',
  'super-user': 'super_admin',
  admin: 'super_admin',
  organizer: 'event_organizer',
  event_organizer: 'event_organizer',
  'event-organizer': 'event_organizer',
  client: 'client',
  attendee: 'attendee',
};

function normalizeRole(role) {
  return ROLE_MAP[(role || '').toLowerCase()] || (role || '').toLowerCase();
}

// ─── Session Helpers ─────────────────────────────────────────────
function getCurrentUser() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (e) {}
  try {
    if (typeof CU !== 'undefined') CU = user;
  } catch (e) {}
}

function clearCurrentUser() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {}
  try {
    if (typeof CU !== 'undefined') CU = null;
  } catch (e) {}
}

// ─── Header Helpers ──────────────────────────────────────────────
function getRoleHeader() {
  const u = getCurrentUser();
  return u ? normalizeRole(u.role || u.userRole || '') : '';
}

function getUserIdHeader() {
  const u = getCurrentUser();
  return u ? u.userId || u.id || '' : '';
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
        : data?.message || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status, data);
    }

    if (options.method && options.method.toUpperCase() !== 'GET')
      window.EventFlowData?.invalidate();
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Network error (backend offline)
    if (
      e.message &&
      (e.message.toLowerCase().includes('fetch') ||
        e.message.toLowerCase().includes('network') ||
        e.name === 'TypeError')
    ) {
      throw new ApiError(
        'Backend server is offline. Please start the NestJS server on port 3001.',
        0
      );
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

async function apiGetClientDashboard() {
  return apiRequest('/analytics/client-dashboard');
}

async function apiGetOrganizerDashboard(organizerId) {
  return apiRequest('/analytics/organizer-dashboard');
}

async function apiGetMyActivity(limit = 5) {
  return apiRequest(`/activity-logs/me?limit=${Math.min(Math.max(Number(limit) || 5, 1), 20)}`);
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

async function apiGetEventPlans() {
  return apiRequest('/event-plans');
}

async function apiGetEventOrganizers() {
  return apiRequest('/event-requests/organizers');
}

async function apiCreateEventRequest(reqData) {
  return apiRequest('/event-requests', {
    method: 'POST',
    body: JSON.stringify(reqData),
  });
}

async function apiGetEventPolicy() {
  return apiRequest('/event-requests/policies');
}

async function apiAcceptEventRequest(requestId, acknowledgement) {
  return apiRequest(`/event-requests/${requestId}/accept`, {
    method: 'POST',
    body: JSON.stringify(acknowledgement),
  });
}

async function apiRejectEventRequest(requestId, request) {
  return apiRequest(`/event-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

async function apiRespondToEventRequest(requestId, response) {
  return apiRequest(`/event-requests/${requestId}/client-response`, {
    method: 'POST',
    body: JSON.stringify(response),
  });
}

async function apiAcceptCounteroffer(requestId, acknowledgement) {
  return apiRequest(`/event-requests/${requestId}/accept-counteroffer`, {
    method: 'POST',
    body: JSON.stringify(acknowledgement),
  });
}

async function apiPreviewClientEventCancellation(eventId) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}/cancellation-preview`);
}

async function apiCancelClientEvent(eventId, payload) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function apiPreviewClientRequestCancellation(id) {
  try {
    return await apiRequest(`/event-requests/${encodeURIComponent(id)}/cancellation-preview`);
  } catch (err) {
    if (err.status !== 404) throw err;
    return await apiRequest(`/events/${encodeURIComponent(id)}/cancellation-preview`);
  }
}

async function apiCancelClientRequest(id, payload) {
  try {
    return await apiRequest(`/event-requests/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err.status !== 404) throw err;
    return await apiRequest(`/events/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

async function apiUpdateAgreementStatus(requestId, agreementStatus = 'agreed') {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}/agreement`, {
    method: 'POST',
    body: JSON.stringify({ agreementStatus }),
  });
}

async function apiUpdateRequestStatus(requestId, status) {
  return apiRequest(`/event-requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

async function apiPayDeposit(requestId, payload = {}) {
  return apiRequest(`/event-requests/${requestId}/pay-deposit`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: 'DEMO_PROVIDER', ...payload }),
  });
}

async function apiRequestEventModification(requestId, payload) {
  return apiRequest(`/event-requests/${requestId}/modifications`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function apiRespondToEventModification(requestId, modId, payload) {
  return apiRequest(`/event-requests/${requestId}/modifications/${modId}/respond`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function apiRespondToEventProposal(requestId, decision, notes = '', acknowledgement = {}) {
  return apiRequest(`/event-requests/${requestId}/client-response`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes, ...acknowledgement }),
  });
}

// ─── EVENT PLANS ─────────────────────────────────────────────────
async function apiCreateEventPlan(planData) {
  return apiRequest('/event-plans', {
    method: 'POST',
    body: JSON.stringify(planData),
  });
}

async function apiDownloadEventPlanDocument(planId) {
  const response = await fetch(
    `${API_BASE_URL}/event-plans/${encodeURIComponent(planId)}/document`,
    {
      headers: getAuthHeader() ? { Authorization: getAuthHeader() } : {},
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new ApiError(
      message || `PDF download failed (${response.status})`,
      response.status,
      data
    );
  }
  return response.blob();
}

async function apiGetWorkflowEvents() {
  return apiRequest('/events');
}

async function apiApproveEventPlan(planId, approvalStatus, reason, comments, acknowledgement = {}) {
  return apiRequest(`/event-plans/${planId}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approvalStatus, reason, comments, ...acknowledgement }),
  });
}

// ─── REGISTRATIONS ───────────────────────────────────────────────
async function apiGetAttendeeRegistrations(attendeeId) {
  return apiRequest('/registrations');
}

async function apiGetOrganizerProfileReviews(organizerId) {
  return apiRequest(`/reviews/organizers/${encodeURIComponent(organizerId)}`);
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

async function apiPayForWorkflowEvent(eventId) {
  return apiRequest(`/payments/events/${encodeURIComponent(eventId)}`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: 'DEMO_PROVIDER' }),
  });
}

async function apiCompleteWorkflowEvent(eventId) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}/complete`, { method: 'POST' });
}

async function apiGetCompletionReports() {
  return apiRequest('/reports/events/completion');
}

async function apiSubmitCompletionReport(eventId, formData) {
  const response = await fetch(
    `${API_BASE_URL}/reports/events/${encodeURIComponent(eventId)}/completion`,
    {
      method: 'POST',
      headers: getAuthHeader() ? { Authorization: getAuthHeader() } : {},
      body: formData,
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new ApiError(
      message || `Report submission failed (${response.status})`,
      response.status,
      data
    );
  }
  return data;
}

async function apiGetPrivateOrganizerReviews() {
  return apiRequest('/reviews/client-organizer');
}

async function apiSubmitPrivateOrganizerReview(reviewData) {
  return apiRequest('/reviews/client-organizer', {
    method: 'POST',
    body: JSON.stringify(reviewData),
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

async function apiGetEventReports() {
  return apiRequest('/reports/events');
}
async function apiUploadEventReport(eventId, file) {
  const form = new FormData();
  form.set('file', file);
  const response = await fetch(
    `${API_BASE_URL}/reports/events/${encodeURIComponent(eventId)}/file`,
    {
      method: 'POST',
      headers: getAuthHeader() ? { Authorization: getAuthHeader() } : {},
      body: form,
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(data.message || 'Unable to submit the event report', response.status, data);
  return data;
}

async function apiCreateEventReport(reportData) {
  return apiRequest('/reports/events', {
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
window.apiGetClientDashboard = apiGetClientDashboard;
window.apiGetOrganizerDashboard = apiGetOrganizerDashboard;
window.apiGetMyActivity = apiGetMyActivity;
window.apiGetEventRequests = apiGetEventRequests;
window.apiGetClientRequests = apiGetClientRequests;
window.apiGetOrganizerRequests = apiGetOrganizerRequests;
window.apiGetEventPlans = apiGetEventPlans;
window.apiGetEventOrganizers = apiGetEventOrganizers;
window.apiCreateEventRequest = apiCreateEventRequest;
window.apiAcceptEventRequest = apiAcceptEventRequest;
window.apiRejectEventRequest = apiRejectEventRequest;
window.apiRespondToEventRequest = apiRespondToEventRequest;
window.apiAcceptCounteroffer = apiAcceptCounteroffer;
window.apiUpdateRequestStatus = apiUpdateRequestStatus;
window.apiUpdateAgreementStatus = apiUpdateAgreementStatus;
window.apiRespondToEventProposal = apiRespondToEventProposal;
window.apiCreateEventPlan = apiCreateEventPlan;
window.apiGetWorkflowEvents = apiGetWorkflowEvents;
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
