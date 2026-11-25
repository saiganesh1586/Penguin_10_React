import { supportExecutiveRepository } from '../api/support-executive-api.js';
import { createPortalSlice } from '../../../app/state/createPortalSlice.js';

export const supportExecutiveSlice = createPortalSlice(
  'supportExecutive',
  supportExecutiveRepository
);
