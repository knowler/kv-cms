import { Page } from "~/models/page.js";

export async function POST({params}) {
  const page = await Page.get(params.itemId);

  await page.delete();

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${params.collection}`,
    },
  });
}
