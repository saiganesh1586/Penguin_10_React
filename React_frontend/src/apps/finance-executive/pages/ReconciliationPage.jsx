import { useFinanceExecutiveContext } from '../context/FinanceExecutiveContext.jsx';
import {
  FinanceHeader,
  FinanceProviderBanner,
  FinanceRanges,
} from '../components/FinanceHeader.jsx';
export default function ReconciliationPage() {
  const portalContext = useFinanceExecutiveContext();
  const portalActions = portalContext.actions;
  const { financeData } = portalContext;
  let html = '';
  const data = financeData;
  html = (
    <>
      <FinanceHeader
        onRenderPage={portalContext.actions.onRenderPage}
        _currentPage={portalContext._currentPage}
        title={'Payment Reconciliation'}
        subtitle={'Financial operations · INR · Asia/Kolkata'}
      />
      <FinanceProviderBanner />
      <FinanceRanges
        onFinanceSet={portalContext.actions.onFinanceSet}
        financeFilters={portalContext.financeFilters}
      />
      <div className="card">
        <div className="h4 mb-12">Gateway reconciliation unavailable</div>
        <p className="muted">
          {data.reason} Checked, matched, and discrepancy totals require an independent payment
          source.
        </p>
      </div>
    </>
  );
  return html;
}
