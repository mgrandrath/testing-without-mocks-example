import { v4 as uuid } from "uuid";
import { Joke, createJokeId } from "../domain/joke";
import { Request } from "../request-handlers/request";
import { JokeInput } from "../request-handlers/jokes";

export const createRequest = (overrides?: Partial<Request>): Request => ({
  params: {},
  data: null,
  ...overrides,
});

export const createJokeInput = (overrides?: Partial<JokeInput>): JokeInput => ({
  question: "Some factory question",
  answer: "Some factory answer",
  ...overrides,
});

export const createJoke = (overrides?: Partial<Joke>): Joke => ({
  jokeId: createJokeId(uuid()),
  question: "Some factory question",
  answer: "Some factory answer",
  ...overrides,
});
