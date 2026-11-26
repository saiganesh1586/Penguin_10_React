import { createPortalRepository, readRuntimeData } from '../../../store/api/portalRepository.js';

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

export const financeExecutiveRepository = createPortalRepository(async ({ page, pageProps, force = false }) => {
  await window.EventFlowData?.sync(undefined, undefined, { force, applyCached: false });
  const runtime = window.EventFlowFinanceExecutiveRuntime;
  const snapshot = runtime.snapshot(pageProps);
  if (
    ['dashboard', 'transactions', 'refunds', 'reconciliation', 'reports', 'commissions'].includes(
      page
    )
  )
    snapshot.financeData = await loadFinancePage(page, snapshot);
  return readRuntimeData(snapshot, {
    ...(page === 'notifications' ? { notificationRows: 'visibleNotifications' } : {}),
  });
});

// Resolve handlers at click time so API-backed overrides installed by data-sync remain active.
export const financeExecutiveActions = {
  onChangePass: (...args) => window.changePass(...args),
  onSignOut: (...args) => window.doLogout(...args),
  onFinanceChangeSentPage: (...args) => window.financeChangeSentPage(...args),
  onFinanceDetail: (...args) => window.financeDetail(...args),
  onFinanceDownloadCsv: (...args) => window.financeDownloadCsv(...args),
  onFinanceDownloadPdf: (...args) => window.financeDownloadPdf(...args),
  onFinanceNavigate: (...args) => window.financeNavigate(...args),
  onFinanceOpenSubmitReport: (...args) => window.financeOpenSubmitReport(...args),
  onFinanceReset: (...args) => window.financeReset(...args),
  onFinanceSet: (...args) => window.financeSet(...args),
  onFinanceSetSentStatus: (...args) => window.financeSetSentStatus(...args),
  onFinanceViewSentReport: (...args) => window.financeViewSentReport(...args),
  onNavigate: (...args) => window.goNav(...args),
  onMarkAllRead: (...args) => window.markAllRead(...args),
  onMarkNotifRead: (...args) => window.markNotifRead(...args),
  onRenderPage: (...args) => window.renderPage(...args),
  onSaveSettings: (...args) => window.saveSettings(...args),
  onValidationError: message => window.toast(message, 'error'),
};
