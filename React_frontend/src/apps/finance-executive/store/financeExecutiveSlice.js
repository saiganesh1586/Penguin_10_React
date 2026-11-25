import { financeExecutiveRepository } from '../api/finance-executive-api.js';
import { createPortalSlice } from '../../../app/state/createPortalSlice.js';

export const financeExecutiveSlice = createPortalSlice(
  'financeExecutive',
  financeExecutiveRepository
);
