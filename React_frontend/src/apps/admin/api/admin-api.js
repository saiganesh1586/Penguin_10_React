// API refresh stays in this module; pages consume the normalized workspace snapshot.
export async function loadAdminData(page, initialData, attempt = 0) {
  let data = initialData;
  if (!data || attempt > 0) {
    await window.EventFlowData?.sync();
    data = window.EventFlowAdminRuntime.snapshot(initialData?.pageProps);
  }
  if (page === 'dashboard') {
    try {
      const response = await window.apiGetDashboard();
      data.dashboardData = response?.data || response;
    } catch {
      data.dashboardData = null;
    }
  }
  data.actions = adminActions;
  return data;
}

// Resolve handlers at click time so API-backed overrides installed by data-sync remain active.
export const adminActions = {
  onChangePass: (...args) => window.changePass(...args),
  onSignOut: (...args) => window.doLogout(...args),
  onFilterEventReportsStage: (...args) => window.filterEventReportsStage(...args),
  onFilterRevenueTimeframe: (...args) => window.filterRevenueTimeframe(...args),
  onFilterUserReports: (...args) => window.filterUserReports(...args),
  onNavigate: (...args) => window.goNav(...args),
  onSaveSettings: (...args) => window.saveSettings(...args),
  onSetEmployeeReportFilter: (...args) => window.setEmployeeReportFilter(...args),
  onViewEmployeeReport: (...args) => window.viewEmployeeReport(...args),
  onValidationError: message => window.toast(message, 'error'),
};
