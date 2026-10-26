# Project 2 — Role & Co. Job Board

A connected job-board website and REST API. Candidates discover jobs and upload PDF resumes; companies publish and manage postings and review their own applicants. Built with Node.js, Express, PostgreSQL, Prisma, Multer, and a responsive React frontend built with Vite. Frontend components live in `frontend/`; all Express, Prisma, database configuration, and API tests live in `backend/`.

The project follows Project 1’s route → validation → controller → service → database structure, with shared professional success/error responses. All application code uses `import`/`export`.

## Open the project

Frontend: **http://127.0.0.1:3002**

API: **http://127.0.0.1:3002/api**

```sh
cd "/Users/apple/Desktop/Wekkly Tasks/project 2"
npm start
```

For development with React hot reload, run from the **project root**:

```sh
npm run dev
```

This starts both workspaces:

- React/Vite frontend: **http://127.0.0.1:5173**
- Express API and Postman: **http://127.0.0.1:3002/api**

Vite proxies `/api` and `/health` to Express, so the browser uses the same API client in development and built mode. API requests and Postman collection URLs have not changed.

`npm start` builds React into `frontend/dist/`, then Express serves that build and the API together at **http://127.0.0.1:3002**. There is no separate frontend server in this mode. Stop any existing server using port 3002 before switching modes.

To run only one side, use `npm run dev --workspace frontend` or `npm run dev --workspace backend` from the root. Both sides are needed for development features to work. Dependency installation uses npm workspaces and one root lockfile: run `npm install` from `project 2`, not from a subfolder.

Local databases already created:

- `project_2_db`: application/demo data.
- `project_2_test_db`: disposable test data, never real tasks or jobs.

Project 1 uses its own database and port 3001.

For installation on a fresh machine, use a supported Node version (22.12+; tested with Node 26), install PostgreSQL, create both databases, and copy `backend/.env.example` to `backend/.env` and `backend/.env.test.example` to `backend/.env.test`. Set your credentials, then run:

```sh
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm start
```

The migration enables PostgreSQL `pg_trgm` for search indexes; the migration user must be allowed to install that extension. Prisma commands use a project-local `.cache` to avoid permission problems with shared caches. These scripts target macOS/Linux.

## Explore the frontend

The seed creates nine **fictional demo jobs** and seven demo accounts. Sign in → Try candidate / Try company fills the demo flow for you.

| Account | Email | Password |
| --- | --- | --- |
| Candidate | `alex@candidate.demo` | `DemoPass123!` |
| Company (Folklore) | `hello@folklore.demo` | `DemoPass123!` |

These credentials are only for the local exercise; do not seed public deployments with demo accounts. The seed is repeatable and does not overwrite edited jobs or passwords.

Candidate flow:

1. Browse jobs anonymously; search by title and location, or filter job type, work style, and skills.
2. Sign up as a candidate or use the demo login.
3. Open a role → Apply → upload a PDF (up to 5 MB) and optionally a cover note.
4. View My applications to track submitted, reviewing, shortlisted, or rejected status.
5. Download your own submitted resume.

Company flow:

1. Register with “Hire great people” or use the company demo login.
2. Open Company workspace → Post a job.
3. Publish, edit, close, or delete your own roles.
4. Open the applicants for a role; download resumes and update review status.
5. Closing retains applications. Deleting a job also permanently removes its applications and resume data; the UI asks for confirmation.

## Import and use Postman

Import both:

- `postman/Job-Board.postman_collection.json`
- `postman/Project-2-Local.postman_environment.json`

Select **Project 2 - Local** in Postman’s environment dropdown. Its `baseUrl` is `http://127.0.0.1:3002` (no `/api` suffix). A Project 1 environment with the same variable name would otherwise override this collection’s URL.

Run requests **01–23 in order**. Registration automatically saves `companyToken` and `candidateToken`. Creating a job saves `jobId`; applying saves `applicationId`. IDs are UUIDs, not sequential integers.

