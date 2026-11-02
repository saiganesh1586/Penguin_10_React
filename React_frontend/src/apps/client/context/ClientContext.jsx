import { createContext, useContext } from 'react';
export const ClientContext = createContext(null);
export function useClientContext() {
  const value = useContext(ClientContext);
  if (!value) throw new Error('Client pages must be rendered inside their page container.');
  return value;
}
