import { clientRepository } from '../../apps/client/api/client-api.js';
import { createPortalSlice } from '../factories/createPortalSlice.js';

export const clientSlice = createPortalSlice('client', clientRepository);
