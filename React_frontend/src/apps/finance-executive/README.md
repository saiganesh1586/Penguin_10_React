# Finance Executive portal

- `app/App.jsx` loads the common shell and registers the React page bridge.
- `app/FinanceExecutivePageContainer.jsx` selects the page and provides its data through context.
- `context/useFinanceExecutiveData.js` handles the page data lifecycle through the shared loading/retry hook.
- `context/FinanceExecutiveContext.jsx` exposes the workspace data and named action callbacks.
- `api/finance-executive-api.js` refreshes data and delegates actions to the existing API-backed handlers.
- `pages/` contains JSX pages. `components/` contains reusable cards, tables and workflow sections.
- `app/runtime.js` retains navigation, modal/workflow actions, and compatibility renderers.
- `api/portal-api.js`, `context/portal-state.js`, and `styles/` retain the existing API, state and visual rules.

`api/finance-data.js` loads financial records with the existing filters. `app/finance-workspace.js` keeps navigation, exports, report submission and refund actions.

This follows the attendee workspace's page/container/hook/API separation. Public pages and authentication are shared from `src/apps/landing/` and `src/apps/auth/`. Common application helpers live in `src/app/`.
