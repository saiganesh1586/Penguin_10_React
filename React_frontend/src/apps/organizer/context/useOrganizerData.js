import usePortalData from '../../../app/usePortalData.js';
import { loadOrganizerData } from '../api/organizer-api.js';
export default function useOrganizerData(page, initialData) {
  return usePortalData(loadOrganizerData, page, initialData);
}
