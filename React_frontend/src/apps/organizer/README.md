# Organizer portal

- `app/App.jsx` loads the common shell and registers the React page bridge.
- `app/OrganizerPageContainer.jsx` selects the page and provides its data through context.
- `app/OrganizerPageContainer.jsx` loads the role slice through the shared `usePortalData.js` hook.
- `context/OrganizerContext.jsx` exposes the workspace data and named action callbacks.
- `api/organizer-api.js` refreshes data and delegates actions to the existing API-backed handlers.
- `pages/` contains JSX pages. `components/` contains reusable cards, tables and workflow sections.
- `components/OrganizerReportDialog.jsx` renders the report upload dialog from React state in `ReportsPage.jsx`. It validates the selected file, blocks repeat submissions, retains failed uploads for retry and refreshes Reports after a saved upload. Client lookup accepts event aliases, client profile/user IDs and request contact details; the backend still chooses the report recipient and checks event ownership.
- `app/runtime.js` retains navigation, modal/workflow actions, and compatibility renderers.
- `api/portal-api.js` provides the role workflow APIs. The runtime uses the shared `src/app/runtime/portal-state.js`.

Attendee filtering uses React state in `pages/AttendeesPage.jsx`; approval and cancellation still use the existing workflow handlers. Organizer registration helpers remain in `utils/organizer-registration.js`.

This follows the attendee workspace's page/container/hook/API separation. Public pages and authentication are shared from `src/apps/landing/` and `src/apps/auth/`. Common application helpers live in `src/app/`.
