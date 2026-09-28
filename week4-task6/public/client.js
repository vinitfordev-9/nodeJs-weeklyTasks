const $ = (id) => document.getElementById(id);
let socket;
let token;
let total = 0;
let loginVersion = 0;
function setStatus(message) { $("status").textContent = message; }
function dispose() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.io.removeAllListeners();
  socket.disconnect();
  socket = null;
}
function connect() {
  dispose();
  setStatus("Connecting…");
  socket = io({ auth: { token }, reconnectionAttempts: 5, reconnectionDelay: 1000 });
  socket.on("session:ready", ({ userId }) => setStatus(`Connected · Account #${userId} · Listening for updates`));
  socket.on("connect", () => { $("disconnect").disabled = false; });
  socket.on("disconnect", (reason) => {
    $("disconnect").disabled = true;
    setStatus(reason === "io server disconnect" ? "Session ended. Log in again to continue." : "Disconnected · Offline updates are not replayed");
  });
  socket.on("connect_error", (error) => setStatus(`Connection failed: ${error.message}`));
  socket.io.on("reconnect_attempt", (attempt) => setStatus(`Reconnecting… attempt ${attempt}/5`));
  socket.io.on("reconnect_failed", () => setStatus("Unable to reconnect. Use Reconnect to retry."));
  // Register once, outside connect, so retries never multiply listeners.
  socket.on("order:changed", (event) => {
    const row = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = `Order #${event.orderId} ${event.action} · ${event.status || "No status"}`;
    const detail = document.createElement("small");
    detail.textContent = `Total: ${event.totalAmount ?? "—"} · ${new Date(event.occurredAt).toLocaleTimeString()}`;
    row.append(title, detail);
    $("events").prepend(row);
    if ($("events").children.length > 50) $("events").lastChild.remove();
    $("empty").hidden = true;
    $("count").textContent = ++total;
  });
}
$("login").addEventListener("submit", async (event) => {
  event.preventDefault();
  const version = ++loginVersion;
  dispose();
  token = null;
  $("reconnect").disabled = $("disconnect").disabled = true;
  $("events").replaceChildren();
  $("count").textContent = total = 0;
  $("empty").hidden = false;
  setStatus("Signing in…");
  try {
    const response = await fetch("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: $("email").value, password: $("password").value }) });
    const result = await response.json();
    if (version !== loginVersion) return;
    if (!response.ok) throw new Error(result.message || "Login failed");
    token = result.token;
    $("password").value = "";
    $("reconnect").disabled = $("logout").disabled = false;
    connect();
  } catch (error) { if (version === loginVersion) setStatus(error.message); }
});
$("disconnect").onclick = () => { dispose(); $("disconnect").disabled = true; setStatus("Disconnected · Connection closed cleanly"); };
$("reconnect").onclick = connect;
$("logout").onclick = () => {
  ++loginVersion;
  dispose(); token = null;
  $("events").replaceChildren(); $("count").textContent = total = 0; $("empty").hidden = false;
  $("reconnect").disabled = $("disconnect").disabled = $("logout").disabled = true;
  setStatus("Logged out");
};
window.addEventListener("pagehide", dispose);
