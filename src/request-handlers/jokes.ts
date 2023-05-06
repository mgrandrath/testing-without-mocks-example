import { match as matchOption } from "fp-ts/lib/Option";
import { match as matchEither } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import {
  Joke,
  ValidationError,
  createJokeId,
  validateJoke,
} from "../domain/joke";
import { RequestHandler, Response } from "./types";
import { badRequest, created, noContent, notFound, ok } from "./responses";

export type JokeInput = Omit<Joke, "jokeId">;

export const index: RequestHandler = async (infrastructure, _request) => {
  const jokes = await infrastructure.jokeRepo.findAll();
  return ok({ jokes });
};

export const show: RequestHandler = async (infrastructure, request) => {
  const jokeId = createJokeId(request.params.jokeId);

  return pipe(
    await infrastructure.jokeRepo.findByJokeId(jokeId),
    matchOption(
      () => notFound(),
      (joke) => ok({ joke })
    )
  );
};

export const create: RequestHandler = async (infrastructure, request) => {
  const jokeInput = request.data;
  const jokeId = createJokeId(infrastructure.uuid.uuidV4());

  return pipe(
    validateJoke({ ...jokeInput, jokeId }),
    matchEither<ValidationError, Joke, Response | Promise<Response>>(
      (validationError) => badRequest({ message: validationError.message }),
      async (joke) => {
        await infrastructure.jokeRepo.add(joke);
        return created({ joke });
      }
    )
  );
};

export const update: RequestHandler = async (infrastructure, request) => {
  const jokeId = createJokeId(request.params.jokeId);
  const jokeInput = request.data;

  return pipe(
    validateJoke({ ...jokeInput, jokeId }),
    matchEither<ValidationError, Joke, Response | Promise<Response>>(
      (validationError) => badRequest({ message: validationError.message }),
      async (joke) => {
        await infrastructure.jokeRepo.add(joke);
        return noContent();
      }
    )
  );
};

export const destroy: RequestHandler = async (infrastructure, request) => {
  const jokeId = createJokeId(request.params.jokeId);
  await infrastructure.jokeRepo.remove(jokeId);
  return noContent();
};
