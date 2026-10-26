export const getToken = () => sessionStorage.getItem("commonroom-token");
export const setToken = (token) =>
  token
    ? sessionStorage.setItem("commonroom-token", token)
    : sessionStorage.removeItem("commonroom-token");
export async function api(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      headers: {
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
        ...(body && { "Content-Type": "application/json" }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("We couldn’t reach the server. Please try again.");
  }
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && result.code === "AUTHENTICATION_REQUIRED") {
      setToken(null);
      window.dispatchEvent(new Event("session-expired"));
    }
    const error = new Error(result.message);
    error.details = result.errors;
    throw error;
  }
  return result;
}
export function emit(socket, event, data) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected)
      return reject(
        new Error("You’re offline. Reconnect, then retry your message."),
      );
    socket.timeout(7000).emit(event, data, (error, result) => {
      if (error)
        return reject(
          new Error(
            "Confirmation timed out. Retry safely using the same message ID.",
          ),
        );
      if (!result?.success)
        return reject(
          new Error(result?.message || "We couldn’t complete that action."),
        );
      resolve(result.data);
    });
  });
}
