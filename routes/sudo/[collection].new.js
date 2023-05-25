import { createPage } from "~/models/page.js";

const singularOfCollection = {
  posts: 'post',
  pages: 'page',
}

export async function GET({params, view}) {
  return view("sudo/[collection].new", {
    title: `New ${singularOfCollection[params.collection]}`
  });
}

export async function POST({request, params}) {
  const formData = await request.formData();

  const pageId = await createPage({
    slug: formData.get("slug"),
    title: formData.get("title"),
  });

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${params.collection}/${pageId}`,
    },
  });
}
