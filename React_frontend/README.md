# EventFlow React frontend

This frontend uses the DineTime Devs application-per-role folder structure. See [the structure guide](../FRONTEND_STRUCTURE.md) for the complete file tree.

- `src/app/`: root application, routing, session and common helpers.
- `src/apps/auth/pages/UnifiedAuthPage.jsx`: login entry reused by the role portals.
- `src/apps/landing/app/App.jsx`: landing portal.
- `src/apps/<role>/`: the role's app, pages, CSS and applicable API, component, hook and utility modules.
- `src/styles/`: global CSS.
- `public/assets/`: existing assets and vendored browser libraries.
- `scripts/`: workflow and React checks.

Run `npm run dev`, `npm test`, `npm run test:react` or `npm run build` here. The backend API remains `http://localhost:3001/api`; backend setup and demo accounts are documented in [the project README](../README.md).

The folder change preserves existing behavior. Customer Support is React-managed; other dashboards still use the existing runtime loader while their React migration is unfinished.
