import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardActivity from '../src/apps/client/components/DashboardActivity.jsx';
import DashboardUpcomingEvents from '../src/apps/client/components/DashboardUpcomingEvents.jsx';
import OrganizerReviewForm from '../src/apps/client/components/OrganizerReviewForm.jsx';
import RequestDetailsPage from '../src/apps/client/pages/RequestDetailsPage.jsx';
import { ClientContext } from '../src/apps/client/context/ClientContext.jsx';
import useClientActivity from '../src/apps/client/context/useClientActivity.js';
import { WorkflowFileReports } from '../src/apps/client/components/WorkflowDetails.jsx';
import fixtures from './role-fixtures.cjs';

describe('Client course concepts', () => {
  it('renders dashboard panels from props and preserves activity rows when records reorder', () => {
    const onViewRequest = vi.fn();
    const rows = [
      { id: 'activity-1', requestId: 'request-1', description: 'Request submitted' },
      { id: 'activity-2', requestId: 'request-2', description: 'Booking confirmed' },
    ];
    const props = {
      loading: false,
      error: '',
      onViewRequest,
      clientActivityLabel: activity => activity.description,
      clientActivityIcon: () => '✓',
      clientActivityTime: () => 'Today',
      reqBadge: () => 'green',
    };
    const view = render(<DashboardActivity {...props} rows={rows} />);
    const firstDescription = screen.getByText('Request submitted');
    view.rerender(<DashboardActivity {...props} rows={[rows[1], rows[0]]} />);
    expect(screen.getByText('Request submitted')).toBe(firstDescription);
    fireEvent.click(screen.getAllByText('View Request Status')[0]);
    expect(onViewRequest).toHaveBeenCalledWith('request-2');
    view.unmount();

    const onViewEvent = vi.fn();
    render(
      <DashboardUpcomingEvents
        events={[{ id: 'event-1', title: 'Conference' }]}
        onViewEvent={onViewEvent}
        clientUpcomingEventDate={() => 'Tomorrow'}
      />
    );
    fireEvent.click(screen.getByText('View Event'));
    expect(onViewEvent).toHaveBeenCalledWith('event-1');
  });

  it('exposes a retry after an activity failure and ignores obsolete responses', async () => {
    const responses = [];
    vi.stubGlobal('apiGetMyActivity', vi.fn(() => new Promise(resolve => responses.push(resolve))));
    const { result, rerender, unmount } = renderHook(
      ({ refreshKey }) => useClientActivity(refreshKey),
      { initialProps: { refreshKey: 'first' } }
    );
    await waitFor(() => expect(responses).toHaveLength(1));
    const retry = result.current.retry;
    rerender({ refreshKey: 'second' });
    await waitFor(() => expect(responses).toHaveLength(2));
    await act(async () => responses[1]([{ id: 'new' }]));
    expect(result.current.rows[0].id).toBe('new');
    await act(async () => responses[0]([{ id: 'old' }]));
    expect(result.current.rows[0].id).toBe('new');
    expect(result.current.retry).toBe(retry);

    window.apiGetMyActivity.mockImplementationOnce(() => { throw new Error('Offline'); });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBe('Offline'));
    act(() => result.current.retry());
    await waitFor(() => expect(responses).toHaveLength(3));
    await act(async () => responses[2]([{ id: 'retried' }]));
    expect(result.current.rows[0].id).toBe('retried');
    expect(result.current.error).toBe('');
    unmount();
  });

  it('validates review state and waits for the parent callback without duplicate submissions', async () => {
    let finish;
    const onSubmitReview = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    render(<OrganizerReviewForm onSubmitReview={onSubmitReview} />);
    fireEvent.click(screen.getByText('Submit Review'));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a 1–5 star rating');
    expect(onSubmitReview).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Written review'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Submit Review'));
    expect(onSubmitReview).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Written review'), { target: { value: '  Well organized  ' } });
    fireEvent.click(screen.getByText('Submit Review'));
    expect(onSubmitReview).toHaveBeenCalledWith({ rating: 5, comment: 'Well organized' });
    expect(screen.getByText('Submitting…')).toBeDisabled();
    fireEvent.submit(screen.getByText('Submitting…').closest('form'));
    expect(onSubmitReview).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(screen.getByText('Submit Review')).toBeEnabled();
  });

  it('retains a failed review draft and permits retry', async () => {
    const onSubmitReview = vi.fn()
      .mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce(undefined);
    render(<OrganizerReviewForm onSubmitReview={onSubmitReview} />);
    fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Written review'), { target: { value: 'Helpful team' } });
    fireEvent.click(screen.getByText('Submit Review'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
    expect(screen.getByLabelText('Written review')).toHaveValue('Helpful team');
    fireEvent.click(screen.getByText('Submit Review'));
    await waitFor(() => expect(onSubmitReview).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('connects a request review to its event and sends React values through the API adapter', async () => {
    const { data, records, context } = fixtures.roleFixture('client', document, sessionStorage);
    records.eventRequests[0].status = 'completed';
    records.eventCompletionReports = [{ eventId: 'event-1', photos: [] }];
    data.DB.eventCompletionReports = records.eventCompletionReports;
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    data.actions = { ...data.actions, onSubmitClientOrganizerReview: onSubmit };
    const view = render(
      <ClientContext.Provider value={data}>
        <RequestDetailsPage id="request-1" />
      </ClientContext.Provider>
    );
    fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Written review'), { target: { value: 'Excellent service' } });
    fireEvent.click(screen.getByText('Submit Review'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      'event-1', 'request-1', { rating: 5, comment: 'Excellent service' }
    ));
    view.unmount();

    context.v = vi.fn(() => { throw new Error('React reviews must not read DOM values'); });
    context.runWorkflowAction = vi.fn(action => action());
    context.apiSubmitPrivateOrganizerReview = vi.fn().mockResolvedValue({ saved: true });
    await context.submitClientOrganizerReview('event-1', 'request-1', { rating: 4, comment: '  Good service  ' });
    expect(context.v).not.toHaveBeenCalled();
    expect(context.apiSubmitPrivateOrganizerReview).toHaveBeenCalledWith({
      eventId: 'event-1', rating: 4, comment: 'Good service',
    });
  });

  it('uses report identity before event identity for reports belonging to the same event', () => {
    const reports = [
      { reportId: 'report-1', eventId: 'event-1', documentName: 'First.pdf', documentFileName: 'first.pdf' },
      { reportId: 'report-2', eventId: 'event-1', documentName: 'Second.pdf', documentFileName: 'second.pdf' },
    ];
    const view = render(<WorkflowFileReports eventId="event-1" eventFileReports={reports} />);
    const first = screen.getByText('Download First.pdf');
    view.rerender(<WorkflowFileReports eventId="event-1" eventFileReports={[reports[1], reports[0]]} />);
    expect(screen.getByText('Download First.pdf')).toBe(first);
  });
});
