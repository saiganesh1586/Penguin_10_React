import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  async function pageFinanceCenter() {
    const tab = sessionStorage.getItem('finance_tab') || 'dashboard';
    const query = sessionStorage.getItem('finance_query') || '';
    const page = Number(sessionStorage.getItem('finance_page') || 1);
    const status = sessionStorage.getItem('finance_status') || '';
    const method = sessionStorage.getItem('finance_method') || '';
    const from = sessionStorage.getItem('finance_from') || '';
    const to = sessionStorage.getItem('finance_to') || '';
    const eventId = sessionStorage.getItem('finance_event') || '';
    const sort = sessionStorage.getItem('finance_sort') || 'date';
    const refundRange = sessionStorage.getItem('finance_refund_range') || 'last30';
    const refundEvent = sessionStorage.getItem('finance_refund_event') || '';
    const refundOrganizer = sessionStorage.getItem('finance_refund_organizer') || '';
    const refundStatus = sessionStorage.getItem('finance_refund_status') || '';
    const refundSearch = sessionStorage.getItem('finance_refund_search') || '';
    const refundSort = sessionStorage.getItem('finance_refund_sort') || 'newest';
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '25',
      search: query,
      status,
      paymentMethod: method,
      eventId,
      from,
      to,
      sort,
      direction: 'desc',
    });
    const isTransactions = tab === 'transactions' || tab === 'dashboard' || tab === 'commission';
    const dashboardParams = new URLSearchParams({
      from,
      to,
    });
    const refundParams = new URLSearchParams({
      page: String(page),
      pageSize: '25',
      range: refundRange,
      eventId: refundEvent,
      organizerId: refundOrganizer,
      status: refundStatus,
      search: refundSearch,
      sort: refundSort,
    });
    const tasks =
      tab === 'refunds'
        ? [apiRequest('/finance/refunds?' + refundParams.toString())]
        : [apiRequest('/finance/dashboard?' + dashboardParams.toString())];
    if (isTransactions) tasks.push(apiRequest('/finance/transactions?' + params.toString()));
    let dashboard;
    let result;
    try {
      const data = await Promise.all(tasks);
      if (tab === 'refunds') result = data[0];
      else {
        dashboard = data[0];
        result = data[1];
      }
    } catch (error) {
      if ((DB.financeTransactions || []).length) return pageFinanceCenterDemo();
      return (
        '<div class="page-hd"><div><div class="page-title">Finance Executive</div><div class="page-sub">Financial operations</div></div></div><div class="card"><div class="empty-title">Finance data is unavailable</div><p class="empty-desc">' +
        escapeHtml(error.message) +
        '</p><button class="btn btn-primary" onclick="renderPage(&quot;finance&quot;)">Retry</button></div>'
      );
    }
    dashboard = dashboard || {
      currency: 'INR',
      totals: {},
    };
    const totals = dashboard.totals || {};
    const currency = value =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: dashboard.currency || 'INR',
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    const dateText = value => (value ? new Date(value).toLocaleString('en-IN') : '—');
    const metric = (label, value, color) =>
      '<div class="stat-card"><div class="stat-value" style="color:' +
      color +
      '">' +
      value +
      '</div><div class="stat-label">' +
      label +
      '</div></div>';
    const metrics =
      '<div class="grid-4 mb-20">' +
      metric('Gross captured revenue', currency(totals.grossRevenue), 'var(--green)') +
      metric('Net after completed refunds', currency(totals.netRevenue), 'var(--accent)') +
      metric('Successful payments', totals.successfulPayments || 0, 'var(--green)') +
      metric('Tickets sold', totals.ticketsSold || 0, 'var(--blue)') +
      metric('Failed payments', totals.failedPayments || 0, 'var(--red)') +
      metric('Pending payments', totals.pendingPayments || 0, 'var(--yellow)') +
      metric('Refund requests pending', totals.pendingRefundRequests || 0, 'var(--yellow)') +
      metric('Completed refunds', currency(totals.refundedAmount), 'var(--purple)') +
      '</div>';
    const tabs = [
      ['dashboard', 'Dashboard'],
      ['transactions', 'Payment Transactions'],
      ['refunds', 'Refund Management'],
      ['settlements', 'Organizer Settlements'],
      ['commission', 'Commission & Revenue'],
      ['reconciliation', 'Payment Reconciliation'],
    ]
      .map(
        item =>
          '<button class="btn ' +
          (tab === item[0] ? 'btn-primary' : 'btn-ghost') +
          '" onclick="switchFinanceTab(&quot;' +
          item[0] +
          '&quot;)">' +
          item[1] +
          '</button>'
      )
      .join('');
    let content = '';
    if (tab === 'dashboard') {
      const rows = ((result && result.data) || [])
        .slice(0, 8)
        .map(
          item =>
            '<tr><td class="mono">' +
            escapeHtml(item.paymentId) +
            '</td><td>' +
            escapeHtml(item.eventName) +
            '</td><td>' +
            escapeHtml(item.attendeeName) +
            '</td><td>' +
            currency(item.amount) +
            '</td><td><span class="badge badge-' +
            financeStatusBadge(item.status) +
            '">' +
            escapeHtml(item.status) +
            '</span></td><td>' +
            dateText(item.paymentDate || item.createdAt) +
            '</td></tr>'
        )
        .join('');
      const eventMax = Math.max(
        1,
        ...(dashboard.eventRevenue || []).map(item => Number(item.revenue || 0))
      );
      const eventBars =
        (dashboard.eventRevenue || [])
          .map(
            item =>
              '<div class="finance-chart-row"><span>' +
              escapeHtml(item.eventName) +
              '</span><div class="finance-bar-track"><i style="width:' +
              (Number(item.revenue || 0) / eventMax) * 100 +
              '%"></i></div><strong>' +
              currency(item.revenue) +
              '</strong></div>'
          )
          .join('') || '<p class="small muted">No event revenue recorded.</p>';
      const trend =
        (dashboard.revenueTrend || [])
          .map(
            item =>
              '<div class="finance-trend-item"><span>' +
              escapeHtml(item.date) +
              '</span><strong>' +
              currency(item.revenue) +
              '</strong></div>'
          )
          .join('') || '<p class="small muted">No revenue trend data available.</p>';
      content =
        '<div class="filter-row"><label class="small muted">From <input class="form-control" type="date" id="finance-from" value="' +
        escapeHtml(from) +
        '"></label><label class="small muted">To <input class="form-control" type="date" id="finance-to" value="' +
        escapeHtml(to) +
        '"></label><button class="btn btn-primary" onclick="applyFinanceDateRange()">Apply date range</button><button class="btn btn-ghost" onclick="clearFinanceDateRange()">Clear</button></div><div class="card"><div class="h4 mb-12">Recent payment activity</div><div class="table-wrap"><table><thead><tr><th>Payment</th><th>Event</th><th>Attendee</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
        (rows ||
          '<tr><td colspan="6" class="text-center py-20">No payment records yet.</td></tr>') +
        '</tbody></table></div></div><div class="grid-2 mt-16"><div class="card"><div class="h4 mb-12">Revenue by event</div>' +
        eventBars +
        '</div><div class="card"><div class="h4 mb-12">Captured revenue trend</div><div class="finance-trend">' +
        trend +
        '</div></div></div>';
    } else if (tab === 'transactions') {
      const rows = (result.data || [])
        .map(
          item =>
            '<tr><td class="mono">' +
            escapeHtml(item.paymentId) +
            '</td><td>' +
            escapeHtml(item.registrationId) +
            '</td><td>' +
            escapeHtml(item.eventName) +
            '</td><td>' +
            escapeHtml(item.attendeeName) +
            '<div class="small muted">' +
            escapeHtml(item.attendeeEmail) +
            '</div></td><td>' +
            currency(item.amount) +
            '</td><td>' +
            escapeHtml(item.paymentMethod) +
            '</td><td><span class="badge badge-' +
            financeStatusBadge(item.status) +
            '">' +
            escapeHtml(item.status) +
            '</span></td><td>' +
            dateText(item.paymentDate || item.createdAt) +
            '</td><td><button class="btn btn-ghost btn-sm" data-payment="' +
            encodeURIComponent(item.paymentId) +
            '" onclick="openFinanceTransaction(this.dataset.payment)">View</button></td></tr>'
        )
        .join('');
      content =
        '<div class="card"><div class="filter-row"><input class="form-control" id="finance-query" placeholder="Search payment, booking, attendee, or event" value="' +
        escapeHtml(query) +
        '"><select class="form-control" id="finance-status"><option value="">All statuses</option>' +
        ['completed', 'pending', 'failed', 'refunded']
          .map(
            s =>
              '<option ' +
              (status === s ? 'selected' : '') +
              ' value="' +
              s +
              '">' +
              s +
              '</option>'
          )
          .join('') +
        '</select><select class="form-control" id="finance-method"><option value="">All methods</option><option value="DEMO_PROVIDER" ' +
        (method === 'DEMO_PROVIDER' ? 'selected' : '') +
        '>Demo provider</option></select><select class="form-control" id="finance-event"><option value="">All events</option>' +
        (dashboard.eventRevenue || [])
          .map(
            item =>
              '<option value="' +
              escapeHtml(item.eventId || '') +
              '" ' +
              (eventId === item.eventId ? 'selected' : '') +
              '>' +
              escapeHtml(item.eventName) +
              '</option>'
          )
          .join('') +
        '</select><select class="form-control" id="finance-sort"><option value="date" ' +
        (sort === 'date' ? 'selected' : '') +
        '>Sort by date</option><option value="amount" ' +
        (sort === 'amount' ? 'selected' : '') +
        '>Sort by amount</option></select><input class="form-control" type="date" id="finance-from" value="' +
        escapeHtml(from) +
        '"><input class="form-control" type="date" id="finance-to" value="' +
        escapeHtml(to) +
        '"><button class="btn btn-primary" onclick="refreshFinanceCenter()">Apply</button><button class="btn btn-ghost" onclick="downloadFinanceCsv()">Download CSV</button></div><div class="table-wrap"><table><thead><tr><th>Transaction</th><th>Booking</th><th>Event</th><th>Attendee</th><th>Amount (INR)</th><th>Method</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>' +
        (rows ||
          '<tr><td colspan="9" class="text-center py-20">No transactions match these filters.</td></tr>') +
        '</tbody></table></div><div class="flex justify-between items-center mt-16"><span class="small muted">' +
        (result.pagination.total || 0) +
        ' matching records · page ' +
        result.pagination.page +
        ' of ' +
        Math.max(1, result.pagination.totalPages) +
        '</span><div><button class="btn btn-ghost" ' +
        (page <= 1 ? 'disabled' : '') +
        ' onclick="financeChangePage(-1)">Previous</button> <button class="btn btn-ghost" ' +
        (page >= result.pagination.totalPages ? 'disabled' : '') +
        ' onclick="financeChangePage(1)">Next</button></div></div></div>';
    } else if (tab === 'refunds') {
      const filters = result.filters || {};
      const eventOptions = (filters.events || [])
        .map(
          item =>
            '<option value="' +
            escapeHtml(item.eventId) +
            '" ' +
            (refundEvent === item.eventId ? 'selected' : '') +
            '>' +
            escapeHtml(item.name) +
            '</option>'
        )
        .join('');
      const organizerOptions = (filters.organizers || [])
        .map(
          item =>
            '<option value="' +
            escapeHtml(item.organizerId) +
            '" ' +
            (refundOrganizer === item.organizerId ? 'selected' : '') +
            '>' +
            escapeHtml(item.name) +
            '</option>'
        )
        .join('');
      const refundDate = value =>
        value
          ? new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'Asia/Kolkata',
            }).format(new Date(value))
          : '—';
      const refundMoney = value =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(value || 0));
      const rows = (result.data || [])
        .map(
          item =>
            '<tr><td class="mono">' +
            escapeHtml(item.refundId) +
            '</td><td>' +
            escapeHtml(item.registrationId) +
            '</td><td>' +
            escapeHtml(item.eventName) +
            '<div class="small muted">' +
            escapeHtml(item.organizerName) +
            '</div></td><td>' +
            escapeHtml(item.attendeeName) +
            '</td><td>' +
            refundMoney(item.originalPaymentAmount) +
            '</td><td>' +
            refundMoney(item.amount) +
            '</td><td>' +
            escapeHtml(item.reason) +
            '</td><td><span class="finance-refund-status finance-refund-status-' +
            escapeHtml(String(item.status).toLowerCase()) +
            '">' +
            escapeHtml(String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)) +
            '</span></td><td>' +
            refundDate(item.requestedAt) +
            '</td><td><button class="btn btn-ghost btn-sm" data-refund="' +
            encodeURIComponent(item.refundId) +
            '" onclick="openFinanceRefund(this.dataset.refund)">View details</button></td></tr>'
        )
        .join('');
      const pagination = result.pagination || {
        page: 1,
        total: 0,
        totalPages: 0,
      };
      content =
        '<div class="finance-warning"><span class="finance-warning-icon">!</span><span>Demo provider only; all existing payments are unverified or simulated. No live refunds or payouts are available. Commission policy is not configured; related amounts remain unavailable.</span></div><div class="finance-filter-toolbar"><label><span>Date range</span><select class="form-control" id="finance-refund-range"><option value="last30" ' +
        (refundRange === 'last30' ? 'selected' : '') +
        '>Last 30 days</option><option value="last7" ' +
        (refundRange === 'last7' ? 'selected' : '') +
        '>Last 7 days</option><option value="thisMonth" ' +
        (refundRange === 'thisMonth' ? 'selected' : '') +
        '>This month</option><option value="all" ' +
        (refundRange === 'all' ? 'selected' : '') +
        '>All time</option></select></label><label><span>Event</span><select class="form-control" id="finance-refund-event"><option value="">All events</option>' +
        eventOptions +
        '</select></label><label><span>Organizer</span><select class="form-control" id="finance-refund-organizer"><option value="">All organizers</option>' +
        organizerOptions +
        '</select></label><label><span>Status</span><select class="form-control" id="finance-refund-status"><option value="">All statuses</option>' +
        ['pending', 'completed', 'failed', 'not_applicable']
          .map(
            value =>
              '<option value="' +
              value +
              '" ' +
              (refundStatus === value ? 'selected' : '') +
              '>' +
              value.charAt(0).toUpperCase() +
              value.slice(1).replace('_', ' ') +
              '</option>'
          )
          .join('') +
        '</select></label><label class="finance-refund-search"><span>Search</span><input class="form-control" id="finance-refund-search" placeholder="Reference, booking, attendee" value="' +
        escapeHtml(refundSearch) +
        '"></label><label><span>Sort</span><select class="form-control" id="finance-refund-sort"><option value="newest" ' +
        (refundSort === 'newest' ? 'selected' : '') +
        '>Newest first</option><option value="oldest" ' +
        (refundSort === 'oldest' ? 'selected' : '') +
        '>Oldest first</option><option value="amountHigh" ' +
        (refundSort === 'amountHigh' ? 'selected' : '') +
        '>Amount: high to low</option><option value="amountLow" ' +
        (refundSort === 'amountLow' ? 'selected' : '') +
        '>Amount: low to high</option></select></label><div class="finance-filter-actions"><button class="btn btn-primary" onclick="applyFinanceRefundFilters()">Apply filters</button><button class="btn btn-ghost" onclick="resetFinanceRefundFilters()">Reset</button></div></div><div class="card finance-refund-table-card"><div class="table-wrap"><table class="finance-refund-table"><thead><tr><th>Refund request</th><th>Booking</th><th>Event</th><th>Attendee</th><th>Original payment</th><th>Requested amount</th><th>Reason</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead><tbody>' +
        (rows ||
          '<tr><td colspan="10" class="text-center py-20">No refund requests match these filters.</td></tr>') +
        '</tbody></table></div><div class="finance-refund-pagination"><span>' +
        pagination.total +
        ' records · Page ' +
        pagination.page +
        ' of ' +
        Math.max(1, pagination.totalPages) +
        '</span><div><button class="btn btn-ghost" ' +
        (pagination.page <= 1 ? 'disabled' : '') +
        ' onclick="financeChangePage(-1)">Previous</button><button class="btn btn-ghost" ' +
        (pagination.page >= pagination.totalPages ? 'disabled' : '') +
        ' onclick="financeChangePage(1)">Next</button></div></div></div>';
    } else if (tab === 'commission') {
      content =
        '<div class="card"><div class="h4 mb-12">Commission &amp; revenue</div><p class="small muted">Gross and net revenue below are calculated from persisted payment and refund records.</p><div class="grid-3 mt-16">' +
        metric('Gross captured revenue', currency(totals.grossRevenue), 'var(--green)') +
        metric('Completed refunds', currency(totals.refundedAmount), 'var(--purple)') +
        metric('Net revenue', currency(totals.netRevenue), 'var(--accent)') +
        '</div><div class="empty-desc mt-16">Commission policy is not configured. Commission and organizer payable amounts are unavailable until an administrator defines a policy.</div></div>';
    } else {
      const title = tab === 'settlements' ? 'Organizer settlements' : 'Payment reconciliation';
      const explanation =
        tab === 'settlements'
          ? 'No payout provider or settlement policy is configured. No organizer payouts can be calculated or marked paid.'
          : 'The configured payment provider is DEMO_PROVIDER and does not provide gateway reconciliation records.';
      content =
        '<div class="card"><div class="h4 mb-12">' +
        title +
        '</div><p class="empty-desc">' +
        explanation +
        '</p></div>';
    }
    const pageTitle =
      {
        dashboard: 'Dashboard',
        transactions: 'Payment Transactions',
        refunds: 'Refund Management',
        settlements: 'Organizer Settlements',
        commission: 'Commission & Revenue',
        reconciliation: 'Payment Reconciliation',
      }[tab] || 'Finance';
    const pageHeader =
      '<div class="page-hd"><div class="page-hd-left"><div class="page-title">' +
      pageTitle +
      '</div><div class="page-sub">Financial operations · INR · Asia/Kolkata</div></div><button class="btn btn-ghost" onclick="renderPage(&quot;finance&quot;)">Refresh</button></div>';
    return pageHeader + (tab === 'refunds' ? '' : metrics) + content;
  }
  /* PORTAL_RUNTIME_END */
}
export default function FinancePage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
