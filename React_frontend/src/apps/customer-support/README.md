# Customer Support module

This folder owns customer ticket requests and the Support Executive employee workspace. Finance remains in `../finance-executive/`. The former `src/apps/support-executive/` folder has been merged here.

| Entry point | Users | Existing routes |
| --- | --- | --- |
| `app/App.jsx` | Clients, organizers and attendees requesting help | `/customer-support` |
| `app/SupportExecutiveApp.jsx` | Support Executive employees managing users, registrations, event issues, requests and reports | `/employee` and `/employee1` |

The entries retain their existing session and permission checks. Customers can submit and follow up on their own tickets. Support employees manage the received queue. Employees and administrators visiting the customer request entry are redirected to their own workspace.

## Customer requests

- `app/App.jsx` checks the session and redirects excluded accounts.
- `pages/CustomerSupportPage.jsx` serves the standalone route and the help page inside the client, organizer, and attendee workspaces. The form draft and selected ticket ID stay in React state.
- `store/supportTicketsSlice.js` dispatches ticket reads, submissions, follow-ups, and status changes through `api/supportApi.js`. The standalone entry reads the signed-in session.
- `components/SupportRequestForm.jsx` and `components/SupportTicketTable.jsx` render the form and ticket table.

## Employee workspace

- `app/SupportExecutiveApp.jsx` loads the common shell and registers the React page bridge.
- `app/SupportExecutivePageContainer.jsx` selects the employee page and provides its data through `context/SupportExecutiveContext.jsx`.
- `app/SupportExecutivePageContainer.jsx` uses the support executive slice and the shared `usePortalData.js` hook.
- `hooks/useSupportRequests.js` selects tickets from Redux for both support views. `hooks/useAutoRefresh.js` manages refresh timers. `pages/SupportIssuesPage.jsx` merges event issues and connects the reply and attachment dialog to the status update thunk.
- Employee pages and components cover the dashboard, user/event management, requests, reports, notifications, profile and settings.
- `app/runtime.js` handles navigation and workflow actions using the shared `src/app/runtime/employee-portal-api.js` and `src/app/runtime/portal-state.js` adapters.

## Shared support code

- `api/supportApi.js` handles authenticated ticket requests, replies, follow-ups, and attachment uploads and downloads.
- `api/legacySupport.js` is the existing compatibility adapter used by role runtimes. The standalone customer page does not load it.
- `api/supportReports.js` owns report submission, attachments and admin review integration.
- `utils/` contains automatic refresh and the existing categories and presentation helpers.

Root session/configuration helpers live in `src/app/`. The customer entry retains the attendee stylesheet for shared form, card, button and modal classes. Employee styling remains in `styles/support-executive.css`. Support-specific rules in `src/styles/global.css` retain their existing cascade order. Attendee page files have not been moved or edited.
