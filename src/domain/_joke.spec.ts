import { describe, expect, it } from "vitest";
import { JokeId, createJokeId, validateJoke } from "./joke";
import { createJoke } from "../spec-helpers/factories";
import { match, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

describe("createJokeId", () => {
  it("should transform the given input to a JokeId", () => {
    const jokeId: JokeId = createJokeId("my-id");
    expect(jokeId).toEqual("my-id");
  });

  it("should reject empty strings", () => {
    expect(() => createJokeId("")).toThrow("JokeId cannot be empty");
  });
});

describe("validateJoke", () => {
  it("should return success when input data is a valid joke", () => {
    const input = createJoke();

    const result = validateJoke(input);

    expect(result).toEqual(right(input));
  });

  it("should remove unexpcted properties", () => {
    const input = {
      ...createJoke(),
      foo: "i don't belong",
    };

    pipe(
      validateJoke(input),
      match(
        (error) => {
          expect.fail(`Expected result but got error '${error.message}'`);
        },
        (result) => {
          expect(result).not.toHaveProperty("foo");
        }
      )
    );
  });

  it("should reject the input when joke is invalid", () => {
    const input = {
      jokeId: 123,
      question: undefined,
      answer: [],
    };

    pipe(
      validateJoke(input),
      match(
        (error) => {
          expect(error.message).toEqual("Joke data is invalid. No joke!");
        },
        () => {
          expect.fail("Expected input to be rejected");
        }
      )
    );
  });
});
