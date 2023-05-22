import { getPageBySlug } from "~/models/page.js";

export async function GET({view, params}) {
  const {page: slug} = params;

  const page = await getPageBySlug(slug);

  return view(
    "[page]",
    {
      currentPath: `/${page}`,
      ...page,
    },
  );
}

