import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */async function renderCustomerRequests(el) {
      const options = supportExecutiveRequestOptions();
      el.innerHTML = await window.EventFlowSupport.render(CU, 'Back to Dashboard', options);
      window.EventFlowSupport.bind(el, CU, () => goNav('dashboard'), 'Back to Dashboard', options);
      const ticketId = sessionStorage.getItem('support_request_id');
      sessionStorage.removeItem('support_request_id');
      if (ticketId) {
        Array.from(el.querySelectorAll('[data-ticket-view]'))
          .find(button => button.dataset.ticketView === ticketId)?.click();
      }
    }/* PORTAL_RUNTIME_END */
}

export default function SupportIssuesPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
