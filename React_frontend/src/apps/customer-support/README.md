# Customer Support portal

- `app/App.jsx` checks the session and redirects excluded accounts.
- `pages/CustomerSupportPage.jsx` composes the request form and history with React state. `pages/TicketDetailsPage.jsx` contains the selected ticket's detail and conversation view, shown in the existing dialog.
- `api/client.js` handles authenticated requests and downloads; `api/supportApi.js` contains ticket, upload and follow-up endpoints.
- `api/legacySupport.js` is the existing compatibility adapter used by other portal runtimes. The standalone React page does not load it.
- `components/` contains the request form and history table.
- `context/` contains the existing request and session state hooks.
- `utils/` contains automatic refresh and the existing categories and presentation helpers.

Root session/configuration helpers live in `src/app/`. The portal retains the existing attendee stylesheet and support workflow.

`app/App.jsx` imports `../../attendee/styles/attendee.css` for shared EventFlow form, card, button and modal classes. Support-specific rules currently live in `src/styles/global.css` and are also used by support entries in other portals, so their cascade order is preserved.
