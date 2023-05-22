import { getSession } from "./sessions.js";

export async function authOrLogin(request) {
  const session = await getSession(request);
  const isAuthenticated = session.get("authenticated");
  const headers = new Headers();

  if (!isAuthenticated) {
    headers.set("location", "/sudo");
    throw new Response(null, {
      status: 303,
      headers,
    })
  }
}
