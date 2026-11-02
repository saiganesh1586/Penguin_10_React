# Client portal

- `app/App.jsx` loads the common shell and registers the React page bridge.
- `app/ClientPageContainer.jsx` selects the page and provides its data through context.
- `context/useClientData.js` handles the page data lifecycle through the shared loading/retry hook.
- `context/ClientContext.jsx` exposes the workspace data and named action callbacks.
- `api/client-api.js` refreshes data and delegates actions to the existing API-backed handlers.
- `pages/` contains JSX pages. `components/` contains reusable cards, tables and workflow sections.
- `pages/DashboardPage.jsx` owns activity loading and derives upcoming events, passing data and callback props to its dashboard panels.
- `components/OrganizerReviewForm.jsx` keeps rating/comment inputs in React state and validates them before passing a review payload to the request page and API adapter.
- `app/runtime.js` retains navigation, modal/workflow actions, and compatibility renderers.
- `api/portal-api.js`, `context/portal-state.js`, and `styles/` retain the existing API, state and visual rules.

This follows the attendee workspace's page/container/hook/API separation. Public pages and authentication are shared from `src/apps/landing/` and `src/apps/auth/`. Common application helpers live in `src/app/`.
