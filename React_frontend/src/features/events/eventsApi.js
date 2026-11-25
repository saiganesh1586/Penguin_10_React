import { API_BASE_URL } from '../../app/config.js';

const publicEventsPath = '/public/events';
export const publicEventsQuery = new URL(API_BASE_URL + publicEventsPath).pathname;

export const eventEndpoints = {
  loadEvents: ['GET', '/events'],
  loadPublicEvents: ['GET', publicEventsPath, { public: true }],
  loadAdminEvents: ['GET', '/events/admin'],
  loadEventStatistics: ['GET', '/events/statistics'],
  loadEvent: ['GET', '/events/:id'],
  loadEventCancellationPreview: ['GET', '/events/:id/cancellation-preview'],
  createEvent: ['POST', '/events'],
  updateEvent: ['PUT', '/events/:id'],
  updateWorkspaceEvent: ['PATCH', '/workspace/events/:id'],
  cancelEvent: ['POST', '/events/:id/cancel'],
  completeEvent: ['POST', '/events/:id/complete'],
  deleteEvent: ['DELETE', '/events/:id'],
};
