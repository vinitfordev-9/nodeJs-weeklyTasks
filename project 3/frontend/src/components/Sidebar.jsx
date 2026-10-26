import { useState } from "react";
import Icon from "./Icon.jsx";
import Avatar from "./Avatar.jsx";
export default function Sidebar({
  user,
  rooms,
  selected,
  select,
  create,
  browse,
  notifications,
  notifyCount,
  logout,
  mobile,
  closeMobile,
}) {
  const [search, setSearch] = useState("");
  return (
    <>
      <aside className="rail">
        <a
          className="rail-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            browse();
          }}
          aria-label="Browse rooms"
        >
          <Icon name="chat" />
        </a>
        <button
          className="rail-button active"
          aria-label="Chat rooms"
          onClick={browse}
        >
          <Icon name="chat" />
        </button>
        <button
          className="rail-button"
          aria-label="Mentions"
          onClick={notifications}
        >
          <Icon name="bell" />
          {notifyCount > 0 && <i />}
        </button>
        <div className="rail-bottom">
          <button
            className="rail-button"
            aria-label="Sign out"
            onClick={logout}
          >
            <Icon name="logout" />
          </button>
          <Avatar user={user} small />
        </div>
      </aside>
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <div className="workspace">
          <div className="workspace-symbol">
            c<span>✦</span>
          </div>
          <div>
            <strong>Commonroom</strong>
            <span>YOUR SHARED SPACE</span>
          </div>
          <button
            className="mobile-close"
            onClick={closeMobile}
            aria-label="Close rooms"
          >
            ×
          </button>
        </div>
        <div className="workspace-label">A little space for big ideas.</div>
        <label className="room-search">
          <Icon name="search" size={15} />
          <input
            aria-label="Search joined rooms"
            placeholder="Find a conversation"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <kbd>⌕</kbd>
        </label>
        <button className="inbox-link" onClick={notifications}>
          <span>@</span> Mentions & updates{" "}
          {notifyCount > 0 && <b>{notifyCount}</b>}
        </button>
        <div className="section-label">
          YOUR ROOMS{" "}
          <button aria-label="Create room" onClick={create}>
            +
          </button>
        </div>
        <nav aria-label="Chat rooms">
          {rooms
            .filter(
              (room) => room.joined && room.name.includes(search.toLowerCase()),
            )
            .map((room) => (
              <button
                key={room.id}
                className={`room-link ${selected?.id === room.id ? "selected" : ""}`}
                onClick={() => {
                  select(room);
                  closeMobile();
                }}
              >
                <span>#</span>
                {room.name}
                {selected?.id === room.id && <i />}
              </button>
            ))}
        </nav>
        <button className="browse-link" onClick={browse}>
          <span>⊞</span> Browse all rooms
        </button>
        <div className="sidebar-card">
          <span className="spark">✳</span>
          <h3>
            A good idea
            <br />
            needs a little room.
          </h3>
          <p>
            Bring your people together.
            <br />
            Start a new conversation.
          </p>
          <button onClick={create}>
            Create a room <span>↗</span>
          </button>
        </div>
        <div className="sidebar-footer">
          <span className="green-dot" />
          Make space for the good stuff.
        </div>
      </aside>
    </>
  );
}
