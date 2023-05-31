import { titleCase } from "https://deno.land/x/case@2.1.1/mod.ts";
import { Page } from "~/models/page.js";

export async function GET({params, view}) {
  const {collection} = params;

  const collectionItems = await Page.list({limit: 10});

  if (collection === "posts") {
    return view ("sudo/unimplemented", {
      title: "Unimplemented",
    });
  }

  return view("sudo/[collection]", {
    title: titleCase(Page.MULTIPLE),
    collection,
    collectionItems,
  });
}
