// API refresh stays in this module; pages consume the normalized workspace snapshot.
export async function loadClientData(page, initialData, attempt = 0) {
  let data = initialData;
  if (!data || attempt > 0) {
    await window.EventFlowData?.sync();
    await window.syncWorkflowData?.();
    if (page === 'find-organizers') await window.syncOrganizerDirectory?.();
    data = window.EventFlowClientRuntime.snapshot(initialData?.pageProps);
  }
  data.actions = clientActions;
  return data;
}

// Resolve handlers at click time so API-backed overrides installed by data-sync remain active.
export const clientActions = {
  onAcceptWorkflowCounteroffer: (...args) => window.acceptWorkflowCounteroffer(...args),
  onAcceptWorkflowRequest: (...args) => window.acceptWorkflowRequest(...args),
  onChangePass: (...args) => window.changePass(...args),
  onDeleteEvent: (...args) => window.deleteEvent(...args),
  onSignOut: (...args) => window.doLogout(...args),
  onDownloadWorkflowEventReport: (...args) => window.downloadWorkflowEventReport(...args),
  onFilterOrganizers: (...args) => window.filterOrganizers(...args),
  onNavigate: (...args) => window.goNav(...args),
  onMarkAllRead: (...args) => window.markAllRead(...args),
  onMarkNotifRead: (...args) => window.markNotifRead(...args),
  onOpenClientCancelRequestModal: (...args) => window.openClientCancelRequestModal(...args),
  onOpenClientCancellationNotification: (...args) =>
    window.openClientCancellationNotification(...args),
  onOpenClientPaymentModal: (...args) => window.openClientPaymentModal(...args),
  onOpenClientPlanReview: (...args) => window.openClientPlanReview(...args),
  onOpenEditEventModal: (...args) => window.openEditEventModal(...args),
  onOpenEventCompletionPhoto: (...args) => window.openEventCompletionPhoto(...args),
  onOpenEventPlanPdf: (...args) => window.openEventPlanPdf(...args),
  onOpenViewEventDrawer: (...args) => window.openViewEventDrawer(...args),
  onOpenWorkflowCancellation: (...args) => window.openWorkflowCancellation(...args),
  onOpenWorkflowCounterofferModal: (...args) => window.openWorkflowCounterofferModal(...args),
  onOpenWorkflowPlanAcceptanceModal: (...args) => window.openWorkflowPlanAcceptanceModal(...args),
  onOpenWorkflowPlanModal: (...args) => window.openWorkflowPlanModal(...args),
  onOpenWorkflowPlanRejectionModal: (...args) => window.openWorkflowPlanRejectionModal(...args),
  onOpenWorkflowPlanRevisionModal: (...args) => window.openWorkflowPlanRevisionModal(...args),
  onOpenWorkflowPolicyDocument: (...args) => window.openWorkflowPolicyDocument(...args),
  onOpenWorkflowRejectModal: (...args) => window.openWorkflowRejectModal(...args),
  onRegForEvent: (...args) => window.regForEvent(...args),
  onRenderPage: (...args) => window.renderPage(...args),
  onRespondToWorkflowChanges: (...args) => window.respondToWorkflowChanges(...args),
  onSaveSettings: (...args) => window.saveSettings(...args),
  onSearchOrganizers: (...args) => window.searchOrganizers(...args),
  onSetWorkflowEventTab: (...args) => window.setWorkflowEventTab(...args),
  onSubmitClientOrganizerReview: (...args) => window.submitClientOrganizerReview(...args),
  onSwitchReqStatTab: (...args) => window.switchReqStatTab(...args),
  onViewOngoingEventDetail: (...args) => window.viewOngoingEventDetail(...args),
  onViewOrganizerProfile: (...args) => window.viewOrganizerProfile(...args),
  onViewRequestDetail: (...args) => window.viewRequestDetail(...args),
  onViewRequestDrawer: (...args) => window.viewRequestDrawer(...args),
  onViewWorkflowEventDetails: (...args) => window.viewWorkflowEventDetails(...args),
  onViewWorkflowEventReport: (...args) => window.viewWorkflowEventReport(...args),
  onViewWorkflowRequestDrawer: (...args) => window.viewWorkflowRequestDrawer(...args),
  onViewClientPublishedEvent: (...args) => window.viewClientPublishedEvent(...args),
  onOpenClientRequestFromActivity: (...args) => window.openClientRequestFromActivity(...args),
  onShowPage: (...args) => window.showPage(...args),
  onGotoLogin: (...args) => window.gotoLogin(...args),
  onValidationError: message => window.toast(message, 'error'),
};
export async function loadClientActivity() {
  const response = await window.apiGetMyActivity(8);
  const rows = Array.isArray(response) ? response : response?.logs || [];
  return [...rows].sort((left, right) => {
    const difference =
      new Date(right.timestamp || right.createdAt || 0) -
      new Date(left.timestamp || left.createdAt || 0);
    return difference || String(right.id || '').localeCompare(String(left.id || ''));
  });
}
