import { JokeRepo } from "./joke-repo";
import { Uuid } from "./uuid";

export type Infrastructure = {
  uuid: Uuid;
  jokeRepo: JokeRepo;
};

export const createNullInfrastructure: (
  overrides?: Partial<Infrastructure>
) => Infrastructure = (overrides) => {
  return {
    uuid: Uuid.createNull(),
    jokeRepo: JokeRepo.createNull(),
    ...overrides,
  };
};
