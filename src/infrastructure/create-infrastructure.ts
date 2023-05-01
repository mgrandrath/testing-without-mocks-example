import { JokeRepo } from "./joke-repo";

export type Infrastructure = {
  jokeRepo: JokeRepo;
};

export const createNullInfrastructure: (
  overrides?: Partial<Infrastructure>
) => Infrastructure = (overrides) => {
  return {
    jokeRepo: JokeRepo.createNull(),
    ...overrides,
  };
};