Requests **08** and **09** need a local file selection:

1. Open Body → form-data.
2. On the `resume` row, choose type **File**.
3. Select `project 2/postman/sample-resume.pdf`, or your own PDF under 5 MB.
4. Leave Content-Type automatic so Postman adds the multipart boundary.

Do not paste PDF contents into raw JSON. The `coverLetter` row is an optional text field.

Request 02 generates a unique email suffix on each run. Request 19 deletes the test job and its applications. Demo jobs remain. Test registration accounts remain in the local application database. The final requests sign out and demonstrate a revoked token; rerun registration or sign in to use a valid token again.

CLI check, from this project directory:

```sh
/Users/apple/.local/bin/postman collection run postman/Job-Board.postman_collection.json \
  --working-dir "/Users/apple/Desktop/Wekkly Tasks/project 2/postman" \
  --no-report-events
```

### Endpoint reference

Prefix all paths below except `/health` with `/api`.

| Method | Path | Access / purpose |
| --- | --- | --- |
| GET | `/health` | Public API and DB check; no `/api` prefix |
| POST | `/auth/register` | Register candidate/company; returns session token |
| POST | `/auth/login` | Sign in; returns session token |
| GET | `/auth/me` | Current signed-in profile |
| POST | `/auth/logout` | Revoke current session |
| GET | `/jobs` | Public search, filters, pagination |
| GET | `/jobs/:id` | Public details; closed jobs remain viewable |
| POST | `/jobs` | Company publishes a job |
| PATCH | `/jobs/:id` | Owning company edits supplied fields |
| DELETE | `/jobs/:id` | Owning company deletes job and applications |
| GET | `/company/jobs` | Company’s own postings, counts and pagination |
| POST | `/jobs/:id/applications` | Candidate applies with multipart PDF upload |
| GET | `/jobs/:id/applications` | Owning company’s paginated applicant dashboard |
| GET | `/applications/me` | Candidate’s own paginated applications |
| PATCH | `/applications/:id/status` | Owning company updates review status |
| GET | `/applications/:id/resume` | Owning company or submitting candidate downloads PDF |

Protected requests use `Authorization: Bearer <token>`. Roles and ownership come from the authenticated account, never a client-supplied company/candidate ID. Each company account represents one company; multi-recruiter teams are outside this exercise.

### Example JSON bodies

Register:

```json
{
  "name": "Vinit",
  "email": "vinit@example.com",
  "password": "MySecurePass123!",
  "role": "candidate"
}
```

For a company use `"role": "company"` and add `"companyName": "My Company"`.

Publish job:

```json
{
  "title": "Frontend Engineer",
  "location": "Bengaluru, India",
  "description": "Build accessible interfaces with our product team and own meaningful projects.",
  "requirements": "JavaScript, React, and clear communication.",
  "tags": ["react", "typescript"],
  "type": "full_time",
  "workMode": "hybrid",
  "salaryMin": 1200000,
  "salaryMax": 2000000,
  "currency": "INR"
}
```

Edit a job: `{"title":"Senior Frontend Engineer","status":"closed"}`.

Review an application: `{"status":"shortlisted"}`.

Fields are strictly validated. Job title, location, description, and requirements are required on create. Salaries are annual whole currency units, optional/nullable, and minimum cannot exceed maximum. Tags are normalized to lowercase, deduplicated, and limited to eight. IDs, owner IDs, and timestamps are managed by the server. PATCH changes supplied fields only and rejects an empty body.

### Search, filters, and pagination

```text
GET /api/jobs?q=engineer&location=bengaluru&tags=react,typescript&workMode=remote&type=full_time&sortBy=newest&page=1&limit=6
```

