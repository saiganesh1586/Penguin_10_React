import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { selectSession } from '../slices/authSlice.js';
import { requestApiResponse } from '../api/baseQuery.js';
import { API_BASE_URL } from '../../app/config.js';
import { readResourceResponse, readResourceWriteResponse } from '../api/resourceResponse.js';
import { readWorkspace } from '../actions/workspaceActions.js';

const actionByMethod = {
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'remove',
};

function createEndpointOperation(resource, name, [method, path, { public: publicRead = false } = {}]) {
  const pattern = new RegExp(`^${path.replace(':id', '[^/]+')}/?$`);
  function route({ id, query } = {}) {
    const search = new URLSearchParams(query).toString();
    return path.replace(':id', () => encodeURIComponent(id ?? '')) + (search ? `?${search}` : '');
  }
  const thunk = createAsyncThunk(`${resource}/${name}`, async (args = {}, thunkApi) => {
    const { getState, signal } = thunkApi;
    const token = args.request || publicRead ? undefined : selectSession(getState())?.token;
    if (!args.request && path.includes(':id') && (args.id == null || args.id === '')) {
      throw new Error('An ID is required for this operation.');
    }
    const request = args.request ?? (() =>
      requestApiResponse(route(args), { token, method, body: args.body, signal }));
    if (method === 'GET') return readResourceResponse({ request }, thunkApi);

    return readResourceWriteResponse(await request(signal));
  });
  return {
    thunk,
    method,
    pattern,
    key(args) {
      if (args?.key != null) return args.key;
      const { pathname, search } = new URL(API_BASE_URL + route(args));
      return pathname + search;
    },
  };
}

export function createResourceSlice(name, { workspaceField, endpoints = {} } = {}) {
  const read = createAsyncThunk(`${name}/readResource`, readResourceResponse);
  const write = operation => createAsyncThunk(`${name}/${operation}Resource`, async ({ request }) => {
    await readResourceWriteResponse(await request());
  });
  const create = write('create');
  const update = write('update');
  const remove = write('delete');
  const operations = Object.entries(endpoints).map(([operation, endpoint]) => [
    operation, createEndpointOperation(name, operation, endpoint),
  ]);
  const reads = [
    { thunk: read, key: args => args.key },
    ...operations.map(([, operation]) => operation).filter(operation => operation.method === 'GET'),
  ];
  const writes = [
    create, update, remove,
    ...operations.map(([, operation]) => operation).filter(operation => operation.method !== 'GET')
      .map(operation => operation.thunk),
  ];
  const writeFulfilled = isAnyOf(...writes.map(thunk => thunk.fulfilled));

  const slice = createSlice({
    name,
    initialState: {
      byQuery: {},
      pending: {},
      errors: {},
      workspace: null,
      workspaceReadId: null,
      pendingWrites: {},
      revision: 0,
    },
    reducers: {},
    extraReducers: builder => {
      for (const { thunk, key: queryKey } of reads) {
        builder
          .addCase(thunk.pending, (state, action) => {
            const key = queryKey(action.meta.arg);
            state.pending[key] = action.meta.requestId;
            delete state.errors[key];
          })
          .addCase(thunk.fulfilled, (state, action) => {
            const key = queryKey(action.meta.arg);
            if (state.pending[key] !== action.meta.requestId) return;
            delete state.pending[key];
            if (action.payload !== null) {
              delete state.byQuery[key];
              state.byQuery[key] = action.payload;
              const keys = Object.keys(state.byQuery);
              if (keys.length > 12) delete state.byQuery[keys[0]];
            }
          })
          .addCase(thunk.rejected, (state, action) => {
            const key = queryKey(action.meta.arg);
            if (state.pending[key] !== action.meta.requestId) return;
            delete state.pending[key];
            if (!action.meta.aborted) {
              state.errors[key] = action.error.message || 'Unable to load data.';
              const keys = Object.keys(state.errors);
              if (keys.length > 12) delete state.errors[keys[0]];
            }
          });
      }
      if (workspaceField) {
        builder
          .addCase(readWorkspace.pending, (state, action) => {
            state.workspaceReadId = action.meta.requestId;
          })
          .addCase(readWorkspace.fulfilled, (state, action) => {
            if (state.workspaceReadId !== action.meta.requestId) return;
            state.workspace = action.payload?.[workspaceField] ?? [];
          });
      }
      builder
        .addMatcher(isAnyOf(...writes.map(thunk => thunk.pending)), (state, action) => {
          state.pendingWrites[action.meta.requestId] = true;
        })
        .addMatcher(writeFulfilled, (state, action) => {
          const id = action.meta.requestId;
          if (!state.pendingWrites[id]) return;
          delete state.pendingWrites[id];
          state.pending = {};
          state.revision++;
        })
        .addMatcher(isAnyOf(...writes.map(thunk => thunk.rejected)), (state, action) => {
          delete state.pendingWrites[action.meta.requestId];
        });
    },
  });

  const fallback = { read, create, update, remove };
  return {
    reducer: slice.reducer,
    actions: Object.fromEntries(operations.map(([operation, { thunk }]) => [operation, thunk])),
    writeFulfilled,
    actionForRequest(method, path) {
      return operations.find(([, operation]) =>
        operation.method === method && operation.pattern.test(path)
      )?.[1].thunk ?? fallback[actionByMethod[method]];
    },
  };
}
