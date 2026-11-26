# Admin portal

- `app/App.jsx` loads the common shell and registers the React page bridge.
- `app/AdminPageContainer.jsx` selects the page and provides its data through context.
- `app/AdminPageContainer.jsx` loads the role slice through the shared `usePortalData.js` hook.
- `context/AdminContext.jsx` exposes the workspace data and named action callbacks.
- `api/admin-api.js` refreshes data and delegates actions to the existing API-backed handlers.
- `pages/` contains JSX pages. `components/` contains reusable cards, tables and workflow sections.
- `app/runtime.js` retains navigation, modal/workflow actions, and compatibility renderers.
- The runtime uses the shared `src/app/runtime/employee-portal-api.js` and `src/app/runtime/portal-state.js`.

This follows the attendee workspace's page/container/hook/API separation. Public pages and authentication are shared from `src/apps/landing/` and `src/apps/auth/`. Common application helpers live in `src/app/`.
