import { useRef, useState } from 'react';
import { allowedCategories, SUPPORT_CONCERNS } from '../utils/supportConfig.js';

export default function SupportRequestForm({ user, onSubmit, onEditing }) {
  const [type, setType] = useState(''), [concern, setConcern] = useState(''), [description, setDescription] = useState('');
  const [files, setFiles] = useState([]), [feedback, setFeedback] = useState(''), [isError, setIsError] = useState(false), [busy, setBusy] = useState(false);
  const pending = useRef(false), fileInput = useRef(null);
  const editing = (nextType, nextDescription, nextFiles) => onEditing(Boolean(nextType || nextDescription || nextFiles.length));
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    setFeedback(''); setIsError(false);
    if (!event.currentTarget.reportValidity()) { setIsError(true); setFeedback('Complete all required fields before submitting.'); return; }
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']);
    if (files.length > 5 || files.some(file => !allowed.has(file.type) || file.size > 5 * 1024 * 1024)) {
      setIsError(true); setFeedback('Choose up to 5 JPG, PNG, WEBP, PDF, or TXT files, each no larger than 5 MB.'); return;
    }
    pending.current = true; setBusy(true);
    try {
      const created = await onSubmit({ requestType: type, concern, description: description.trim() }, files);
      setType(''); setConcern(''); setDescription(''); setFiles([]); onEditing(false);
      if (fileInput.current) fileInput.current.value = '';
      setFeedback(`Request submitted. Your ticket number is ${created.ticketId}.`);
    } catch (error) { setIsError(true); setFeedback(error.message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <section className="card card-lg">
    <h2 className="support-card-title">Submit a support request</h2>
    <form id="support-request-form" noValidate onSubmit={submit}>
      <div className="form-group"><label className="form-label" htmlFor="support-request-type">Request Type <span aria-hidden="true">*</span></label>
        <select className="form-control" id="support-request-type" name="requestType" required value={type} onChange={event => { setType(event.target.value); setConcern(''); editing(event.target.value, description, files); }}>
          <option value="">Select a request type</option>{allowedCategories(user).map(category => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>
      <div className="form-group" id="support-concern-group" hidden={!type}><label className="form-label" htmlFor="support-concern">Type of Concern <span aria-hidden="true">*</span></label>
        <select className="form-control" id="support-concern" name="concern" required={Boolean(type)} disabled={!type} value={concern} onChange={event => setConcern(event.target.value)}>
          <option value="">Select a concern</option>{(SUPPORT_CONCERNS[type] || []).map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label" htmlFor="support-description">Description <span aria-hidden="true">*</span></label>
        <textarea className="form-control" id="support-description" name="description" rows={5} maxLength={5000} required value={description} onChange={event => { setDescription(event.target.value); editing(type, event.target.value, files); }} />
      </div>
      <div className="form-group"><label className="form-label" htmlFor="support-attachments">Attachments <span className="small">(optional; up to 5 files, 5 MB each)</span></label>
        <input ref={fileInput} className="form-control" id="support-attachments" name="attachments" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.txt" onChange={event => { const next = Array.from(event.target.files || []); setFiles(next); editing(type, description, next); }} />
        <p className="support-hint">Accepted formats: JPG, PNG, WEBP, PDF, TXT.</p>
        <div id="support-selected-files" className="support-selected-files">{files.map(file => file.name).join(', ')}</div>
      </div>
      <p className={`support-feedback${isError ? ' is-error' : feedback ? ' is-success' : ''}`} id="support-feedback" role="status" aria-live="polite">{feedback}</p>
      <button className="btn btn-primary" id="support-submit" type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit Request'}</button>
    </form>
  </section>;
}
