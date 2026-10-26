const TOKEN_KEY = "roleco-token";
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export function saveToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export async function api(
  path,
  { method = "GET", body, binary = false, signal } = {},
) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      signal,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "We could not reach the server. Check your connection and try again.",
    );
  }
  if (binary && response.ok) return response.blob();
  const result = await response.json();
  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      result.code === "AUTHENTICATION_REQUIRED"
    ) {
      saveToken(null);
      window.dispatchEvent(new Event("session-expired"));
    }
    const error = new Error(result.message);
    error.details = result.errors;
    error.code = result.code;
    throw error;
  }
  return result;
}
export async function downloadResume(id) {
  const blob = await api(`/applications/${id}/resume`, { binary: true });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume.pdf";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
