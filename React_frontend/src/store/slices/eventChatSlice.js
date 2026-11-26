import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { selectSession } from './authSlice.js';
import { requestJson } from '../api/baseQuery.js';

const chatPath = eventId => `/events/${encodeURIComponent(eventId)}/chat`;

function chatToken(getState) {
  const token = selectSession(getState())?.token;
  if (!token) throw Object.assign(new Error('Sign in to use event chat.'), { status: 401 });
  return token;
}

const read = createAsyncThunk(
  'eventChatMessages/read',
  async ({ eventId }, { getState, signal, rejectWithValue }) => {
    try {
      return await requestJson(chatPath(eventId), { token: chatToken(getState), signal });
    } catch (error) {
      return rejectWithValue(error.status || 0);
    }
  }
);

function write(operation, method, getRequest) {
  return createAsyncThunk(`eventChatMessages/${operation}`, async (input, { dispatch, getState }) => {
    const token = chatToken(getState);
    const { path, body } = getRequest(input);
    await requestJson(path, { token, method, body });
    if (selectSession(getState())?.token === token) {
      await dispatch(read({ eventId: input.eventId }));
    }
  });
}

const messagePath = ({ eventId, messageId }) => `${chatPath(eventId)}/${encodeURIComponent(messageId)}`;
const create = write('create', 'POST', ({ eventId, message }) => ({
  path: chatPath(eventId),
  body: message,
}));
const update = write('update', 'PATCH', input => ({
  path: messagePath(input),
  body: { text: input.text },
}));
const remove = write('delete', 'DELETE', input => ({ path: messagePath(input) }));

const emptyConversation = {
  data: null,
  loadError: '',
  unavailable: false,
  readId: null,
  writeId: null,
  writeError: '',
};

const eventChat = createSlice({
  name: 'eventChatMessages',
  initialState: {},
  reducers: {
    clearWriteError(state, action) {
      const conversation = state[action.payload];
      if (conversation) conversation.writeError = '';
    },
  },
  extraReducers: builder => builder
    .addCase(read.pending, (state, action) => {
      const eventId = action.meta.arg.eventId;
      const conversation = state[eventId] ??= { ...emptyConversation };
      conversation.readId = action.meta.requestId;
    })
    .addCase(read.fulfilled, (state, action) => {
      const conversation = state[action.meta.arg.eventId];
      if (conversation?.readId !== action.meta.requestId) return;
      conversation.data = action.payload;
      conversation.readId = null;
      conversation.loadError = '';
      conversation.unavailable = false;
    })
    .addCase(read.rejected, (state, action) => {
      const conversation = state[action.meta.arg.eventId];
      if (conversation?.readId !== action.meta.requestId) return;
      conversation.readId = null;
      if (action.meta.aborted) return;
      conversation.unavailable = [401, 403, 404].includes(action.payload);
      if (conversation.unavailable) conversation.data = null;
      conversation.loadError = conversation.unavailable
        ? 'Event chat is unavailable.'
        : 'Could not load messages.';
    })
    .addMatcher(isAnyOf(create.pending, update.pending, remove.pending), (state, action) => {
      const eventId = action.meta.arg.eventId;
      const conversation = state[eventId] ??= { ...emptyConversation };
      conversation.writeError = '';
      conversation.writeId = action.meta.requestId;
    })
    .addMatcher(isAnyOf(create.fulfilled, update.fulfilled, remove.fulfilled), (state, action) => {
      const conversation = state[action.meta.arg.eventId];
      if (conversation?.writeId === action.meta.requestId) conversation.writeId = null;
    })
    .addMatcher(isAnyOf(create.rejected, update.rejected, remove.rejected), (state, action) => {
      const conversation = state[action.meta.arg.eventId];
      if (conversation?.writeId !== action.meta.requestId) return;
      conversation.writeId = null;
      conversation.writeError = 'Could not save the message change. Try again.';
    }),
});

export const eventChatReducer = eventChat.reducer;
export const eventChatActions = { read, create, update, remove, ...eventChat.actions };
export const selectEventChat = (state, eventId) =>
  state.eventChatMessages[eventId] ?? emptyConversation;
