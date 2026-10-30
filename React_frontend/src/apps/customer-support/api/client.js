import { API_BASE_URL } from '../../../app/config.js';

export async function apiRequest(endpoint, user, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(Array.isArray(result?.message) ? result.message.join(', ') : result?.message || `Request failed (${response.status})`);
  }
  return result;
}

export async function downloadAttachment(attachment, user) {
  const response = await fetch(`${API_BASE_URL}/support/attachments/${encodeURIComponent(attachment.attachmentId)}`, {
    headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
  });
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
