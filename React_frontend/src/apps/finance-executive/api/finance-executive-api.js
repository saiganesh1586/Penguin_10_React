import { loadFinancePage } from './finance-data.js';
// API refresh stays in this module; pages consume the normalized workspace snapshot.
export async function loadFinanceExecutiveData(page, initialData, attempt = 0) {
  let data = initialData;
  if (!data || attempt > 0) {
    await window.EventFlowData?.sync();
    data = window.EventFlowFinanceExecutiveRuntime.snapshot(initialData?.pageProps);
  }
  if (
    ['dashboard', 'transactions', 'refunds', 'reconciliation', 'reports', 'commissions'].includes(
      page
    )
  )
    data.financeData = await loadFinancePage(page, data);
  data.actions = financeExecutiveActions;
  return data;
}

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
