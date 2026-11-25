import { clientRepository } from '../api/client-api.js';
import { createPortalSlice } from '../../../app/state/createPortalSlice.js';

export const clientSlice = createPortalSlice('client', clientRepository);
