import { organizerRepository } from '../api/organizer-api.js';
import { createPortalSlice } from '../../../app/state/createPortalSlice.js';

export const organizerSlice = createPortalSlice('organizer', organizerRepository);
