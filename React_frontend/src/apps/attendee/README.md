# Attendee portal

- `app/App.jsx` is the React entry and keeps the existing layout, navigation, authentication component and CSS import.
- `api/attendee-api.js` contains the existing API and session helpers.
- `context/attendee-state.js` contains the existing state and persistence logic. This portal does not use a React Context provider.
- `pages/` contains the Attendee-specific public Find Events page, plus the authenticated Dashboard, Browse Events, My Tickets, Notifications, Profile and Settings pages. Event details remains a drawer and its renderer is in `pages/EventDetailsPage.jsx`. The common public home, About, Contact and Gallery pages are reused from `src/apps/landing/`.
- `components/RegistrationFlow.jsx` contains the registration, payment and cancellation dialogs. `src/app/LegacyPageMarkup.jsx` renders page markup with the existing handlers.
- `styles/attendee.css` and `utils/ticket-scanner.js` retain the existing styles and QR helper.

`app/runtime.js` keeps routing and shared handlers. `App.jsx` assembles the page code at its original positions before running the legacy handlers, preserving the existing navigation and backend workflows.

Login and registration markup is shared from `src/apps/auth/pages/UnifiedAuthPage.jsx`.
