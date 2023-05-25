import kv from "~/kv.js";

const pagesPrefix = "pages";
const publishedPagesPrefix = "published_pages";

export async function publishPage(id) {}

export async function unpublishPage(id) {
  // Update primary record
  // Remove published record
}

export async function createPage(pageData) {
  const page = {
    ...pageData,
    id: crypto.randomUUID(),
  };
  const key = [pagesPrefix, page.id];

  let res = { ok: false };
  res = await kv.atomic()
    // This checks that the key doesn’t already exist
    .check({ key, timestamp: null })
    .set(key, page)
    .commit();

  if (!res.ok) throw "Page with ID already exists";

  return page.id;
}

export async function updatePage(page) {
  const key = [pagesPrefix, page.id];

  const getRes = await kv.get(key);

  const res = await kv.atomic()
    .check(getRes)
    .mutate({ key, type: "set", value: page })
    .commit();

  if (!res.ok) throw new Error("Cannot update page.");
}

export async function getPage(id) {
  const res = await kv.get(["pages", id]);
  return res.value;
}

// TODO: update this
export async function getPageBySlug(slug) {
  const res = await kv.get(["pages_by_slug", slug]);
  return res.value;
}

export async function deletePage(id) {
  let res = { ok: false };
  while (!res.ok) {
    const getRes = await kv.get(["pages", id]);
    if (getRes.value === null) return;
    res = await kv.atomic()
      .check(getRes)
      .delete(["pages", id])
      //.delete(["pages_by_slug", res.value.slug])
      .commit();
  }
}
