import { createContext, useContext } from 'react';
export const FinanceExecutiveContext = createContext(null);
export function useFinanceExecutiveContext() {
  const value = useContext(FinanceExecutiveContext);
  if (!value)
    throw new Error('FinanceExecutive pages must be rendered inside their page container.');
  return value;
}
