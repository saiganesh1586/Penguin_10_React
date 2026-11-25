import { createResourceSlice } from '../../app/state/createResourceSlice.js';
import { eventRequestEndpoints } from './eventRequestsApi.js';

export const eventRequestsResource = createResourceSlice('eventRequests', {
  workspaceField: 'eventRequests',
  endpoints: eventRequestEndpoints,
});

export const {
  loadEventRequests, loadEventRequest, createEventRequest, updateEventRequestStatus, cancelEventRequest,
} = eventRequestsResource.actions;

export const selectWorkspaceEventRequests = state => state.resources.eventRequests.workspace;
