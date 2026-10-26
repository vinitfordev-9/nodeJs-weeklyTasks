import { useEffect, useRef, useState } from "react";
import { emit } from "../services/api.js";
import Icon from "./Icon.jsx";
export default function Composer({ room, user, socket, connection, send }) {
  const key = `commonroom-draft:${user.id}:${room.id}`;
  const [text, setText] = useState(() => sessionStorage.getItem(key) || "");
  const [pending, setPending] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`${key}:pending`));
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastTyping = useRef(0);
  const timer = useRef();
  useEffect(() => {
    sessionStorage.setItem(key, text);
  }, [key, text]);
  useEffect(() => {
    if (pending)
      sessionStorage.setItem(`${key}:pending`, JSON.stringify(pending));
    else sessionStorage.removeItem(`${key}:pending`);
  }, [key, pending]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (socket?.connected)
        emit(socket, "typing:set", { roomId: room.id, typing: false }).catch(
          () => {},
        );
    },
    [room.id, socket],
  );
  function change(value) {
    setText(value);
    if (Date.now() - lastTyping.current > 1500 && socket?.connected) {
      lastTyping.current = Date.now();
      emit(socket, "typing:set", { roomId: room.id, typing: true }).catch(
        () => {},
      );
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (socket?.connected)
        emit(socket, "typing:set", { roomId: room.id, typing: false }).catch(
          () => {},
        );
    }, 1800);
  }
  async function submit() {
    const input = pending || {
      content: text.trim(),
      clientMessageId: crypto.randomUUID(),
    };
    if (!input.content || busy) return;
    setBusy(true);
    setPending(input);
    setError("");
    try {
      await send(input.content, input.clientMessageId);
      setText("");
      setPending(null);
      if (socket?.connected)
        emit(socket, "typing:set", { roomId: room.id, typing: false }).catch(
          () => {},
        );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="composer-area">
      <div className="composer">
        <textarea
          aria-label={`Message ${room.name}`}
          placeholder={`Message #${room.name}`}
          maxLength={4000}
          value={pending ? pending.content : text}
          disabled={busy || !!pending}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <div className="composer-tools">
          <span>
            <b>@</b> Mention someone by their handle
          </span>
          <button
            className="send-button"
            aria-label={pending ? "Retry message" : "Send message"}
            disabled={
              busy ||
              connection !== "connected" ||
              !(pending?.content || text.trim())
            }
            onClick={submit}
          >
            {busy ? "Sending…" : pending ? "Retry" : "Send"}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
      {error && (
        <div className="error composer-error" role="alert">
          {error} Your message is kept here for a safe retry.
        </div>
      )}
      <div className="composer-hint">
        <span>↵ to send · Shift + ↵ for a new line</span>
        <span>
          {connection === "connected"
            ? "● Connected, and in good company"
            : "○ Reconnecting… your draft is safe"}
        </span>
      </div>
    </div>
  );
}
