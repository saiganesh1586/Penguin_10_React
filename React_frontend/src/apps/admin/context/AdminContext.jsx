import { createContext, useContext } from 'react';
export const AdminContext = createContext(null);
export function useAdminContext() {
  const value = useContext(AdminContext);
  if (!value) throw new Error('Admin pages must be rendered inside their page container.');
  return value;
}
