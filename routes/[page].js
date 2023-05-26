import { Page } from "~/models/page.js";

export async function GET({view, params}) {
  const page = await Page.getPublished(params.page);

  if (!page || !page.published) throw new Response("Not found", {status: 404});

  return view("[page]", {
    title: page.title,
    page,
  });
}

