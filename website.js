import { renderFile } from "pug";
import { serve } from "std/http";
import { contentType } from "std/media_types";
import { getSession } from "~/sessions.js";

import * as indexRoute from "~/routes/index.js";
import * as blogIndexRoute from "~/routes/blog.index.js";
import * as webmentionRoute from "~/routes/webmention.js";
import * as pageRoute from "~/routes/[page].js";

import * as sudoIndexRoute from "~/routes/sudo/index.js";
import * as sudoExitRoute from "~/routes/sudo/exit.js";
import * as sudoDashboardRoute from "~/routes/sudo/dashboard.js";
import * as sudoWebmentionsRoute from "~/routes/sudo/webmentions.js";
import * as sudoWebmentionSingleRoute from "~/routes/sudo/webmentions.[webmentionId].js";
import * as sudoWebmentionSingleDeleteRoute from "~/routes/sudo/webmentions.[webmentionId].delete.js";
import * as sudoCollectionRoute from "~/routes/sudo/[collection].js";
import * as sudoCollectionNewItemRoute from "~/routes/sudo/[collection].new.js";
import * as sudoCollectionItemRoute from "~/routes/sudo/[collection].[itemId].js";
import * as sudoCollectionItemDeleteRoute from "~/routes/sudo/[collection].[itemId].delete.js";
import * as sudoCollectionItemPublishRoute from "~/routes/sudo/[collection].[itemId].publish.js";

const kv = await Deno.openKv();

const pagesIter = await kv.list({ prefix: ["pages"] });

const log = value => console.log(value);
const del = res => kv.delete(res.key);

for await (const res of pagesIter) log(res);

const publishedPagesIter = await kv.list({ prefix: ["published_pages"] });

for await (const res of publishedPagesIter) log(res);

//Deno.exit();

const publicRoutes = [
  {
    pattern: new URLPattern({pathname: "/"}),
    ...indexRoute,
  },
  {
    pattern: new URLPattern({pathname: "/blog{/}?"}),
    ...blogIndexRoute,
  },
  {
    pattern: new URLPattern({pathname: "/webmention{/}?"}),
    ...webmentionRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo{/}?"}),
    ...sudoIndexRoute,
  },
  {
    pattern: new URLPattern({pathname: "/:page{/}?"}),
    ...pageRoute,
  },
];

const sudoRoutes = [
  {
    pattern: new URLPattern({pathname: "/sudo/exit{/}?"}),
    ...sudoExitRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/dashboard{/}?"}),
    ...sudoDashboardRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/webmentions{/}?"}),
    ...sudoWebmentionsRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/webmentions/:webmentionId{/}?"}),
    ...sudoWebmentionSingleRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/webmentions/:webmentionId/delete{/}?"}),
    ...sudoWebmentionSingleDeleteRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection{/}?"}),
    ...sudoCollectionRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection/new{/}?"}),
    ...sudoCollectionNewItemRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection/:itemId{/}?"}),
    ...sudoCollectionItemRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection/:itemId/delete{/}?"}),
    ...sudoCollectionItemDeleteRoute,
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection/:itemId/publish{/}?"}),
    ...sudoCollectionItemPublishRoute,
  }
];

serve(handle);

const sudoRoutePattern = new URLPattern({ pathname: "/sudo/:etc+" });
const assetPattern = new URLPattern({ pathname: "/:filename.:extension" });

async function handleSudoRoute(request) {
  const session = await getSession(request);

  if (!session.get("authenticated")) {
    return new Response(null, {
      status: 303,
      headers: {
        location: "/sudo",
      },
    });
  }

  return matchRequestToRoutes(request, sudoRoutes);
}

function handlePublicRoute(request) {
  return matchRequestToRoutes(request, publicRoutes);
}

async function handle(request) {
  const url = new URL(request.url);
  const assetMatch = assetPattern.exec({ pathname: url.pathname });

  console.log(url.pathname, Boolean(assetMatch));

  let response;

  if (assetMatch) response = await serveStatic({params: assetMatch?.pathname.groups });
  else {
    const isSudoRoute = sudoRoutePattern.test({ pathname: url.pathname });
    try {
      response = isSudoRoute ? handleSudoRoute(request) : handlePublicRoute(request);
    } catch (errorOrResponse) {
      response = errorOrResponse instanceof Response
        ? errorOrResponse
        : new Response(`<pre><code>${JSON.stringify(errorOrResponse?.message, null, 2)}</code></pre>`, {
          status: 500, 
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        });
    }
  }

  return response;
}

async function serveStatic({params}) {
  const {extension, filename} = params;

  if (!filename) return new Response(null, {status: 500});

  const filePath = `assets/${filename}.${extension}`;
  const fileUrl = new URL(filePath, import.meta.url);

  const body = await Deno.readFile(fileUrl);
  if (!body) return new Response(null, {status: 404});

  return new Response(body, {
    headers: {
      'content-type': contentType(extension),
    },
  });
}

async function matchRequestToRoutes(request, routes) {
  const url = new URL(request.url);
  for (const route of routes) {
    const matched = route.pattern.exec({pathname: url.pathname});
    let response;
    if (matched) {
      const view = createView(request);
      if ('module' in route) {
        const module = await route.module();
        response = await module[request.method]({request, params: matched.pathname?.groups, view})
      } else {
        response = await route[request.method]({request, params: matched.pathname?.groups, view})
      }
      return response
    }
  }

  return new Response("Not found", { status: 404 });
}

function createView(request) {
  const url = new URL(request.url);

  return function view(template, context = {}, init = {}) {
    init.headers ??= new Headers();
    init.headers.set('content-type', 'text/html; charset=utf-8');

    return new Response(
      renderFile(`./routes/${template}.pug`, {
        basedir: './routes',
        isCurrentPath(path) {
          const normalizedPath = path.endsWith('/') ? path : `${path}/`;
          const normalizedRequestPath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
          return normalizedPath === normalizedRequestPath;
        },
        currentPath: url.pathname,
        ...context,
      }),
      init,
    );
  }
}
