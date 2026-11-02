import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function OrganizerReportDialog({
  event,
  recipient,
  onClose,
  onSubmit,
  onSubmitted,
}) {
  const dialog = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (submitting || !recipient) return;
    if (!file) {
      setError('Please select a report file to submit.');
      return;
    }
    if (!/\.(pdf|docx|xlsx)$/i.test(file.name) || file.size > 10 * 1024 * 1024) {
      setError('Choose a PDF, DOCX, or XLSX report no larger than 10 MB.');
      return;
    }
    if (!file.size) {
      setError('The selected report file is empty. Choose another file.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(file);
      await onSubmitted();
    } catch (failure) {
      setError(failure.message || 'Unable to submit the report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (!submitting) onClose();
    }
    if (event.key === 'Tab') {
      const controls = [
        ...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled)'),
      ];
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return createPortal(
    <div
      className="overlay open support-modal-overlay"
      onClick={event => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="organizer-report-title"
        tabIndex={-1}
        ref={dialog}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-head">
          <h2 className="modal-title" id="organizer-report-title">
            Submit Event Report
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Close report dialog"
            disabled={submitting}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form noValidate onSubmit={submit} aria-busy={submitting}>
          <div className="modal-body">
            <p className="mb-16">{event.title || event.name || 'Completed event'}</p>
            {recipient ? (
              <div className="form-group">
                <div className="form-label">Send report to</div>
                <div>{recipient.name || 'Requesting client'}</div>
                {recipient.email && <div className="small muted">{recipient.email}</div>}
                <p className="small muted mt-4">
                  This report is sent automatically to the client who requested this event.
                </p>
              </div>
            ) : (
              <p role="alert">
                This event has no requesting client linked to it. Client reports are available for
                events created from a client request.
              </p>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="organizer-report-file">
                Report file
              </label>
              <input
                className="form-control"
                id="organizer-report-file"
                type="file"
                accept=".pdf,.docx,.xlsx"
                disabled={submitting || !recipient}
                onChange={event => {
                  setFile(event.target.files?.[0] || null);
                  setError('');
                }}
                aria-describedby="organizer-report-file-help"
              />
              <p id="organizer-report-file-help" className="small muted mt-4">
                PDF, DOCX, or XLSX. Maximum 10 MB.
              </p>
              {file && <p className="small mt-4">Selected: {file.name}</p>}
            </div>
            {error && (
              <p role="alert" style={{ color: 'var(--red)' }}>
                {error}
              </p>
            )}
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost" type="button" disabled={submitting} onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={submitting || !recipient}>
              {submitting ? 'Submitting…' : 'Submit File'}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
