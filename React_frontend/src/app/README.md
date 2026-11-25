# Root application

This folder owns routing, session configuration, the shared Redux store and slice factory, and the layout, theme, account policy, checkout and synchronization code used across portals.

Portals live under `src/apps/`. Authentication is `src/apps/auth/pages/UnifiedAuthPage.jsx`; the landing entry is `src/apps/landing/app/App.jsx`. Automated checks live in `scripts/`.

`LegacyRuntime.jsx` loads the existing navigation, session, payment and workflow handlers. Signed-in role pages render React components through their page containers.

`portal-state.js` supplies the browser state adapter shared by five role runtimes. Admin, Support Executive and Finance Executive also share `employee-portal-api.js`.

## Redux data flow

`state/store.js` registers the session, resource, and portal-view reducers. `main.jsx` provides the store to the application, and `PortalProvider.jsx` connects the page roots created by existing navigation to the same store.

| Store key | Repository |
| --- | --- |
| `admin` | `apps/admin/api/admin-api.js` |
| `attendee` | `apps/attendee/api/attendeeRepository.js` |
| `client` | `apps/client/api/client-api.js` |
| `organizer` | `apps/organizer/api/organizer-api.js` |
| `supportExecutive` | `apps/customer-support/api/support-executive-api.js` |
| `supportTickets` | `apps/customer-support/api/supportApi.js` |
| `financeExecutive` | `apps/finance-executive/api/finance-executive-api.js` |
| `landing` | Public catalog loading and errors |
| `resources` | Backend collections and their API queries, including the public event catalog |
| `workspace` | Metadata for the backend workspace snapshot |
| `auth` | The signed-in account and its preference writes |
| `eventChatMessages` | Conversations indexed by event ID |

1. When a page opens, its data hook dispatches the repository's read thunk. The fulfilled reducer stores the data, and React selects it from Redux.
2. A form collects and validates its inputs. The runtime API adapter dispatches the matching backend resource thunk. For example, client event requests and attendee registrations dispatch create thunks for their respective resources.
3. The thunk waits for the backend write to succeed before invalidating the workspace. The active page then reads the saved records into Redux. A failed write preserves the previous records. Event chat and support tickets have dedicated CRUD thunks.

Events, event requests, and registrations each have an API route table, named thunks, selectors, and focused tests under `src/features/`. Existing portal handlers dispatch those thunks through the runtime adapter. React code can also dispatch them directly with the form data, for example `createEventRequest({ body })` or `cancelEventRequest({ id, body })`.

`createPageBridge.jsx` passes route arguments to the page container. The workspace request puts backend collections into their resource slices. `data-sync.js` provides a detached view of those records to the existing navigation and modal handlers. Portal page thunks prepare the view data React selects for each page.

The sign-in action sets the Redux session after the backend accepts the credentials. Browser session storage preserves the Redux session across reloads. Signing out clears the session and the previous account's cached records.

Pages pass selected data and callbacks to their child components. React state holds interaction details such as form drafts, filters, and selected IDs. The concept-to-file guide is in the root `FRONTEND_STRUCTURE.md`.

`event-date-rules.js` supplies the minimum date and validation for event creation and client requests. `LegacyRuntime.jsx` loads it before the role runtime and API handlers. New dates must be at least seven calendar days from today in India time; the backend independently enforces the same creation rule.

`record-order.js` keeps new events, registrations and requests first in React lists. Ordering uses creation or registration timestamps, independent of scheduled event dates and later edits. The API and workspace snapshots apply the same ordering to copies of their records, preserving the store's insertion order and waitlist processing priority. Tickets default to recently registered first while retaining explicit event-date sorting.
