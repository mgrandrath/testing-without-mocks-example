import { Option } from "fp-ts/lib/Option";
import { Joke, JokeId } from "../domain/joke";
import { FsDbClient } from "./fs_db_client";

export class JokeRepo {
  #fsDbClient: FsDbClient<Joke>;

  constructor(fsDbClient: FsDbClient<Joke>) {
    this.#fsDbClient = fsDbClient;
  }

  async findAll() {
    return await this.#fsDbClient.listItems();
  }

  async findByJokeId(jokeId: string): Promise<Option<Joke>> {
    return await this.#fsDbClient.getItem(jokeId);
  }

  async add(joke: Joke) {
    await this.#fsDbClient.putItem(joke.jokeId, joke);
  }

  async remove(jokeId: JokeId) {
    await this.#fsDbClient.deleteItem(jokeId);
  }
}
