import { afterEach, describe, expect, it } from "vitest";
import axios from "axios";
import { Server, createServer } from "./server";
import {
  createJoke,
  createJokeInput,
  createNullInfrastructure,
} from "./spec-helpers/factories";
import { recordEvents } from "./spec-helpers/record-events";
import { JokeRepo } from "./infrastructure/joke-repo";
import { Infrastructure } from "./infrastructure/create";

describe("server", () => {
  let server: Server;

  const createAndStartServer = async (overrides?: Partial<Infrastructure>) => {
    const infrastructure = createNullInfrastructure(overrides);
    server = createServer(infrastructure);
    await server.start(0);

    return {
      port: server.port,
      infrastructure,
    };
  };

  afterEach(async () => {
    if (server?.isRunning()) {
      await server.stop();
    }
  });

  describe("startup and shutdown", () => {
    it("should set a flag when it's listening", async () => {
      const infrastructure = createNullInfrastructure();
      const server = createServer(infrastructure);

      try {
        expect(server.isRunning()).toEqual(false);

        await server.start(0);
        expect(server.isRunning()).toEqual(true);

        await server.stop();
        expect(server.isRunning()).toEqual(false);
      } finally {
        if (server.isRunning()) {
          await server.stop();
        }
      }
    });

    it("should throw an error when reading the port before server has started", () => {
      const infrastructure = createNullInfrastructure();
      const server = createServer(infrastructure);

      expect(() => server.port).toThrow("Server is not running");
    });

    it("should throw an error when stopping the server before it has started", async () => {
      const infrastructure = createNullInfrastructure();
      const server = createServer(infrastructure);

      await expect(server.stop()).rejects.toThrow("Server is not running");
    });

    it("should throw an error when startup fails (e.g. because the port is already in use)", async () => {
      const infrastructure = createNullInfrastructure();
      const server1 = createServer(infrastructure);
      await server1.start(0);

      const server2 = createServer(infrastructure);
      await expect(server2.start(server1.port)).rejects.toThrow("EADDRINUSE");
    });
  });

  it("should retrieve all the jokes", async () => {
    const joke1 = createJoke();
    const joke2 = createJoke();
    const jokeRepo = JokeRepo.createNull({
      jokes: {
        [joke1.jokeId]: joke1,
        [joke2.jokeId]: joke2,
      },
    });
    const { port } = await createAndStartServer({ jokeRepo });

    const response = await axios({
      method: "GET",
      baseURL: `http://localhost:${port}`,
      url: `/jokes`,
    });

    expect(response.status).toEqual(200);
    expect(response.data).toEqual({ jokes: [joke1, joke2] });
  });

  it("should store jokes", async () => {
    const jokeInput = createJokeInput();
    const { port, infrastructure } = await createAndStartServer();
    const jokeAddedEvents = recordEvents(infrastructure.jokeRepo.events);

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/jokes",
      data: jokeInput,
    });

    expect(response.status).toEqual(201);
    expect(jokeAddedEvents.data()).toEqual([
      {
        type: "JokeRepo/joke-added",
        payload: {
          ...jokeInput,
          jokeId: expect.any(String),
        },
      },
    ]);
  });

  it("shoud retrieve single jokes", async () => {
    const joke = createJoke();
    const jokeRepo = JokeRepo.createNull({
      jokes: {
        [joke.jokeId]: joke,
      },
    });
    const { port } = await createAndStartServer({ jokeRepo });

    const response = await axios({
      method: "GET",
      baseURL: `http://localhost:${port}`,
      url: `/jokes/${joke.jokeId}`,
    });

    expect(response.status).toEqual(200);
    expect(response.data).toEqual({ joke });
  });

  it("should update jokes", async () => {
    const joke = createJoke();
    const jokeInput = createJokeInput();
    const { port, infrastructure } = await createAndStartServer();
    const jokeAddedEvents = recordEvents(infrastructure.jokeRepo.events);

    const response = await axios({
      method: "PUT",
      baseURL: `http://localhost:${port}`,
      url: `/jokes/${joke.jokeId}`,
      data: jokeInput,
    });

    expect(response.status).toEqual(204);
    expect(jokeAddedEvents.data()).toEqual([
      {
        type: "JokeRepo/joke-added",
        payload: {
          ...jokeInput,
          jokeId: joke.jokeId,
        },
      },
    ]);
  });

  it("should delete jokes", async () => {
    const { port, infrastructure } = await createAndStartServer();
    const jokeRemovedEvents = recordEvents(infrastructure.jokeRepo.events);

    const response = await axios({
      method: "DELETE",
      baseURL: `http://localhost:${port}`,
      url: "/jokes/joke-111",
    });

    expect(response.status).toEqual(204);
    expect(jokeRemovedEvents.data()).toEqual([
      {
        type: "JokeRepo/joke-removed",
        payload: {
          jokeId: "joke-111",
        },
      },
    ]);
  });

  it("should respond with a 500 error when an exception is thrown", async () => {
    const { port } = await createAndStartServer({
      jokeRepo: JokeRepo.createNull({
        error: new Error("Some internal failure"),
      }),
    });

    const response = await axios({
      method: "GET",
      baseURL: `http://localhost:${port}`,
      url: "/jokes",
      validateStatus: () => true,
    });

    expect(response.status).toEqual(500);
    expect(response.data).toEqual({ message: "Internal server error" });
  });
});
