import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  WorkflowCancellation,
  WorkflowEventPolicy,
  WorkflowFileReports,
} from '../src/apps/client/components/WorkflowDetails.jsx';
import EventPicker from '../src/apps/organizer/components/EventPicker.jsx';
import AccountSettingsPage from '../src/app/AccountSettingsPage.jsx';
import ImageWithFallback from '../src/app/ImageWithFallback.jsx';
import useSupportRequests from '../src/apps/customer-support/context/useSupportRequests.js';

describe('Course React patterns retain existing behavior', () => {
  it('renders cancellation details with explicit props and no workspace provider', () => {
    render(
      <WorkflowCancellation
        user={{ id: 'client-1', name: 'Michael' }}
        users={[{ id: 'organizer-1', name: 'Sarah', role: 'organizer' }]}
        events={[]}
        request={{ status: 'cancelled', organizerUserId: 'organizer-1' }}
        cancellation={{
          cancelledBy: 'organizer-1',
          reason: 'Venue unavailable',
          paidAmount: 1000,
          cancellationFee: 0,
          refundAmount: 1000,
          refundStatus: 'pending',
        }}
        workflowMoney={amount => `INR ${amount}`}
        workflowPolicyDate={() => '2 Nov 2026'}
      />
    );
    expect(screen.getByText('Cancelled by organizer')).toBeInTheDocument();
    expect(screen.getByText('Venue unavailable')).toBeInTheDocument();
    expect(screen.getByText('Refund pending review')).toBeInTheDocument();
    expect(screen.getAllByText('INR 1000')).toHaveLength(2);
  });

  it('keeps report rows attached to their IDs when the list changes order', () => {
    const reports = [
      {
        eventReportId: 'REPORT-A',
        eventId: 'EVENT-1',
        reportTitle: 'First report',
        documentFileName: 'first.pdf',
        documentName: 'First.pdf',
      },
      {
        eventReportId: 'REPORT-B',
        eventId: 'EVENT-1',
        reportTitle: 'Second report',
        documentFileName: 'second.pdf',
        documentName: 'Second.pdf',
      },
    ];
    const onDownload = vi.fn();
    const view = render(
      <WorkflowFileReports
        eventId="EVENT-1"
        eventFileReports={reports}
        onDownloadWorkflowEventReport={onDownload}
      />
    );
    const firstButton = screen.getByText('Download First.pdf');
    view.rerender(
      <WorkflowFileReports
        eventId="EVENT-1"
        eventFileReports={[reports[1], reports[0]]}
        onDownloadWorkflowEventReport={onDownload}
      />
    );
    expect(screen.getByText('Download First.pdf')).toBe(firstButton);
    fireEvent.click(firstButton);
    expect(onDownload).toHaveBeenCalledWith('REPORT-A');
  });

  it('filters the event picker and sends the selected record ID to its parent', () => {
    const events = [
      { id: 'EVENT-A', title: 'Conference', status: 'published' },
      { id: 'EVENT-B', title: 'Workshop', status: 'published' },
    ];
    const onSelect = vi.fn();
    const { container } = render(
      <EventPicker events={events} selectedEvent={events[0]} onSelect={onSelect} />
    );
    fireEvent.click(container.querySelector('summary'));
    fireEvent.change(screen.getByLabelText('Search your events'), { target: { value: 'work' } });
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
    fireEvent.click(container.querySelector('[role="option"]'));
    expect(onSelect).toHaveBeenCalledWith('EVENT-B');
    expect(screen.getByLabelText('Search your events')).toHaveValue('');
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('controls policy agreement state and resets it when the policy changes', () => {
    const policy = { version: 'v1', cancellation: { minimumNoticeDays: 14, feePercent: 10 } };
    const registry = new Map();
    const onOpen = vi.fn();
    const view = render(
      <WorkflowEventPolicy
        policy={policy}
        checkboxId="policy-agreement"
        workflowPolicyDocuments={registry}
        onOpenWorkflowPolicyDocument={onOpen}
      />
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    fireEvent.click(screen.getByText('Event Policies & Rules'));
    expect(onOpen).toHaveBeenCalledWith('policies', 'v1');
    view.rerender(
      <WorkflowEventPolicy
        policy={{ ...policy, version: 'v2' }}
        checkboxId="policy-agreement"
        workflowPolicyDocuments={registry}
        onOpenWorkflowPolicyDocument={onOpen}
      />
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(registry.has('v2')).toBe(true);
  });

  it('validates controlled settings fields before invoking the existing save callbacks', async () => {
    const onSave = vi.fn().mockResolvedValue(true),
      onPassword = vi.fn().mockResolvedValue(true),
      onError = vi.fn();
    render(
      <AccountSettingsPage
        user={{ name: 'Michael', email: 'client@example.com' }}
        roleLabel="Client"
        onSaveSettings={onSave}
        onChangePassword={onPassword}
        onValidationError={onError}
      />
    );
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Enter a name and valid email.');
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Michael Torres' } });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Michael Torres' }))
    );
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'old-password' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByText('Update Password'));
    expect(onPassword).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Passwords do not match.');
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByText('Update Password'));
    await waitFor(() => expect(screen.getByLabelText('New Password')).toHaveValue(''));
  });

  it('uses image state for the fallback and retries a changed image source', () => {
    const view = render(
      <ImageWithFallback
        src="/first.jpg"
        alt="Event"
        fallbackProps={{ style: { display: 'flex' } }}
      >
        📅
      </ImageWithFallback>
    );
    const fallback = screen.getByText('📅');
    expect(fallback).not.toBeVisible();
    fireEvent.error(screen.getByAltText('Event'));
    expect(fallback).toBeVisible();
    view.rerender(
      <ImageWithFallback
        src="/second.jpg"
        alt="Event"
        fallbackProps={{ style: { display: 'flex' } }}
      >
        📅
      </ImageWithFallback>
    );
    expect(fallback).not.toBeVisible();
    expect(screen.getByAltText('Event')).toBeVisible();
  });

  it('ignores an older support response after a newer refresh has completed', async () => {
    const pending = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(resolve => pending.push(resolve)))
    );
    const user = { id: 'client-1', token: 'token' };
    const { result } = renderHook(() => useSupportRequests(user));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    let refresh;
    act(() => {
      refresh = result.current.refresh();
    });
    await act(async () => {
      pending[1](
        new Response(JSON.stringify([{ ticketId: 'NEW' }]), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      await refresh;
    });
    expect(result.current.tickets[0].ticketId).toBe('NEW');
    await act(async () =>
      pending[0](
        new Response(JSON.stringify([{ ticketId: 'OLD' }]), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    expect(result.current.tickets[0].ticketId).toBe('NEW');
  });
});
