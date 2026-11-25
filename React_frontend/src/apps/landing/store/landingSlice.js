import { createPortalSlice } from '../../../app/state/createPortalSlice.js';
import { landingRepository } from '../api/landingRepository.js';

export const landingSlice = createPortalSlice('landing', landingRepository);
