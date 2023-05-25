import { setCookie } from "std/http";
import { commitSession, getSession } from "~/sessions.js";

export async function GET({request, view}) {
  const session = await getSession(request);
  const isAuthenticated = session.get("authenticated");

  if (isAuthenticated) {
    return new Response(null, {
      status: 302,
      headers: {
        location: "/sudo/dashboard",
      },
    });
  }

  const errors = session.get("errors");
  const headers = new Headers();

  setCookie(
    headers,
    await commitSession(session),
  );

  return view("sudo/index", {
    title: "Sign In",
    errors,
  }, { headers });
}

export async function POST({request}) {
  const session = await getSession(request);
  const isAuthenticated = session.get("authenticated");

  if (isAuthenticated) {
    return new Response(null, {
      status: 302,
      headers: {
        location: "/sudo/dashboard",
      },
    });
  }

  const formData = await request.formData();
  const password = formData.get("password");

  const headers = new Headers();

  if (password && password === Deno.env.get("PASSWORD")) {
    headers.set("location", "/sudo/dashboard");
    session.set("authenticated", true);
  } else {
    headers.set("location", "/sudo");
    session.flash("errors", "Password is incorrect.");
  }

  setCookie(
    headers,
    await commitSession(session),
  );

  return new Response(null, {
    status: 303,
    headers,
  });
}
