# Project 3 — Commonroom

A multi-room chat and in-app mention notification system, with a React frontend and a separate Express backend. PostgreSQL stores accounts, room memberships, messages, read receipts, mentions, and a broadcast outbox. Socket.IO delivers live events; Redis connects server instances.

## Run locally

From `project 3`, open two terminals:

```sh
# Terminal 1: isolated Redis on port 6383
npm run redis
```

```sh
# Terminal 2: React + backend, with hot reload
npm run dev
```

- Frontend: **http://127.0.0.1:5174**
- Backend/Postman: **http://127.0.0.1:3003**
- Socket.IO: **ws://127.0.0.1:3003**, path `/socket.io`, WebSocket transport.

If Redis is already running on 6383, reuse it instead of starting another process. PostgreSQL must also be running. `npm start` builds React and serves the frontend and API together at **http://127.0.0.1:3003**; Redis still needs to be running. Stop the dev backend before using `npm start` on the same port.

Dedicated databases: `project_3_db` for this application; `project_3_test_db` for disposable tests. Project 1 and Project 2 data are separate. The Redis instance uses port 6383; app and tests also use separate Pub/Sub namespaces. No Redis flush commands are used. Redis is ephemeral; chat history does not depend on Redis persistence.

Fresh installation (Node 22.12+; tested on Node 26):

1. Install PostgreSQL and Redis; create both databases.
2. Copy `backend/.env.example` to `backend/.env`, and `.env.test.example` to `.env.test`; set your own PostgreSQL credentials.
3. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed` from the project root.
4. Start Redis, then `npm run dev`.

Use npm workspaces from the root; one lockfile installs both applications. Application source uses ES module `import`/`export`, with route → validation/authentication → controller → service → database layers. The frontend uses React components, hooks, and context.

## Try a conversation

Demo accounts, password **`DemoPass123!`**:

| Person | Email | Mention handle |
| --- | --- | --- |
| Alex Lee | `alex@commonroom.demo` | `@alex` |
| Mara Kim | `mara@commonroom.demo` | `@mara` |
| Theo Oliver | `theo@commonroom.demo` | `@theo` |
| Sofia Chen | `sofia@commonroom.demo` | `@sofia` |

These accounts and seeded conversations are fictional local demo data. Do not use demo credentials in a public deployment. Seed is repeatable without resetting existing accounts or message contents.

1. Open the frontend and choose **Try as Alex**.
2. Open another browser window/profile and sign in as Mara. Separate tabs also work because tokens use sessionStorage; avoid duplicating an authenticated tab if you want a different account.
3. Open the same room in both windows. Type and send messages to see typing, live delivery, and presence.
4. Focus the receiving window with the message visible to produce a read receipt.
5. Send `@mara` to create an in-app mention. Open Mentions from the left rail.
6. Reload or disconnect/reconnect; saved messages remain. Scroll up and choose Load earlier messages for older pages.
7. Create another room or use Browse all rooms → Join. Leave through the room header to revoke membership on all tabs.

The workspace shows currently **viewing** users in a room, not every member who has an open app elsewhere. Membership is durable; presence is connection-based. Each socket watches one room. A user with multiple viewing tabs appears once. Typing indicators expire automatically.

## Postman

Import:

- `postman/Commonroom.postman_collection.json`
- `postman/Project-3-Local.postman_environment.json`

Select **Project 3 - Local**, with `baseUrl = http://127.0.0.1:3003`. Do not use Project 1/2’s environment because it can override the same variable name with the wrong port.

Run the 22 HTTP requests in order. The collection creates two users and a room, saves tokens/UUIDs, posts and retries a message, marks it read, checks mentions, and tests membership restrictions. Accounts and test rooms remain in the local demo database. Repeated runs use unique account/room names. Tokens are deliberately left valid for the live-event exercises.

See **[Socket.IO instructions](postman/SOCKET-IO.md)** for headers, events, acknowledgements, and copyable event payloads. A regular HTTP collection does not listen to live Socket.IO events; create Socket.IO tabs separately.

CLI:

```sh
/Users/apple/.local/bin/postman collection run postman/Commonroom.postman_collection.json --no-report-events
```

### REST endpoints

