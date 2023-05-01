import { Infrastructure } from "../request-handlers/types";
import { JokeRepo } from "./joke-repo";
import { Uuid } from "./uuid";

export type InfrastructureOptions = {
  dbFile: string;
};

export const create = (options: InfrastructureOptions): Infrastructure => {
  return {
    uuid: Uuid.create(),
    jokeRepo: JokeRepo.create({ dbFile: options.dbFile }),
  };
};
