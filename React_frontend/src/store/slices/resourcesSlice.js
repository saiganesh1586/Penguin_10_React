import { createSlice } from '@reduxjs/toolkit';
import { eventRequestsResource, selectWorkspaceEventRequests } from './eventRequestsSlice.js';
import { eventsResource, selectWorkspaceEvents } from './eventsSlice.js';
import { registrationsResource, selectWorkspaceRegistrations } from './registrationsSlice.js';
import { createResourceSlice } from '../factories/createResourceSlice.js';
import { readWorkspace } from '../actions/workspaceActions.js';

// Use the collection names from the backend. A resource can have several API
// views (workspace rows, public results, filtered results, and a detail).
const workspaceCollections = {
  users: 'users',
  eventPlans: 'eventPlans',
  payments: 'payments',
  refunds: 'refunds',
  eventWorkflowPayments: 'eventWorkflowPayments',
  eventWorkflowRefunds: 'eventWorkflowRefunds',
  notifications: 'notifications',
  supportTickets: 'supportTickets',
  supportReports: 'supportExecutiveReports',
};

const routeCollections = [
  [/^\/workspace\/customers(?:\/|$)|^\/auth\/(?:register|password)$|^\/users(?:\/|$)/, 'users'],
  [/^\/workspace\/events(?:\/|$)|^\/(?:public\/)?events(?:\/|$)/, 'events'],
  [/^\/event-requests\/[^/]+\/(?:pay-deposit|payments?)(?:\/|$)|^\/payments\/events(?:\/|$)/, 'eventWorkflowPayments'],
  [/^\/event-requests\/[^/]+\/(?:plan|plans)(?:\/|$)/, 'eventPlans'],
  [/^\/event-requests\/[^/]+\/modifications(?:\/|$)/, 'eventChanges'],
  [/^\/event-requests\/organizers(?:\/|$)/, 'users'],
  [/^\/event-requests(?:\/|$)/, 'eventRequests'],
  [/^\/event-plans(?:\/|$)/, 'eventPlans'],
  [/^\/registrations(?:\/|$)/, 'registrations'],
  [/^\/attendees(?:\/|$)/, 'attendees'],
  [/^\/attendance(?:\/|$)/, 'attendance'],
  [/^\/(?:payments|finance\/transactions)(?:\/|$)/, 'payments'],
  [/^\/finance\/refunds(?:\/|$)/, 'refunds'],
  [/^\/finance\/submissions(?:\/|$)/, 'financeReportSubmissions'],
  [/^\/notifications(?:\/|$)/, 'notifications'],
  [/^\/activity-logs(?:\/|$)/, 'activityLogs'],
  [/^\/reports\/events\/(?:completion|[^/]+\/completion)(?:\/|$)/, 'eventCompletionReports'],
  [/^\/reports\/events(?:\/|$)/, 'eventReports'],
  [/^\/reports\/support(?:\/|$)/, 'supportExecutiveReports'],
  [/^\/reports\/operational(?:\/|$)/, 'operationalReports'],
  [/^\/reviews\/(?:client-organizer|organizers)(?:\/|$)/, 'clientOrganizerReviews'],
  [/^\/reviews\/events(?:\/|$)/, 'eventReviews'],
  [/^\/auth\/organizer-application(?:s|\/|$)/, 'organizerApplications'],
  [/^\/support\/tickets(?:\/|$)/, 'supportTickets'],
  [/^\/support\/attachments(?:\/|$)/, 'supportAttachments'],
  [/^\/uploads(?:\/|$)/, 'uploads'],
  [/^\/(?:analytics|finance)(?:\/|$)/, 'reportViews'],
];

export function resourceForRequest(pathname) {
  const path = pathname.replace(/^\/api(?=\/)/, '');
  if (path === '/workspace') return 'workspace';
  return routeCollections.find(([pattern]) => pattern.test(path))?.[1];
}

const workspace = createSlice({
  name: 'workspace',
  initialState: { currentUser: null, version: null, readId: null },
  reducers: {},
  extraReducers: builder => builder
    .addCase(readWorkspace.pending, (state, action) => {
      state.readId = action.meta.requestId;
    })
    .addCase(readWorkspace.fulfilled, (state, action) => {
      if (state.readId !== action.meta.requestId) return;
      state.currentUser = action.payload?.currentUser ?? null;
      state.version = action.payload?.version ?? null;
    }),
});

export const workspaceReducer = workspace.reducer;

export function selectWorkspace(state) {
  if (!state.workspace.currentUser) return null;
  return {
    currentUser: state.workspace.currentUser,
    version: state.workspace.version,
    events: selectWorkspaceEvents(state) ?? [],
    eventRequests: selectWorkspaceEventRequests(state) ?? [],
    registrations: selectWorkspaceRegistrations(state) ?? [],
    ...Object.fromEntries(Object.entries(workspaceCollections).map(([field, name]) => [
      field,
      state.resources[name].workspace ?? [],
    ])),
  };
}

const featureResources = {
  events: eventsResource,
  eventRequests: eventRequestsResource,
  registrations: registrationsResource,
};

const collectionNames = new Set([
  ...Object.values(workspaceCollections),
  ...routeCollections.map(([, name]) => name),
]);

const resources = Object.fromEntries([...collectionNames].map(name => {
  const workspaceField = Object.keys(workspaceCollections).find(field => workspaceCollections[field] === name);
  return [name, featureResources[name] ?? createResourceSlice(name, { workspaceField })];
}));

export const resourceReducers = Object.fromEntries(
  Object.entries(resources).map(([name, resource]) => [name, resource.reducer])
);

export function resourceAction(name, method, pathname) {
  if (name === 'workspace') return method === 'GET' ? readWorkspace : undefined;
  const path = pathname?.replace(/^\/api(?=\/)/, '');
  return resources[name]?.actionForRequest(method, path);
}

export function directResourceWriteCommitted(action, previousState) {
  if (action.meta?.arg?.request || !action.type.endsWith('/fulfilled')) return false;
  const resource = action.type.split('/')[0];
  const definition = featureResources[resource];
  return Boolean(definition?.writeFulfilled(action)
    && previousState.resources[resource].pendingWrites[action.meta.requestId]);
}

export const selectResourceQuery = (state, name, key) => state.resources[name].byQuery[key];
