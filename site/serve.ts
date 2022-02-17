import { getSitePath } from "./util.ts";

/*
 * This is an example of a server that will serve static content out of the
 * $CWD/examples/static path.
 */

import {
  bold,
  cyan,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.118.0/fmt/colors.ts";

import {
  Application,
  HttpError,
  Status,
} from "https://deno.land/x/oak@v10.1.0/mod.ts";
const publicPath = getSitePath("public");

export default async function main() {
  const app = new Application();

  // Error handler middleware
  app.use(async (context, next) => {
    try {
      await next();
    } catch (e) {
      if (e instanceof HttpError) {
        // deno-lint-ignore no-explicit-any
        context.response.status = e.status as any;
        if (e.expose) {
          context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>${e.status} - ${e.message}</h1>
              </body>
            </html>`;
        } else {
          context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>${e.status} - ${Status[e.status]}</h1>
              </body>
            </html>`;
        }
      } else if (e instanceof Error) {
        context.response.status = 500;
        context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>500 - Internal Server Error</h1>
              </body>
            </html>`;
        console.log("Unhandled Error:", red(bold(e.message)));
        console.log(e.stack);
      }
    }
  });

  // Logger
  app.use(async (context, next) => {
    await next();
    const rt = context.response.headers.get("X-Response-Time");
    console.log(
      `${green(context.request.method)} ${cyan(
        context.request.url.pathname
      )} - ${bold(String(rt))}`
    );
  });

  // Response Time
  app.use(async (context, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    context.response.headers.set("X-Response-Time", `${ms}ms`);
  });

  // Send static content
  app.use(async (context) => {
    await context.send({
      root: publicPath,
      index: "index.html",
    });
  });

  app.addEventListener("listen", ({ port, serverType }) => {
    console.log(
      bold("Start listening on ") + yellow(`http://localhost:${port}`)
    );
    console.log(bold("  using HTTP server: " + yellow(serverType)));
  });

  await app.listen({ hostname: "127.0.0.1", port: 8000 });
}
