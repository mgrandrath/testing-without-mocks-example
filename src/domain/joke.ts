export type JokeId = string & { __brand: "JokeId" };

export type Joke = {
  jokeId: JokeId;
  question: string;
  answer: string;
};

export const createJokeId = (jokeId: string): JokeId => jokeId as JokeId;
