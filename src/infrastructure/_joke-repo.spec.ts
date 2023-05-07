import { describe, expect, it } from "vitest";
import { isNone, some } from "fp-ts/lib/Option";
import { Joke, createJokeId } from "../domain/joke";
import { FsDbClient, ItemStoredEvent } from "./fs_db_client";
import { JokeAddedEvent, JokeRemovedEvent, JokeRepo } from "./joke-repo";
import { createJoke } from "../spec-helpers/factories";
import { recordEvents } from "../spec-helpers/record-events";
import { createTmpDbFile } from "../spec-helpers/tmp-file";

const irrelevantId = createJokeId("irrelevant-id");

describe("JokeRepo", () => {
  describe("integration", () => {
    it("should write to the filesystem", async () => {
      const tmpFile = await createTmpDbFile();
      try {
        const jokeRepo = JokeRepo.create({ dbFile: tmpFile.path });

        const joke = createJoke();
        await jokeRepo.add(joke);
        const retrievedJoke = await jokeRepo.findByJokeId(joke.jokeId);

        expect(retrievedJoke).toEqual(some(joke));
      } finally {
        tmpFile.cleanup();
      }
    });
  });

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

        const joke = await jokeRepo.findByJokeId(irrelevantId);

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

      it("should throw a configurable error", async () => {
        const jokeRepo = JokeRepo.createNull({
          error: new Error("some error"),
        });

        await expect(jokeRepo.findByJokeId(irrelevantId)).rejects.toThrow(
          "some error"
        );
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
      it("should return an empty list by default", async () => {
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

      it("should throw a configurable error", async () => {
        const jokeRepo = JokeRepo.createNull({
          error: new Error("some error"),
        });

        await expect(jokeRepo.findAll()).rejects.toThrow("some error");
      });
    });
  });

  describe("add", () => {
    it("should add jokes", async () => {
      const fsDbClient = FsDbClient.createNull<Joke>();
      const itemStoredEvents = recordEvents<ItemStoredEvent<Joke>>(
        fsDbClient,
        FsDbClient.ITEM_STORED
      );
      const jokeRepo = new JokeRepo(fsDbClient);

      const joke = createJoke({
        jokeId: createJokeId("joke-111"),
        question: "Was ist weiß und steht hinterm Baum?",
        answer: "Eine schüchterne Milch",
      });

      await jokeRepo.add(joke);

      expect(itemStoredEvents.data()).toEqual([
        { id: joke.jokeId, item: joke },
      ]);
    });

    describe("null instance", () => {
      it("should emit a JOKE_ADDED event after adding a new joke", async () => {
        const fsDbClient = FsDbClient.createNull<Joke>();
        const jokeRepo = new JokeRepo(fsDbClient);
        const jokeAddedEvents = recordEvents<JokeAddedEvent>(
          jokeRepo,
          JokeRepo.JOKE_ADDED
        );

        const joke = createJoke({
          jokeId: createJokeId("joke-111"),
          question: "Was ist weiß und steht hinterm Baum?",
          answer: "Eine schüchterne Milch",
        });

        await jokeRepo.add(joke);

        expect(jokeAddedEvents.data()).toEqual([
          {
            jokeId: "joke-111",
            question: "Was ist weiß und steht hinterm Baum?",
            answer: "Eine schüchterne Milch",
          },
        ]);
      });

      it("should throw a configurable error", async () => {
        const jokeRepo = JokeRepo.createNull({
          error: new Error("some error"),
        });

        await expect(jokeRepo.add(createJoke())).rejects.toThrow("some error");
      });
    });
  });

  describe("remove", () => {
    it("should remove a joke by id", async () => {
      const fsDbClient = FsDbClient.createNull<Joke>();
      const jokeRemovedEvents = recordEvents<JokeRemovedEvent>(
        fsDbClient,
        FsDbClient.ITEM_DELETED
      );
      const jokeRepo = new JokeRepo(fsDbClient);

      await jokeRepo.remove(createJokeId("joke-111"));

      expect(jokeRemovedEvents.data()).toEqual([{ id: "joke-111" }]);
    });

    describe("null instance", () => {
      it("should emit a JOKE_REMOVED event after removing a joke", async () => {
        const fsDbClient = FsDbClient.createNull<Joke>();
        const jokeRepo = new JokeRepo(fsDbClient);
        const jokeRemovedEvents = recordEvents<JokeRemovedEvent>(
          jokeRepo,
          JokeRepo.JOKE_REMOVED
        );

        await jokeRepo.remove(createJokeId("joke-111"));

        expect(jokeRemovedEvents.data()).toEqual([
          {
            jokeId: "joke-111",
          },
        ]);
      });

      it("should throw a configurable error", async () => {
        const jokeRepo = JokeRepo.createNull({
          error: new Error("some error"),
        });

        await expect(jokeRepo.remove(irrelevantId)).rejects.toThrow(
          "some error"
        );
      });
    });
  });
});
