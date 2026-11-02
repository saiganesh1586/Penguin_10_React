# Frontend structure

The folder organization follows `21_Dinetime_Devs_React-main.zip`: application-wide modules in `src/app/`, portals in `src/apps/`, global CSS in `src/styles/`, and checks in `scripts/`. Portal names and functionality are EventFlow-specific.

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
      App.jsx
      routes.jsx
      session.js
      config.js
      DashboardLayout.jsx
      Navbar.jsx
      Sidebar.jsx
      LegacyRuntime.jsx
      LegacyPageMarkup.jsx
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
        api/client.js
        api/supportApi.js
        api/legacySupport.js
        app/App.jsx
        components/
        context/useStoredSession.js
        context/useSupportRequests.js
        pages/CustomerSupportPage.jsx
        pages/TicketDetailsPage.jsx
        utils/supportConfig.js
        utils/useAutoRefresh.js
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
      support-executive/
        api/supportReports.js
        api/portal-api.js
        app/
        context/
        pages/
        styles/
    styles/global.css
```

## File ownership

- `src/app/` holds root routing, session/configuration, and modules reused by multiple portals, following the reference's common application helpers.
- `src/apps/auth/pages/UnifiedAuthPage.jsx` is the common login entry. It selects the existing login markup for each workspace so credential labels, text, and handlers stay unchanged.
- `src/apps/landing/app/App.jsx` is the landing portal entry. Its pages, catalog component and CSS live in `pages/`, `components/` and `styles/`.
- Each remaining portal starts at `src/apps/<role>/app/App.jsx`. Its pages, styles, API modules, components, state, and utilities live inside that portal, as applicable to its implementation.
- Customer Support owns its authenticated API client, ticket API and request/conversation hooks. Support Executive owns the existing report API adapter. Attendee owns ticket scanning; Organizer owns organizer registration utilities. Common consumers import these modules directly.
- Automated checks live in `scripts/`. `npm test` runs the existing JavaScript workflow checks; `npm run test:react` runs the React tests. Run `npm run build` for production output in `build/`.
- Event Staff remains removed. Browser routes, API endpoints, public assets, CSS classes, text, and workflows remain unchanged.
- Signed-in attendee, client, organizer, admin, support-executive and finance-executive pages use React JSX, page containers, hooks, API adapters and reusable components. Customer Support retains its existing React pages and hooks. Navigation, modal actions, payment and cancellation workflows still use the preserved runtime handlers.

## Reading a role workspace

Follow `app/App.jsx` → `app/<Role>PageContainer.jsx` → `context/use<Role>Data.js` → `api/<role>-api.js`.
The container provides the loaded workspace data through `context/<Role>Context.jsx`. Pages render JSX and invoke named action callbacks; reusable UI lives in `components/`. The attendee workspace is the reference for this separation.

`src/app/createPageBridge.jsx` connects existing navigation to React, while `src/app/usePortalData.js` handles loading, errors and retries. The runtime adapters preserve API endpoints, authorization, workflow decisions and existing modal handlers. CSS, backend schema and folder locations are unchanged.

## React course concepts

The other role workspaces use the following patterns. Attendee files remain unchanged.

| Topic                                   | Example to read                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component composition                   | Client `components/WorkflowDetails.jsx` and `components/EventCards.jsx` export components used with JSX.                                                          |
| Lists with `.map()` and keys            | `WorkflowFileReports` uses report IDs; Organizer `EventPicker` uses event IDs.                                                                                    |
| `useState` and functional updates       | `src/app/AccountSettingsPage.jsx` owns profile, password and preference state.                                                                                    |
| Lifting state, props and callback props | Organizer `AttendeesPage.jsx` owns the selected event and attendee filters; `EventPicker.jsx` receives `events`, `selectedEvent` and `onSelect`.                  |
| Search and derived filtering            | Client `FindOrganizersPage.jsx` derives its results from `useOrganizerSearch.js`; `EventPicker.jsx` derives visible events from its search text.                  |
| Controlled forms and validation         | `AccountSettingsPage.jsx` uses controlled fields and forms; `settingsValidation.js` preserves the existing validation rules and messages.                         |
| Props versus Context                    | Pages read shared workspace data with `useClientContext`, `useOrganizerContext`, etc. Child components receive only the data, formatters and callbacks they need. |
| Conditional rendering                   | `WorkflowCancellation`, `OrganizerEventActions` and `ImageWithFallback` render the appropriate status, action or fallback.                                        |
| `useEffect` and cleanup                 | `usePortalData.js` and `useSupportRequests.js` ignore obsolete results; `useAutoRefresh.js` cleans up timers and event listeners.                                 |
| `useCallback`                           | Search updates, data retries and support refresh callbacks keep stable identities for their consumers.                                                            |
| Custom Hooks                            | Role data hooks, `useOrganizerSearch`, `useSupportQueue` and `useSupportDialog` keep effects and state logic out of page markup.                                  |

React screen code uses named callbacks rather than executable action strings, state rather than direct DOM styling, and ordinary style objects. The existing runtime/API adapters still perform the established payment, cancellation, support and navigation workflows.
