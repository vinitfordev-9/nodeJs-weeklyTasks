import { useConversation } from "../hooks/useConversation.js";
import MessageList from "./MessageList.jsx";
import Composer from "./Composer.jsx";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
export default function Conversation({
  room,
  user,
  socket,
  connection,
  epoch,
  leave,
  showRooms,
}) {
  const chat = useConversation(room.id, socket, epoch);
  return (
    <section className="conversation">
      <header className="chat-header">
        <button
          className="mobile-menu"
          aria-label="Show rooms"
          onClick={showRooms}
        >
          ☰
        </button>
        <span className="header-hash">#</span>
        <div>
          <h1>{room.name}</h1>
          <p>{room.description}</p>
        </div>
        <div className="header-members">
          {chat.presence.slice(0, 3).map((person) => (
            <Avatar key={person.id} user={person} small />
          ))}
          <span>{chat.presence.length} online</span>
        </div>
        <button className="icon-button" aria-label="Leave room" onClick={leave}>
          <Icon name="logout" />
        </button>
      </header>
      <div className="room-banner">
        <span>✦</span> A shared space. A fresh perspective.{" "}
        <span className="banner-right">Make yourself at home.</span>
      </div>
      {chat.error && (
        <div className="error live-error" role="alert">
          {chat.error}
        </div>
      )}
      {chat.loading && !chat.messages.length ? (
        <div className="loading">Connecting the conversation…</div>
      ) : (
        <MessageList {...chat} room={room} user={user} />
      )}
      <Composer
        key={room.id}
        room={room}
        user={user}
        socket={socket}
        connection={connection}
        send={chat.send}
      />
    </section>
  );
}