- `q`: case-insensitive substring search on **job title**.
- `location`: case-insensitive substring match.
- `tags`: comma-separated, case-insensitive exact tags; **all** supplied tags must match.
- `type`: `full_time`, `part_time`, `contract`, `internship`.
- `workMode`: `remote`, `hybrid`, `onsite`.
- `sortBy`: `newest` (default), `oldest`, or `salary` (highest annual maximum salary first; unspecified last). Salary sorting compares numeric amounts, not exchange-rate converted currencies; filter/compare listings with this in mind.
- `page`: defaults to 1; maximum 100,000.
- `limit`: defaults to 9; maximum 50.

Filters combine with AND. Public lists contain open jobs only. Company listings include closed jobs. Stable sorting uses ID as a tie-breaker. Pagination metadata reports page, limit, total, totalPages, hasNextPage, and hasPreviousPage. Count and list share a repeatable-read transaction. Title/location have trigram GIN indexes; tags have a GIN index; company/status pagination has supporting indexes. Offset pagination is suitable for this exercise; very deep pages still become more expensive.

## Shared response format

All API JSON responses have the same six fields, implemented in `backend/src/common/responses.js`:

```json
{
  "success": true,
  "code": "APPLICATION_SUBMITTED",
  "message": "Your application has been sent. Good luck!",
  "data": { "id": "application-uuid" },
  "errors": [],
  "meta": null
}
```

```json
{
  "success": false,
  "code": "ALREADY_APPLIED",
  "message": "You have already applied to this job. View it in My applications.",
  "data": null,
  "errors": [],
  "meta": null
}
```

HTTP statuses: 200 success, 201 created, 400 invalid input/PDF, 401 missing/expired authentication, 403 wrong role/owner, 404 missing record, 409 duplicate/conflict/closed job, 413 upload too large, 415 wrong content type, 429 rate limit, 500 unexpected error, 503 recognized database connectivity errors. Field validation details appear in `errors`. Stack traces and internal errors are not returned to clients.

A successful resume download intentionally returns the actual PDF with attachment headers. Download failures still return the common JSON response. Frontend HTML and other static assets are also not JSON endpoints.

## Code flow and structure

```text
Browser or Postman
  → Express app
  → Route
  → Authentication / role check
  → JSON validation or Multer PDF upload + validation
  → Controller
  → Service
  → Prisma
  → PostgreSQL
  → Shared response → Browser or Postman
```

```text
project 2/
  package.json                  Workspace scripts: dev, build, start, test
  frontend/
    package.json                React, React DOM, Vite
    index.html                  React root element
    vite.config.js              React build + development API proxy
    src/
      main.jsx                  React entry and providers
      App.jsx                   Page selection and role boundaries
      context/
        AuthContext.jsx         Current user, login/logout, session restore
        AppContext.jsx          Navigation, dialogs, toast notifications
      pages/
        JobsPage.jsx            Search, filters, paginated job discovery
        CompanyPage.jsx         Company posting dashboard
        ApplicationsPage.jsx    Candidate application tracker
      components/
        Layout.jsx              Sidebar, header, account controls
        Hero.jsx                Discover-page introduction
        JobCard.jsx             Reusable job listing card
        JobFilters.jsx          Job type, work style, skills
        JobDetails.jsx          Job detail view
        AuthForm.jsx            Registration, login, demo access
        JobForm.jsx             Create/edit job form
        ApplicationForm.jsx     PDF application form and confirmation
        ApplicantsPanel.jsx     Company applicant review
        DeleteJobDialog.jsx     Confirm permanent job deletion
        DownloadButton.jsx      Authenticated resume download
        ModalHost.jsx           Accessible native dialog + modal routing
        RoleGuard.jsx           Role-aware frontend access message
        Pagination.jsx          Shared page controls
        Feedback.jsx            Loading, empty, error states
        CompanyLogo.jsx         Company initials
        Icon.jsx                Shared SVG icons
      hooks/useResource.js      Fetch state, cancellation, retry
      services/api.js           Shared fetch client, tokens, PDF downloads
      utils/format.js           Date, salary, and label formatting
      styles.css                Responsive design
    dist/                       Generated build (ignored)
  backend/
    package.json                Express/Prisma dependencies and scripts
    .env                        Database connection and API port (ignored)
    .env.test                   Separate test DB connection (ignored)
    src/
      app.js                    Express middleware, APIs, React build serving
      server.js                 Startup and graceful shutdown
      common/                   Response codes, AppError, shared validation
      config/database.js        Prisma connection
      middleware/               Auth, PDF upload, errors
      auth/                     Routes, validation, controller, service
      jobs/                     Routes, validation, controller, service
      applications/             Routes, validation, controller, service
    prisma/                     Schema, migrations, demo seed
    prisma.config.ts            Prisma CLI configuration
    tests/                      API and full browser integration tests
    scripts/                    Sample PDF generation utility
    test-results/               Browser screenshots (ignored)
  postman/                      Collection, environment, sample PDF
```

