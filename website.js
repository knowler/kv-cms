import { renderFile } from "pug";
import { serve } from "std/http";
import { contentType } from "std/media_types";

import * as indexRoute from "~/routes/index.js";
import * as blogIndexRoute from "~/routes/blog.index.js";
import * as webmentionRoute from "~/routes/webmention.js";
import * as pageRoute from "~/routes/[page].js";

import * as sudoIndexRoute from "~/routes/sudo.index.js";
import * as sudoExitRoute from "~/routes/sudo.exit.js";
import * as sudoDashboardRoute from "~/routes/sudo.dashboard.js";
import * as sudoWebmentionsRoute from "~/routes/sudo.webmentions.js";
import * as sudoWebmentionSingleRoute from "~/routes/sudo.webmentions.[webmentionId].js";
import * as sudoWebmentionSingleDeleteRoute from "~/routes/sudo.webmentions.[webmentionId].delete.js";
import * as sudoCollectionRoute from "~/routes/sudo.[collection].js";
import * as sudoCollectionItemRoute from "~/routes/sudo.[collection].[itemId].js";

const routes = [
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
    pattern: new URLPattern({pathname: "/sudo/:collection/:itemId{/}?"}),
    ...sudoCollectionItemRoute,
  },
  {
    pattern: new URLPattern({pathname: "/:filename.:extension"}),
    async GET({params}) {
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
  },
  {
    pattern: new URLPattern({pathname: "/:page{/}?"}),
    ...pageRoute,
  },
];

serve(handle);

async function handle(request) {
  const url = new URL(request.url);

  for (const route of routes) {
    const matched = route.pattern.exec({pathname: url.pathname});
    let response;
    if (matched) {
      try {
        if ('module' in route) {
          const module = await route.module();
          response = await module[request.method]({request, params: matched.pathname?.groups, view})
        } else {
          response = await route[request.method]({request, params: matched.pathname?.groups, view})
        }
      } catch(errorOrResponse) {
        if (errorOrResponse instanceof Response) {
          response = errorOrResponse instanceof Response
        } else throw errorOrResponse;
      }
      return response
    }
  }

  return new Response("Not found", { status: 404 });
}

function view(template, context = {}, init = {}) {
  init.headers ??= new Headers();
  init.headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(
    renderFile(`./routes/${template}.pug`, {
      basedir: './routes',
      ...context,
    }),
    init,
  );
}
