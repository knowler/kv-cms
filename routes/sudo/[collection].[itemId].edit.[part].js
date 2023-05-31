import { Page } from "~/models/page.js";

export async function GET({params, view}) {
  const {collection, itemId, part} = params
  const page = await Page.get(itemId);

  return view("sudo/[collection].[itemId].edit.[part]", {
    title: `Update ${part}`,
    part,
    backLink: `/sudo/${collection}/${itemId}`,
    currentValue: page[part],
  });
}

export async function POST({request, params}) {
  const {collection, itemId, part} = params;
  const formData = await request.formData();

  const page = await Page.get(itemId);

  page[part] = formData.get(part);

  page.save();

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${collection}/${itemId}`,
    },
  });
}
