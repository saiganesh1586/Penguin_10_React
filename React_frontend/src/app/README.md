# Root application

This folder owns `App.jsx`, `routes.jsx`, `session.js`, `config.js`, and the existing common layout, theme, account policy, checkout and synchronization helpers used across portals.

Portals live under `src/apps/`. Authentication is `src/apps/auth/pages/UnifiedAuthPage.jsx`; the landing entry is `src/apps/landing/app/App.jsx`. Automated checks live in `scripts/`.

`LegacyRuntime.jsx` loads the existing navigation, session, payment and workflow handlers. Signed-in role pages render React components through their page containers.

## Reading a portal page

Start with a role's `app/<Role>PageContainer.jsx`. It selects the page and loads data through `context/use<Role>Data.js`. The hook uses the role's API adapter, and the context makes the workspace data and named action callbacks available to pages and components. Pages contain JSX; reusable event cards, tables, charts and workflow sections live in `components/`.

`createPageBridge.jsx` connects the existing navigation to these containers. It reuses the current React root so filters and form state survive data refreshes. `usePortalData.js` handles loading, errors, retry and obsolete requests. `AccountSettingsPage.jsx` shares the attendee form pattern across the other roles.

In these browser scripts, `CU` means the signed-in user and `DB` is the legacy browser model. The short helpers `g(id)` and `v(id)` find an element and read its trimmed form value. These names remain available because existing HTML event handlers call global functions by name.

The API adapters expose named callbacks that look up existing handlers when clicked, preserving the API-backed overrides installed by `data-sync.js`. Runtime snapshots retain `CU` and `DB` for compatibility; React components give these values descriptive local names. Existing modal workflows and fallback renderers remain in the runtimes, as they do in the attendee workspace. Shared request synchronization belongs in `data-sync.js`; UI notifications belong in `ToastHost.jsx`.

Pages use Context for workspace data and pass specific props and callback props to their child components. `FilterInput.jsx` and `PortalSelect.jsx` keep filter controls in React state during API refreshes. `ImageWithFallback.jsx` and `HoverCard.jsx` use state to control their appearance. Account forms keep controlled values and validate them before calling the existing save handlers. The concept-to-file guide is in the root `FRONTEND_STRUCTURE.md`.
