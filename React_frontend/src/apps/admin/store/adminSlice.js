import { adminRepository } from '../api/admin-api.js';
import { createPortalSlice } from '../../../app/state/createPortalSlice.js';

export const adminSlice = createPortalSlice('admin', adminRepository);
