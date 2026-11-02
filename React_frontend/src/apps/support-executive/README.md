# Support Executive portal

- `app/App.jsx` loads the common shell and registers the React page bridge.
- `app/SupportExecutivePageContainer.jsx` selects the page and provides its data through context.
- `context/useSupportExecutiveData.js` handles the page data lifecycle through the shared loading/retry hook.
- `context/SupportExecutiveContext.jsx` exposes the workspace data and named action callbacks.
- `api/support-executive-api.js` refreshes data and delegates actions to the existing API-backed handlers.
- `pages/` contains JSX pages. `components/` contains reusable cards, tables and workflow sections.
- `app/runtime.js` retains navigation, modal/workflow actions, and compatibility renderers.
- `api/portal-api.js`, `context/portal-state.js`, and `styles/` retain the existing API, state and visual rules.

`context/useSupportQueue.js` loads support tickets and merges event issues. The existing shared support dialog handles replies, attachments and status updates. `api/supportReports.js` remains the report adapter.

This follows the attendee workspace's page/container/hook/API separation. Public pages and authentication are shared from `src/apps/landing/` and `src/apps/auth/`. Common application helpers live in `src/app/`.
