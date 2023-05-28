import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isNone, some } from "fp-ts/lib/Option";
import { FsDbClient, assertValidId } from "./fs_db_client";
import { recordEvents } from "../spec-helpers/record-events";
import { TmpFile, createTmpDbFile } from "../spec-helpers/tmp-file";

describe("assertValidId", () => {
  it("should throw when item id is not a string", () => {
    expect(() => assertValidId(123)).toThrow(
      "Expected id to be a string, but got 'number'."
    );
  });

  it("should throw when item id is blank", async () => {
    expect(() => assertValidId("")).toThrow("id cannot be blank");
  });

  it("should throw when item id contains reserved character '/'", () => {
    expect(() => assertValidId("this/is/invalid")).toThrow(
      "The '/' character is not allowed in item ids. Invalid value was 'this/is/invalid'."
    );
  });
});

describe("FsDbClient", () => {
  describe("real instance", () => {
    let tmpFile: TmpFile;

    beforeEach(async () => {
      tmpFile = await createTmpDbFile();
    });

    afterEach(() => {
      tmpFile.cleanup();
    });

    it("should return `None` when a given id does not exist", async () => {
      type Item = { myId: string };
      const fsDbClient = FsDbClient.create<Item>({
        dbFile: tmpFile.path,
      });

      const retrievedItem = await fsDbClient.getItem("id-that-does-not-exist");

      expect(isNone(retrievedItem)).toEqual(true);
    });

    it("should read and write a single item", async () => {
      type Item = { someString: string; numberProp: number };
      const fsDbClient = FsDbClient.create<Item>({
        dbFile: tmpFile.path,
      });

      await fsDbClient.putItem("item-111", {
        someString: "this is a string",
        numberProp: 123,
      });

      const retrievedItem = await fsDbClient.getItem("item-111");

      expect(retrievedItem).toEqual(
        some({
          someString: "this is a string",
          numberProp: 123,
        })
      );
    });

    it("should replace an existing item", async () => {
      type Item = { payload?: string; data?: string };
      const fsDbClient = FsDbClient.create<Item>({
        dbFile: tmpFile.path,
      });

      await fsDbClient.putItem("item-111", {
        payload: "this is my payload",
      });
      await fsDbClient.putItem("item-111", {
        data: "this is my data",
      });

      const retrievedItem = await fsDbClient.getItem("item-111");

      expect(retrievedItem).toEqual(
        some({
          data: "this is my data",
        })
      );
    });

    it("should return a list of all items", async () => {
      type Item = { someMessage: string };
      const fsDbClient = FsDbClient.create<Item>({
        dbFile: tmpFile.path,
      });

      await fsDbClient.putItem("item-111", {
        someMessage: "I am item 1",
      });
      await fsDbClient.putItem("item-222", {
        someMessage: "I am item 2",
      });
      await fsDbClient.putItem("item-333", {
        someMessage: "I am item 3",
      });

      const retrievedItems = await fsDbClient.listItems();

      expect(retrievedItems).toEqual([
        {
          someMessage: "I am item 1",
        },
        {
          someMessage: "I am item 2",
        },
        {
          someMessage: "I am item 3",
        },
      ]);
    });

    it("should delete items", async () => {
      type Item = { data: string };
      const fsDbClient = FsDbClient.create<Item>({
        dbFile: tmpFile.path,
      });

      await fsDbClient.putItem("item-111", {
        data: "I am item 1",
      });
      await fsDbClient.putItem("item-222", {
        data: "I am item 2",
      });

      await fsDbClient.deleteItem("item-111");

      const retrievedItems = await fsDbClient.listItems();
      expect(retrievedItems).toEqual([
        {
          data: "I am item 2",
        },
      ]);
    });

    it("should not fail when item does not exist", async () => {
      type Item = { data: string };
      const fsDbClient = FsDbClient.create<Item>({
        dbFile: tmpFile.path,
      });

      // test fails if this throws an error
      await fsDbClient.deleteItem("item-111");
    });
  });

  describe("null instance", () => {
    it("should not write to the filesystem", async () => {
      type Item = { myData: string };
      const fsDbClient = FsDbClient.createNull<Item>();

      await fsDbClient.putItem("item-111", { myData: "data 1" });
      await fsDbClient.putItem("item-222", { myData: "data 2" });
      await fsDbClient.putItem("item-333", { myData: "data 3" });

      expect(await fsDbClient.listItems()).toEqual([]);
      expect(isNone(await fsDbClient.getItem("item-111"))).toEqual(true);
      // test fails if this throws an error
      await fsDbClient.deleteItem("item-111");
    });

    describe("getItem", () => {
      it("should respond with a configured item", async () => {
        type Item = { id: string; data: number };
        const fsDbClient = FsDbClient.createNull<Item>({
          items: {
            "item-111": {
              id: "item-111",
              data: 111,
            },
            "item-222": {
              id: "item-222",
              data: 222,
            },
          },
        });

        expect(await fsDbClient.getItem("item-111")).toEqual(
          some({
            id: "item-111",
            data: 111,
          })
        );
      });

      it("should throw a configurable error", async () => {
        const fsDbClient = FsDbClient.createNull({
          error: new Error("some error"),
        });

        await expect(fsDbClient.getItem("irrelevant-id")).rejects.toThrow(
          "some error"
        );
      });
    });

    describe("listItems", () => {
      it("should respond with configured items", async () => {
        type Item = { id: string; data: number };
        const fsDbClient = FsDbClient.createNull<Item>({
          items: {
            "item-111": {
              id: "item-111",
              data: 111,
            },
            "item-222": {
              id: "item-222",
              data: 222,
            },
          },
        });

        expect(await fsDbClient.listItems()).toEqual([
          {
            id: "item-111",
            data: 111,
          },
          {
            id: "item-222",
            data: 222,
          },
        ]);
      });

      it("should throw a configurable error", async () => {
        const fsDbClient = FsDbClient.createNull({
          error: new Error("some error"),
        });

        await expect(fsDbClient.listItems()).rejects.toThrow("some error");
      });
    });

    describe("putItem", () => {
      it("should emit an event when an item has been stored", async () => {
        type Item = { data: string };
        const fsDbClient = FsDbClient.createNull<Item>();
        const itemStoredEvents = recordEvents(fsDbClient.events.itemStored);

        await fsDbClient.putItem("item-111", {
          data: "some data",
        });

        expect(itemStoredEvents.data()).toEqual([
          {
            id: "item-111",
            item: {
              data: "some data",
            },
          },
        ]);
      });

      it("should throw a configurable error", async () => {
        const fsDbClient = FsDbClient.createNull({
          error: new Error("some error"),
        });

        await expect(fsDbClient.putItem("irrelevant-id", {})).rejects.toThrow(
          "some error"
        );
      });
    });

    describe("deleteItem", () => {
      it("should emit an event when an item has been deleted", async () => {
        type Item = { data: string };
        const fsDbClient = FsDbClient.createNull<Item>();
        const itemDeletedEvents = recordEvents(fsDbClient.events.itemDeleted);

        await fsDbClient.deleteItem("item-111");

        expect(itemDeletedEvents.data()).toEqual([{ id: "item-111" }]);
      });

      it("should throw a configurable error", async () => {
        const fsDbClient = FsDbClient.createNull({
          error: new Error("some error"),
        });

        await expect(fsDbClient.deleteItem("irrelevant-id")).rejects.toThrow(
          "some error"
        );
      });
    });
  });
});
