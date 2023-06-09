import { Page } from "~/models/page.js";

const singularOfCollection = {
  posts: 'post',
  pages: 'page',
}

export async function GET({params, view}) {
  return view("sudo/[collection].new", {
    title: `Create new ${singularOfCollection[params.collection]}`
  });
}

export async function POST({request, params}) {
  const formData = await request.formData();

  const page = Page.create();
  page.title = formData.get("title");

  await page.save();

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${params.collection}/${page.id}`,
    },
  });
}
