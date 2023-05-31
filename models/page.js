import kv from "~/kv.js";

export class Page {
  static SINGULAR = "page";
  static MULTIPLE = "pages";

  static prefix = "pages";
  static publishedPrefix = "published_pages";

  #data = new Map();
  #isNewPage;

  get #pageKey() { return [Page.prefix, this.id]; }
  get #publishedPageKey() { return [Page.publishedPrefix, this.slug]; }

  get id() { return this.#data.get('id'); }
  set id(value) { this.#data.set('id', value); }

  get title() { return this.#data.get('title'); }
  set title(value) { this.#data.set('title', value); }

  get description() { return this.#data.get('description'); }
  set description(value) { this.#data.set('description', value); }

  get slug() { return this.#data.get('slug'); }
  set slug(value) { this.#data.set('slug', value); }

  get html() { return this.#data.get('html'); }
  set html(value) { this.#data.set('html', value); }

  get published() { return this.#data.get('published'); }
  set published(value) { this.#data.set('published', value); }

  get createdAt() { return this.#data.get('createdAt'); }
  set createdAt(value) { this.#data.set('createdAt', value); }

  get modifiedAt() { return this.#data.get('modifiedAt'); }
  set modifiedAt(value) { this.#data.set('modifiedAt', value); }

  get publishedAt() { return this.#data.get('publishedAt'); }
  set publishedAt(value) { this.#data.set('publishedAt', value); }

  constructor(id, data) {
    this.#isNewPage = !id;
    this.id = id ?? crypto.randomUUID();

    if (data) {
      for (const [key, datum] of Object.entries(data)) {
        this[key] = datum;
      }
    }
  }

  static create() {
    const page = new Page();

    return page;
  }

  static async get(id) {
    const res = await kv.get([Page.prefix, id]);
    if (res.versionstamp === null) throw "Cannot find page";

    const page = new Page(id);
    for (const [prop, value] of Object.entries(res.value)) {
      page[prop] = value;
    }

    return page;
  }

  static async getPublished(slug) {
    const res = await kv.get([Page.publishedPrefix, slug]);
    if (res.versionstamp === null) throw "Cannot find published page";

    const page = new Page(res.value.id);
    for (const [prop, value] of Object.entries(res.value)) {
      page[prop] = value;
    }

    return page;
  }

  static async list() {
    const iter = await kv.list({ prefix: [Page.prefix] });
    const pages = [];

    for await (const res of iter) {
      pages.push(new Page(res.value.id, res.value));
    }

    return pages;
  }

  async save() {
    if (this.#isNewPage) await this.#saveNewPage();
    else await this.#updatePage();
  }

  async delete() {
    const getRes = await kv.get(this.#pageKey);
    if (getRes.versionstamp === null) throw "Cannot delete page which doesn’t exist";
    const wasPublished = getRes.value.published;

    const res = kv.atomic().check(getRes).delete(this.#pageKey)

    if (wasPublished) res.delete(this.#publishedPageKey)

    await res.commit();
  }

  async #saveNewPage() {
    this.createdAt = Date.now();
    if (this.published) this.publishedAt = this.createdAt;

    let res;
    const page = Object.fromEntries(this.#data);

    if (this.published) {
      // TODO: don’t throw
      if (!this.slug) throw "Cannot publish page without slug";

      res = await kv.atomic()
        .check({ key: this.#pageKey, versionstamp: null })
        .check({ key: this.#publishedPageKey, versiontamp: null })
        .set(this.#pageKey, page)
        .set(this.#publishedPageKey, page)
        .commit();
    } else {
      res = await kv.atomic()
        .check({ key: this.#pageKey, versionstamp: null })
        .set(this.#pageKey, page)
        .commit();
    }

    if (!res.ok) {
      this.publishedAt = this.createdAt = undefined;
      throw "Page already exists";
    }

    this.#isNewPage = false;
  }

  async #updatePage() {
    const getRes = await kv.get(this.#pageKey);

    if (!getRes.versionstamp) throw "Page does not exists";

    this.modifiedAt = Date.now();
    const wasPublished = getRes.value.published;

    const res = kv.atomic().check(getRes);

    const needsToBeUnpublished = wasPublished && !this.published;

    if (needsToBeUnpublished) {
      this.publishedAt = undefined;
      res.delete(this.#publishedPageKey)
    } 

    const needsToBePublished = !wasPublished && this.published;
    if (needsToBePublished) this.publishedAt = this.modifiedAt;

    const pageData = Object.fromEntries(this.#data);

    res.set(this.#pageKey, pageData);

    if (!needsToBeUnpublished && (needsToBePublished || wasPublished)) {
      res.set(this.#publishedPageKey, pageData);
    }

    await res.commit();
  }

  *[Symbol.iterator]() {
    for (const entry of this.#data) {
      yield entry;
    }
  }
}
