import { Option } from "fp-ts/lib/Option";
import { Joke, JokeId } from "../domain/joke";
import { FsDbClient } from "./fs-db-client";
import { IJokeRepo, JokeRepoEvent } from "../request-handlers/types";
import { EventEmitter } from "./event-emitter";

type JokeRepoOptions = {
  dbFile: string;
};

type NullJokeRepoOptions = {
  jokes?: Record<string, Joke>;
  error?: Error;
};

export class JokeRepo implements IJokeRepo {
  static create(options: JokeRepoOptions) {
    const fsDbClient = FsDbClient.create<Joke>({ dbFile: options.dbFile });
    return new JokeRepo(fsDbClient);
  }

  static createNull(options?: NullJokeRepoOptions) {
    const fsDbClient = FsDbClient.createNull<Joke>({
      items: options?.jokes,
      error: options?.error,
    });
    return new JokeRepo(fsDbClient);
  }

  #fsDbClient: FsDbClient<Joke>;

  events = new EventEmitter<JokeRepoEvent>();

  constructor(fsDbClient: FsDbClient<Joke>) {
    this.#fsDbClient = fsDbClient;
  }

  async findAll(): Promise<Joke[]> {
    return await this.#fsDbClient.listItems();
  }

  async findByJokeId(jokeId: JokeId): Promise<Option<Joke>> {
    return await this.#fsDbClient.getItem(jokeId);
  }

  async add(joke: Joke): Promise<void> {
    await this.#fsDbClient.putItem(joke.jokeId, joke);
    this.events.emit({
      type: "JokeRepo/joke-added",
      payload: joke,
    });
  }

  async remove(jokeId: JokeId): Promise<void> {
    await this.#fsDbClient.deleteItem(jokeId);
    this.events.emit({
      type: "JokeRepo/joke-removed",
      payload: { jokeId },
    });
  }
}
