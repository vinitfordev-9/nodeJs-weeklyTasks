import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getToken, setToken } from "../services/api.js";
export function useSocket(userId) {
  const [socket, setSocket] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const client = io({
      transports: ["websocket"],
      auth: { token: getToken() },
      autoConnect: false,
    });
    setSocket(client);
    client.on("connect", () => {
      setConnection("connected");
      setEpoch((value) => value + 1);
    });
    client.on("disconnect", () => setConnection("offline"));
    client.on("connect_error", (error) => {
      setConnection("offline");
      if (error.data?.code === "AUTHENTICATION_REQUIRED") {
        setToken(null);
        window.dispatchEvent(new Event("session-expired"));
      }
    });
    client.connect();
    return () => {
      client.disconnect();
      client.removeAllListeners();
    };
  }, [userId]);
  return { socket, connection, epoch };
}
