import EventEmitter from "node:events";
import { Option } from "fp-ts/lib/Option";
import { Joke, JokeId } from "../domain/joke";

export interface IUuid {
  uuidV4(): string;
}

export interface IJokeRepo extends EventEmitter {
  findAll(): Promise<Joke[]>;
  findByJokeId(jokeId: JokeId): Promise<Option<Joke>>;
  add(joke: Joke): Promise<void>;
  remove(jokeId: JokeId): Promise<void>;
}

export type Infrastructure = {
  uuid: IUuid;
  jokeRepo: IJokeRepo;
};

export type Request = {
  params: Record<string, string>;
  data: object | null;
};

export type Response = {
  status: number;
  data: object | null;
};

export type RequestHandler = (
  infrastructure: Infrastructure,
  request: Request
) => Promise<Response>;
