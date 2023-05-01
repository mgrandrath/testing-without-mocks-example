import { afterEach, beforeEach, describe, expect, it } from "vitest";
import tmp from "tmp";
import { FsDbClient } from "./fs_db_client";

type TmpFile = {
  path: string;
  cleanup: () => void;
};

const createTmpDbFile = () => {
  return new Promise<TmpFile>((resolve, reject) => {
    tmp.file(
      { prefix: "test", postfix: ".db" },
      (error, path, _fd, cleanup) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({ path, cleanup });
      }
    );
  });
};

describe("FsDbClient", () => {
  let tmpFile: TmpFile;

  beforeEach(async () => {
    tmpFile = await createTmpDbFile();
  });

  afterEach(() => {
    tmpFile.cleanup();
  });

  it("should return `null` when a given id does not exist", async () => {
    type Item = { myId: string };
    const fsDbClient = FsDbClient.create<Item>({
      dbFile: tmpFile.path,
      idProp: "myId",
    });

    const retrievedItem = await fsDbClient.getItem("id-that-does-not-exist");

    expect(retrievedItem).toEqual(null);
  });

  it("should read and write a single item", async () => {
    type Item = { myId: string; someString: string; numberProp: number };
    const fsDbClient = FsDbClient.create<Item>({
      dbFile: tmpFile.path,
      idProp: "myId",
    });

    await fsDbClient.putItem({
      myId: "item-111",
      someString: "this is a string",
      numberProp: 123,
    });

    const retrievedItem = await fsDbClient.getItem("item-111");

    expect(retrievedItem).toEqual({
      myId: "item-111",
      someString: "this is a string",
      numberProp: 123,
    });
  });

  it("should replace an existing item", async () => {
    type Item = { myId: string; payload?: string; data?: string };
    const fsDbClient = FsDbClient.create<Item>({
      dbFile: tmpFile.path,
      idProp: "myId",
    });

    await fsDbClient.putItem({
      myId: "item-111",
      payload: "this is my payload",
    });
    await fsDbClient.putItem({
      myId: "item-111",
      data: "this is my data",
    });

    const retrievedItem = await fsDbClient.getItem("item-111");

    expect(retrievedItem).toEqual({
      myId: "item-111",
      data: "this is my data",
    });
  });

  it("should throw when item id contains reserved character '/'", async () => {
    type Item = { myId: string };
    const fsDbClient = FsDbClient.create<Item>({
      dbFile: tmpFile.path,
      idProp: "myId",
    });

    await expect(() =>
      fsDbClient.putItem({ myId: "this/is/invalid" })
    ).rejects.toThrow("The '/' character is not allowed in item ids");
  });

  it("should return a list of all items", async () => {
    type Item = { someId: string; someMessage: string };
    const fsDbClient = FsDbClient.create<Item>({
      dbFile: tmpFile.path,
      idProp: "someId",
    });

    await fsDbClient.putItem({
      someId: "item-111",
      someMessage: "I am item 1",
    });
    await fsDbClient.putItem({
      someId: "item-222",
      someMessage: "I am item 2",
    });
    await fsDbClient.putItem({
      someId: "item-333",
      someMessage: "I am item 3",
    });

    const retrievedItems = await fsDbClient.listItems();

    expect(retrievedItems).toEqual([
      {
        someId: "item-111",
        someMessage: "I am item 1",
      },
      {
        someId: "item-222",
        someMessage: "I am item 2",
      },
      {
        someId: "item-333",
        someMessage: "I am item 3",
      },
    ]);
  });

  it("should delete items", async () => {
    type Item = { myId: string; data: string };
    const fsDbClient = FsDbClient.create<Item>({
      dbFile: tmpFile.path,
      idProp: "myId",
    });

    await fsDbClient.putItem({
      myId: "item-111",
      data: "I am item 1",
    });
    await fsDbClient.putItem({
      myId: "item-222",
      data: "I am item 2",
    });

    await fsDbClient.deleteItem("item-111");

    const retrievedItems = await fsDbClient.listItems();
    expect(retrievedItems).toEqual([
      {
        myId: "item-222",
        data: "I am item 2",
      },
    ]);
  });
});