All `/api` routes below require `Authorization: Bearer <token>` except registration/login.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | PostgreSQL and Redis readiness |
| POST | `/api/auth/register` | Create account and session |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current profile |
| POST | `/api/auth/logout` | Revoke session and disconnect its sockets |
| GET | `/api/rooms?page=1&limit=50` | Discover rooms, counts, and membership |
| POST | `/api/rooms` | Create a room and join it |
| POST | `/api/rooms/:id/join` | Join/rejoin a room |
| POST | `/api/rooms/:id/leave` | Leave and evict all your live tabs |
| GET | `/api/rooms/:id/members` | First 100 active members |
| GET | `/api/rooms/:id/messages?limit=30` | Latest message page, oldest first within page |
| GET | `/api/rooms/:id/messages?before=SEQUENCE` | Older page |
| GET | `/api/rooms/:id/messages?after=SEQUENCE` | Catch up after a known sequence |
| POST | `/api/rooms/:id/messages` | Save/send a message over REST |
| POST | `/api/rooms/:id/read` | Persist receipts for up to 50 messages |
| GET | `/api/notifications` | Latest 50 personal mentions |
| PATCH | `/api/notifications/:id/read` | Mark your own mention as read |

Create an account:

```json
{
  "name": "Vinit",
  "handle": "vinit",
  "email": "vinit@example.com",
  "password": "MySecurePass123!"
}
```

Create a room:

```json
{
  "name": "our-project",
  "description": "A place to share progress and ideas."
}
```

Send a message:

```json
{
  "content": "Hello @mara!",
  "clientMessageId": "a97d4ca5-a631-45d6-9f53-fd240e6e34f1"
}
```

The caller supplies a new UUID `clientMessageId` for each intended new message. The server assigns the actual `id` and a `sequence` string. Retrying with the same user, room, ID, and content returns the same record; changed content conflicts. Message text is 1–4,000 characters after trimming. HTML is rendered as text by React. There are no message edits/deletes or attachments in this scope.

History supports `limit` 1–50 and either `before` or `after`, never both. `sequence` is a decimal **string** so JavaScript does not lose 64-bit precision. Cursor pages remain stable while new messages arrive. `meta.hasMore` and `meta.nextCursor` let clients continue. Room discovery uses offset pagination, limited to 50 rooms per page.

### Socket.IO contract

Authenticate with `auth: { token }` in the JavaScript client or an `Authorization: Bearer ...` handshake header in Postman. Tokens are not accepted in URL query parameters.

| Client event | Payload | Result |
| --- | --- | --- |
| `room:watch` | `{roomId}` | Verify membership, subscribe, return presence |
| `message:send` | `{roomId, content, clientMessageId}` | Save idempotently, acknowledge, queue broadcast |
| `message:read` | `{roomId, messageIds}` | Persist readers and queue broadcast |
| `typing:set` | `{roomId, typing}` | Broadcast temporary typing state to other viewers |

Server events: `message:new`, `message:read`, `typing:update`, `room:presence`, `notification:new`, and `room:left`. Events are typed payloads; acknowledgements use the same generic envelope as REST. The server validates authentication, membership, payload, and per-socket event rate on every event. Session expiry and logout disconnect clients. Presence lists expose IDs, names, and handles, not email addresses.

## Shared response format

`backend/src/common/responses.js` centralizes HTTP statuses, codes, messages, AppError, JSON-safe serialization, and the response envelope. Controllers and socket acknowledgements import the same definitions.

```json
{
  "success": true,
  "code": "MESSAGE_SAVED",
  "message": "Your message was saved successfully.",
  "data": { "id": "saved-message-uuid", "sequence": "42" },
  "errors": [],
  "meta": null
}
```

```json
{
  "success": false,
  "code": "ROOM_ACCESS_DENIED",
  "message": "Join this room before reading or sending messages.",
  "data": null,
  "errors": [],
  "meta": null
}
```

HTTP statuses include 200/201 success, 400 validation, 401 authentication, 403 membership, 404 missing record, 409 conflict, 413 request size, 415 content type, 429 rate limit, and 500/503 server/unavailability. Internal exception details are logged on the server. Static frontend files are not JSON endpoints.

## Persistence and delivery flow

```text
React / Postman
  → Authenticated REST route or Socket.IO event
  → Validation + membership check
  → Service transaction
  → Message + mention notifications + outbox stored in PostgreSQL
  → Sender acknowledgement
  → Outbox worker → Socket.IO → Redis adapter → room viewers
  → Client merges by message ID
```

