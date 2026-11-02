import usePortalData from '../../../app/usePortalData.js';
import { loadFinanceExecutiveData } from '../api/finance-executive-api.js';
export default function useFinanceExecutiveData(page, initialData) {
  const financialPage = [
    'dashboard',
    'transactions',
    'refunds',
    'reconciliation',
    'reports',
    'commissions',
  ].includes(page);
  return usePortalData(loadFinanceExecutiveData, page, initialData, financialPage);
}
