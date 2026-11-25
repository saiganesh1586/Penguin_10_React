import { createPortalRepository } from '../../../app/state/portalRepository.js';
import { loadPublicEvents } from '../../../features/events/eventsSlice.js';

export const landingRepository = createPortalRepository(async ({ signal, dispatch }) => {
  try {
    await dispatch(loadPublicEvents(undefined, { signal })).unwrap();
  } catch {
    throw new Error('Events could not be loaded. Please try again.');
  }
  return null;
});
