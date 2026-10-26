# Project 1 — Personal Task Manager API

Single-user Node.js + Express + PostgreSQL + Prisma API. All application code uses ES module `import`/`export`. Responses are JSON; EJS templates are not needed for a REST API.

## Start locally

The local `.env` points to the dedicated `project_1_db` database. Tests use `project_1_test_db` only. PostgreSQL must be running.

```sh
cd "/Users/apple/Desktop/Wekkly Tasks/project 1"
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

The API defaults to **http://127.0.0.1:3001**. No authentication is required: this is the single-user exercise from the specification, bound to localhost by default.

For a fresh machine, create both databases with `createdb project_1_db` and `createdb project_1_test_db`, copy `.env.example` to `.env`, and supply your PostgreSQL credentials. Copy `.env.test.example` to `.env.test` and set the test database credentials too. Never commit these files.

## Simple Postman flow

Import `postman/Task-Manager.postman_collection.json`. Run its requests in order. The collection defines `baseUrl` and automatically captures `taskId` after creating a task. Its tests check HTTP status, response code, success flag, and response shape.

1. Check health.
2. Create a task.
3. List or filter tasks.
4. Get the task using its ID.
5. Update its status.
6. Delete it; getting it again returns 404.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Check API and database connectivity |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get one task |
| PATCH | `/api/tasks/:id` | Update provided fields |
| DELETE | `/api/tasks/:id` | Delete a task |

For POST/PATCH select **Body → raw → JSON** in Postman. Create example:

```json
{
  "title": "Complete my backend project",
  "description": "Test all endpoints in Postman",
  "dueDate": "2026-12-01T18:00:00+05:30",
  "priority": "high",
  "status": "todo"
}
```

Update example: `{"status":"in-progress"}` or `{"status":"done"}`.

Only title is required on create. It must contain 1–200 characters after trimming. Description is optional (maximum 5,000 characters). Due date is optional and accepts a valid ISO timestamp with timezone. Dates are stored and returned in UTC; past dates are allowed for overdue tasks. Send `null` to clear description or due date. Priority defaults to `medium`; status defaults to `todo`.

Allowed priorities: `low`, `medium`, `high`. Allowed statuses: `todo`, `in-progress`, `done`. Empty updates and unknown fields are rejected. IDs must be UUIDs.

### Filters, pagination, and sorting

```text
GET /api/tasks?status=todo&priority=high&page=1&limit=5&sortBy=dueDate&sortOrder=asc
```

All query parameters are optional. `page` defaults to 1 (maximum 1,000,000); `limit` defaults to 10 (maximum 100). `sortBy` accepts `createdAt`, `dueDate`, or `priority`; `sortOrder` accepts `asc` or `desc`. Default order is newest first. Priority descending means high → medium → low. Undated tasks sort last. ID breaks sorting ties. Filters combine with AND. An out-of-range page returns an empty list. `meta` reports page, limit, total, totalPages, hasNextPage, and hasPreviousPage.

## Consistent responses

All endpoints, including errors, use the same six fields. Messages and HTTP statuses are centralized in `src/common/responses.js` and imported everywhere.

```json
{
  "success": true,
  "code": "TASK_DELETED",
  "message": "Your task was deleted successfully.",
  "data": { "id": "the-deleted-task-uuid" },
  "errors": [],
  "meta": null
}
```

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Please correct the highlighted fields and try again.",
  "data": null,
  "errors": [{ "field": "title", "message": "Title is required." }],
  "meta": null
}
```

Create returns 201. Reads, updates, and deletion return 200 (deletion includes a confirmation body). Validation/malformed JSON return 400; missing resources/routes 404; conflicts 409; oversized requests 413; unsupported content types 415; unexpected errors 500; recognized connectivity errors 503. Internal error details are logged only on the server.

## Code flow

`Postman → Express app → task router → validation → task controller → task service → Prisma → PostgreSQL → shared JSON response`

Errors reach a single error middleware, which chooses the shared code/status/message. `src/server.js` handles startup and shutdown; `src/app.js` builds the app; `src/tasks/` holds routes, validation, controllers, and database operations. `task.routes.js` connects endpoints and middleware; `task.controller.js` reads validated input, calls the service, and sends the shared response; `task.service.js` performs database operations. Prisma schema and versioned SQL migrations live in `prisma/`.

## Tests

Apply migrations to the separate test database, then run integration tests:

```sh
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/project_1_test_db" npm run db:migrate
npm test
```

Tests cover persistence, CRUD, combined filters, pagination, priority and date sorting, status mapping, invalid input, missing tasks, malformed JSON, unsupported content, oversized bodies, and health. Tests clear task records only in `project_1_test_db`; never use that database for real tasks.

Optional screenshot extensions for scheduled reminders and many-to-many tags are outside this implementation. Due-date and priority sorting are included.

Implementation references: [Prisma 7 setup](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) and [Express error handling](https://expressjs.com/en/5x/guide/error-handling/).
