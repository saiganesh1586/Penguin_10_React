import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { eventChatActions, selectEventChat } from '../../store/slices/eventChatSlice.js';

const POLL_INTERVAL = 4000;
const MAX_MESSAGE_LENGTH = 2000;
const messageDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function EventChat({ eventId }) {
  const dispatch = useDispatch();
  const {
    data: chat,
    loadError,
    writeId,
    writeError,
  } = useSelector(state => selectEventChat(state, eventId));
  const [refresh, setRefresh] = useState(0);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const pendingMessage = useRef(null);
  const log = useRef(null);
  const followLatest = useRef(true);
  const latestMessageId = chat?.messages.at(-1)?.id;

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    async function load() {
      const action = await dispatch(eventChatActions.read({ eventId }, { signal: controller.signal }));
      if (!controller.signal.aborted && ![401, 403, 404].includes(action.payload)) {
        timer = setTimeout(load, POLL_INTERVAL);
      }
    }

    load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [dispatch, eventId, refresh]);

  useEffect(() => {
    if (followLatest.current && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [latestMessageId]);

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!chat || writeId || !text) return;

    try {
      if (editingId) {
        await dispatch(eventChatActions.update({ eventId, messageId: editingId, text })).unwrap();
      } else {
        if (pendingMessage.current?.text !== text) {
          pendingMessage.current = { id: crypto.randomUUID(), text };
        }
        followLatest.current = true;
        await dispatch(eventChatActions.create({ eventId, message: pendingMessage.current })).unwrap();
        pendingMessage.current = null;
      }
      resetComposer();
    } catch {
      // Keep the draft for retry. The rejected thunk supplies the feedback.
    }
  }

  function resetComposer() {
    setDraft('');
    setEditingId(null);
    dispatch(eventChatActions.clearWriteError(eventId));
  }

  async function deleteMessage(messageId) {
    if (writeId || !window.confirm('Delete this message?')) return;
    const action = await dispatch(eventChatActions.remove({ eventId, messageId }));
    if (eventChatActions.remove.fulfilled.match(action) && editingId === messageId) resetComposer();
  }

  return (
    <aside
      className="card event-chat"
      id="event-chat"
      aria-labelledby="event-chat-title"
      tabIndex={-1}
    >
      <header className="event-chat-header">
        <h2 id="event-chat-title">Event chat</h2>
        {chat?.participantName && <p>Conversation with {chat.participantName}</p>}
      </header>

      <div
        className="event-chat-log"
        role="log"
        aria-label="Event messages"
        tabIndex={0}
        ref={log}
        onScroll={event => {
          const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
          followLatest.current = scrollHeight - scrollTop - clientHeight < 48;
        }}
      >
        {chat?.messages.length ? (
          <ol className="event-chat-messages">
            {chat.messages.map(message => (
              <li key={message.id} className={message.isOwn ? 'event-chat-message-own' : ''}>
                <div className="event-chat-message-meta">
                  <strong>{message.isOwn ? 'You' : chat.participantName}</strong>
                  <time dateTime={message.createdAt}>
                    {messageDate.format(new Date(message.createdAt))}
                  </time>
                </div>
                <p>{message.text}</p>
                {message.isOwn && (
                  <div className="event-chat-message-meta">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      disabled={Boolean(writeId)}
                      onClick={() => {
                        dispatch(eventChatActions.clearWriteError(eventId));
                        setEditingId(message.id);
                        setDraft(message.text);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      disabled={Boolean(writeId)}
                      onClick={() => deleteMessage(message.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          !loadError && (
            <p className="event-chat-empty">
              {chat ? 'No messages yet. Start the conversation below.' : 'Loading messages…'}
            </p>
          )
        )}
      </div>

      <form className="event-chat-form" onSubmit={send}>
        {loadError && (
          <div className="event-chat-status" role="status">
            <span>{loadError}</span>
            <button
              className="btn btn-ghost btn-xs"
              type="button"
              onClick={() => setRefresh(value => value + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {writeError && (
          <p className="event-chat-status" role="alert">
            {writeError}
          </p>
        )}
        <textarea
          className="form-control"
          aria-label="Message"
          placeholder="Write a message…"
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          value={draft}
          disabled={!chat}
          readOnly={Boolean(writeId)}
          onChange={event => {
            setDraft(event.target.value);
            dispatch(eventChatActions.clearWriteError(eventId));
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={!chat || !draft.trim() || Boolean(writeId)}
        >
          {editingId ? 'Save edit' : 'Send'}
        </button>
        {editingId && (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            disabled={Boolean(writeId)}
            onClick={resetComposer}
          >
            Cancel edit
          </button>
        )}
      </form>
    </aside>
  );
}
