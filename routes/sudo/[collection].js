import { Page } from "~/models/page.js";

export async function GET({params, view}) {
  const {collection} = params;

  const collectionItems = await Page.list({limit: 10});

  return view("sudo/[collection]", {
    title: collection,
    collection,
    collectionItems,
  });
}
