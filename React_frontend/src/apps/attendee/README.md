# Attendee portal

- `app/App.jsx` is the React entry and keeps the existing layout, navigation, authentication component and CSS import.
- `api/attendee-api.js` contains the existing API and session helpers.
- `context/AttendeeContext.jsx` exposes React page data and actions. `legacy/attendee-state.js` is isolated demo CRUD state used only by the browser runtime.
- `api/attendeeRepository.js` reads the existing event, registration, and notification endpoints into `src/store/slices/attendeeSlice.js`; `src/store/hooks/usePortalData.js` supplies each page. The runtime catalog receives separate normalized copies for dialogs and checkout.
- `pages/` contains the authenticated Dashboard, Browse Events, Event Details, My Tickets, Notifications, Profile and Settings JSX components. The common public pages, including Find Events, are reused from `src/apps/landing/`.
- `components/` contains the event and ticket cards, page feedback, filters and shared display elements. `components/RegistrationFlow.jsx` retains the existing registration, payment and cancellation dialogs.
- `styles/attendee.css` and `utils/ticket-scanner.js` retain the existing styles and QR helper.

`app/runtime.js` keeps routing and compatibility handlers for registration, payment, cancellation, notifications, and modal workflows. `app/attendeePageBridge.jsx` uses the shared page bridge and owns the React roots for ticket and event details dialogs. `app/AttendeePageContainer.jsx` supplies loading, errors, retries, context, and actions; settings uses the shared `AccountSettingsPage.jsx`.

Login and registration markup is shared from `src/apps/auth/pages/UnifiedAuthPage.jsx`.
