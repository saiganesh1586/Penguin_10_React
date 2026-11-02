import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import FinanceExecutivePageContainer from '../src/apps/finance-executive/app/FinanceExecutivePageContainer.jsx';
import { loadFinancePage } from '../src/apps/finance-executive/api/finance-data.js';
import { financeExecutiveActions } from '../src/apps/finance-executive/api/finance-executive-api.js';
import { ClientContext } from '../src/apps/client/context/ClientContext.jsx';
import { OrganizerContext } from '../src/apps/organizer/context/OrganizerContext.jsx';
import { AdminContext } from '../src/apps/admin/context/AdminContext.jsx';
import { SupportExecutiveContext } from '../src/apps/customer-support/context/SupportExecutiveContext.jsx';
import { FinanceExecutiveContext } from '../src/apps/finance-executive/context/FinanceExecutiveContext.jsx';
import fixtures from './role-fixtures.cjs';

const contexts = {
  client: ClientContext,
  organizer: OrganizerContext,
  admin: AdminContext,
  'support-executive': SupportExecutiveContext,
  'finance-executive': FinanceExecutiveContext,
};
const pages = import.meta.glob(
  '../src/apps/{client,organizer,admin,customer-support,finance-executive}/pages/*.jsx',
  { eager: true }
);
const renderers = {
  CompletedEventsPage: 'pageCompletedEvents',
  DashboardPage: 'dash',
  FindOrganizersPage: 'pageFindOrganizers',
  MyEventsPage: 'pageWorkflowEvents',
  NotificationsPage: 'pageNotifications',
  OngoingEventsPage: 'pageOngoingEvents',
  ProfilePage: 'pageProfile',
  RequestStatusPage: 'pageRequestStatus',
  SettingsPage: 'pageSettings',
  UpcomingEventsPage: 'pageUpcomingEvents',
  AttendeesPage: 'pageAttendees',
  EventRequestsPage: 'pageEventRequests',
  EventsPage: 'pageEvents',
  ReportsPage: 'pageReports',
  EmployeeReportsPage: 'pageEmployeeReports',
  EventReportsPage: 'pageEventReports',
  RevenueReportsPage: 'pageRevenueReports',
  UserReportsPage: 'pageUserReports',
  UserEventManagementPage: 'pageUserAndEventManagement',
  ReportsAnalyticsPage: 'pageReportsAndAnalytics',
};
const normalize = html => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent.replace(/\s+/g, '');
};

