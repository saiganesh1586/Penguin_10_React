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
      account-policy.js
      data-sync.js
      legacyEvents.js
      paymentCheckout.js
      theme.js
    apps/
      auth/
        UnifiedAuthPage.jsx
      landing/
        LandingPage.jsx
        HomePage.jsx
        FindEventsPage.jsx
        GalleryPage.jsx
        AboutPage.jsx
        ContactPage.jsx
        PublicEventCatalog.jsx
        landing.css
        home.css
        runtime.js
      admin/
        app/App.jsx
        app/runtime.js
        pages/
        styles/admin.css
      attendee/
        app/
        pages/
        styles/
        utils/ticket-scanner.js
      client/
        app/
        pages/
        styles/
      customer-support/
        api/client.js
        api/supportApi.js
        api/legacySupport.js
        app/App.jsx
        components/
        hooks/
        pages/CustomerSupportPage.jsx
        utils/supportConfig.js
      finance-executive/
        app/
        pages/
        styles/
      organizer/
        app/
        pages/
        styles/
        utils/organizer-registration.js
      support-executive/
        api/supportReports.js
        app/
        pages/
        styles/
    styles/global.css
```

## File ownership

- `src/app/` holds root routing, session/configuration, and modules reused by multiple portals, following the reference's common application helpers.
- `src/apps/auth/UnifiedAuthPage.jsx` is the common login entry. It selects the existing login markup for each workspace so credential labels, text, and handlers stay unchanged.
- `src/apps/landing/LandingPage.jsx` is the landing portal entry. Its page components and CSS live beside it.
- Each remaining portal starts at `src/apps/<role>/app/App.jsx`. Its pages, styles, API modules, components, hooks, and utilities live inside that portal, as applicable to its implementation.
- Customer Support owns its authenticated API client, ticket API and request/conversation hooks. Support Executive owns the existing report API adapter. Attendee owns ticket scanning; Organizer owns organizer registration utilities. Common consumers import these modules directly.
- Automated checks live in `scripts/`. `npm test` runs the existing JavaScript workflow checks; `npm run test:react` runs the React tests. Run `npm run build` for production output in `build/`.
- Event Staff remains removed. Browser routes, API endpoints, public assets, CSS classes, text, and workflows remain unchanged.
- This reorganization does not complete the React migration. Customer Support uses React state; other dynamic dashboards still use their preserved runtime modules.
