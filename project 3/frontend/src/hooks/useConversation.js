import { useCallback, useEffect, useRef, useState } from "react";
import { api, emit } from "../services/api.js";
function merge(current, incoming) {
  const records = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    const previous = records.get(message.id);
    records.set(message.id, {
      ...message,
      receipts: [
        ...new Map(
          [...(previous?.receipts || []), ...message.receipts].map(
            (receipt) => [receipt.user.id, receipt],
          ),
        ).values(),
      ],
    });
  }
  return [...records.values()].sort((a, b) =>
    BigInt(a.sequence) < BigInt(b.sequence) ? -1 : 1,
  );
}
export function useConversation(roomId, socket, epoch) {
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState([]);
  const [typing, setTyping] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [older, setOlder] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const generation = useRef(0);
  const readQueue = useRef(new Set());
  const confirmedReads = useRef(new Set());
  const watermark = useRef(null);
  useEffect(() => {
    setMessages([]);
    setPresence([]);
    setTyping({});
    setError("");
    setLoading(true);
    setOlder(null);
    watermark.current = null;
    readQueue.current.clear();
    confirmedReads.current.clear();
  }, [roomId]);
  useEffect(() => {
    if (!roomId || !socket?.connected) return;
    const version = ++generation.current;
    let active = true,
      syncing = false;
    const append = (message) => {
      if (message.roomId === roomId)
        setMessages((current) => merge(current, [message]));
    };
    const receipt = (payload) => {
      if (payload.roomId !== roomId) return;
      setMessages((current) =>
        current.map((message) => {
          const added = payload.receipts.filter(
            (item) => item.messageId === message.id,
          );
          return added.length
            ? {
                ...message,
                receipts: [
                  ...new Map(
                    [...message.receipts, ...added].map((item) => [
                      item.user.id,
                      item,
                    ]),
                  ).values(),
                ],
              }
            : message;
        }),
      );
    };
    const online = (payload) => {
      if (payload.roomId === roomId) setPresence(payload.users);
    };
    const typingEvent = (payload) => {
      if (payload.roomId === roomId)
        setTyping((current) => ({
          ...current,
          [payload.user.id]: payload.typing ? payload : null,
        }));
    };
    socket.on("message:new", append);
    socket.on("message:read", receipt);
    socket.on("room:presence", online);
    socket.on("typing:update", typingEvent);
    async function sync() {
      if (!active || syncing || !socket.connected) return;
      syncing = true;
      try {
        const online = await emit(socket, "room:watch", { roomId });
        if (!active) return;
        setPresence(online.users);
        let more;
        do {
          const cursor = watermark.current;
          const result = await api(
            `/rooms/${roomId}/messages?limit=50${cursor ? `&after=${cursor}` : ""}`,
          );
          if (!active || generation.current !== version) return;
          setMessages((current) => merge(current, result.data));
          if (!cursor)
            setOlder(result.meta.hasMore ? result.meta.nextCursor : null);
          if (result.data.length)
            watermark.current = result.data.at(-1).sequence;
          more = cursor && result.meta.hasMore;
        } while (more);
        // Receipts can change without new messages, including while this tab was offline.
        const recent = await api(`/rooms/${roomId}/messages?limit=50`);
        if (!active || generation.current !== version) return;
        setMessages((current) => merge(current, recent.data));
        setError("");
      } catch (failure) {
        if (active) setError(failure.message);
      } finally {
        syncing = false;
        if (active) setLoading(false);
      }
    }
    sync();
    const timer = setInterval(sync, 15000);
    const expire = setInterval(
      () =>
        setTyping((current) =>
          Object.fromEntries(
            Object.entries(current).filter(
              ([, value]) => value && value.expiresAt > Date.now(),
            ),
          ),
        ),
      1000,
    );
    const readTimer = setInterval(async () => {
      if (
        document.visibilityState !== "visible" ||
        !document.hasFocus() ||
        !socket.connected
      )
        return;
      const ids = [...readQueue.current]
        .filter((id) => !confirmedReads.current.has(id))
        .slice(0, 50);
      if (!ids.length) return;
      ids.forEach((id) => readQueue.current.delete(id));
      try {
        const receipts = await emit(socket, "message:read", {
          roomId,
          messageIds: ids,
        });
        if (!active) return;
        ids.forEach((id) => confirmedReads.current.add(id));
        receipt({ roomId, receipts });
      } catch {
        if (active) ids.forEach((id) => readQueue.current.add(id));
      }
    }, 700);
    return () => {
      active = false;
      clearInterval(timer);
      clearInterval(expire);
      clearInterval(readTimer);
      socket.off("message:new", append);
      socket.off("message:read", receipt);
      socket.off("room:presence", online);
      socket.off("typing:update", typingEvent);
    };
  }, [roomId, socket, epoch]);
  const markVisible = useCallback((id) => readQueue.current.add(id), []);
  async function loadOlder() {
    if (!older || loadingOlder) return;
    const version = generation.current;
    setLoadingOlder(true);
    try {
      const result = await api(
        `/rooms/${roomId}/messages?limit=30&before=${older}`,
      );
      if (generation.current !== version) return;
      setMessages((current) => merge(result.data, current));
      setOlder(result.meta.hasMore ? result.meta.nextCursor : null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoadingOlder(false);
    }
  }
  async function send(content, clientMessageId) {
    const result = await emit(socket, "message:send", {
      roomId,
      content,
      clientMessageId,
    });
    setMessages((current) => merge(current, [result]));
    return result;
  }
  return {
    messages,
    presence,
    typing: Object.values(typing).filter(Boolean),
    error,
    loading,
    older,
    loadingOlder,
    loadOlder,
    send,
    markVisible,
  };
}
