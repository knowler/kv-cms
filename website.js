import { renderFile } from "pug";
import { serve } from "std/http";
import { contentType } from "std/media_types";

const routes = [
  {
    pattern: new URLPattern({pathname: "/"}),
    module: () => import("~/routes/index.js"),
  },
  {
    pattern: new URLPattern({pathname: "/blog{/}?"}),
    module: () => import("~/routes/blog.index.js"),
  },
  {
    pattern: new URLPattern({pathname: "/webmention{/}?"}),
    module: () => import("~/routes/webmention.js"), },
  {
    pattern: new URLPattern({pathname: "/sudo{/}?"}),
    module: () => import("~/routes/sudo.index.js"),
  },
  {
    pattern: new URLPattern({pathname: "/sudo/exit{/}?"}),
    module: () => import("~/routes/sudo.exit.js"),
  },
  {
    pattern: new URLPattern({pathname: "/sudo/dashboard{/}?"}),
    module: () => import("~/routes/sudo.dashboard.js"),
  },
  {
    pattern: new URLPattern({pathname: "/sudo/webmentions{/}?"}),
    module: () => import("~/routes/sudo.webmentions.js"),
  },
  {
    pattern: new URLPattern({pathname: "/sudo/webmentions/:webmentionId{/}?"}),
    module: () => import("~/routes/sudo.webmentions.[webmentionId].js")
  },
  {
    pattern: new URLPattern({pathname: "/sudo/webmentions/:webmentionId/delete{/}?"}),
    module: () => import("~/routes/sudo.webmentions.[webmentionId].delete.js"),
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection{/}?"}),
    module: () => import("~/routes/sudo.[collection].js"),
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection/:itemId{/}?"}),
    module: () => import("~/routes/sudo.[collection].[itemId].js"),
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
    module: () => import("~/routes/[page].js"),
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
