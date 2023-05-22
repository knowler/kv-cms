import { authOrLogin } from "~/auth.js";
import kv from "~/kv.js";

export async function GET({request, params, view}) {
  await authOrLogin(request);

  const res = await kv.get(["webmention", params.webmentionId]);

  return view("sudo.webmentions.[webmentionId]", {
    webmention: {
      id: params.webmentionId,
      ...res.value,
    }
  });
}
