import { authOrLogin } from "~/auth.js";
import kv from "~/kv.js";

export async function POST({request, params}) {
  await authOrLogin(request);

  try {
    await kv.delete(["webmention", params.webmentionId]);
    return new Response(null, {
      status: 303,
      headers: {
        location: "/sudo/webmentions",
      },
    });
  } catch (error) {
    throw error;
  }
}
