import { useEffect } from 'react';
import validationRulesSource from './validation-rules.js?raw';
import themeSource from './theme.js?raw';
import scannerSource from '../apps/attendee/utils/ticket-scanner.js?raw';
import supportSource from '../apps/customer-support/api/legacySupport.js?raw';
import supportReportsSource from '../apps/support-executive/api/supportReports.js?raw';
import accountPolicySource from './account-policy.js?raw';
import organizerRegSource from '../apps/organizer/utils/organizer-registration.js?raw';
import paymentCheckoutSource from './paymentCheckout.js?raw';
import dataSyncSource from './data-sync.js?raw';
import '../styles/payment-checkout.css';

function run(source) {
  const script = document.createElement('script');
  script.textContent = source;
  document.body.appendChild(script);
  return script;
}

export default function LegacyRuntime({ source, role }) {
  useEffect(() => {
    const existingRuntime = window.__eventFlowLegacyRuntime;
    if (existingRuntime) {
      if (!existingRuntime.active || existingRuntime.role !== role || existingRuntime.source !== source) window.location.reload();
      return;
    }
    window.__eventFlowLegacyRuntime = { role, source, active: true };
    document.body.dataset.eventflowRole = role;
    const scripts = [run(validationRulesSource), run(themeSource), run(scannerSource), run(supportSource), run(supportReportsSource), run(accountPolicySource), run(organizerRegSource), run(source), run(paymentCheckoutSource), run(dataSyncSource)];
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return () => {
      window.EventFlowData?.dispose?.();
      window.__eventFlowLegacyRuntime.active = false;
      scripts.forEach(script => script.remove());
    };
  }, [source, role]);
  return null;
}
