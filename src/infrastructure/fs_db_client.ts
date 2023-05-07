import EventEmitter from "node:events";
import { writeFile } from "node:fs/promises";
import {
  Config as JsonDbConfig,
  JsonDB,
  DatabaseError,
  DataError,
} from "node-json-db";
import { Option, none, some } from "fp-ts/lib/Option";

type FsDbClientOptions = { dbFile: string };
type NullFsDbClientOptions<T> = { items?: Record<string, T>; error?: Error };
type Item = Record<string, unknown>;
type Id = string & { __brand: "Id" };
type JsonDbInterface = Pick<JsonDB, "getData" | "push" | "delete">;

// Error ids used as magic numbers inside node-json-db
const JSON_PARSE_ERROR = 1;
const DATA_PATH_NOT_FOUND = 5;

export function assertValidId(id: unknown): asserts id is Id {
  if (typeof id !== "string") {
    throw new Error(`Expected id to be a string, but got '${typeof id}'.`);
  }

  if (id === "") {
    throw new Error("id cannot be blank");
  }

  if (id.includes("/")) {
    throw new Error(
      `The '/' character is not allowed in item ids. Invalid value was '${id}'.`
    );
  }
}

export class FsDbClient<T extends Item> extends EventEmitter {
  static create<T extends Item>(options: FsDbClientOptions) {
    const jsonDbConfig = new JsonDbConfig(
      options.dbFile,
      /* saveOnPush */ true,
      /* humanReadable */ false,
      /* pathSeparator */ "/"
    );
    const jsonDb = new JsonDB(jsonDbConfig);
    return new FsDbClient<T>(jsonDb, options);
  }

  static createNull<T extends Item>(options?: NullFsDbClientOptions<T>) {
    return new FsDbClient<T>(createJsonDbStub(options), {
      dbFile: "null-file.json",
    });
  }

  static ITEM_STORED = "FsDbClient:item-stored";
  static ITEM_DELETED = "FsDbClient:item-deleted";

  #dbFile: string;
  #jsonDb: JsonDbInterface;

  constructor(jsonDb: JsonDbInterface, options: FsDbClientOptions) {
    super();

    this.#dbFile = options.dbFile;
    this.#jsonDb = jsonDb;
  }

  async listItems(): Promise<T[]> {
    const itemsById = await this.#jsonDb.getData("/");
    return Object.values<T>(itemsById);
  }

  async getItem(id: string): Promise<Option<T>> {
    assertValidId(id);

    try {
      return some(await this.#jsonDb.getData(this.#itemPath(id)));
    } catch (error) {
      if (this.#isDbUninitialized(error)) {
        await this.#initializeDbFile();
        return this.getItem(id);
      }

      if (this.#isItemMissing(error)) {
        return none;
      }

      throw error;
    }
  }

  async putItem(id: string, item: T): Promise<void> {
    assertValidId(id);

    try {
      await this.#jsonDb.push(this.#itemPath(id), item, /* overwrite */ true);
      this.emit(FsDbClient.ITEM_STORED, { id, item });
    } catch (error) {
      if (this.#isDbUninitialized(error)) {
        await this.#initializeDbFile();
        await this.putItem(id, item);
        return;
      }

      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    assertValidId(id);

    try {
      await this.#jsonDb.delete(this.#itemPath(id));
      this.emit(FsDbClient.ITEM_DELETED, { id });
    } catch (error) {
      if (this.#isDbUninitialized(error)) {
        await this.#initializeDbFile();
        await this.deleteItem(id);
        return;
      }

      throw error;
    }
  }

  #itemPath(id: Id) {
    return `/${id}`;
  }

  #isDbUninitialized(error: unknown) {
    return error instanceof DatabaseError && error.id === JSON_PARSE_ERROR;
  }

  #isItemMissing(error: unknown) {
    return error instanceof DataError && error.id === DATA_PATH_NOT_FOUND;
  }

  #initializeDbFile() {
    return writeFile(this.#dbFile, JSON.stringify({}), { encoding: "utf8" });
  }
}

const createJsonDbStub = <T>(
  options: NullFsDbClientOptions<T> | undefined
): JsonDbInterface => {
  return {
    async getData(dataPath) {
      if (options?.error) {
        throw options.error;
      }

      if (dataPath === "/") {
        return options?.items ?? {};
      } else {
        const id = dataPath.substring(1); // remove leading '/'
        const item = options?.items?.[id];

        if (!item) {
          throw new DataError("Can't find dataPath", DATA_PATH_NOT_FOUND);
        }

        return item;
      }
    },

    async push(_dataPath, _data, _override) {
      if (options?.error) {
        throw options.error;
      }
    },

    async delete(_dataPath) {
      if (options?.error) {
        throw options.error;
      }
    },
  };
};
