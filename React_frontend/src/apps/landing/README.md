# Landing portal

`app/App.jsx` is the portal entry and `app/runtime.js` preserves its existing behavior. Public screens live in `pages/`, the public event catalog in `components/`, and existing CSS in `styles/`. Login markup comes from `../auth/pages/UnifiedAuthPage.jsx`.

Root routing and common application helpers live in `src/app/`.

`PortalPublicHomePage.jsx` and `PortalFindEventsPage.jsx` are the unchanged public pages shared by actor portals. Actor portals also reuse this folder's About, Contact and Gallery pages where their rendered output matches.
