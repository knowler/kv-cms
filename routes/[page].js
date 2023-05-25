import { getPageBySlug } from "~/models/page.js";

export async function GET({view, params}) {
  return view("[page]", { page: await getPageBySlug(params.page) });
}

