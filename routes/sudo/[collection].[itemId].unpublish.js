import { Page } from "~/models/page.js";

export async function POST({params}) {
  const page = await Page.get(params.itemId);

  page.published = false;

  await page.save();

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${params.collection}/${params.itemId}`,
    },
  });
}
