import { authOrLogin } from "~/auth.js";
import kv from "~/kv.js";

export async function GET({request, params, view}) {
  await authOrLogin(request);
  const {collection} = params;

  const iter = await kv.list({ prefix: [collection] }, { limit: 10 });
  const collectionItems = [];
  for await (const res of iter) collectionItems.push(res.value);

  return view("sudo.[collection]", {
    currentPath: `/sudo/${collection}`,
    title: collection,
    collection,
    collectionItems,
  });
}
