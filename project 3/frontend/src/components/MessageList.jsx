import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar.jsx";
const clock = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
export default function MessageList({
  room,
  messages,
  user,
  older,
  loadOlder,
  loadingOlder,
  markVisible,
  typing,
}) {
  const feed = useRef();
  const bottom = useRef();
  const wasNearBottom = useRef(true);
  const previousLast = useRef(null);
  const [focusVersion, setFocusVersion] = useState(0);
  useEffect(() => {
    const focus = () => setFocusVersion((value) => value + 1);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (document.visibilityState !== "visible" || !document.hasFocus())
          return;
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => markVisible(entry.target.dataset.messageId));
      },
      { root: feed.current, threshold: 0.7 },
    );
    feed.current
      ?.querySelectorAll("[data-message-id]")
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [messages, markVisible, focusVersion]);
  useEffect(() => {
    const last = messages.at(-1)?.id;
    if (last !== previousLast.current && wasNearBottom.current)
      bottom.current?.scrollIntoView({ block: "end" });
    previousLast.current = last;
  }, [messages]);
  return (
    <div
      className="message-feed"
      ref={feed}
      onScroll={() => {
        const node = feed.current;
        wasNearBottom.current =
          node.scrollHeight - node.scrollTop - node.clientHeight < 120;
      }}
    >
      <div className="room-intro">
        <span className="intro-hash">#</span>
        <h2>A little hello goes a long way.</h2>
        <p>
          This is the beginning of <strong>#{room.name}</strong>.<br />
          {room.description}
        </p>
        <span className="intro-chip">GOOD PEOPLE. GOOD CONVERSATIONS.</span>
      </div>
      {older && (
        <button
          className="load-older"
          disabled={loadingOlder}
          onClick={async () => {
            const height = feed.current.scrollHeight;
            await loadOlder();
            requestAnimationFrame(() => {
              if (feed.current)
                feed.current.scrollTop += feed.current.scrollHeight - height;
            });
          }}
        >
          ↑ {loadingOlder ? "Loading…" : "Load earlier messages"}
        </button>
      )}
      <div className="day-divider">
        <span>
          {messages.length
            ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                new Date(messages[0].createdAt),
              )
            : "Start the conversation"}
        </span>
      </div>
      {messages.map((message, index) => {
        const own = message.author.id === user.id;
        const seen = message.receipts.filter(
          (receipt) => receipt.user.id !== user.id,
        );
        const previous = messages[index - 1];
        const newDay =
          previous &&
          new Date(previous.createdAt).toDateString() !==
            new Date(message.createdAt).toDateString();
        return (
          <div key={message.id}>
            {newDay && (
              <div className="day-divider">
                <span>
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                  }).format(new Date(message.createdAt))}
                </span>
              </div>
            )}
            <article
              className={`message ${own ? "own" : ""}`}
              data-message-id={message.id}
            >
              <Avatar user={message.author} />
              <div className="message-main">
                <div className="message-meta">
                  <strong>{message.author.name}</strong>
                  {own && <span className="you-tag">you</span>}
                  <time dateTime={message.createdAt}>
                    {clock(message.createdAt)}
                  </time>
                </div>
                <div className="message-content">
                  {message.content
                    .split(/(@[a-z][a-z0-9_]{2,29})/gi)
                    .map((part, i) =>
                      part.startsWith("@") ? <mark key={i}>{part}</mark> : part,
                    )}
                </div>
                <div className="receipt">
                  {own ? (
                    seen.length ? (
                      <span
                        title={seen.map((item) => item.user.name).join(", ")}
                      >
                        ✓✓ Seen by{" "}
                        {seen
                          .map((item) => item.user.name.split(" ")[0])
                          .join(", ")}
                      </span>
                    ) : (
                      <span>✓ Saved</span>
                    )
                  ) : message.receipts.length > 0 ? (
                    <span
                      title={message.receipts
                        .map((item) => item.user.name)
                        .join(", ")}
                    >
                      Seen by {message.receipts.length}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        );
      })}
      <div className="typing-line" aria-live="polite">
        {typing.length > 0 && (
          <>
            <span className="typing-dots">•••</span>
            {typing.map((item) => item.user.name.split(" ")[0]).join(", ")}{" "}
            {typing.length === 1 ? "is" : "are"} typing
          </>
        )}
      </div>
      <div ref={bottom} />
    </div>
  );
}
