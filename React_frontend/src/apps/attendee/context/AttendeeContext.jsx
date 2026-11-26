import { createContext, useContext } from 'react';

export const AttendeeContext = createContext(null);

export function useAttendeeContext() {
  const value = useContext(AttendeeContext);
  if (!value) throw new Error('Attendee pages must be rendered inside their page container.');
  return value;
}
