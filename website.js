import {renderFile} from "pug";

import { serve, setCookie } from "std/http";
import { contentType } from "std/media_types";
import { extname } from "std/path";
import { getSession, commitSession } from "./sessions.js";

const routes = [
  {
    pattern: new URLPattern({pathname: "/"}),
    GET: () => view(
      "home.pug",
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
        "blog.pug",
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
    pattern: new URLPattern({pathname: "/accessibility{/}?"}),
    GET() {
      return view(
        "page.pug",
        {
          title: "Accessibility Statement",
          currentPath: "/accessibility",
          content: "<h1>Accessibility Statement</h1>"
        },
      );
    }
  },
  {
    pattern: new URLPattern({pathname: "/privacy{/}?"}),
    GET() {
      return view(
        "page.pug",
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
      "webmention.pug",
      {
        title: 'Webmention',
        currentPath: "/webmention",
      },
    ),
  },
  {
    pattern: new URLPattern({pathname: "/login{/}?"}),
    async GET({request}) {
      const session = await getSession(request);
      const headers = new Headers();
      const isAuthenticated = session.get('authenticated');

      if (isAuthenticated) {
        headers.set('location', '/');

        return new Response(
          null,
          { status: 303, headers },
        );
      }

      const errors = session.get('errors');

      setCookie(
        headers,
        await commitSession(session),
      );

      return new Response("login");
    },
    async POST({request}) {
      const session = await getSession(request);
      const headers = new Headers();
      const formData = await request.formData();

      if (formData.get('password') === Deno.env.get('PASSWORD')) {
        session.set('authenticated', true);
        setCookie(
          headers,
          await commitSession(session),
        );

        headers.set('location', '/');

        return new Response(null, {
          status: 303,
          headers,
        });
      } else {
        session.flash('errors', 'Incorrect password');

        headers.set('location', '/login');

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
  },
  {
    pattern: new URLPattern({pathname: "/logout{/}?"}),
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
    pattern: new URLPattern({pathname: "/:filename+"}),
    async GET({params}) {
      const {filename} = params;

      if (!filename) return new Response(null, {status: 500});

      const filePath = `assets/${filename}`;
      const fileUrl = new URL(filePath, import.meta.url);

      const body = await Deno.readFile(fileUrl);
      if (!body) return new Response(null, {status: 404});

      return new Response(body, {
        headers: {
          'content-type': contentType(extname(filePath)),
        },
      });
    }
  },
];

serve(request => {
  const url = new URL(request.url);

  for (const route of routes) {
    const matched = route.pattern.exec({pathname: url.pathname});
    if (matched) return route[request.method]({request, params: matched.pathname?.groups})
  }
});

function view(template, context = {}, init = {}) {
  init.headers ??= new Headers();

  init.headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(
    renderFile(`./views/${template}`, {
      basedir: './views',
      ...context,
    }),
    init,
  );
}
