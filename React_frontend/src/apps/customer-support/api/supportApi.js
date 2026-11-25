import { API_BASE_URL } from '../../../app/config.js';

async function apiRequest(endpoint, user, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(', ')
        : result?.message || `Request failed (${response.status})`
    );
  }
  return result;
}

export async function downloadAttachment(attachment, user) {
  const response = await fetch(
    `${API_BASE_URL}/support/attachments/${encodeURIComponent(attachment.attachmentId)}`,
    {
      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
    }
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || `Download failed (${response.status})`);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.originalName;
  link.click();
  URL.revokeObjectURL(url);
}

export const listTickets = (user, signal) => apiRequest('/support/tickets', user, { signal });
export const submitTicket = (user, request) =>
  apiRequest('/support/tickets', user, { method: 'POST', body: JSON.stringify(request) });
export const sendFollowUp = (user, id, message) =>
  apiRequest(`/support/tickets/${encodeURIComponent(id)}/follow-ups`, user, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
export const updateTicketStatus = (user, id, values) =>
  apiRequest(`/support/tickets/${encodeURIComponent(id)}/status`, user, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
export const deleteTicket = (user, id) =>
  apiRequest(`/support/tickets/${encodeURIComponent(id)}`, user, { method: 'DELETE' });
export async function uploadAttachment(user, file) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/support/attachments', user, { method: 'POST', body: form });
}
