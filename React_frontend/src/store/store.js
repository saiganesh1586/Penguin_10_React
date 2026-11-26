import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { adminSlice } from './slices/adminSlice.js';
import { attendeeSlice } from './slices/attendeeSlice.js';
import { clientSlice } from './slices/clientSlice.js';
import { supportExecutiveSlice } from './slices/supportExecutiveSlice.js';
import { supportTicketsReducer } from './slices/supportTicketsSlice.js';
import { financeExecutiveSlice } from './slices/financeExecutiveSlice.js';
import { organizerSlice } from './slices/organizerSlice.js';
import { landingSlice } from './slices/landingSlice.js';
import { authReducer, restoreSession, selectSession } from './slices/authSlice.js';
import { persistSession } from './session.js';
import { eventChatReducer } from './slices/eventChatSlice.js';
import { directResourceWriteCommitted, resourceReducers, workspaceReducer } from './slices/resourcesSlice.js';
import { invalidateWorkspace } from './actions/workspaceActions.js';

export const portalSlices = {
  admin: adminSlice,
  attendee: attendeeSlice,
  client: clientSlice,
  employee1: supportExecutiveSlice,
  employee2: financeExecutiveSlice,
  organizer: organizerSlice,
  landing: landingSlice,
};

const reducer = combineReducers({
  ...Object.fromEntries(Object.values(portalSlices).map(slice => [slice.name, slice.reducer])),
  auth: authReducer,
  eventChatMessages: eventChatReducer,
  resources: combineReducers(resourceReducers),
  workspace: workspaceReducer,
  supportTickets: supportTicketsReducer,
});

const workspaceListener = createListenerMiddleware();
workspaceListener.startListening({
  predicate: (action, _, previousState) => directResourceWriteCommitted(action, previousState),
  effect: (_, { dispatch }) => {
    globalThis.window?.EventFlowData?.invalidate?.();
    dispatch(invalidateWorkspace());
  },
});

export const store = configureStore({
  reducer(state, action) {
    const next = reducer(state, action);
    if (!state || state.auth.user?.token === next.auth.user?.token) return next;
    return { ...reducer(undefined, { type: 'auth/resetWorkspace' }), auth: next.auth };
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(workspaceListener.middleware),
  devTools: {
    stateSanitizer: state => ({
      ...state,
      auth: {
        ...state.auth,
        user: state.auth.user && { ...state.auth.user, token: '[hidden]' },
      },
    }),
    actionSanitizer: action => action.payload?.token
      ? { ...action, payload: { ...action.payload, token: '[hidden]' } }
      : action,
  },
});

store.dispatch(restoreSession());
let session = selectSession(store.getState());
persistSession(session);
store.subscribe(() => {
  const user = selectSession(store.getState());
  if (session === user) return;
  session = user;
  persistSession(user);
});
