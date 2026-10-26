import { useState } from "react";
import { api } from "../services/api.js";
import Modal from "./Modal.jsx";
export function CreateRoom({ close, created }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Make room for something good." onClose={close}>
      <p className="muted">
        A shared space for a project, a topic, or a little inspiration.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const body = Object.fromEntries(new FormData(event.currentTarget));
          setBusy(true);
          try {
            const result = await api("/rooms", { method: "POST", body });
            await created(result.data);
            close();
          } catch (failure) {
            setError(
              [
                failure.message,
                ...(failure.details || []).map((item) => item.message),
              ].join(" "),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="error" role="alert">
          {error}
        </div>
        <label>
          Room name
          <input
            name="name"
            required
            pattern="[a-z0-9][a-z0-9-]{1,49}"
            placeholder="design-studio"
          />
          <small>Lowercase letters, numbers, and hyphens.</small>
        </label>
        <label>
          What’s this room about?
          <textarea
            name="description"
            required
            minLength={5}
            maxLength={250}
            placeholder="A place to share ideas and make things better."
          />
        </label>
        <button className="button primary wide" disabled={busy}>
          Create room →
        </button>
      </form>
    </Modal>
  );
}
export function BrowseRooms({
  close,
  rooms,
  join,
  nextPage,
  hasMore,
  loading,
}) {
  return (
    <Modal title="Find your kind of conversation." onClose={close}>
      <p className="muted">
        All rooms are discoverable. Join one to read its history and take part.
      </p>
      <div className="browse-rooms">
        {rooms.map((room) => (
          <div key={room.id} className="browse-room">
            <span className="room-hash">#</span>
            <div>
              <h3>{room.name}</h3>
              <p>{room.description}</p>
              <small>{room._count?.memberships || 0} members</small>
            </div>
            <button
              className="button small"
              onClick={() => join(room)}
              disabled={loading}
            >
              {room.joined ? "Open" : "Join"}
            </button>
          </div>
        ))}
      </div>
      {hasMore && (
        <button className="button wide" disabled={loading} onClick={nextPage}>
          Load more rooms
        </button>
      )}
      {!rooms.length && (
        <p className="muted">No rooms yet. Create the first one.</p>
      )}
    </Modal>
  );
}
export function Notifications({ items, close, open }) {
  return (
    <Modal title="You’re part of the conversation." onClose={close}>
      <p className="muted">
        Your latest 50 mentions stay here, even when you’re offline.
      </p>
      {items.length ? (
        items.map((item) => (
          <button
            className={`notification ${item.read ? "" : "unread"}`}
            key={item.id}
            onClick={() => open(item)}
          >
            <span>@</span>
            <div>
              <strong>{item.message.author.name} mentioned you</strong>
              <small>#{item.message.room.name}</small>
              <p>{item.message.content}</p>
            </div>
            {!item.read && <i />}
          </button>
        ))
      ) : (
        <div className="empty-mini">
          All caught up. Your next hello is on its way.
        </div>
      )}
    </Modal>
  );
}
