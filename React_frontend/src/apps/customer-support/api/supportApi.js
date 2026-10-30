import { apiRequest } from './client.js';

export const listTickets = (user, signal) => apiRequest('/support/tickets', user, { signal });
export const submitTicket = (user, request) => apiRequest('/support/tickets', user, { method: 'POST', body: JSON.stringify(request) });
export const sendFollowUp = (user, id, message) => apiRequest(`/support/tickets/${encodeURIComponent(id)}/follow-ups`, user, {
  method: 'POST', body: JSON.stringify({ message }),
});
export async function uploadAttachment(user, file) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/support/attachments', user, { method: 'POST', body: form });
}
