// API refresh stays in this module; pages consume the normalized workspace snapshot.
export async function loadOrganizerData(page, initialData, attempt = 0) {
  let data = initialData;
  if (!data || attempt > 0) {
    await window.EventFlowData?.sync();
    await window.syncWorkflowData?.();
    if (page === 'attendees') await window.syncOrganizerAttendees?.();
    data = window.EventFlowOrganizerRuntime.snapshot(initialData?.pageProps);
  }
  data.actions = organizerActions;
  return data;
}

// Resolve handlers at click time so API-backed overrides installed by data-sync remain active.
export const organizerActions = {
  onAcceptWorkflowCounteroffer: (...args) => window.acceptWorkflowCounteroffer(...args),
  onAcceptWorkflowRequest: (...args) => window.acceptWorkflowRequest(...args),
  onCancelReg: (...args) => window.cancelReg(...args),
  onChangePass: (...args) => window.changePass(...args),
  onCompleteWorkflowEvent: (...args) => window.completeWorkflowEvent(...args),
  onSignOut: (...args) => window.doLogout(...args),
  onDownloadWorkflowEventReport: (...args) => window.downloadWorkflowEventReport(...args),
  onFilterEventReportsStage: (...args) => window.filterEventReportsStage(...args),
  onFilterOrganizerDashboardEventsFromControls: (...args) =>
    window.filterOrganizerDashboardEventsFromControls(...args),
  onFilterOrganizerEventOptions: (...args) => window.filterOrganizerEventOptions(...args),
  onNavigate: (...args) => window.goNav(...args),
  onHandleOrganizerDeleteEvent: (...args) => window.handleOrganizerDeleteEvent(...args),
  onMarkAllRead: (...args) => window.markAllRead(...args),
  onMarkNotifRead: (...args) => window.markNotifRead(...args),
  onOpenAddEventModal: (...args) => window.openAddEventModal(...args),
  onOpenCompletionReportModal: (...args) => window.openCompletionReportModal(...args),
  onOpenCreateEventOpsReportModal: (...args) => window.openCreateEventOpsReportModal(...args),
  onOpenEditEventModal: (...args) => window.openEditEventModal(...args),
  onOpenEventCompletionPhoto: (...args) => window.openEventCompletionPhoto(...args),
  onOpenEventPlanPdf: (...args) => window.openEventPlanPdf(...args),
  onOpenOrganizerEventCancellationModal: (...args) =>
    window.openOrganizerEventCancellationModal(...args),
  onOpenOrganizerEvents: (...args) => window.openOrganizerEvents(...args),
  onOpenOrganizerReportFile: (...args) => window.openOrganizerReportFile(...args),
  onOpenOrganizerRequests: (...args) => window.openOrganizerRequests(...args),
  onOpenSubmitOperationalReportModal: (...args) => window.openSubmitOperationalReportModal(...args),
  onOpenSubmitReportModal: (...args) => window.openSubmitReportModal(...args),
  onOpenViewEventDrawer: (...args) => window.openViewEventDrawer(...args),
  onOpenWorkflowCounterofferModal: (...args) => window.openWorkflowCounterofferModal(...args),
  onOpenWorkflowPlanModal: (...args) => window.openWorkflowPlanModal(...args),
  onOpenWorkflowPlanRevisionModal: (...args) => window.openWorkflowPlanRevisionModal(...args),
  onOpenWorkflowPolicyDocument: (...args) => window.openWorkflowPolicyDocument(...args),
  onOpenWorkflowRejectModal: (...args) => window.openWorkflowRejectModal(...args),
  onOrganiserApproveAttendee: (...args) => window.organiserApproveAttendee(...args),
  onOrganiserRejectAttendee: (...args) => window.organiserRejectAttendee(...args),
  onPageOrganizerFinancialRecords: (...args) => window.pageOrganizerFinancialRecords(...args),
  onRefreshAttendees: (...args) => window.refreshAttendees(...args),
  onRefreshEorPage: (...args) => window.refreshEorPage(...args),
  onRefreshEvents: (...args) => window.refreshEvents(...args),
  onRegForEvent: (...args) => window.regForEvent(...args),
  onRenderPage: (...args) => window.renderPage(...args),
  onRespondToWorkflowChanges: (...args) => window.respondToWorkflowChanges(...args),
  onReviewWorkflowPlan: (...args) => window.reviewWorkflowPlan(...args),
  onSaveSettings: (...args) => window.saveSettings(...args),
  onScanQR: (...args) => window.scanQR(...args),
  onSearchOrganizerEvents: (...args) => window.searchOrganizerEvents(...args),
  onSetOrganizerEventFilter: (...args) => window.setOrganizerEventFilter(...args),
  onSetWorkflowEventTab: (...args) => window.setWorkflowEventTab(...args),
  onSubmitDraftEventOpsReport: (...args) => window.submitDraftEventOpsReport(...args),
  onSubmitOperationalReport: (...args) => window.submitOperationalReport(...args),
  onSwitchOrganizerEvent: (...args) => window.switchOrganizerEvent(...args),
  onSwitchReportTab: (...args) => window.switchReportTab(...args),
  onToast: (...args) => window.toast(...args),
  onViewEventOpsReportModal: (...args) => window.viewEventOpsReportModal(...args),
  onViewOrganizerAttendeeProfile: (...args) => window.viewOrganizerAttendeeProfile(...args),
  onViewRequestDetail: (...args) => window.viewRequestDetail(...args),
  onViewWorkflowEventDetails: (...args) => window.viewWorkflowEventDetails(...args),
  onViewWorkflowEventReport: (...args) => window.viewWorkflowEventReport(...args),
  onViewWorkflowRequestDrawer: (...args) => window.viewWorkflowRequestDrawer(...args),
  onOrganizerEventSection: (...args) => window.organizerEventSection(...args),
  onOpenOrganizerIssue: (...args) => window.openOrganizerIssue(...args),
  onValidationError: message => window.toast(message, 'error'),
};
