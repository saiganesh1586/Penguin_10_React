import { createPortalRepository, readRuntimeData } from '../../../store/api/portalRepository.js';
import { resourceAction } from '../../../store/slices/resourcesSlice.js';
import { API_BASE_URL } from '../../../app/config.js';
import { selectSession } from '../../../store/slices/authSlice.js';

export const clientRepository = createPortalRepository(async ({ page, pageProps, force = false }) => {
  await window.EventFlowData?.sync(undefined, undefined, { force, applyCached: false });
  if (force) {
    await window.syncWorkflowData?.();
    if (page === 'find-organizers') await window.syncOrganizerDirectory?.();
  }
  const runtime = window.EventFlowClientRuntime;
  return readRuntimeData(runtime.snapshot(pageProps), {
    ...(page === 'my-events' ? { workflowEvents: 'getClientWorkflowEvents' } : {}),
    ...(page === 'notifications' ? { notificationRows: 'visibleNotifications' } : {}),
  });
});

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
const activityUrl = `${API_BASE_URL}/activity-logs/me?limit=8`;
export const clientActivityQuery = new URL(activityUrl).pathname + '?limit=8';
const readActivity = resourceAction('activityLogs', 'GET');

export const loadClientActivity = () => (dispatch, getState) => {
  const token = selectSession(getState())?.token;
  if (!token) return;
  return dispatch(readActivity({
    key: clientActivityQuery,
    request: signal => fetch(activityUrl, {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    }),
  }));
};
