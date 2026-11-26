import { useEffect } from 'react';
import validationRulesSource from './validation-rules.js?raw';
import eventDateRulesSource from './event-date-rules.js?raw';
import themeSource from './theme.js?raw';
import scannerSource from '../../apps/attendee/utils/ticket-scanner.js?raw';
import supportSource from '../../apps/customer-support/api/legacySupport.js?raw';
import supportReportsSource from '../../apps/customer-support/api/supportReports.js?raw';
import accountPolicySource from './account-policy.js?raw';
import organizerRegSource from '../../apps/organizer/utils/organizer-registration.js?raw';
import paymentCheckoutSource from './paymentCheckout.js?raw';
import dataSyncSource from './data-sync.js?raw';
import { portalSlices, store } from '../../store/store.js';
import { createRuntimeFetch } from '../../store/api/portalRepository.js';
import { selectWorkspace } from '../../store/slices/resourcesSlice.js';
import { login, logout, profileReceived, registrationConfirmed, selectSession } from '../../store/slices/authSlice.js';
import '../../styles/payment-checkout.css';

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
      if (
        !existingRuntime.active ||
        existingRuntime.role !== role ||
        existingRuntime.source !== source
      )
        window.location.reload();
      return;
    }
    window.__eventFlowLegacyRuntime = { role, source, active: true };
    document.body.dataset.eventflowRole = role;
    window.EventFlowAuth = {
      login: (email, password) => store.dispatch(login({ email, password })),
      logout: () => store.dispatch(logout()),
      getSession: () => {
        const user = selectSession(store.getState());
        return user && structuredClone(user);
      },
      updateProfile: profile => store.dispatch(profileReceived(profile)),
      registrationConfirmed: user => store.dispatch(registrationConfirmed(user)),
    };
    const slice = portalSlices[role];
    if (slice) {
      window.EventFlowFetch = createRuntimeFetch(
        store.dispatch,
        slice.actions,
        () => window.EventFlowData?.invalidate(),
        () => selectSession(store.getState())?.token
      );
      window.EventFlowResources = {
        getWorkspace: () => {
          const workspace = selectWorkspace(store.getState());
          return workspace && structuredClone(workspace);
        },
      };
    }
    const scripts = [
      run(eventDateRulesSource),
      run(validationRulesSource),
      run(themeSource),
      run(scannerSource),
      run(supportSource),
      run(supportReportsSource),
      run(accountPolicySource),
      run(organizerRegSource),
      run(source),
      run(paymentCheckoutSource),
      run(dataSyncSource),
    ];
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return () => {
      window.EventFlowData?.dispose?.();
      delete window.EventFlowFetch;
      delete window.EventFlowAuth;
      delete window.EventFlowResources;
      if (slice) store.dispatch(slice.actions.reset());
      window.__eventFlowLegacyRuntime.active = false;
      scripts.forEach(script => script.remove());
    };
  }, [source, role]);
  return null;
}
