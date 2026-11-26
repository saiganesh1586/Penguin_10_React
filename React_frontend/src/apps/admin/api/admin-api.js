import { createPortalRepository, readRuntimeData } from '../../../store/api/portalRepository.js';

export const adminRepository = createPortalRepository(async ({ page, pageProps, force = false }) => {
  await window.EventFlowData?.sync(undefined, undefined, { force, applyCached: false });
  const runtime = window.EventFlowAdminRuntime;
  const data = readRuntimeData(runtime.snapshot(pageProps), {
    ...(page === 'employee-reports' ? { employeeReports: 'receivedEmployeeReports' } : {}),
  });
  if (page === 'dashboard') {
    try {
      const response = await window.apiGetDashboard();
      data.dashboardData = response?.data || response;
    } catch {
      data.dashboardData = null;
    }
  }
  return data;
});

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
