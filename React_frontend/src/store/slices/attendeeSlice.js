import { createPortalSlice } from '../factories/createPortalSlice.js';
import { attendeeRepository } from '../../apps/attendee/api/attendeeRepository.js';

export const attendeeSlice = createPortalSlice('attendee', attendeeRepository);
