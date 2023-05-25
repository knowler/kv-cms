import { deletePage } from "~/models/page.js";

export async function POST({params}) {
  await deletePage(params.itemId);

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${params.collection}`,
    },
  });
}
