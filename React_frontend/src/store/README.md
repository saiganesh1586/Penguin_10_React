# Redux store

Redux is grouped here following the reference project's `src/store/` layout.

- `store.js` configures the shared Redux Toolkit store; `session.js` handles session persistence.
- `Provider.jsx` supplies that store to both the main React root and legacy page roots.
- `actions/` contains shared workspace thunks and invalidation actions.
- `api/` contains the shared request transport, repository, and response adapters.
- `hooks/` contains the shared Redux page-data hook.
- `factories/` contains the reusable portal and resource slice creators.
- `slices/` contains auth, role, resource, workspace, feature, and chat state.

Role-specific backend repositories and runtime action adapters remain under `src/apps/<role>/api/`. They use the central store without changing the existing endpoints or workflows.
