import kv from "~/kv.js";

export function GET({ view }) {
  return view(
    "webmention",
    {
      title: 'Webmention',
      currentPath: "/webmention",
    },
  );
}

export async function POST({ request }) {
  const formData = await request.formData();
  const source = formData.get("source");
  const target = formData.get("target");

  const id = crypto.randomUUID();

  await kv.set(["webmention", id], { source, target });

  return new Response(null, { status: 303, headers: { location: "/webmention" } });
}
