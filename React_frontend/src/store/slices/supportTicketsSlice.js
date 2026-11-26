import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import {
  listTickets,
  deleteTicket as deleteTicketRequest,
  sendFollowUp,
  submitTicket,
  updateTicketStatus,
  uploadAttachment,
} from '../../apps/customer-support/api/supportApi.js';
import { selectSession } from './authSlice.js';

export function supportIdentity(user) {
  const id = user?.id || user?.userId || 'anonymous';
  return `${id}:${user?.role || ''}:${user?.employeeType || ''}`;
}

function readCurrentUser(getState, identity) {
  const user = selectSession(getState());
  if (!user?.token || supportIdentity(user) !== identity) {
    throw new Error('Your session has changed. Please sign in again.');
  }
  return user;
}

async function refreshAfterWrite({ dispatch, getState }, identity) {
  if (supportIdentity(selectSession(getState())) === identity) {
    await dispatch(loadTickets({ identity }));
  }
}

const loadTickets = createAsyncThunk(
  'supportTickets/read',
  async ({ identity }, { getState, signal, rejectWithValue }) => {
    try {
      return await listTickets(readCurrentUser(getState, identity), signal);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to load support tickets.');
    }
  }
);

const createTicket = createAsyncThunk(
  'supportTickets/create',
  async ({ request, files = [], identity }, thunk) => {
    const user = readCurrentUser(thunk.getState, identity);
    const attachmentIds = [];
    for (const file of files) {
      attachmentIds.push((await uploadAttachment(user, file)).attachmentId);
    }
    const result = await submitTicket(user, { ...request, attachmentIds });
    await refreshAfterWrite(thunk, identity);
    return result;
  }
);

const sendTicketFollowUp = createAsyncThunk(
  'supportTickets/followUp',
  async ({ id, message, identity }, thunk) => {
    const result = await sendFollowUp(readCurrentUser(thunk.getState, identity), id, message);
    await refreshAfterWrite(thunk, identity);
    return result;
  }
);

const updateTicket = createAsyncThunk('supportTickets/update', async ({ id, values, identity }, { getState }) =>
  updateTicketStatus(readCurrentUser(getState, identity), id, values)
);

const deleteTicket = createAsyncThunk('supportTickets/delete', async ({ id, identity }, { getState }) => {
  await deleteTicketRequest(readCurrentUser(getState, identity), id);
  return id;
});

const supportTicketsSlice = createSlice({
  name: 'supportTickets',
  initialState: {
    identity: '',
    tickets: [],
    loading: false,
    error: '',
    requestId: null,
    pendingWrites: {},
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadTickets.pending, (state, action) => {
        if (state.identity !== action.meta.arg.identity) state.tickets = [];
        state.identity = action.meta.arg.identity;
        state.loading = true;
        state.error = '';
        state.requestId = action.meta.requestId;
      })
      .addCase(loadTickets.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.tickets = action.payload;
        state.loading = false;
        state.error = '';
        state.requestId = null;
      })
      .addCase(loadTickets.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload || action.error.message || 'Unable to load support tickets.';
        state.requestId = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        if (state.identity !== action.meta.arg.identity || !state.pendingWrites[action.meta.requestId]) return;
        const index = state.tickets.findIndex(ticket => ticket.ticketId === action.payload.ticketId);
        if (index !== -1) state.tickets[index] = action.payload;
        state.requestId = null;
        state.loading = false;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        if (state.identity !== action.meta.arg.identity || !state.pendingWrites[action.meta.requestId]) return;
        state.tickets = state.tickets.filter(ticket => ticket.ticketId !== action.payload);
        state.requestId = null;
        state.loading = false;
      })
      .addMatcher(isAnyOf(updateTicket.pending, deleteTicket.pending), (state, action) => {
        state.pendingWrites[action.meta.requestId] = true;
      })
      .addMatcher(isAnyOf(
        updateTicket.fulfilled, deleteTicket.fulfilled, updateTicket.rejected, deleteTicket.rejected
      ), (state, action) => {
        delete state.pendingWrites[action.meta.requestId];
      });
  },
});

export const supportTicketsReducer = supportTicketsSlice.reducer;
export const supportTicketsActions = {
  loadTickets, createTicket, updateTicket, deleteTicket, sendTicketFollowUp,
};
