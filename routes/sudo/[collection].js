import kv from "~/kv.js";

export async function GET({params, view}) {
  const {collection} = params;

  const iter = await kv.list({ prefix: [collection] }, { limit: 10 });
  const collectionItems = [];
  for await (const res of iter) collectionItems.push(res.value);

  return view("sudo/[collection]", {
    title: collection,
    collection,
    collectionItems,
  });
}
