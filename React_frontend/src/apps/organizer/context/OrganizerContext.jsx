import { createContext, useContext } from 'react';
export const OrganizerContext = createContext(null);
export function useOrganizerContext() {
  const value = useContext(OrganizerContext);
  if (!value) throw new Error('Organizer pages must be rendered inside their page container.');
  return value;
}
