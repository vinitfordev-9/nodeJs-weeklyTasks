import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { api } from "./services/api.js";
import { useSocket } from "./hooks/useSocket.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Conversation from "./components/Conversation.jsx";
import {
  BrowseRooms,
  CreateRoom,
  Notifications,
} from "./components/RoomDialogs.jsx";
import Modal from "./components/Modal.jsx";
function Workspace() {
  const { user, logout } = useAuth();
  const { socket, connection, epoch } = useSocket(user.id);
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const refresh = useCallback(async () => {
    const [result, notifications] = await Promise.all([
      api("/rooms?limit=50"),
      api("/notifications"),
    ]);
    setRooms(result.data);
    setPage(1);
    setHasMore(result.meta.totalPages > 1);
    setItems(notifications.data);
    return result.data;
  }, []);
  useEffect(() => {
    let active = true;
    refresh()
      .then((data) => {
        if (active)
          setSelected(
            data.find(
              (room) => room.joined && room.name === "the-common-room",
            ) ||
              data.find((room) => room.joined) ||
              null,
          );
      })
      .catch((error) => {
        if (active) setToast(error.message);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!socket) return;
    const update = () =>
      api("/notifications")
        .then((result) => setItems(result.data))
        .catch(() => {});
    const left = ({ roomId }) => {
      setSelected((current) => (current?.id === roomId ? null : current));
      refresh().catch(() => {});
    };
    socket.on("notification:new", update);
    socket.on("room:left", left);
    update();
    const timer = setInterval(update, 15000);
    return () => {
      socket.off("notification:new", update);
      socket.off("room:left", left);
      clearInterval(timer);
    };
  }, [socket, epoch, refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function join(room) {
    setBusy(true);
    try {
      if (!room.joined) await api(`/rooms/${room.id}/join`, { method: "POST" });
      await refresh();
      setSelected({ ...room, joined: true });
      setModal(null);
      setMobile(false);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function leave() {
    setBusy(true);
    try {
      await api(`/rooms/${selected.id}/leave`, { method: "POST" });
      setSelected(null);
      setModal(null);
      await refresh();
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="workspace-app">
      <Sidebar
        user={user}
        rooms={rooms}
        selected={selected}
        select={setSelected}
        create={() => setModal("create")}
        browse={() => setModal("browse")}
        notifications={() => setModal("notifications")}
        notifyCount={items.filter((item) => !item.read).length}
        logout={async () => {
          try {
            await logout();
          } catch (error) {
            setToast(error.message);
          }
        }}
        mobile={mobile}
        closeMobile={() => setMobile(false)}
      />
      <div className="main-shell">
        <div className="topbar">
          <span>
            YOUR EVERYDAY CONNECTION <span>✦</span>
          </span>
          <div>
            <i
              className={connection === "connected" ? "green-dot" : "amber-dot"}
            />
            {connection === "connected" ? "Live and connected" : "Reconnecting"}
            <span className="topbar-divider">/</span>
            <span>{user.name.split(" ")[0]}’s workspace</span>
          </div>
        </div>
        {selected ? (
          <Conversation
            key={selected.id}
            room={selected}
            user={user}
            socket={socket}
            connection={connection}
            epoch={epoch}
            leave={() => setModal("leave")}
            showRooms={() => setMobile(true)}
          />
        ) : (
          <div className="welcome-empty">
            <span className="big-spark">✳</span>
            <span className="eyebrow">THERE’S A SEAT FOR YOU HERE</span>
            <h1>
              A room full
              <br />
              of possibilities.
            </h1>
            <p>
              {initializing
                ? "Opening your workspace…"
                : "Join a conversation, find your people, and share what’s on your mind."}
            </p>
            <button
              className="button primary"
              onClick={() => setModal("browse")}
            >
              Find your room →
            </button>
            <button className="button" onClick={() => setModal("create")}>
              Create a room
            </button>
          </div>
        )}
      </div>
      {modal === "create" && (
        <CreateRoom
          close={() => setModal(null)}
          created={async (room) => {
            await refresh();
            setSelected({ ...room, joined: true });
          }}
        />
      )}{" "}
      {modal === "browse" && (
        <BrowseRooms
          rooms={rooms}
          close={() => setModal(null)}
          join={join}
          hasMore={hasMore}
          loading={busy}
          nextPage={async () => {
            setBusy(true);
            try {
              const result = await api(`/rooms?page=${page + 1}&limit=50`);
              setRooms((current) => [
                ...new Map(
                  [...current, ...result.data].map((room) => [room.id, room]),
                ).values(),
              ]);
              setPage(page + 1);
              setHasMore(page + 1 < result.meta.totalPages);
            } catch (error) {
              setToast(error.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}{" "}
      {modal === "notifications" && (
        <Notifications
          items={items}
          close={() => setModal(null)}
          open={async (item) => {
            try {
              await api(`/notifications/${item.id}/read`, { method: "PATCH" });
              await refresh();
              const room = rooms.find(
                (room) => room.id === item.message.roomId,
              );
              if (room) await join(room);
              else {
                setModal("browse");
                setToast("Find and join this room to view its messages.");
              }
            } catch (error) {
              setToast(error.message);
            }
          }}
        />
      )}{" "}
      {modal === "leave" && (
        <Modal title="Step out of this room?" onClose={() => setModal(null)}>
          <p className="muted">
            Your messages stay in the history. You can rejoin this public room
            whenever you like.
          </p>
          <div className="actions">
            <button className="button" onClick={() => setModal(null)}>
              Stay here
            </button>
            <button className="button primary" disabled={busy} onClick={leave}>
              Leave room
            </button>
          </div>
        </Modal>
      )}
      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </div>
  );
}
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading full">Opening Commonroom…</div>;
  return user ? <Workspace key={user.id} /> : <AuthScreen />;
}