- Acknowledgement means **saved in PostgreSQL**, not “read by everyone.”
- A database unique constraint prevents duplicate messages on retry. Room-row locking orders concurrent writes and coordinates join/leave checks.
- Message and outbox are committed together. Workers claim pending outbox rows using `FOR UPDATE SKIP LOCKED`; an interrupted attempt can be retried. Broadcast duplicates are possible, so the frontend merges by message ID.
- Redis Pub/Sub is ephemeral and Socket.IO broadcasts are not a durable per-recipient queue. Outbox `deliveredAt` means a **broadcast attempt**, not recipient acknowledgement. Clients recover through PostgreSQL history after reconnect and every 15 seconds while viewing a room.
- The browser advances its history cursor from REST responses, not from possibly out-of-order broadcasts. It pages through missing messages before updating that cursor, and refreshes recent history to recover read-receipt updates missed while disconnected.
- Pending sends and drafts are retained in the tab’s sessionStorage. Retry reuses the original client message UUID. There is no automatic offline send queue; the UI asks for a safe retry after reconnection.
- Read receipts are stored per user/message. React uses viewport intersection and foreground/focus checks before marking visible messages. The server trusts the authenticated user’s explicit read action; it cannot prove a human read the text.
- Mentions are persisted for active members using `@handle`, whether online or offline. Users see the most recent 50 in their inbox. This is an in-app feature; OS push notifications/email are not implemented.

### Multiple server instances

The Redis adapter is enabled by default. Instances sharing PostgreSQL, Redis URL, and `REDIS_CHANNEL_PREFIX` broadcast across one another. Tests exercise two instances with clients connected to different servers, including leaving rooms across tabs and session revocation.

For a local second instance:

```sh
PORT=3004 npm run start --workspace backend
```

Add its browser origin to `ALLOWED_ORIGINS` if serving its frontend directly. A reverse proxy should use TLS and support WebSocket upgrades. This implementation intentionally uses WebSocket-only transport, avoiding long-polling sticky-session requirements. It is not a load-tested production deployment. Auth/API limits are per process and socket limits per connection; a shared abuse-rate limiter can be added for an internet deployment. Outbox delivered rows currently remain for inspection and need a retention policy for long-running use.

## Structure and code reading order

```text
project 3/
  package.json                 Workspace scripts
  backend/
    src/
      server.js                HTTP startup, realtime attachment, shutdown
      app.js                   Express routes, security, React build serving
      common/                  Shared responses and validation
      config/database.js       Prisma client
      middleware/              Session verification and errors
      auth/                    Account routes/controllers/services
      rooms/                   Membership and room routes/controllers/services
      messages/                Persistence, cursor history, receipt services
      notifications/           Personal mention inbox
      realtime/
        socket.js              Authentication, event handlers, Redis, presence
        outbox.js              Durable broadcast-attempt worker
    prisma/                    Schema, migration, seed
    tests/                     API, two-node realtime, and browser tests
    .env                       Local DB/Redis configuration (ignored)
  frontend/
    src/
      App.jsx                  Workspace composition and room selection
      context/AuthContext.jsx  Session restoration and account state
      hooks/useSocket.js       Connection lifecycle
      hooks/useConversation.js History sync, message merge, readers, presence
      services/api.js          REST client and socket acknowledgement helper
      components/              Auth, sidebar, rooms, conversation, composer,
                               message list, avatars, and dialogs
      styles.css               Responsive Commonroom design
    vite.config.js             React dev API and WebSocket proxy
  postman/                     Collection, local environment, Socket.IO guide
```

Read `server.js` → `realtime/socket.js` → `messages/message.service.js` → `realtime/outbox.js` to understand live delivery. On the frontend, read `App.jsx` → `Conversation.jsx` → `useConversation.js` → `Composer.jsx`.

## Tests

Apply the test migration once with your own credentials:

```sh
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/project_3_test_db" npm run db:migrate
```

With Redis running:

```sh
npm test
npm run test:ui
```

Tests reject any database except `project_3_test_db` and require a Redis channel prefix ending in `:test`. They clear only that test database. Do not run both suites concurrently. Browser tests use installed macOS Chrome; override `CHROME_PATH` elsewhere. They start an isolated server and do not need the ordinary API running. Screenshots go to ignored `backend/test-results/`.

`npm run format` formats the React source. `npm run build` builds the frontend. No database reset is required for normal startup.

Implementation references: [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/), [Redis adapter](https://socket.io/docs/v4/redis-adapter), and [Node Redis connection API](https://redis.io/docs/latest/develop/clients/nodejs/connect/).

Verified locally: all 7 API/realtime test groups passed, including two server instances on Redis; the two-user browser workflow passed with visible reader names and mobile overflow checks; all 22 Postman requests and 88 assertions passed.
