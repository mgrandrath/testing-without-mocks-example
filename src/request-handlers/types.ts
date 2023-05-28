import { Option } from "fp-ts/lib/Option";
import { Joke, JokeId } from "../domain/joke";
import { EventEmitter } from "../utils/event-emitter";

export interface IUuid {
  uuidV4(): string;
}

export type JokeAddedEvent = Joke;
export type JokeRemovedEvent = { jokeId: JokeId };

export interface IJokeRepo {
  events: {
    jokeAdded: EventEmitter<JokeAddedEvent>;
    jokeRemoved: EventEmitter<JokeRemovedEvent>;
  };
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
