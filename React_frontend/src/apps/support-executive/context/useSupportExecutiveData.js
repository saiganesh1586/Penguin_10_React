import usePortalData from '../../../app/usePortalData.js';
import { loadSupportExecutiveData } from '../api/support-executive-api.js';
export default function useSupportExecutiveData(page, initialData) {
  return usePortalData(loadSupportExecutiveData, page, initialData);
}
