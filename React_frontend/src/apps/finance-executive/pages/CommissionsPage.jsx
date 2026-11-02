import { useFinanceExecutiveContext } from '../context/FinanceExecutiveContext.jsx';
import { CommissionPreview } from '../components/CommissionPreview.jsx';
export default function CommissionsPage() {
  const portalContext = useFinanceExecutiveContext();
  const portalActions = portalContext.actions;
  let html = '';
  html = (
    <CommissionPreview
      financeCommissionDemo={portalContext.financeCommissionDemo}
      financeMoney={portalContext.financeMoney}
      onRenderPage={portalContext.actions.onRenderPage}
      _currentPage={portalContext._currentPage}
    />
  );
  return html;
}
