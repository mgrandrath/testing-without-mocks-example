import { JokeRepo } from "./joke-repo";
import { Uuid } from "./uuid";

type InfrastructureOptions = {
  dbFile: string;
};

export type Infrastructure = {
  uuid: Uuid;
  jokeRepo: JokeRepo;
};

export const createInfrastructure = (
  options: InfrastructureOptions
): Infrastructure => {
  return {
    uuid: Uuid.create(),
    jokeRepo: JokeRepo.create({ dbFile: options.dbFile }),
  };
};