React components render JSX rather than building HTML strings or using global click handlers. Component state controls forms and loading indicators; context shares account and UI state. `useResource` aborts stale requests when filters or pages change. The shared API client attaches the current session token and handles session expiry. React escapes interpolated strings automatically.

Read the frontend in this order: `main.jsx` → `App.jsx` → `pages/JobsPage.jsx` → `components/JobCard.jsx` → `services/api.js`. On the backend, follow routes → validation → controller → service. Frontend role checks guide the UI; backend role and ownership checks remain authoritative.

`npm run format` formats the React source with Prettier.


Passwords use salted scrypt hashes. Sessions use cryptographically random tokens, stored only as SHA-256 hashes in PostgreSQL, expire after 24 hours, and are revoked on logout. The frontend keeps the token in sessionStorage for the current browser tab. Reload restores the profile via `/auth/me`. Auth requests and general API traffic have rate limits.

Resumes use Multer memory storage with a 5 MB cap and are persisted as private PostgreSQL `bytea` with the application. File extension, MIME type, PDF header and EOF signature are checked. This is a format check, not malware scanning or full PDF parsing. There is no public uploads directory and resume bytes are excluded from listing responses. Database storage avoids orphaned files and ensures job deletion removes dependent PDFs; production-scale file storage/scanning can be added separately.

A unique `(jobId, candidateId)` database constraint prevents duplicate applications under concurrent requests. Job-row locking coordinates applications with closing/deletion and partial salary changes. React escapes dynamic text, uses local assets and an explicit content security policy, and handles loading, empty, error, and success states.

## Verification

First apply the schema to the test DB:

```sh
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/project_2_test_db" npm run db:migrate
npm test
```

Browser checks (build React and start an isolated test server automatically; no normal server needed):

```sh
npm run test:ui
```

Browser tests use installed Google Chrome on macOS; set `CHROME_PATH` to your Chrome/Chromium executable elsewhere. They start an isolated test server and only clear `project_2_test_db`. Tests must not run concurrently with each other because they share that disposable database. Screenshots are saved under ignored `backend/test-results/`.

API tests cover auth, ownership, CRUD, salary validation, filters, pagination, invalid uploads, concurrent duplicate prevention, protected downloads, application review, closure/deletion, session revocation/expiry, and generic errors. Browser tests exercise real company/candidate flows and mobile layout. Verified locally: all 7 API test groups passed; the browser workflow passed; all 23 Postman requests and 90 assertions passed. Desktop, mobile, and applicant-view screenshots are available in `backend/test-results/`.

Scope: required screenshot features plus accounts, review statuses, work-style/type filters, salary display/sorting, and frontend. Optional email notifications, saved searches, and job alerts are not implemented. No external emails are sent.

References: [Multer upload API](https://expressjs.com/en/resources/middleware/multer/) and [Prisma 7 transactions](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions).

React migration references: [React createRoot](https://react.dev/reference/react-dom/client/createRoot) and [Vite server proxy](https://vite.dev/config/server-options).
