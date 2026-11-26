import { organizerRepository } from '../../apps/organizer/api/organizer-api.js';
import { createPortalSlice } from '../factories/createPortalSlice.js';

export const organizerSlice = createPortalSlice('organizer', organizerRepository);
