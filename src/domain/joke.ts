import { Either, left, right } from "fp-ts/lib/Either";

export type JokeId = string & { __brand: "JokeId" };

export type Joke = {
  jokeId: JokeId;
  question: string;
  answer: string;
};

export type ValidationError = {
  message: string;
};

export const createJokeId = (jokeId: string): JokeId => {
  if (!jokeId) {
    throw new Error("JokeId cannot be empty");
  }

  return jokeId as JokeId;
};

export const validateJoke = (data: unknown): Either<ValidationError, Joke> => {
  if (
    !data ||
    typeof data !== "object" ||
    !("jokeId" in data) ||
    typeof data.jokeId !== "string" ||
    !("question" in data) ||
    typeof data.question !== "string" ||
    !("answer" in data) ||
    typeof data.answer !== "string"
  ) {
    return left({ message: "Joke data is invalid. No joke!" });
  }

  return right({
    jokeId: createJokeId(data.jokeId),
    question: data.question,
    answer: data.answer,
  });
};
