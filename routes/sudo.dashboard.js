import { authOrLogin } from "~/auth.js";

export async function GET({request, view}) {
  await authOrLogin(request);

  return view("sudo.dashboard", {
    currentPath: "/sudo/dashboard",
  });
}
