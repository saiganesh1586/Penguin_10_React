# Root application

This folder owns `App.jsx`, `routes.jsx`, `session.js`, `config.js`, and the existing common layout, theme, account policy, checkout and synchronization helpers used across portals.

Portals live under `src/apps/`. Authentication is `src/apps/auth/pages/UnifiedAuthPage.jsx`; the landing entry is `src/apps/landing/app/App.jsx`. Automated checks live in `scripts/`.

`LegacyRuntime.jsx` still loads the preserved runtime modules for the dynamic dashboards. Moving files does not complete their React migration.

## Reading a portal page

Most portal pages have two parts. The functions between `PORTAL_RUNTIME_START` and `PORTAL_RUNTIME_END` build the existing page HTML and define its actions. The small React component at the bottom mounts that HTML. The role's `app/App.jsx` extracts the marked functions and inserts them into `app/runtime.js` at the matching `PORTAL_SECTION` marker.

In these browser scripts, `CU` means the signed-in user and `DB` is the legacy browser model. The short helpers `g(id)` and `v(id)` find an element and read its trimmed form value. These names remain available because existing HTML event handlers call global functions by name.

Newer attendee and customer-support pages use React components, hooks, and API modules directly. Shared request synchronization belongs in `data-sync.js`; UI notification rendering belongs in `ToastHost.jsx`.
