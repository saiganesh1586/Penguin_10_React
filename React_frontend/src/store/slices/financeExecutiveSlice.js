import { financeExecutiveRepository } from '../../apps/finance-executive/api/finance-executive-api.js';
import { createPortalSlice } from '../factories/createPortalSlice.js';

export const financeExecutiveSlice = createPortalSlice(
  'financeExecutive',
  financeExecutiveRepository
);
