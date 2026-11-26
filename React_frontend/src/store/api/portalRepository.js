import { resourceAction, resourceForRequest } from '../slices/resourcesSlice.js';

// Keep legacy response handling in the caller. Only successful HTTP writes invalidate Redux data.
async function write({ request, onCommitted, refresh }) {
  const response = await request();
  if (!response.ok) throw new Error(`Write failed (${response.status}).`);
  if (refresh) onCommitted();
  return { refresh };
}

export function createPortalRepository(read) {
  return { read, create: write, update: write, delete: write };
}

const nonWorkspaceWrites = /(?:\/auth\/(?:login|register|password|organizer-application)|\/users\/me\/password|\/support\/attachments|\/uploads)$/;

export function createRuntimeFetch(
  dispatch,
  { createRecord, updateRecord, deleteRecord, invalidate: invalidatePortal },
  invalidate,
  getSessionToken
) {
  const mutations = {
    POST: createRecord,
    PUT: updateRecord,
    PATCH: updateRecord,
    DELETE: deleteRecord,
  };
  return async (url, options) => {
    const method = options?.method?.toUpperCase() || 'GET';
    const mutation = mutations[method];
    const parsedUrl = new URL(url, window.location.href);
    const resource = getSessionToken && resourceForRequest(parsedUrl.pathname);
    const action = resource && resourceAction(resource, method, parsedUrl.pathname);
    if (!mutation && !action) return fetch(url, options);

    // The original Response and network error stay available to the legacy workflow.
    const token = getSessionToken?.();
    let response;
    let networkError;
    const request = async () => {
      try {
        response = await fetch(url, options);
        return response;
      } catch (error) {
        networkError = error;
        throw error;
      }
    };
    const refresh = !nonWorkspaceWrites.test(parsedUrl.pathname);
    if (action) {
      const result = await dispatch(action({ key: parsedUrl.pathname + parsedUrl.search, request }));
      if (mutation && refresh && action.fulfilled.match(result) && token === getSessionToken()) {
        invalidate();
        dispatch(invalidatePortal());
      }
    } else {
      await dispatch(mutation({
        request,
        refresh,
        onCommitted: () => {
          if (!getSessionToken || token === getSessionToken()) invalidate();
        },
      }));
    }
    if (networkError) throw networkError;
    return response;
  };
}

const runtimeHelper = value => typeof value === 'function' || value instanceof Map;

export function readRuntimeData(snapshot, fields = {}) {
  const data = Object.fromEntries(
    Object.entries(snapshot).filter(([key, value]) => key !== 'actions' && !runtimeHelper(value))
  );
  for (const [key, read] of Object.entries(fields)) {
    if (snapshot[read]) data[key] = snapshot[read]();
  }
  if (data.CU) {
    const { token, password, ...user } = data.CU;
    data.CU = user;
  }
  // Copy the data before Redux freezes it and the runtime processes another response.
  return JSON.parse(JSON.stringify(data));
}

export function getRuntimeHelpers(runtime, data) {
  return Object.fromEntries(
    Object.entries(runtime?.snapshot(undefined, data) || {}).filter(([, value]) =>
      runtimeHelper(value)
    )
  );
}

