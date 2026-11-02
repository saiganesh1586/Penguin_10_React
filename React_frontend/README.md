# EventFlow React frontend

This frontend uses the DineTime Devs application-per-role folder structure. See [the structure guide](../FRONTEND_STRUCTURE.md) for the complete file tree.

- `src/app/`: root application, routing, session and common helpers.
- `src/apps/auth/pages/UnifiedAuthPage.jsx`: login entry reused by the role portals.
- `src/apps/landing/app/App.jsx`: landing portal.
- `src/apps/<role>/`: the role's app, pages, CSS and applicable API, component, hook and utility modules.
- `src/apps/customer-support/`: customer ticket requests and the Support Executive employee workspace share one module; `app/App.jsx` serves customers and `app/SupportExecutiveApp.jsx` serves support employees. Finance remains in `src/apps/finance-executive/`.
- `src/styles/`: global CSS.
- `public/assets/`: existing assets and vendored browser libraries.
- `scripts/`: workflow and React checks.

Run `npm run dev`, `npm test`, `npm run test:react` or `npm run build` here. The backend API remains `http://localhost:3001/api`; backend setup and demo accounts are documented in [the project README](../README.md).

Signed-in role pages use React page containers, Context, custom Hooks and reusable components. Existing navigation and some modal workflows still use compatibility runtime handlers. See [the React concepts review](REACT_CONCEPTS.md) for examples of the requested course concepts and the changes made during the review.
