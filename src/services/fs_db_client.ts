import { writeFile } from "node:fs/promises";
import {
  Config as JsonDbConfig,
  JsonDB,
  DatabaseError,
  DataError,
} from "node-json-db";

type FsDbClientOptions = { dbFile: string; idProp: string };
type Item = Record<string, unknown>;
type Id = string & { __brand: "Id" };

// Error ids used as magic numbers inside node-json-db
const JSON_PARSE_ERROR = 1;
const DATA_PATH_NOT_FOUND = 5;

export class FsDbClient<T extends Item> {
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

  #idProp: string;
  #dbFile: string;
  #jsonDb: JsonDB;

  constructor(jsonDb: JsonDB, options: FsDbClientOptions) {
    this.#idProp = options.idProp;
    this.#dbFile = options.dbFile;
    this.#jsonDb = jsonDb;
  }

  async listItems(): Promise<T[]> {
    const itemsById = await this.#jsonDb.getData("/");
    return Object.values<T>(itemsById);
  }

  async getItem(id: string): Promise<T | null> {
    this.#assertValidId(id);

    try {
      return await this.#jsonDb.getData(this.#itemPath(id));
    } catch (error) {
      if (this.#isDbUninitialized(error)) {
        await this.#initializeDbFile();
        return this.getItem(id);
      }

      if (this.#isItemMissing(error)) {
        return null;
      }

      throw error;
    }
  }

  async putItem(item: T): Promise<void> {
    const id = item[this.#idProp];
    this.#assertValidId(id);

    try {
      await this.#jsonDb.push(this.#itemPath(id), item, /* overwrite */ true);
    } catch (error) {
      if (this.#isDbUninitialized(error)) {
        await this.#initializeDbFile();
        await this.putItem(item);
        return;
      }

      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    this.#assertValidId(id);
    await this.#jsonDb.delete(this.#itemPath(id));
  }

  #itemPath(id: Id) {
    return `/${id}`;
  }

  #assertValidId(id: unknown): asserts id is Id {
    if (typeof id !== "string" || id.match(/\//)) {
      throw new Error("The '/' character is not allowed in item ids");
    }
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
