# Attendee portal

- `app/App.jsx` is the React entry and keeps the existing layout, navigation, authentication component and CSS import.
- `api/attendee-api.js` contains the existing API and session helpers.
- `context/attendee-state.js` retains existing browser state; `context/useAttendeeData.js` loads current events, registrations and notifications for the page container.
- `pages/` contains the authenticated Dashboard, Browse Events, Event Details, My Tickets, Notifications, Profile and Settings JSX components. The common public pages, including Find Events, are reused from `src/apps/landing/`.
- `components/` contains the event and ticket cards, page feedback, filters and shared display elements. `components/RegistrationFlow.jsx` retains the existing registration, payment and cancellation dialogs.
- `styles/attendee.css` and `utils/ticket-scanner.js` retain the existing styles and QR helper.

`app/runtime.js` keeps routing and compatibility handlers for the existing registration and payment workflows. `app/AttendeePageContainer.jsx` fetches through the existing API functions and passes data, loading, error and actions to the JSX pages.

Login and registration markup is shared from `src/apps/auth/pages/UnifiedAuthPage.jsx`.
