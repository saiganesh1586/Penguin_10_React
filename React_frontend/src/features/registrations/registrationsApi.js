export const registrationEndpoints = {
  loadRegistrations: ['GET', '/registrations'],
  loadRegistration: ['GET', '/registrations/:id'],
  createRegistration: ['POST', '/registrations'],
  updateRegistrationDetails: ['PATCH', '/registrations/:id/details'],
  reviewRegistration: ['PATCH', '/registrations/:id/review'],
  markRegistrationDeclineViewed: ['PATCH', '/registrations/:id/decline-viewed'],
  confirmWaitlistRegistration: ['POST', '/registrations/:id/waitlist/confirm'],
  cancelRegistration: ['PATCH', '/registrations/:id/cancel'],
};
