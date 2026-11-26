import { loadFinanceCenter, loadFinanceReport } from './finance-data.js';
import { createPortalRepository, readRuntimeData } from '../../../store/api/portalRepository.js';

export const supportExecutiveRepository = createPortalRepository(async ({ page, pageProps, force = false }) => {
  await window.EventFlowData?.sync(undefined, undefined, { force, applyCached: false });
  const runtime = window.EventFlowSupportExecutiveRuntime;
  const snapshot = runtime.snapshot(pageProps);
  const data = readRuntimeData(snapshot, {
    ...(page === 'notifications' ? { notificationRows: 'visibleNotifications' } : {}),
    ...(page === 'reports-analytics' ? { supportReports: 'getAllReportsList' } : {}),
  });
  if (page === 'support-issues') {
    data.additionalTickets = readRuntimeData({
      tickets: snapshot.supportExecutiveRequestOptions?.().getAdditionalTickets?.() || [],
    }).tickets;
  }
  if (page === 'dashboard') {
    try {
      const response = await window.apiGetEmployeeDashboard();
      data.dashboardData = response?.data || response;
    } catch {
      data.dashboardData = null;
    }
  }
  if (page === 'finance') {
    try {
      data.financeResults = await loadFinanceCenter();
    } catch (error) {
      data.financeError = error.message;
    }
  }
  if (page === 'finance-reports') {
    try {
      data.financeReportData = await loadFinanceReport();
    } catch (error) {
      data.financeReportError = error.message;
    }
  }
  return data;
});

// Resolve handlers at click time so API-backed overrides installed by data-sync remain active.
export const supportExecutiveActions = {
  onApplyFinanceDateRange: (...args) => window.applyFinanceDateRange(...args),
  onApplyFinanceRefundFilters: (...args) => window.applyFinanceRefundFilters(...args),
  onApproveEventOpsDirect: (...args) => window.approveEventOpsDirect(...args),
  onApproveRegistrationDirect: (...args) => window.approveRegistrationDirect(...args),
  onChangePass: (...args) => window.changePass(...args),
  onClearFinanceDateRange: (...args) => window.clearFinanceDateRange(...args),
  onSignOut: (...args) => window.doLogout(...args),
  onDownloadFinanceCsv: (...args) => window.downloadFinanceCsv(...args),
  onFinanceChangePage: (...args) => window.financeChangePage(...args),
  onNavigate: (...args) => window.goNav(...args),
  onMarkAllRead: (...args) => window.markAllRead(...args),
  onMarkNotifRead: (...args) => window.markNotifRead(...args),
  onOpenCreateSupportExecutiveReportModal: (...args) =>
    window.openCreateSupportExecutiveReportModal(...args),
  onOpenEditEventModal: (...args) => window.openEditEventModal(...args),
  onOpenEditUserModal: (...args) => window.openEditUserModal(...args),
  onOpenFinanceRefund: (...args) => window.openFinanceRefund(...args),
  onOpenFinanceTransaction: (...args) => window.openFinanceTransaction(...args),
  onOpenRejectRegistrationWithReasonModal: (...args) =>
    window.openRejectRegistrationWithReasonModal(...args),
  onOpenReviewRegistrationModal: (...args) => window.openReviewRegistrationModal(...args),
  onOpenViewEventDrawer: (...args) => window.openViewEventDrawer(...args),
  onPreviewReportDocument: (...args) => window.previewReportDocument(...args),
  onRefreshFinanceCenter: (...args) => window.refreshFinanceCenter(...args),
  onRefreshReportsAnalytics: (...args) => window.refreshReportsAnalytics(...args),
  onRefreshUemEvents: (...args) => window.refreshUemEvents(...args),
  onRefreshUemRegistrations: (...args) => window.refreshUemRegistrations(...args),
  onRefreshUemUsers: (...args) => window.refreshUemUsers(...args),
  onRejectEventOpsDirect: (...args) => window.rejectEventOpsDirect(...args),
  onRenderPage: (...args) => window.renderPage(...args),
  onResetFinanceRefundFilters: (...args) => window.resetFinanceRefundFilters(...args),
  onSaveSettings: (...args) => window.saveSettings(...args),
  onSetEventOpsStatus: (...args) => window.setEventOpsStatus(...args),
  onSetUemTab: (...args) => window.setUemTab(...args),
  onSubmitReportToAdminDirect: (...args) => window.submitReportToAdminDirect(...args),
  onSwitchFinanceTab: (...args) => window.switchFinanceTab(...args),
  onSwitchTabAndNav: (...args) => window.switchTabAndNav(...args),
  onToggleUserStatus: (...args) => window.toggleUserStatus(...args),
  onOpenSupportTicketModal: (...args) => window.openSupportTicketModal(...args),
  onOpenSupportExecutiveRequest: (...args) => window.openSupportExecutiveRequest(...args),
  onValidationError: message => window.toast(message, 'error'),
};
