# React concepts review

All the requested concepts are present. The non-attendee portals use page components, role data Hooks and Context providers. Child cards, tables and forms receive the specific props and callback props they need.

| Concept | Status and example |
| --- | --- |
| Component composition | Used. Client `pages/DashboardPage.jsx` composes `DashboardActivity` and `DashboardUpcomingEvents`. `pages/RequestDetailsPage.jsx` composes workflow sections and `OrganizerReviewForm`. |
| Lists with `.map()` and keys | Used. Dashboard activity uses activity IDs, upcoming events use event IDs, and workflow reports use report IDs. Employee metrics and finance filter options use stable labels or values. |
| `useState` and state updates | Used. `components/OrganizerReviewForm.jsx` stores review values, errors and submission status. `src/app/AccountSettingsPage.jsx` updates profile, password and preferences with functional state updates. |
| Lifting state, props and callback props | Used. `DashboardPage` owns the activity loading Hook and derives upcoming events, then passes results and callbacks to its panels. The review form passes validated values to `RequestDetailsPage`, which adds event and request IDs before saving. |
| Search and filtering using derived data | Used. Client `pages/FindOrganizersPage.jsx` derives visible organizers from workspace users and `context/useOrganizerSearch.js` filters. Organizer `components/EventPicker.jsx` derives visible events from search text. Filtered records are not duplicated in state. |
| Controlled forms and validation | Used. `OrganizerReviewForm` controls the rating and comment, rejects missing ratings and blank comments, disables duplicate submissions while saving, and retains a failed draft. `AccountSettingsPage` controls account fields and uses `settingsValidation.js`. |
| Props versus Context | Used. `context/ClientContext.jsx` and the other role providers share workspace data with pages. Dashboard panels, event cards, workflow sections and review forms receive specific props instead of reading the entire workspace themselves. |
| Conditional rendering | Used. Dashboard panels select loading, error, empty and populated views. Request details show review, payment and cancellation sections according to the current records. |
| `useState` | Used for local form, filter, tab and feedback state. |
| `useEffect` | Used in `context/useClientActivity.js` and `src/app/usePortalData.js` for loading and cleanup; obsolete responses cannot overwrite newer data. |
| `useContext` | Used by `useClientContext` and the equivalent role context Hooks. |
| `useCallback` | Used for stable retry callbacks in `useClientActivity` and `usePortalData`, and filter updates in `useOrganizerSearch`. |
| Custom Hooks | Used. `useClientData`, `useClientActivity`, `useOrganizerSearch` and `usePortalData` separate reusable state and loading logic from JSX. |

Paths beginning with `pages/`, `components/` or `context/` in client examples are relative to `src/apps/client/`.

## Changes from this review

- Lifted client dashboard data loading and event selection into its page; both panels now render from explicit props and callbacks.
- Replaced the client organizer review's DOM-read submission with a controlled React form and a validated callback payload. The existing API adapter still performs the save.
- Made the activity retry callback stable and routed synchronous loading failures into the error/retry view.
- Replaced index keys in employee metrics, report histories, workflow progress/proposals/modifications and filter options with record identity or stable values. A workflow report's key no longer falls back to its shared event ID ahead of its own report ID.

Attendee portal files and the organizer attendee page/table were excluded from edits. Existing unrelated workspace changes were retained.

Navigation, payments and some modal workflows still call compatibility runtime handlers. Their presence does not mean the React concepts are missing; those integrations have not all been rewritten as React components. No additional Hook or Context was added where local props or ordinary derived data already fit.

## Verification

`scripts/ClientCoursePatterns.test.jsx` exercises prop-based dashboard panels, activity retry and obsolete responses, controlled review validation and submission, request/API integration, and report identity during reordering. Run the full checks with `npm run test:react`, `npm test` and `npm run build`.
