# Frontend structure

Application-wide modules live in `src/app/`, role portals in `src/apps/`, and shared backend features in `src/features/`. Global CSS lives in `src/styles/`.

```text
React_frontend/
  index.html
  package.json
  package-lock.json
  vite.config.js
  README.md
  public/assets/
  scripts/
  src/
    main.jsx
    app/
      routes.jsx
      session.js
      config.js
      DashboardLayout.jsx
      EmployeeProfile.jsx
      LegacyRuntime.jsx
      employee-portal-api.js
      portal-state.js
      state/
      account-policy.js
      data-sync.js
      legacyEvents.js
      paymentCheckout.js
      theme.js
    apps/
      auth/
        pages/UnifiedAuthPage.jsx
        README.md
      landing/
        app/App.jsx
        app/runtime.js
        components/PublicEventCatalog.jsx
        pages/
        styles/landing.css
        styles/home.css
        README.md
      admin/
        api/
        app/App.jsx
        app/runtime.js
        context/
        pages/
        styles/admin.css
      attendee/
        api/
        app/
        components/
        context/
        pages/
        styles/
        utils/ticket-scanner.js
      client/
        api/
        app/
        context/
        pages/
        styles/
      customer-support/
        api/supportApi.js
        api/legacySupport.js
        api/supportReports.js
        api/support-executive-api.js
        api/finance-data.js
        app/App.jsx
        app/SupportExecutiveApp.jsx
        app/SupportExecutivePageContainer.jsx
        app/runtime.js
        components/
        context/
        pages/DashboardPage.jsx
        pages/UserEventManagementPage.jsx
        pages/SupportIssuesPage.jsx
        pages/ReportsAnalyticsPage.jsx
        pages/CustomerSupportPage.jsx
        pages/TicketDetailsPage.jsx
        pages/
        styles/support-executive.css
        utils/supportConfig.js
        utils/useAutoRefresh.js
        README.md
      finance-executive/
        api/
        app/
        context/
        pages/
        styles/
      organizer/
        api/
        app/
        context/
        pages/
        styles/
        utils/organizer-registration.js
    features/
      events/
        eventsApi.js
        eventsSlice.js
        eventsSlice.test.js
      event-requests/
        eventRequestsApi.js
        eventRequestsSlice.js
        eventRequestsSlice.test.js
      registrations/
        registrationsApi.js
        registrationsSlice.js
        registrationsSlice.test.js
    styles/global.css
```

## File ownership

- `src/app/` holds root routing, session/configuration, and modules reused by multiple portals, following the reference's common application helpers.
- `src/apps/auth/pages/UnifiedAuthPage.jsx` is the common login entry. It selects the existing login markup for each workspace so credential labels, text, and handlers stay unchanged.
- `src/apps/landing/app/App.jsx` is the landing portal entry. Its pages, catalog component and CSS live in `pages/`, `components/` and `styles/`.
- Each remaining portal starts at `src/apps/<role>/app/App.jsx`. Customer Support also has `app/SupportExecutiveApp.jsx` for its employee workspace. Pages, styles, API modules, components, state, and utilities live inside the owning module.
- Customer Support owns the customer ticket entry and the Support Executive workspace, sharing ticket APIs, conversation components and report adapters. Its customer entry uses `/customer-support`; its employee entry retains `/employee` and `/employee1`. Finance remains a separate employee workspace at `/employee2`. Attendee owns ticket scanning; Organizer owns organizer registration utilities.
- `src/features/` groups shared backend routes, Redux thunks, selectors, and focused tests for events, event requests, and registrations.
- `npm test` runs the workflow checks in `scripts/`. `npm run test:react` runs the React and feature tests. Run `npm run build` for production output in `build/`.
- Event Staff remains removed. Browser routes, API endpoints, public assets, CSS classes, text, and workflows remain unchanged.
- Signed-in attendee, client, organizer, admin, support employee and finance employee pages use React JSX, page containers, hooks, API adapters and reusable components. Customer requests and Support Executive pages now live together under `customer-support/`. Navigation, modal actions, payment and cancellation workflows still use the preserved runtime handlers.

## Reading a role workspace

Follow `app/App.jsx` → `app/<Role>PageContainer.jsx` → `store/<role>Slice.js` → the role repository in `api/`. The containers use the shared `src/app/usePortalData.js` hook.
For Support Executive, begin with `customer-support/app/SupportExecutiveApp.jsx` and follow `SupportExecutivePageContainer.jsx`, `supportExecutiveSlice.js` and `support-executive-api.js`.
The container provides the loaded workspace data through `context/<Role>Context.jsx`. Pages render JSX and invoke named action callbacks; reusable UI lives in `components/`. The attendee workspace is the reference for this separation.

`src/app/createPageBridge.jsx` connects existing navigation to React, while `src/app/usePortalData.js` handles loading, errors and retries. The runtime adapters preserve API endpoints, authorization, workflow decisions and existing modal handlers. The Support Executive folder has been merged into Customer Support; CSS rules and backend schema are unchanged.

## React course concepts

The role workspaces use the following patterns.

| Topic                                   | Example to read                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component composition                   | Client `components/WorkflowDetails.jsx` and `components/EventCards.jsx` export components used with JSX.                                                          |
| Lists with `.map()` and keys            | `WorkflowFileReports` uses report IDs; Organizer `EventPicker` uses event IDs.                                                                                    |
| `useState` and functional updates       | `src/app/AccountSettingsPage.jsx` owns profile, password and preference state.                                                                                    |
| Lifting state, props and callback props | Organizer `AttendeesPage.jsx` owns the selected event and attendee filters; `EventPicker.jsx` receives `events`, `selectedEvent` and `onSelect`.                  |
| Search and derived filtering            | Client `FindOrganizersPage.jsx` applies its filters to the Redux organizer records. `EventPicker.jsx` derives visible events from its search text.                  |
| Controlled forms and validation         | `AccountSettingsPage.jsx` controls and validates account fields before invoking save callbacks.                                                                 |
| Props versus Context                    | Pages read shared workspace data with `useClientContext`, `useOrganizerContext`, etc. Child components receive only the data, formatters and callbacks they need. |
| Conditional rendering                   | `WorkflowCancellation`, `OrganizerEventActions` and `ImageWithFallback` render the appropriate status, action or fallback.                                        |
| `useEffect` and cleanup                 | `usePortalData.js` and `useSupportRequests.js` ignore obsolete results; `useAutoRefresh.js` cleans up timers and event listeners.                                 |
| `useCallback`                           | Search updates, data retries and support refresh callbacks keep stable identities for their consumers.                                                            |
| Custom Hooks                            | `usePortalData` handles workspace loads. `useSupportRequests` handles ticket reads and writes for the customer and employee views.                                |

React screen code uses named callbacks rather than executable action strings, state rather than direct DOM styling, and ordinary style objects. The existing runtime/API adapters still perform the established payment, cancellation, support and navigation workflows.
