import { renderFile } from "pug";
import { serve, setCookie } from "std/http";
import { contentType } from "std/media_types";
import { commitSession, getSession } from "./sessions.js";
import { authOrLogin } from "./auth.js";

const routes = [
  {
    pattern: new URLPattern({pathname: "/"}),
    GET: () => view(
      "page",
      {
        title: 'Home',
        currentPath: "/",
        content: "<h1>Welcome</h1>\n<p>My name is Nathan Knowler and this is my website. I’m originally from Vancouver, however, I now live in Winnipeg and work remotely as a Senior Frontend Developer at <a href=\"https://wearekettle.com\" rel=\"noreferrer\">Kettle</a>.</p>"
      },
    ),
  },
  {
    pattern: new URLPattern({pathname: "/blog{/}?"}),
    GET() {
      return view(
        "blog.index",
        {
          title: "Blog",
          currentPath: "/blog",
          posts: [
            {
              title: 'Rust for a Rusty Game Developer',
              slug: 'rust-for-a-rusty-game-developer',
              publishedAt: '2019-01-31T16:31:00.000Z',
            },
            {
              title: 'Hello, World!',
              slug: 'hello-world',
              publishedAt: '2018-12-31T16:30:00.000Z',
            },
          ],
        },
      );
    }
  },
  {
    pattern: new URLPattern({pathname: "/about{/}?"}),
    GET() {
      return view(
        "page",
        {
          title: "About",
          currentPath: "/about",
          content: "<h1>About</h1>",
        },
      );
    }
  },
  {
    pattern: new URLPattern({pathname: "/accessibility{/}?"}),
    GET() {
      return view(
        "page",
        {
          title: "Accessibility Statement",
          currentPath: "/accessibility",
          content: "<h1>Accessibility Statement</h1>",
        },
      );
    }
  },
  {
    pattern: new URLPattern({pathname: "/privacy{/}?"}),
    GET() {
      return view(
        "page",
        {
          title: "Privacy Policy",
          currentPath: "/privacy",
          content: "<h1>Privacy Policy</h1>"
        },
      );
    }
  },
  {
    pattern: new URLPattern({pathname: "/webmention{/}?"}),
    GET: () => view(
      "webmention",
      {
        title: 'Webmention',
        currentPath: "/webmention",
      },
    ),
  },
  {
    pattern: new URLPattern({pathname: "/sudo{/}?"}),
    async GET({request}) {
      const session = await getSession(request);
      const isAuthenticated = session.get("authenticated");

      if (isAuthenticated) {
        return new Response(null, {
          status: 302,
          headers: {
            location: "/sudo/dashboard",
          },
        });
      }

      const errors = session.get("errors");
      const headers = new Headers();

      setCookie(
        headers,
        await commitSession(session),
      );

      return view("sudo.index", {
        title: "Sign In",
        errors,
      }, { headers });
    },
    async POST({request}) {
      const session = await getSession(request);
      const isAuthenticated = session.get("authenticated");

      if (isAuthenticated) {
        return new Response(null, {
          status: 302,
          headers: {
            location: "/sudo/dashboard",
          },
        });
      }

      const formData = await request.formData();
      const password = formData.get("password");

      const headers = new Headers();

      if (password && password === Deno.env.get("PASSWORD")) {
        headers.set("location", "/sudo/dashboard");
        session.set("authenticated", true);
      } else {
        headers.set("location", "/sudo");
        session.flash("errors", "Password is incorrect.");
      }

      setCookie(
        headers,
        await commitSession(session),
      );

      return new Response(null, {
        status: 303,
        headers,
      });
    }
  },
  {
    pattern: new URLPattern({pathname: "/sudo/exit{/}?"}),
    async GET({request}) {
      const session = await getSession(request);
      const headers = new Headers();

      session.set('authenticated', false);
      headers.set('location', '/');

      setCookie(
        headers,
        await commitSession(session),
      );

      return new Response(null, { status: 303, headers });
    },
  },
  {
    pattern: new URLPattern({pathname: "/sudo/dashboard{/}?"}),
    async GET({request}) {
      await authOrLogin(request);

      return view("sudo.dashboard", {
        currentPath: "/sudo/dashboard",
      });
    },
  },
  {
    pattern: new URLPattern({pathname: "/sudo/:collection{/}?"}),
    async GET({request, params}) {
      await authOrLogin(request);
      const {collection} = params;

      return view("sudo.[collection]", {
        currentPath: `/sudo/${collection}`,
        title: collection,
      });
    },
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
];

serve(handle);

async function handle(request) {
  const url = new URL(request.url);

  for (const route of routes) {
    const matched = route.pattern.exec({pathname: url.pathname});
    let response;
    if (matched) {
      try {
        response = await route[request.method]({request, params: matched.pathname?.groups})
      } catch(errorOrResponse) {
        response = errorOrResponse instanceof Response
          ? errorOrResponse
          : new Response("Something’s wrong", { status: 500 });
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
    renderFile(`./views/${template}.pug`, {
      basedir: './views',
      ...context,
    }),
    init,
  );
}
