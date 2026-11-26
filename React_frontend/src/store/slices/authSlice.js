import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { requestJson } from '../api/baseQuery.js';
import { normalizeSession, readPersistedSession } from '../session.js';

const authenticate = createAsyncThunk(
  'auth/login',
  async (submitCredentials, { signal }) => {
    const user = normalizeSession(await submitCredentials(signal));
    if (!user) throw new Error('The account did not return a valid session.');
    return user;
  }
);

export const login = credentials => async (dispatch, getState) => {
  const user = await dispatch(authenticate(signal => requestJson('/auth/login', {
    method: 'POST',
    body: credentials,
    signal,
  }))).unwrap();
  if (selectSession(getState()) !== user) throw new Error('The sign-in request was superseded.');
  return user;
};

export const saveAccountPreferences = createAsyncThunk(
  'users/savePreferences',
  async (preferences, { getState, signal }) => {
    const user = selectSession(getState());
    if (!user?.userId) throw new Error('Sign in again to update your preferences.');
    return requestJson(`/users/${encodeURIComponent(user.userId)}`, {
      token: user.token,
      method: 'PATCH',
      body: { preferences },
      signal,
    });
  }
);

const preferenceStatus = { requestId: null, error: '' };
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loginRequestId: null, error: '', preferenceStatus },
  reducers: {
    sessionRestored(state, action) {
      state.user = action.payload;
      state.loginRequestId = null;
      state.error = '';
      state.preferenceStatus = preferenceStatus;
    },
    registrationConfirmed(state, action) {
      state.user = normalizeSession(action.payload);
      state.loginRequestId = null;
      state.error = '';
      state.preferenceStatus = preferenceStatus;
    },
    profileReceived(state, action) {
      const profile = action.payload;
      if (!state.user || state.user.userId !== (profile.userId || profile.id)) return;
      if (profile.updatedAt && state.user.updatedAt &&
        new Date(profile.updatedAt) < new Date(state.user.updatedAt)) return;
      const user = normalizeSession({ ...state.user, ...profile, token: state.user.token });
      if (user) state.user = user;
    },
    logout(state) {
      state.user = null;
      state.loginRequestId = null;
      state.error = '';
      state.preferenceStatus = preferenceStatus;
    },
  },
  extraReducers: builder => builder
    .addCase(authenticate.pending, (state, action) => {
      state.loginRequestId = action.meta.requestId;
      state.error = '';
    })
    .addCase(authenticate.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.loginRequestId) return;
      state.user = action.payload;
      state.loginRequestId = null;
      state.preferenceStatus = preferenceStatus;
    })
    .addCase(authenticate.rejected, (state, action) => {
      if (action.meta.requestId !== state.loginRequestId) return;
      state.loginRequestId = null;
      state.error = action.error.message || 'Could not sign in.';
    })
    .addCase(saveAccountPreferences.pending, (state, action) => {
      state.preferenceStatus = { requestId: action.meta.requestId, error: '' };
    })
    .addCase(saveAccountPreferences.fulfilled, (state, action) => {
      if (state.preferenceStatus.requestId !== action.meta.requestId || !state.user) return;
      state.preferenceStatus = preferenceStatus;
      state.user.preferences = action.payload.preferences;
      state.user.updatedAt = action.payload.updatedAt;
    })
    .addCase(saveAccountPreferences.rejected, (state, action) => {
      if (state.preferenceStatus.requestId !== action.meta.requestId) return;
      state.preferenceStatus = { requestId: null, error: action.error.message };
    }),
});

export const authReducer = authSlice.reducer;
export const { logout, profileReceived, registrationConfirmed } = authSlice.actions;
export const restoreSession = () => authSlice.actions.sessionRestored(readPersistedSession());
export const selectSession = state => state.auth.user;
export const selectPreferenceStatus = state => state.auth.preferenceStatus;
