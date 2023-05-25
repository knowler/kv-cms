import kv from "~/kv.js";
import { getPage, updatePage } from "~/models/page.js";

const singularForCollection = {
  pages: 'page',
  posts: 'post',
};

export async function GET({params, view}) {
  const {collection, itemId} = params;

  const res = await kv.get([collection, itemId]);

  if (!res.value) throw new Response('Not found.', { status: 404 });

  const collectionItem = res.value;

  return view("sudo/[collection].[itemId]", {
    title: `Overview of “${collectionItem.title}” ${singularForCollection[collection]}`,
    collectionItem,
  });
}

export async function POST({request, params}) {
  const page = await getPage(params.itemId);
  const formData = await request.formData();

  await updatePage({
    ...page,
    title: formData.get('title'),
    html: formData.get('html'),
  });

  return new Response(null, {
    status: 303,
    headers: {
      location: `/sudo/${params.collection}/${params.itemId}`,
    },
  })
}
