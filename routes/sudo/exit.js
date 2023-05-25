import { setCookie } from "std/http";
import { commitSession, getSession } from "~/sessions.js";

export async function GET({request}) {
  const session = await getSession(request);
  const headers = new Headers();

  session.set('authenticated', false);
  headers.set('location', '/');

  setCookie(
    headers,
    await commitSession(session),
  );

  return new Response(null, { status: 303, headers });
}
