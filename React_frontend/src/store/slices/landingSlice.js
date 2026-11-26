import { createPortalSlice } from '../factories/createPortalSlice.js';
import { landingRepository } from '../../apps/landing/api/landingRepository.js';

export const landingSlice = createPortalSlice('landing', landingRepository);
