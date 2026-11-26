import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { invalidateWorkspace } from '../actions/workspaceActions.js';

function invalidateView(state) {
  state.revision++;
  state.requestId = null;
  state.loading = false;
}

export function createPortalSlice(name, repository) {
  const loadData = createAsyncThunk(
    `${name}/read`,
    async (args, { signal, dispatch, getState, rejectWithValue }) => {
      try {
        return await repository.read({ ...args, signal, dispatch, getState });
      } catch (error) {
        return rejectWithValue(error.message || 'Unable to load data.');
      }
    }
  );

  const mutation = operation =>
    createAsyncThunk(`${name}/${operation}`, args => repository[operation](args));
  const createRecord = mutation('create');
  const updateRecord = mutation('update');
  const deleteRecord = mutation('delete');

  const slice = createSlice({
    name,
    initialState: {
      data: null,
      page: null,
      loading: false,
      error: '',
      requestId: null,
      pendingWrites: {},
      revision: 0,
    },
    reducers: {
      reset: () => slice.getInitialState(),
      invalidate: invalidateView,
    },
    extraReducers: builder => {
      builder
        .addCase(invalidateWorkspace, invalidateView)
        .addCase(loadData.pending, (state, action) => {
          state.loading = true;
          state.error = '';
          state.requestId = action.meta.requestId;
        })
        .addCase(loadData.fulfilled, (state, action) => {
          if (state.requestId !== action.meta.requestId) return;
          state.data = action.payload;
          state.page = action.meta.arg.page;
          state.loading = false;
          state.error = '';
          state.requestId = null;
        })
        .addCase(loadData.rejected, (state, action) => {
          if (state.requestId !== action.meta.requestId) return;
          state.loading = false;
          state.error = action.payload || action.error.message || 'Unable to load data.';
          state.requestId = null;
        });
      builder
        .addMatcher(
          isAnyOf(createRecord.pending, updateRecord.pending, deleteRecord.pending),
          (state, action) => {
            state.pendingWrites[action.meta.requestId] = true;
          }
        )
        .addMatcher(
          isAnyOf(createRecord.fulfilled, updateRecord.fulfilled, deleteRecord.fulfilled),
          (state, action) => {
            const id = action.meta.requestId;
            if (!state.pendingWrites[id]) return;
            delete state.pendingWrites[id];
            if (action.payload.refresh) invalidateView(state);
          }
        )
        .addMatcher(
          isAnyOf(createRecord.rejected, updateRecord.rejected, deleteRecord.rejected),
          (state, action) => {
            delete state.pendingWrites[action.meta.requestId];
          }
        );
    },
  });

  return {
    name,
    reducer: slice.reducer,
    actions: { ...slice.actions, loadData, createRecord, updateRecord, deleteRecord },
  };
}
