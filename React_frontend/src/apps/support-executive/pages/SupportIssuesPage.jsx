import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  async function renderCustomerRequests(element) {
    const options = supportExecutiveRequestOptions();
    element.innerHTML = await window.EventFlowSupport.render(CU, 'Back to Dashboard', options);
    window.EventFlowSupport.bind(
      element,
      CU,
      () => goNav('dashboard'),
      'Back to Dashboard',
      options
    );
    const ticketId = sessionStorage.getItem('support_request_id');
    sessionStorage.removeItem('support_request_id');
    if (ticketId) {
      Array.from(element.querySelectorAll('[data-ticket-view]'))
        .find(button => button.dataset.ticketView === ticketId)
        ?.click();
    }
  }
  /* PORTAL_RUNTIME_END */
}
export default function SupportIssuesPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
