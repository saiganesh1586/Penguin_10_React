import { API_BASE_URL } from '../../app/config.js';

export function requestApiResponse(path, { token, method, body, signal } = {}) {
  return fetch(API_BASE_URL + path, {
    method,
    signal,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export async function requestJson(path, options) {
  const response = await requestApiResponse(path, options);
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok || result?.success === false) {
    const message = Array.isArray(result?.message) ? result.message.join(', ') : result?.message;
    throw Object.assign(new Error(message || `Request failed (${response.status})`), {
      status: response.status,
    });
  }
  return result?.data ?? result;
}
