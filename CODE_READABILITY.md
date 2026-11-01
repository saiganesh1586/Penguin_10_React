# Code readability maintenance

The review covers 336 project-owned files across frontend and backend source, tests, configuration, documentation, the database schema, and sample-report HTML. Existing directories, public handler names, API routes, database schema, stored records, and rendered page templates are preserved. Dependencies, compiled output, uploaded files, logs, lockfiles, and vendored browser libraries are excluded from formatting.

## Changes

- Apply the shared Prettier configuration to JavaScript, JSX, TypeScript, CSS, HTML, and JSON.
- Expand short local names for requests, events, registrations, payments, proposals, users, and other domain records. Keep identifiers used by existing HTML handlers compatible.
- Put independent variable declarations on separate lines and make nested conditions readable.
- Compute client dashboard counts before rendering the markup.
- Separate organizer cancellation validation from client-booking and public-event previews in the same runtime file.
- Reuse common deposit-payment record fields while preserving failed, cancelled, pending, and completed outcomes.
- Centralize the support hook's stale-response check without changing its refresh behavior.
- Explain portal extraction markers, browser state aliases, persistence timing, and currency rounding where those details are easy to miss.
- Make source-based test selectors independent of indentation. Fix stale dates, missing accepted-policy fixtures, and tests that read an unassembled runtime instead of the source used by the application.

## Reading the code

Start at `React_frontend/src/app/routes.jsx` for workspace routes. Each role's `app/App.jsx` connects its pages, layout, and runtime. The [frontend application guide](React_frontend/src/app/README.md) explains the existing HTML renderers and the newer React pages.

For a backend operation, follow its controller to the corresponding service. Request DTOs sit beside their module. Shared payment, registration, account-access, and policy rules are under `backend/src/common/`. The large seed-data sections are development fixtures; keeping their IDs stable preserves links between demo workflows.

## Formatting

The repository uses two-space indentation, single quotes, semicolons, and a 100-column target. Template HTML and embedded languages retain their literal contents to avoid layout changes.

With the existing backend dependencies installed, check formatting from the repository root:

```powershell
node backend/node_modules/prettier/bin-prettier.js --check "React_frontend/src/**/*.{js,jsx,css}" "React_frontend/scripts/*.{js,cjs,jsx}" "backend/src/**/*.ts" "backend/tests/*.cjs"
```

## Validation

All final checks pass:

| Check                                                          | Result     |
| -------------------------------------------------------------- | ---------- |
| Frontend `npm test`                                            | 219 passed |
| Backend `npm test` with temporary test data                    | 136 passed |
| Frontend `npm run test:react -- --pool threads --maxWorkers 1` | 33 passed  |
| Frontend production build                                      | Passed     |
| Backend type check and Nest production build                   | Passed     |
| Prettier check across project-owned code                       | Passed     |

The Node test scripts run one test file at a time in separate processes to keep their memory usage and fixtures isolated. Vite compilation checks require permission to start their local compiler helpers in restricted environments.

Source comparisons verify that automated formatting and local renames preserve the program structure in 219 source files. The remaining source changes are the documented refactors and portal-source explanations. Generated HTML template contents, the meaning of all 10 stylesheets, and the content and elements of all six sample reports were checked against their original versions.

Whitespace inside existing HTML template strings is intentionally preserved. Those literal lines can still appear in a Git trailing-whitespace check when surrounding code moves; the formatter leaves them intact to preserve the rendered output.
