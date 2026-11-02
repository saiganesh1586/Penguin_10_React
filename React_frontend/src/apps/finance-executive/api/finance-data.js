// These are the same endpoints and filters used by the finance workflow handlers.
export async function loadFinancePage(page, data) {
  const query = data.financeQuery;
  if (page === 'dashboard') return window.apiRequest('/finance/overview?' + query());
  if (page === 'transactions' || page === 'refunds') {
    const filters = query(page === 'refunds' ? { sort: 'newest' } : {});
    return window.apiRequest(
      `/finance/${page}?${filters}${page === 'refunds' ? '&range=custom' : ''}`
    );
  }
  if (page === 'reconciliation') return window.apiRequest('/finance/reconciliation');
  if (page === 'reports') {
    const params = new URLSearchParams(query());
    params.set('type', data.financeFilters.reportType);
    const report = await window.apiRequest('/finance/reports?' + params);
    data.financeSentReports = await window.apiRequest('/finance/submissions');
    const matching = data.financeSentReports.filter(
      item =>
        data.financeSentStatus === 'all' || item.status.toLowerCase() === data.financeSentStatus
    );
    data.financeSentPage = Math.min(
      data.financeSentPage,
      Math.max(1, Math.ceil(matching.length / 5))
    );
    return report;
  }
  return null;
}
