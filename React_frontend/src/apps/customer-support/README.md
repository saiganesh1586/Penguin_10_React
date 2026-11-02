# Customer Support module

This folder owns customer ticket requests and the Support Executive employee workspace. Finance remains in `../finance-executive/`. The former `src/apps/support-executive/` folder has been merged here.

| Entry point | Users | Existing routes |
| --- | --- | --- |
| `app/App.jsx` | Clients, organizers and attendees requesting help | `/customer-support` |
| `app/SupportExecutiveApp.jsx` | Support Executive employees managing users, registrations, event issues, requests and reports | `/employee` and `/employee1` |

The entries retain their existing session and permission checks. Customers can submit and follow up on their own tickets. Support employees manage the received queue. Employees and administrators visiting the customer request entry are redirected to their own workspace.

## Customer requests

- `app/App.jsx` checks the session and redirects excluded accounts.
- `pages/CustomerSupportPage.jsx` composes the request form and history with React state. `pages/TicketDetailsPage.jsx` contains the selected ticket's detail and conversation dialog.
- `context/useStoredSession.js` and `context/useSupportRequests.js` own session and ticket state.
- `components/SupportRequestForm.jsx` and `components/SupportTicketTable.jsx` render the form and ticket table.

## Employee workspace

- `app/SupportExecutiveApp.jsx` loads the common shell and registers the React page bridge.
- `app/SupportExecutivePageContainer.jsx` selects the employee page and provides its data through `context/SupportExecutiveContext.jsx`.
- `context/useSupportExecutiveData.js` loads employee workspace data through `api/support-executive-api.js` and the shared loading/retry Hook.
- `context/useSupportQueue.js` loads received support tickets and merges event issues. `context/useSupportDialog.js` connects the existing reply, attachment and status-update dialog.
- Employee pages and components cover the dashboard, user/event management, requests, reports, notifications, profile and settings.
- `app/runtime.js`, `api/portal-api.js` and `context/portal-state.js` retain existing navigation and API-backed workflow handlers. Role identifiers such as `support-executive`, `SUPPORT_EXECUTIVE` and `EventFlowSupportExecutiveRuntime` remain unchanged for session and runtime compatibility.

## Shared support code

- `api/client.js` handles authenticated requests and downloads; `api/supportApi.js` supplies ticket, upload, reply and follow-up endpoints.
- `api/legacySupport.js` is the existing compatibility adapter used by role runtimes. The standalone customer page does not load it.
- `api/supportReports.js` owns report submission, attachments and admin review integration.
- `utils/` contains automatic refresh and the existing categories and presentation helpers.

Root session/configuration helpers live in `src/app/`. The customer entry retains the attendee stylesheet for shared form, card, button and modal classes. Employee styling remains in `styles/support-executive.css`. Support-specific rules in `src/styles/global.css` retain their existing cascade order. Attendee page files have not been moved or edited.
