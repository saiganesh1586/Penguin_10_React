import { createContext, useContext } from 'react';
export const SupportExecutiveContext = createContext(null);
export function useSupportExecutiveContext() {
  const value = useContext(SupportExecutiveContext);
  if (!value)
    throw new Error('SupportExecutive pages must be rendered inside their page container.');
  return value;
}
