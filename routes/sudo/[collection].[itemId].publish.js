import { Page } from "~/models/page.js";

export async function GET({params, view}) {
  const page = await Page.get(params.itemId);

  if (!page) throw new Response("Not found", { status: 404 });

  return view(
    "sudo/[collection].[itemId].publish",
    { page }
  );
}

export async function POST({request, params}) {
  const formData = await request.formData();

  const page = await Page.get(params.itemId);

  page.published = true;
  page.title = formData.get('title');
  page.slug = formData.get('slug');

  await page.save();

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${params.collection}/${params.itemId}`,
    },
  });
}
