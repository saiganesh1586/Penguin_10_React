import { createPortalSlice } from '../../../app/state/createPortalSlice.js';
import { attendeeRepository } from '../api/attendeeRepository.js';

export const attendeeSlice = createPortalSlice('attendee', attendeeRepository);
