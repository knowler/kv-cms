import kv from "~/kv.js";

export async function GET({params, view}) {
  const res = await kv.get(["webmention", params.webmentionId]);

  return view("sudo/webmentions.[webmentionId]", {
    webmention: {
      id: params.webmentionId,
      ...res.value,
    }
  });
}
