import { useState } from 'react';

const ratings = [
  ['5', '★★★★★ - Excellent'],
  ['4', '★★★★ - Good'],
  ['3', '★★★ - Average'],
  ['2', '★★ - Poor'],
  ['1', '★ - Very poor'],
];

export default function OrganizerReviewForm({ onSubmitReview }) {
  const [review, setReview] = useState({ rating: '', comment: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setReview(current => ({ ...current, [field]: value }));
    setError('');
  }

  async function submitReview(event) {
    event.preventDefault();
    if (submitting) return;
    const rating = Number(review.rating);
    const comment = review.comment.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      setError('Choose a 1–5 star rating and enter a written review.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmitReview({ rating, comment });
    } catch (error) {
      setError(error.message || 'Unable to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={submitReview}
      aria-busy={submitting}
      style={{
        marginTop: '14px',
        padding: '16px',
        background: 'var(--surface2)',
        borderRadius: '10px',
      }}
    >
      <h3 style={{ margin: '0 0 10px' }}>Review the Organizer</h3>
      <div className="form-group">
        <label className="form-label" htmlFor="workflow-review-rating">
          Rating
        </label>
        <select
          className="form-control"
          id="workflow-review-rating"
          value={review.rating}
          onChange={event => updateField('rating', event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'workflow-review-error' : undefined}
          disabled={submitting}
          required
        >
          <option value="">Choose stars</option>
          {ratings.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="workflow-review-comment">
          Written review
        </label>
        <textarea
          className="form-control"
          id="workflow-review-comment"
          rows="3"
          value={review.comment}
          onChange={event => updateField('comment', event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'workflow-review-error' : undefined}
          disabled={submitting}
          required
        />
      </div>
      {error && <p id="workflow-review-error" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
