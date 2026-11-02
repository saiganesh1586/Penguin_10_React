const saved = (name, fallback = '') => sessionStorage.getItem(`finance_${name}`) || fallback;

export async function loadFinanceCenter() {
  const tab = saved('tab', 'dashboard');
  const from = saved('from');
  const to = saved('to');
  const refundParams = new URLSearchParams({
    page: saved('page', '1'),
    pageSize: '25',
    range: saved('refund_range', 'last30'),
    eventId: saved('refund_event'),
    organizerId: saved('refund_organizer'),
    status: saved('refund_status'),
    search: saved('refund_search'),
    sort: saved('refund_sort', 'newest'),
  });
  const requests = [
    window.apiRequest(
      tab === 'refunds'
        ? '/finance/refunds?' + refundParams
        : '/finance/dashboard?' + new URLSearchParams({ from, to })
    ),
  ];
  if (['transactions', 'dashboard', 'commission'].includes(tab)) {
    const params = new URLSearchParams({
      page: saved('page', '1'),
      pageSize: '25',
      search: saved('query'),
      status: saved('status'),
      paymentMethod: saved('method'),
      eventId: saved('event'),
      from,
      to,
      sort: saved('sort', 'date'),
      direction: 'desc',
    });
    requests.push(window.apiRequest('/finance/transactions?' + params));
  }
  return Promise.all(requests);
}

export function loadFinanceReport() {
  return window.apiRequest(
    '/finance/dashboard?' + new URLSearchParams({ from: saved('from'), to: saved('to') })
  );
}
