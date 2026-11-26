export async function readResourceResponse({ request }, { signal }) {
  const response = await request(signal);
  if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  if (!response.headers?.get('content-type')?.includes('application/json')) return null;
  const result = await response.clone().json();
  if (result?.success === false) throw new Error('The server rejected the request.');
  return result?.data ?? result;
}

export async function readResourceWriteResponse(response) {
  if (!response.ok) throw new Error(`Write failed (${response.status}).`);
  if (!response.headers?.get('content-type')?.includes('application/json')) return null;
  const result = await response.clone().json();
  if (result?.success === false) throw new Error('The server rejected the change.');
  return result?.data ?? result;
}
