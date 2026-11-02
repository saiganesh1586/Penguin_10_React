import usePortalData from '../../../app/usePortalData.js';
import { loadClientData } from '../api/client-api.js';
export default function useClientData(page, initialData) {
  return usePortalData(loadClientData, page, initialData);
}
