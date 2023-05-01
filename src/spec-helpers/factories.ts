import { Joke, createJokeId } from "../domain/joke";

export const createJoke = (overrides: Partial<Joke>): Joke => ({
  jokeId: createJokeId("factory-joke-111"),
  question: "Some factory question",
  answer: "Some factory answer",
  ...overrides,
});
