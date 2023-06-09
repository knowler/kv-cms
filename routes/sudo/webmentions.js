import kv from "~/kv.js";

export async function GET({view}) {
  const iter = await kv.list({ prefix: ["webmention"] }, { limit: 10 });
  const webmentions = [];
  for await (const res of iter) {
    webmentions.push({
      id: res.key[1],
      ...res.value,
    });
  }

  return view("sudo/webmentions", {
    title: "Webmentions",
    webmentions,
  });
}
