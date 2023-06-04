import { Option } from "fp-ts/lib/Option";
import { Joke, JokeId } from "../domain/joke";

export interface InfrastructureEvent<
  TPrefix extends string,
  TName extends string
> {
  type: `${TPrefix}/${TName}`;
  payload: unknown;
}

export type EventListener<TEvent extends InfrastructureEvent<string, string>> =
  (event: TEvent) => void;

export interface IEventEmitter<
  TEvent extends InfrastructureEvent<string, string>
> {
  addListener(listener: EventListener<TEvent>): () => void;
  removeListener(listener: EventListener<TEvent>): void;
  emit(myEvent: TEvent): void;
}

export interface IUuid {
  uuidV4(): string;
}

export interface JokeAddedEvent
  extends InfrastructureEvent<"JokeRepo", "joke-added"> {
  payload: Joke;
}
export interface JokeRemovedEvent
  extends InfrastructureEvent<"JokeRepo", "joke-removed"> {
  payload: { jokeId: JokeId };
}
export type JokeRepoEvent = JokeAddedEvent | JokeRemovedEvent;

export interface IJokeRepo {
  events: IEventEmitter<JokeRepoEvent>;
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
