import { supportExecutiveRepository } from '../../apps/customer-support/api/support-executive-api.js';
import { createPortalSlice } from '../factories/createPortalSlice.js';

export const supportExecutiveSlice = createPortalSlice(
  'supportExecutive',
  supportExecutiveRepository
);