describe('Role React pages', () => {
  for (const [file, module] of Object.entries(pages)) {
    if (
      file.endsWith('/PublicHomePage.jsx') ||
      file.endsWith('/SupportIssuesPage.jsx') ||
      file.endsWith('/CustomerSupportPage.jsx') ||
      file.endsWith('/TicketDetailsPage.jsx')
    ) continue;
    const folder = file.split('/')[3];
    const role = folder === 'customer-support' ? 'support-executive' : folder;
    const name = file.split('/').at(-1);
    it(`${role}/${name} renders workspace records without HTML string artifacts`, async () => {
      sessionStorage.clear();
      const { data, context } = fixtures.roleFixture(role, document, sessionStorage);
      vi.stubGlobal('EventFlowAccountPolicy', context.EventFlowAccountPolicy);
      const Context = contexts[role];
      const Page = module.default;
      const props = {
        id: 'request-1',
        isOrg: role === 'organizer',
        page: name === 'FinancePage.jsx' ? 'transactions' : 'dashboard',
      };
      const html = renderToStaticMarkup(
        <Context.Provider value={data}>
          <Page {...props} />
        </Context.Provider>
      );
      expect(html).not.toMatch(
        /\[object Object\]|___PORTAL_EXPR_|&lt;(?:div|table|tr|span|button)/
      );
      expect(html.length).toBeGreaterThan(50);
      let renderer = renderers[name.replace('.jsx', '')];
      if (renderer === 'dash')
        renderer = {
          client: 'dashClient',
          organizer: 'dashOrganizer',
          admin: 'dashAdmin',
          'support-executive': 'dashSupportExecutive',
        }[role];
      context.apiGetDashboard = context.apiGetEmployeeDashboard = async () => null;
      if (
        renderer &&
        role !== 'finance-executive' &&
        !(role === 'client' && name === 'DashboardPage.jsx')
      ) {
        const expected = await context[renderer]();
        expect(normalize(html)).toBe(normalize(expected));
      }
    });
  }

  it('keeps organizer attendee rows inside the table and filters them through React state', () => {
    const { data } = fixtures.roleFixture('organizer', document, sessionStorage);
    const Page = pages['../src/apps/organizer/pages/AttendeesPage.jsx'].default;
    const { container } = render(
      <OrganizerContext.Provider value={data}>
        <Page />
      </OrganizerContext.Provider>
    );
    expect(container.querySelector('tbody')).toHaveTextContent('Anita Rao');
    fireEvent.change(screen.getByLabelText('Search attendees'), { target: { value: 'missing' } });
    expect(screen.queryByText('Anita Rao')).not.toBeInTheDocument();
    expect(screen.getByText('No attendees match your filters')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search attendees'), { target: { value: 'Anita' } });
    expect(container.querySelector('tbody')).toHaveTextContent('Anita Rao');
  });

  for (const role of Object.keys(contexts)) {
    it(`${role} navigation reaches its React dashboard with the existing workspace data`, async () => {
      const { context, records } = fixtures.roleFixture(role, document, sessionStorage);
      const container = document.createElement('div');
      container.id = 'page-content';
      document.body.appendChild(container);
      const bridge = { hasPage: () => true, render: vi.fn(), clear: vi.fn() };
      const name = role
        .split('-')
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join('');
      context[`EventFlow${name}Pages`] = bridge;
      for (const method of [
        'syncWorkflowData',
        'syncOrganizerDashboard',
        'syncOrganizerDashboardData',
        'syncOrganizerEventRequests',
        'syncClientEventRequests',
      ])
        context[method] = async () => {};
      try {
        await (role === 'finance-executive'
          ? context.financeRender('dashboard')
          : context.renderPageContent('dashboard'));
        expect(bridge.render).toHaveBeenCalled();
        expect(bridge.render.mock.calls[0][1]).toBe('dashboard');
        expect(bridge.render.mock.calls[0][2].DB.eventRequests).toBe(records.eventRequests);
      } finally {
        container.remove();
      }
    });
  }

  it('filters organizer search in React and keeps the saved filter values', () => {
    const { data, records } = fixtures.roleFixture('client', document, sessionStorage);
    records.users.push({
      id: 'org-1',
      role: 'organizer',
      name: 'Sarah Chen',
      city: 'Chennai',
      packages: [],
      rating: 4.8,
      avatar: 'SC',
    });
    const Page = pages['../src/apps/client/pages/FindOrganizersPage.jsx'].default;
    const { container } = render(
      <ClientContext.Provider value={data}>
        <Page />
      </ClientContext.Provider>
    );
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    fireEvent.change(container.querySelector('#search-org-q'), { target: { value: 'missing' } });
    expect(screen.queryByText('Sarah Chen')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('search_org_q')).toBe('missing');
    fireEvent.change(container.querySelector('#search-org-q'), { target: { value: 'Sarah' } });
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });

  for (const role of ['client', 'organizer']) {
    it(`${role} cancellation details retain the full refund history and workflow actions`, () => {
      const { data, request } = fixtures.roleFixture(role, document, sessionStorage);
      request.status = 'cancelled';
      request.cancellation = {
        reason: 'Venue unavailable <script>alert(1)</script>',
        cancelledBy: 'organizer-1',
        paidAmount: 10000,
        cancellationFeePercent: 0,
        cancellationFee: 0,
        refundAmount: 10000,
        refundStatus: 'pending',
      };
      const Page = pages[`../src/apps/${role}/pages/RequestDetailsPage.jsx`].default;
      const Context = contexts[role];
      const { container } = render(
        <Context.Provider value={data}>
          <Page id={request.id} />
        </Context.Provider>
      );
      expect(container).toHaveTextContent('Venue unavailable <script>alert(1)</script>');
      expect(container.querySelector('script')).toBeNull();
      expect(container).toHaveTextContent('10,000');
      expect(container.textContent).not.toContain('[object Object]');
    });
  }

  it('renders finance charts and transaction rows with their existing detail and filter actions', () => {
    const { data } = fixtures.roleFixture('finance-executive', document, sessionStorage);
    const transaction = {
      paymentId: 'PAY-1',
      registrationId: 'BOOK-1',
      eventName: 'Client conference',
      attendeeName: 'Anita Rao',
      amount: 1000,
      status: 'completed',
      paymentMethod: 'UPI',
      createdAt: '2026-10-01',
    };
    Object.assign(data.financeData, {
      recentTransactions: [transaction],
      revenueTrend: [{ date: '2026-10-01', revenue: 1000 }],
      eventRevenue: [{ eventName: transaction.eventName, revenue: 1000 }],
      paymentStatuses: [{ status: 'completed', count: 1 }],
      refundTrend: [{ date: '2026-10-01', requested: 100, completed: 50 }],
      data: [transaction],
      pagination: { page: 2, total: 30, totalPages: 2 },
    });
    data.actions = { onFinanceDetail: vi.fn(), onFinanceSet: vi.fn(), onFinanceReset: vi.fn() };
    const Dashboard = pages['../src/apps/finance-executive/pages/DashboardPage.jsx'].default;
    const html = renderToStaticMarkup(
      <FinanceExecutiveContext.Provider value={data}>
        <Dashboard />
      </FinanceExecutiveContext.Provider>
    );
    expect(html).not.toMatch(/\[object Object\]|&lt;|<!--/);
    expect(html).toContain('<rect');
    expect(html).toContain('PAY-1');
    const Transactions = pages['../src/apps/finance-executive/pages/FinancePage.jsx'].default;
    const { container } = render(
      <FinanceExecutiveContext.Provider value={data}>
        <Transactions page="transactions" />
      </FinanceExecutiveContext.Provider>
    );
    expect(container.querySelector('tbody')).toHaveTextContent('Anita Rao');
    fireEvent.click(screen.getByText('Details'));
    expect(data.actions.onFinanceDetail).toHaveBeenCalledWith('transactions', 'PAY-1');
    fireEvent.click(screen.getByText('Previous'));
    expect(data.actions.onFinanceSet).toHaveBeenCalledWith('page', 1);
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('renders refreshed admin statistics and charts through React without replacing their containers', () => {
    const { data } = fixtures.roleFixture('admin', document, sessionStorage);
    data.dashboardData = {
      users: { total: 70, byRole: { attendee: 50, event_organizer: 10 } },
      events: { total: 35, published: 20, ongoing: 3 },
      registrations: { total: 400 },
      payments: { totalRevenue: 123000 },
      eventRequests: { pending: 2, total: 9 },
    };
    const Page = pages['../src/apps/admin/pages/DashboardPage.jsx'].default;
    const { container } = render(
      <AdminContext.Provider value={data}>
        <Page />
      </AdminContext.Provider>
    );
    expect(container.querySelector('#adm-stat-users')).toHaveTextContent('70');
    expect(container.querySelector('#adm-stat-events')).toHaveTextContent('35');
    expect(container.querySelector('#adm-stat-regs')).toHaveTextContent('400');
    expect(container.querySelector('#adm-role-chart svg')).not.toBeNull();
    expect(container).toHaveTextContent('50 attendees');
  });

  it('keeps finance report requests and sent-report state connected to the original filters', async () => {
    const { data } = fixtures.roleFixture('finance-executive', document, sessionStorage);
    data.financeFilters.reportType = 'refunds';
    const request = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce([{ id: 'REPORT-1' }]);
    vi.stubGlobal('apiRequest', request);
    await loadFinancePage('reports', data);
    expect(request.mock.calls[0][0]).toContain('/finance/reports?');
    expect(request.mock.calls[0][0]).toContain('type=refunds');
    expect(request.mock.calls[1][0]).toBe('/finance/submissions');
    expect(data.financeSentReports[0].id).toBe('REPORT-1');
  });

  it('keeps the finance loading screen until refreshed filter results are ready', async () => {
    const { data } = fixtures.roleFixture('finance-executive', document, sessionStorage);
    const payment = {
      paymentId: 'PAY-OLD',
      registrationId: 'BOOK-1',
      eventName: 'Conference',
      attendeeName: 'Anita',
      amount: 1000,
      status: 'completed',
    };
    const first = { ...data.financeData, data: [payment] };
    let finishRefresh;
    const request = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            finishRefresh = resolve;
          })
      );
    vi.stubGlobal('apiRequest', request);
    const { container, rerender } = render(
      <FinanceExecutivePageContainer page="transactions" initialData={data} />
    );
    expect(container.querySelector('.finance-loading')).not.toBeNull();
    await screen.findByText('PAY-OLD');
    rerender(<FinanceExecutivePageContainer page="transactions" initialData={{ ...data }} />);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(container.querySelector('.finance-loading')).not.toBeNull();
    expect(screen.queryByText('PAY-OLD')).not.toBeInTheDocument();
    await act(async () =>
      finishRefresh({ ...first, data: [{ ...payment, paymentId: 'PAY-NEW' }] })
    );
    expect(await screen.findByText('PAY-NEW')).toBeInTheDocument();
  });

  it('resolves action handlers at click time so synchronized API overrides remain active', () => {
    const original = vi.fn();
    vi.stubGlobal('financeDetail', original);
    financeExecutiveActions.onFinanceDetail('refunds', 'REF-1');
    const replacement = vi.fn();
    vi.stubGlobal('financeDetail', replacement);
    financeExecutiveActions.onFinanceDetail('refunds', 'REF-2');
    expect(original).toHaveBeenCalledOnce();
    expect(replacement).toHaveBeenCalledWith('refunds', 'REF-2');
  });

  it('loads support tickets, merges event issues once, and opens the existing reply dialog', async () => {
    const { data } = fixtures.roleFixture('support-executive', document, sessionStorage);
    const ticket = {
      ticketId: 'SUP-1',
      concern: 'Payment help',
      requestType: 'Payment Issues',
      status: 'open',
      requesterName: 'Anita Rao',
      createdAt: '2026-10-01',
    };
    data.supportExecutiveRequestOptions = () => ({
      getAdditionalTickets: () => [
        ticket,
        { ...ticket, ticketId: 'EVENT-1', concern: 'Venue issue' },
      ],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => [ticket],
      })
    );
    const openTicket = vi.fn();
    vi.stubGlobal('EventFlowSupport', { bind: vi.fn(() => ({ openTicket, destroy: vi.fn() })) });
    const Page = pages['../src/apps/customer-support/pages/SupportIssuesPage.jsx'].default;
    render(
      <SupportExecutiveContext.Provider value={data}>
        <Page />
      </SupportExecutiveContext.Provider>
    );
    await screen.findByText('Payment help');
    expect(screen.getAllByText('Payment help')).toHaveLength(1);
    fireEvent.click(screen.getAllByText('Review & Respond')[0]);
    expect(openTicket).toHaveBeenCalledWith(ticket);
    expect(screen.getByText('Open: 2')).toBeInTheDocument();
  });
});
