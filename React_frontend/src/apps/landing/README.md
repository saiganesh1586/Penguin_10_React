# Landing portal

`app/App.jsx` is the portal entry and `app/runtime.js` preserves its existing behavior. Public screens live in `pages/`, the public event catalog in `components/`, and existing CSS in `styles/`. Login markup comes from `../auth/pages/UnifiedAuthPage.jsx`.

Root routing and common application helpers live in `src/app/`.

`PortalPublicHomePage.jsx` and `FindEventsPage.jsx` are shared by role portals. The client portal enables the Employee entry on its public home page. Role portals also reuse this folder's About, Contact, and Gallery pages.
