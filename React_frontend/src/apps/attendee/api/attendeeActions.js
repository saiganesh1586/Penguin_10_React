// Resolve legacy workflow handlers at click time, after the runtime has installed them.
export const attendeeActions = {
  onNavigate: page => window.goNav(page),
  onRegister: eventId => window.regForEvent(String(eventId)),
  onViewEvent: (eventId, registrationId) => window.openViewEventDrawer(
    String(eventId), registrationId == null ? null : String(registrationId)
  ),
  onViewTicket: id => window.openViewTicketModal(String(id)),
  onPay: id => window.completeDemoPayment(String(id)),
  onCancel: id => window.cancelTicket(String(id)),
  onMarkNotificationRead: id => window.markNotifRead(String(id)),
  onMarkAllRead: () => window.markAllRead(),
  onSaveSettings: values => window.saveSettings(values),
  onChangePass: values => window.changePass(values),
  onSignOut: () => window.doLogout(),
  onValidationError: message => window.toast(message, 'error'),
};
