import { describe, expect, it } from "vitest";
import { isNone, some } from "fp-ts/lib/Option";
import { Joke, createJokeId } from "../domain/joke";
import { FsDbClient } from "./fs_db_client";
import { JokeRepo } from "./joke-repo";
import { createJoke } from "../spec-helpers/factories";
import { recordEvents } from "../spec-helpers/record-events";

describe("JokeRepo", () => {
  describe("findByJokeId", () => {
    it("should find jokes by id", async () => {
      const jokeId = createJokeId("joke-111");
      const joke = createJoke({
        jokeId,
        question: "Was ist weiß und stört beim Frühstück?",
        answer: "Eine Lawine",
      });
      const fsDbClient = FsDbClient.createNull<Joke>({
        items: {
          "joke-111": joke,
        },
      });
      const jokeRepo = new JokeRepo(fsDbClient);

      const retrievedJoke = await jokeRepo.findByJokeId(jokeId);

      expect(retrievedJoke).toEqual(some(joke));
    });

    describe("null instance", () => {
      it("should return nothing by default", async () => {
        const jokeRepo = JokeRepo.createNull();

        const joke = await jokeRepo.findByJokeId(createJokeId("irrelevant"));

        expect(isNone(joke)).toEqual(true);
      });

      it("should return configurable jokes", async () => {
        const joke1 = createJoke({
          jokeId: createJokeId("joke-111"),
        });
        const joke2 = createJoke({
          jokeId: createJokeId("joke-222"),
        });

        const jokeRepo = JokeRepo.createNull({
          jokes: {
            [joke1.jokeId]: joke1,
            [joke2.jokeId]: joke2,
          },
        });

        expect(await jokeRepo.findByJokeId(joke1.jokeId)).toEqual(some(joke1));
        expect(await jokeRepo.findByJokeId(joke2.jokeId)).toEqual(some(joke2));
      });
    });
  });

  describe("findAll", () => {
    it("should list all the jokes", async () => {
      const joke1 = createJoke({
        jokeId: createJokeId("joke-111"),
        question: "Was ist weiß und steht hinterm Baum?",
        answer: "Eine schüchterne Milch",
      });
      const joke2 = createJoke({
        jokeId: createJokeId("joke-222"),
        question: "Was ist weiß und stört beim Frühstück?",
        answer: "Eine Lawine",
      });

      const fsDbClient = FsDbClient.createNull<Joke>({
        items: {
          "joke-111": joke1,
          "joke-222": joke2,
        },
      });
      const jokeRepo = new JokeRepo(fsDbClient);

      const jokes = await jokeRepo.findAll();

      expect(jokes).toEqual([joke1, joke2]);
    });

    describe("null instance", () => {
      it("should return nothing by default", async () => {
        const jokeRepo = JokeRepo.createNull();

        const jokes = await jokeRepo.findAll();

        expect(jokes).toEqual([]);
      });

      it("should return configurable jokes", async () => {
        const joke1 = createJoke({
          jokeId: createJokeId("joke-111"),
        });
        const joke2 = createJoke({
          jokeId: createJokeId("joke-222"),
        });

        const jokeRepo = JokeRepo.createNull({
          jokes: {
            [joke1.jokeId]: joke1,
            [joke2.jokeId]: joke2,
          },
        });

        const jokes = await jokeRepo.findAll();

        expect(jokes).toEqual([joke1, joke2]);
      });
    });
  });

  describe("add", () => {
    it("should add jokes", async () => {
      const fsDbClient = FsDbClient.createNull<Joke>();
      const itemStoredEvents = recordEvents(fsDbClient, FsDbClient.ITEM_STORED);
      const jokeRepo = new JokeRepo(fsDbClient);

      const joke = createJoke({
        jokeId: createJokeId("joke-111"),
        question: "Was ist weiß und steht hinterm Baum?",
        answer: "Eine schüchterne Milch",
      });

      await jokeRepo.add(joke);

      expect(itemStoredEvents).toEqual([{ id: joke.jokeId, item: joke }]);
    });

    describe("null instance", () => {
      it("should emit a JOKE_ADDED event after adding a new joke", async () => {
        const fsDbClient = FsDbClient.createNull<Joke>();
        const jokeRepo = new JokeRepo(fsDbClient);
        const jokeAddedEvents = recordEvents(jokeRepo, JokeRepo.JOKE_ADDED);

        const joke = createJoke({
          jokeId: createJokeId("joke-111"),
          question: "Was ist weiß und steht hinterm Baum?",
          answer: "Eine schüchterne Milch",
        });

        await jokeRepo.add(joke);

        expect(jokeAddedEvents).toEqual([
          {
            jokeId: "joke-111",
            question: "Was ist weiß und steht hinterm Baum?",
            answer: "Eine schüchterne Milch",
          },
        ]);
      });
    });
  });

  describe("remove", () => {
    it("should remove a joke by id", async () => {
      const fsDbClient = FsDbClient.createNull<Joke>();
      const itemDeletedEvents = recordEvents(
        fsDbClient,
        FsDbClient.ITEM_DELETED
      );
      const jokeRepo = new JokeRepo(fsDbClient);

      await jokeRepo.remove(createJokeId("joke-111"));

      expect(itemDeletedEvents).toEqual([{ id: "joke-111" }]);
    });

    describe("null instance", () => {
      it("should emit a JOKE_REMOVED event after removing a joke", async () => {
        const fsDbClient = FsDbClient.createNull<Joke>();
        const jokeRepo = new JokeRepo(fsDbClient);
        const jokeRemovedEvents = recordEvents(jokeRepo, JokeRepo.JOKE_REMOVED);

        await jokeRepo.remove(createJokeId("joke-111"));

        expect(jokeRemovedEvents).toEqual([
          {
            jokeId: "joke-111",
          },
        ]);
      });
    });
  });
});
