import { Server as HttpServer } from "node:http";
import express from "express";
import {
  Infrastructure,
  Request,
  RequestHandler,
} from "./request-handlers/types";
import * as Jokes from "./request-handlers/jokes";

export type Server = {
  port: number;
  start: (port: number) => Promise<void>;
  stop: () => Promise<void>;
};

const createRequest = (httpRequest: express.Request): Request => ({
  params: httpRequest.params,
  data: httpRequest.body,
});

export const createServer = (infrastructure: Infrastructure): Server => {
  let httpServer: HttpServer | undefined;

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
      // TODO log the error
      httpResponse.status(500).json({ message: "Internal server error" });
    }
  );

  return {
    get port() {
      const addressInfo = httpServer?.address();
      if (!addressInfo) {
        throw new Error("Server has not been started");
      }
      if (typeof addressInfo === "string") {
        throw new Error(
          "Port number is not available because server is connected to a pipe"
        );
      }

      return addressInfo.port;
    },

    start: (port: number) => {
      return new Promise((resolve, reject) => {
        httpServer = app.listen(port, resolve);
        httpServer.once("error", (error) => {
          reject(error);
        });
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
