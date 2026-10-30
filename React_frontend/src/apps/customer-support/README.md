# Customer Support portal

- `app/App.jsx` checks the session and redirects excluded accounts.
- `pages/CustomerSupportPage.jsx` composes the request form, history and conversation dialog with React state.
- `api/client.js` handles authenticated requests and downloads; `api/supportApi.js` contains ticket, upload and follow-up endpoints.
- `api/legacySupport.js` is the existing compatibility adapter used by other portal runtimes. The standalone React page does not load it.
- `components/` contains the request form, history table and conversation dialog.
- `hooks/` contains request, session and automatic refresh hooks.
- `utils/supportConfig.js` contains existing categories and presentation helpers.

Root session/configuration helpers live in `src/app/`. The portal retains the existing attendee stylesheet and support workflow.
