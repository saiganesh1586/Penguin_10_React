# EventFlow React frontend

This frontend follows the role-based layout of the supplied `React_frontend.zip` reference. See [the structure guide](../FRONTEND_STRUCTURE.md) for the current file tree.

- `src/app/`: routing and configuration, with shared UI in `components/`, browser compatibility code in `runtime/`, and helpers in `utils/`. Redux lives in `src/store/`.
- `src/apps/auth/pages/UnifiedAuthPage.jsx`: login entry reused by the role portals.
- `src/apps/landing/app/App.jsx`: landing portal.
- `src/apps/<role>/`: the role's app, pages, CSS and applicable API, component, hook and utility modules.
- `src/apps/customer-support/`: customer ticket requests and the Support Executive employee workspace share one module; `app/App.jsx` serves customers and `app/SupportExecutiveApp.jsx` serves support employees. Finance remains in `src/apps/finance-executive/`.
- `src/styles/`: global CSS.
- `public/assets/`: existing assets and vendored browser libraries.
- `scripts/`: workflow and React checks.

Run `npm run dev`, `npm test`, `npm run test:react` or `npm run build` here. The backend API remains `http://localhost:3001/api`; backend setup and demo accounts are documented in [the project README](../README.md).

The role workspaces, public event catalog, and customer ticket pages load backend data through Redux Toolkit thunks. The [Redux data flow guide](src/app/README.md#redux-data-flow) lists the repository-to-slice mapping and shows how form submissions reach the backend before Redux refreshes.
