# Support Executive portal

- `app/App.jsx` is the portal entry and imports the common authentication component.
- `pages/` contains this portal's public page components.
- `styles/` contains its unchanged styles.
- `app/runtime.js` retains the existing dashboard behavior and inline API calls; its React migration is incomplete.

Root routes, common layout, and common helpers live in `src/app/`. Login markup lives in `src/apps/auth/UnifiedAuthPage.jsx`. Portal-specific API, component, context, data, hook, asset and utility modules belong inside the portal when implemented.

The report API adapter is `api/supportReports.js`.
