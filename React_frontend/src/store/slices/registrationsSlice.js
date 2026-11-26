import { createResourceSlice } from '../factories/createResourceSlice.js';
import { registrationEndpoints } from '../../features/registrations/registrationsApi.js';

export const registrationsResource = createResourceSlice('registrations', {
  workspaceField: 'registrations',
  endpoints: registrationEndpoints,
});

export const {
  loadRegistrations, loadRegistration, createRegistration, updateRegistrationDetails,
  reviewRegistration, cancelRegistration,
} = registrationsResource.actions;

export const selectWorkspaceRegistrations = state => state.resources.registrations.workspace;
