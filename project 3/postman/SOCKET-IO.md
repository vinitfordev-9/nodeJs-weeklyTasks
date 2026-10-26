# Test live chat in Postman

The HTTP collection covers accounts, membership, messages, cursor history, read receipts, and notifications. Socket.IO requests are configured separately in Postman; this file provides the live event examples.

1. Import `Commonroom.postman_collection.json` and `Project-3-Local.postman_environment.json`.
2. Select **Project 3 - Local** and run HTTP requests 01–22 in order.
3. Copy `tokenA`, `tokenB`, and `roomId` from the collection variables. These are real session tokens and a UUID, not the example placeholders below.
4. Choose **New → Socket.IO**. URL: `ws://127.0.0.1:3003`.
5. Before connecting, add header **Authorization: Bearer YOUR_TOKEN_A**. Use Socket.IO client version 4 and the default handshake path `/socket.io`.
6. Connect. In **Events**, add and enable listeners for `message:new`, `message:read`, `typing:update`, `room:presence`, `notification:new`, and `room:left`.
7. Enter an event name beside Send, use one JSON object argument, and enable **Ack** to see the common success/error response.
8. Repeat in another Socket.IO tab with token B so you can see delivery between two users. Both users must have joined the room through REST first.

If collection variables do not resolve in a separately created Socket.IO request, paste the actual values or add them to your selected environment. Do not put tokens in URL query parameters.

## Start watching a room

Event: `room:watch`

```json
{ "roomId": "PASTE_ROOM_UUID" }
```

Returns online users, starts live delivery, and stops watching the previously viewed room on this socket. Watching is separate from durable membership: `POST /api/rooms/:id/join` joins the room; `room:watch` views it live. Each tab watches one room at a time. Multiple tabs for one user count as one online user.

## Send a message

Event: `message:send`

```json
{
  "roomId": "PASTE_ROOM_UUID",
  "content": "Hello from Postman!",
  "clientMessageId": "a97d4ca5-a631-45d6-9f53-fd240e6e34f1"
}
```

Use a fresh UUID for each new message. If confirmation is lost, retry the **same content and same UUID**. The saved message is returned instead of inserting a duplicate. Reusing a UUID with different content returns a conflict. The server assigns the actual message `id` and chronological `sequence`.

Listen for `message:new` in both tabs. Its payload is the saved message, including author and sequence. A successful acknowledgement confirms PostgreSQL persistence, not that every recipient has read or received it.

## Typing indicator

Event: `typing:set`

```json
{ "roomId": "PASTE_ROOM_UUID", "typing": true }
```

Other room viewers receive `typing:update`. Send `false` when finished. The React UI expires stale indicators after five seconds; typing is deliberately ephemeral and not stored in PostgreSQL.

## Read receipt

Event: `message:read`

```json
{
  "roomId": "PASTE_ROOM_UUID",
  "messageIds": ["PASTE_SAVED_MESSAGE_UUID"]
}
```

Only mark messages the user has actually viewed. Up to 50 IDs per request. The receipt is persisted and broadcast as `message:read`. Fetch message history to see the users and timestamps who have read each message.

## Presence and leaving

`room:presence` broadcasts a snapshot `{ roomId, users }` when a room is watched, switched, or a socket disconnects. Disconnect a tab to test. Closing the last viewing tab removes that user from the online list after disconnect detection.

Use REST `POST /api/rooms/:id/leave` to end membership. This evicts **all of that user’s tabs**, even on another server instance. `room:left` tells the UI to close that conversation. Messages remain in history. Rejoin through REST to regain access.

## Mentions

Send `@handle` (for example `@mara` in the demo room). A durable notification is created for each mentioned active member except the sender. The user receives `notification:new` while connected; `GET /api/notifications` recovers recent mentions later. This is an in-app inbox, not operating-system/browser push notifications.

## Reconnect and recover

Reconnect, emit `room:watch`, then request:

```text
GET /api/rooms/ROOM_UUID/messages?after=LAST_SEQUENCE&limit=50
```

While `meta.hasMore` is true, repeat using `meta.nextCursor` as `after`. The frontend also reconciles history every 15 seconds to cover dropped broadcasts. The plain Redis adapter does not replay events; PostgreSQL history is the source of truth.

Official Postman references: [create a Socket.IO request](https://learning.postman.com/docs/use/send-requests/protocols/websocket/create-a-socketio-request/), [headers and connection settings](https://learning.postman.com/docs/use/send-requests/protocols/websocket/add-details-websocket), and [event listeners](https://learning.postman.com/docs/use/send-requests/protocols/websocket/listen-to-socketio-events/).
