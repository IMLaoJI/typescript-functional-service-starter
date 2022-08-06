import { pipe } from "fp-ts/lib/function";
import * as RT from "fp-ts/lib/ReaderTask";
import * as T from "fp-ts/lib/Task";
import { z } from "zod";
import type { Cache } from "../../infrastructure/cache";
import type { Database } from "../../infrastructure/database";
import type { HttpServer } from "../../infrastructure/http";
import { bindHealthcheckRoutes } from "./routes/healthcheck";

interface Dependencies {
  readonly httpServer: HttpServer;
  readonly database: Database;
  readonly cache: Cache;
}

export const bindHttpRoutes = (): RT.ReaderTask<Dependencies, HttpServer> =>
  pipe(
    RT.ask<Dependencies>(),
    RT.chainFirst(bindDocumentationRoute),
    RT.chainFirst(bindHealthcheckRoutes),
    RT.map(({ httpServer }) => httpServer)
  );

const bindDocumentationRoute = (): RT.ReaderTask<Dependencies, HttpServer> =>
  pipe(
    RT.ask<Dependencies>(),
    RT.chain(({ httpServer }) => {
      return RT.of(
        httpServer.createRoute({
          handler(request) {
            return T.of({
              status: 200,
              body: request.server.swagger(),
            });
          },
          method: "GET",
          url: "/docs",
          schema: {
            response: {
              200: z.object({}),
            },
          },
        })
      );
    })
  );
