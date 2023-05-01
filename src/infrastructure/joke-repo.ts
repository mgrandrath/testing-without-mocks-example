import EventEmitter from "node:events";
import { Option } from "fp-ts/lib/Option";
import { Joke, JokeId } from "../domain/joke";
import { FsDbClient } from "./fs_db_client";
import { IJokeRepo } from "../request-handlers/types";

type JokeRepoOptions = {
  dbFile: string;
};

type NullJokeRepoOptions = {
  jokes: Record<string, Joke>;
};

export class JokeRepo extends EventEmitter implements IJokeRepo {
  static create(options: JokeRepoOptions) {
    const fsDbClient = FsDbClient.create<Joke>({ dbFile: options.dbFile });
    return new JokeRepo(fsDbClient);
  }

  static createNull(options?: NullJokeRepoOptions) {
    const fsDbClient = FsDbClient.createNull<Joke>({
      items: options?.jokes,
    });
    return new JokeRepo(fsDbClient);
  }

  static JOKE_ADDED: "JokeRepo:joke-added";
  static JOKE_REMOVED: "JokeRepo:joke-removed";

  #fsDbClient: FsDbClient<Joke>;

  constructor(fsDbClient: FsDbClient<Joke>) {
    super();

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
    this.emit(JokeRepo.JOKE_ADDED, joke);
  }

  async remove(jokeId: JokeId): Promise<void> {
    await this.#fsDbClient.deleteItem(jokeId);
    this.emit(JokeRepo.JOKE_REMOVED, { jokeId });
  }
}
