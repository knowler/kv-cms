import kv from "~/kv.js";

export async function insertPage(page) {
  const primaryKey = ["pages", page.id];
  const bySlugKey = ["pages_by_slug", page.slug];

  const res = await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: bySlugKey, versionstamp: null })
    .set(primaryKey, page)
    .set(bySlugKey, page)
    .commit();

  if (!res.ok) throw "Page with slug doesn’t exist."
}

export async function getPage(id) {
  const res = await kv.get(["pages", id]);
  return res.value;
}

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
      .delete(["pages_by_slug", res.value.slug])
      .commit();
  }
}
