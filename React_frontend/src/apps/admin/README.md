# Admin portal

- `app/App.jsx` is the portal entry and imports the common authentication component.
- `pages/` contains Dashboard, User Reports, Event Reports, Revenue Reports and Employee Reports renderer modules.
- `api/portal-api.js` and `context/portal-state.js` contain the existing API and state code.
- `styles/` contains its unchanged styles.
- `app/runtime.js` keeps routing and shared handlers. `App.jsx` assembles the extracted code in its original order.

Root routes, common layout, and common helpers live in `src/app/`. Login markup lives in `src/apps/auth/pages/UnifiedAuthPage.jsx`. Portal-specific API, component, context, data, hook, asset and utility modules belong inside the portal when implemented.

Common public pages are reused from `src/apps/landing/`.
