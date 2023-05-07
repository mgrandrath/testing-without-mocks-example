import { afterEach, describe, expect, it } from "vitest";
import axios from "axios";
import { Server, createServer } from "./server";
import {
  createJoke,
  createJokeInput,
  createNullInfrastructure,
} from "./spec-helpers/factories";
import { recordEvents } from "./spec-helpers/record-events";
import {
  JokeAddedEvent,
  JokeRemovedEvent,
  JokeRepo,
} from "./infrastructure/joke-repo";
import { Infrastructure } from "./request-handlers/types";

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
    await server?.stop();
  });

  describe("startup", () => {
    it("should throw an error when reading the port before server has started", () => {
      const infrastructure = createNullInfrastructure();
      const server = createServer(infrastructure);

      expect(() => server.port).toThrow("Server has not been started");
    });
  });

  it("shoud retrieve all the jokes", async () => {
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
    const jokeAddedEvents = recordEvents<JokeAddedEvent>(
      infrastructure.jokeRepo,
      JokeRepo.JOKE_ADDED
    );

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/jokes",
      data: jokeInput,
    });

    expect(response.status).toEqual(201);
    expect(jokeAddedEvents.data()).toEqual([
      {
        ...jokeInput,
        jokeId: expect.any(String),
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
    const jokeAddedEvents = recordEvents<JokeAddedEvent>(
      infrastructure.jokeRepo,
      JokeRepo.JOKE_ADDED
    );

    const response = await axios({
      method: "PUT",
      baseURL: `http://localhost:${port}`,
      url: `/jokes/${joke.jokeId}`,
      data: jokeInput,
    });

    expect(response.status).toEqual(204);
    expect(jokeAddedEvents.data()).toEqual([
      {
        ...jokeInput,
        jokeId: joke.jokeId,
      },
    ]);
  });

  it("should delete jokes", async () => {
    const { port, infrastructure } = await createAndStartServer();
    const jokeRemovedEvents = recordEvents<JokeRemovedEvent>(
      infrastructure.jokeRepo,
      JokeRepo.JOKE_REMOVED
    );

    const response = await axios({
      method: "DELETE",
      baseURL: `http://localhost:${port}`,
      url: "/jokes/joke-111",
    });

    expect(response.status).toEqual(204);
    expect(jokeRemovedEvents.data()).toEqual([
      {
        jokeId: "joke-111",
      },
    ]);
  });
});
