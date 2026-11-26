import { adminRepository } from '../../apps/admin/api/admin-api.js';
import { createPortalSlice } from '../factories/createPortalSlice.js';

export const adminSlice = createPortalSlice('admin', adminRepository);
