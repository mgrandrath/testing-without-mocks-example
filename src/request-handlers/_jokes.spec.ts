import { describe, expect, it } from "vitest";
import {
  createJoke,
  createJokeInput,
  createNullInfrastructure,
  createRequest,
} from "../spec-helpers/factories";
import { JokeRepo } from "../infrastructure/joke-repo";
import { badRequest, created, noContent, notFound, ok } from "./responses";
import * as Jokes from "./jokes";
import { recordEvents } from "../spec-helpers/record-events";
import { Uuid } from "../infrastructure/uuid";

describe("Jokes request handlers", () => {
  describe("index", () => {
    it("should return a success response with all the jokes", async () => {
      const joke1 = createJoke();
      const joke2 = createJoke();
      const infrastructure = createNullInfrastructure({
        jokeRepo: JokeRepo.createNull({
          jokes: {
            [joke1.jokeId]: joke1,
            [joke2.jokeId]: joke2,
          },
        }),
      });
      const request = createRequest();

      const response = await Jokes.index(infrastructure, request);

      expect(response).toEqual(
        ok({
          jokes: [joke1, joke2],
        })
      );
    });
  });

  describe("show", () => {
    it("should return the joke with the given id", async () => {
      const joke = createJoke();
      const infrastructure = createNullInfrastructure({
        jokeRepo: JokeRepo.createNull({
          jokes: {
            [joke.jokeId]: joke,
          },
        }),
      });
      const request = createRequest({ params: { jokeId: joke.jokeId } });

      const response = await Jokes.show(infrastructure, request);

      expect(response).toEqual(
        ok({
          joke: joke,
        })
      );
    });

    it("should respond with a 404 when the given id does not exist", async () => {
      const infrastructure = createNullInfrastructure();
      const request = createRequest({ params: { jokeId: "does-not-exist" } });

      const response = await Jokes.show(infrastructure, request);

      expect(response).toEqual(notFound());
    });
  });

  describe("create", () => {
    it("should add the new joke", async () => {
      const jokeInput = createJokeInput();
      const uuid = Uuid.createNull("joke-111");
      const expectedJoke = { ...jokeInput, jokeId: "joke-111" };
      const infrastructure = createNullInfrastructure({ uuid });
      const jokeAddedEvents = recordEvents(
        infrastructure.jokeRepo,
        JokeRepo.JOKE_ADDED
      );
      const request = createRequest({ data: jokeInput });

      const response = await Jokes.create(infrastructure, request);

      expect(jokeAddedEvents).toEqual([{ joke: expectedJoke }]);
      expect(response).toEqual(created({ joke: expectedJoke }));
    });

    it("should respond with 'Bad request' when validation fails", async () => {
      const invalidJokeInput = createJokeInput({ question: undefined });
      const infrastructure = createNullInfrastructure();
      const jokeAddedEvents = recordEvents(
        infrastructure.jokeRepo,
        JokeRepo.JOKE_ADDED
      );
      const request = createRequest({ data: invalidJokeInput });

      const response = await Jokes.create(infrastructure, request);

      expect(jokeAddedEvents).toHaveLength(0);
      expect(response).toEqual(
        badRequest({ message: "Joke data is invalid. No joke!" })
      );
    });
  });

  describe("update", () => {
    it("should update the given joke", async () => {
      const jokeInput = createJokeInput();
      const expectedJoke = { ...jokeInput, jokeId: "joke-111" };
      const infrastructure = createNullInfrastructure();
      const jokeAddedEvents = recordEvents(
        infrastructure.jokeRepo,
        JokeRepo.JOKE_ADDED
      );
      const request = createRequest({
        params: { jokeId: "joke-111" },
        data: jokeInput,
      });

      const response = await Jokes.update(infrastructure, request);

      expect(jokeAddedEvents).toEqual([{ joke: expectedJoke }]);
      expect(response).toEqual(noContent());
    });

    it("should respond with 'Bad request' when validation fails", async () => {
      const invalidJokeInput = createJokeInput({ question: undefined });
      const infrastructure = createNullInfrastructure();
      const jokeAddedEvents = recordEvents(
        infrastructure.jokeRepo,
        JokeRepo.JOKE_ADDED
      );
      const request = createRequest({
        params: { jokeId: "joke-111" },
        data: invalidJokeInput,
      });

      const response = await Jokes.update(infrastructure, request);

      expect(jokeAddedEvents).toHaveLength(0);
      expect(response).toEqual(
        badRequest({ message: "Joke data is invalid. No joke!" })
      );
    });
  });

  describe("destroy", () => {
    it("should remove the given joke", async () => {
      const jokeId = "joke-111";
      const infrastructure = createNullInfrastructure();
      const jokeRemovedEvents = recordEvents(
        infrastructure.jokeRepo,
        JokeRepo.JOKE_REMOVED
      );
      const request = createRequest({ params: { jokeId } });

      const response = await Jokes.destroy(infrastructure, request);

      expect(jokeRemovedEvents).toEqual([{ jokeId }]);
      expect(response).toEqual(noContent());
    });
  });
});
