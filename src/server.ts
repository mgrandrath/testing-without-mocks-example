import { Server as HttpServer } from "node:http";
import express from "express";
import {
  Infrastructure,
  Request,
  RequestHandler,
} from "./request-handlers/types";
import * as Jokes from "./request-handlers/jokes";

export type Server = {
  start: (port: number) => Promise<void>;
  stop: () => Promise<void>;
};

const createRequest = (httpRequest: express.Request): Request => ({
  params: httpRequest.params,
  data: httpRequest.body,
});

export const createServer = (infrastructure: Infrastructure): Server => {
  let httpServer: HttpServer;

  const wrapRequestHandler =
    (handleRequest: RequestHandler): express.RequestHandler =>
    async (httpRequest, httpResponse, next) => {
      try {
        const request = createRequest(httpRequest);
        const response = await handleRequest(infrastructure, request);
        httpResponse.status(response.status).json(response.data);
      } catch (error) {
        next(error);
      }
    };

  const app = express();
  app.use(express.json());
  app.get("/jokes", wrapRequestHandler(Jokes.index));
  app.post("/jokes", wrapRequestHandler(Jokes.create));
  app.get("/jokes/:jokeId", wrapRequestHandler(Jokes.show));
  app.put("/jokes/:jokeId", wrapRequestHandler(Jokes.update));
  app.delete("/jokes/:jokeId", wrapRequestHandler(Jokes.destroy));
  app.use(
    (
      error: unknown,
      httpRequest: express.Request,
      httpResponse: express.Response,
      _next: express.NextFunction
    ) => {
      console.error({ httpRequest, error });
      httpResponse.status(500).json({ message: "Internal server error" });
    }
  );

  return {
    start: (port: number) => {
      return new Promise((resolve) => {
        httpServer = app.listen(port, resolve);
      });
    },

    stop: () => {
      return new Promise((resolve, reject) => {
        if (!httpServer) {
          resolve();
          return;
        }

        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
};
