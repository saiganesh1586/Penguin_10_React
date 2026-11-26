# Frontend structure

Application-wide modules live in `src/app/`, role portals in `src/apps/`, and shared backend features in `src/features/`. Global CSS lives in `src/styles/`.

```text
React_frontend/
  public/assets/            Existing images and browser assets
  scripts/                  Workflow and React checks
  src/
    main.jsx
    app/
      routes.jsx            Root routes
      config.js             API and session constants
      createPageBridge.jsx  Legacy navigation to React
      components/           Shared React UI, including settings and layout
      runtime/              Shared browser runtime and compatibility adapters
      utils/                Shared display and ordering helpers
    apps/
      auth/pages/           Shared sign-in and registration UI
      landing/              Public pages and catalog
      admin/                Admin portal
      attendee/             Attendee portal, including legacy demo state
      client/               Client portal
      customer-support/     Customer requests and Support Executive portal
      finance-executive/    Finance Executive portal
      organizer/            Organizer portal
      # Portals own app/, api/, components/, context/, hooks/, pages/, styles/
      # and utils/ or legacy/ only when those responsibilities exist.
    features/
      events/               Shared event API and focused tests
      event-requests/       Shared request API and focused tests
      registrations/        Shared registration API and focused tests
    store/
      store.js              Redux store configuration
      Provider.jsx          Provider for root and page bridges
      session.js            Session persistence
      actions/ api/ factories/ hooks/ slices/
    styles/                 Global and shared CSS
```

## File ownership

- `src/app/` holds root routing and configuration. Its `components/`, `runtime/`, and `utils/` folders separate shared UI, browser compatibility code, and small helpers.
- `src/apps/auth/pages/UnifiedAuthPage.jsx` is the common login entry. It selects the existing login markup for each workspace so credential labels, text, and handlers stay unchanged.
- `src/apps/landing/app/App.jsx` is the landing portal entry. Its pages, catalog component and CSS live in `pages/`, `components/` and `styles/`.
- Each remaining portal starts at `src/apps/<role>/app/App.jsx`. Customer Support also has `app/SupportExecutiveApp.jsx` for its employee workspace. Pages, styles, API modules, components, context, and utilities live inside the owning module; Redux slices live in `src/store/slices/`.
- Customer Support owns the customer ticket entry and the Support Executive workspace, sharing ticket APIs, conversation components and report adapters. Its customer entry uses `/customer-support`; its employee entry retains `/employee` and `/employee1`. Finance remains a separate employee workspace at `/employee2`. Attendee owns ticket scanning; Organizer owns organizer registration utilities.
- `src/features/` groups shared backend route definitions and focused tests for events, event requests, and registrations. Their Redux slices and selectors live in `src/store/slices/`.
- `npm test` runs the workflow checks in `scripts/`. `npm run test:react` runs the React and feature tests. Run `npm run build` for production output in `build/`.
- Event Staff remains removed. Browser routes, API endpoints, public assets, CSS classes, text, and workflows remain unchanged.
- Signed-in attendee, client, organizer, admin, support employee and finance employee pages use React JSX, page containers, hooks, API adapters and reusable components. Customer requests and Support Executive pages now live together under `customer-support/`. Navigation, modal actions, payment and cancellation workflows still use the preserved runtime handlers.

## Reading a role workspace

Follow `app/App.jsx` → `app/<Role>PageContainer.jsx` → `src/store/slices/<role>Slice.js` → the role repository in `api/`. The containers use the shared `src/store/hooks/usePortalData.js` hook.
For Support Executive, begin with `customer-support/app/SupportExecutiveApp.jsx` and follow `SupportExecutivePageContainer.jsx`, `supportExecutiveSlice.js` and `support-executive-api.js`.
The container provides the loaded workspace data through `context/<Role>Context.jsx`. Pages render JSX and invoke named action callbacks; reusable UI lives in `components/`. The attendee workspace is the reference for this separation.

`src/app/createPageBridge.jsx` connects existing navigation to React, while `src/store/hooks/usePortalData.js` handles loading, errors and retries. The runtime adapters preserve API endpoints, authorization, workflow decisions and existing modal handlers. The Support Executive folder has been merged into Customer Support; CSS rules and backend schema are unchanged.

## React course concepts

The role workspaces use the following patterns.

| Topic                                   | Example to read                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component composition                   | Client `components/WorkflowDetails.jsx` and `components/EventCards.jsx` export components used with JSX.                                                          |
| Lists with `.map()` and keys            | `WorkflowFileReports` uses report IDs; Organizer `EventPicker` uses event IDs.                                                                                    |
| `useState` and functional updates       | `src/app/components/AccountSettingsPage.jsx` owns profile, password and preference state.                                                                                    |
| Lifting state, props and callback props | Organizer `AttendeesPage.jsx` owns the selected event and attendee filters; `EventPicker.jsx` receives `events`, `selectedEvent` and `onSelect`.                  |
| Search and derived filtering            | Client `FindOrganizersPage.jsx` applies its filters to the Redux organizer records. `EventPicker.jsx` derives visible events from its search text.                  |
| Controlled forms and validation         | `AccountSettingsPage.jsx` controls and validates account fields before invoking save callbacks.                                                                 |
| Props versus Context                    | Pages read shared workspace data with `useClientContext`, `useOrganizerContext`, etc. Child components receive only the data, formatters and callbacks they need. |
| Conditional rendering                   | `WorkflowCancellation`, `OrganizerEventActions` and `ImageWithFallback` render the appropriate status, action or fallback.                                        |
| `useEffect` and cleanup                 | `usePortalData.js` and `useSupportRequests.js` ignore obsolete results; `useAutoRefresh.js` cleans up timers and event listeners.                                 |
| `useCallback`                           | Search updates, data retries and support refresh callbacks keep stable identities for their consumers.                                                            |
| Custom Hooks                            | `usePortalData` handles workspace loads. `useSupportRequests` handles ticket reads and writes for the customer and employee views.                                |

React screen code uses named callbacks rather than executable action strings, state rather than direct DOM styling, and ordinary style objects. The existing runtime/API adapters still perform the established payment, cancellation, support and navigation workflows.
