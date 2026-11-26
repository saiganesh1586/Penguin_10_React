import { createResourceSlice } from '../factories/createResourceSlice.js';
import { eventEndpoints, publicEventsQuery } from '../../features/events/eventsApi.js';

export const eventsResource = createResourceSlice('events', {
  workspaceField: 'events',
  endpoints: eventEndpoints,
});

export const { loadEvents, loadPublicEvents, loadEvent, createEvent, updateEvent, cancelEvent, deleteEvent } =
  eventsResource.actions;

export const selectWorkspaceEvents = state => state.resources.events.workspace;
export const selectPublicEvents = state => state.resources.events.byQuery[publicEventsQuery];
export const selectEventsRevision = state => state.resources.events.revision;
