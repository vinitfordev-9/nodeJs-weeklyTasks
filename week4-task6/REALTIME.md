# Socket.IO order notifications

## Contract

Connect to the API using `io(apiUrl, { auth: { token: loginToken } })`. Use the JWT returned by `POST /login`. Never send tokens in query strings. The server uses HS256 and validates subject, email, role and expiration. WebSocket and polling requests enforce the existing origin allowlist.

`session:ready`: `{ userId: 2 }` confirms authentication and room membership.

`order:changed` example:

```json
{"action":"updated","orderId":4,"status":"SHIPPED","totalAmount":149,"occurredAt":"2026-09-21T04:00:00.000Z"}
```

The controller emits only after a successful service/database result. Failed writes and missing orders emit nothing. The owner ID is taken from the persisted order. No client-driven room joining or publishing endpoint exists. If an order is reassigned, only the resulting owner receives the update.

## Manual verification

1. Set up PostgreSQL, generate Prisma, migrate, and start the API as described in README.
2. Register two users with `POST /register`, then log in to `/live/` in separate browser profiles.
3. Use a valid Bearer token to `POST /orders` with `{"userId":2,"orderDate":"2026-09-21T00:00:00.000Z","status":"PENDING","totalAmount":149}` (substitute the real owner ID).
4. Only that owner's browser receives the new event. `PUT /orders/:id` with the same fields and `status: "SHIPPED"` sends the next event without a page reload.
5. Disconnect, reconnect and update again: exactly one additional event appears. Log out: activity clears and the connection closes.
6. Stop the server: browser shows disconnection and retries. Restart it while the token remains valid: the user rejoins their room.

## Automated evidence

`test/realtime.test.js` uses a real HTTP server and Socket.IO clients to verify delivery to the owner's multiple tabs, isolation, ineffective arbitrary join attempts, authentication failures, WebSocket origin rejection, expiration, transport reconnect, room cleanup and server shutdown.

`npm run demo:record` drives the actual browser login and existing REST controllers/services, with the inherited in-memory Prisma fixture replacing PostgreSQL. It asserts event counts, another user's exclusion and zero browser JavaScript errors; screenshots are encoded into the included GIF. Google Chrome is required. Production startup never loads this fixture.

Reference: [Socket.IO rooms and automatic disconnection cleanup](https://socket.io/docs/v4/rooms/), [client connection lifecycle](https://socket.io/docs/v4/client-socket-instance/).

Verified on 2026-09-21: **16 suites, 141 tests passed**. Statement coverage: **93.64%**; branch coverage: **89.83%**. Browser recording assertions passed with no JavaScript errors.
