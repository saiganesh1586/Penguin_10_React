import usePortalData from '../../../app/usePortalData.js';
import { loadAdminData } from '../api/admin-api.js';
export default function useAdminData(page, initialData) {
  return usePortalData(loadAdminData, page, initialData);
}
