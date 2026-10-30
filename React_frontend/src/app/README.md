# Root application

This folder owns `App.jsx`, `routes.jsx`, `session.js`, `config.js`, and the existing common layout, theme, account policy, checkout and synchronization helpers used across portals.

Portals live under `src/apps/`. Authentication is `src/apps/auth/UnifiedAuthPage.jsx`; the landing entry is `src/apps/landing/LandingPage.jsx`. Automated checks live in `scripts/`.

`LegacyRuntime.jsx` still loads the preserved runtime modules for the dynamic dashboards. Moving files does not complete their React migration.
