import { v4 as realUuidV4 } from "uuid";
import { IUuid } from "../request-handlers/types";

type NullUuidOptions = string | string[] | undefined;

export class Uuid implements IUuid {
  static create() {
    return new Uuid(realUuidV4);
  }

  static createNull(options?: NullUuidOptions) {
    return new Uuid(createUuidStub(options));
  }

  #uuidV4: () => string;

  constructor(uuidV4: () => string) {
    this.#uuidV4 = uuidV4;
  }

  uuidV4(): string {
    return this.#uuidV4();
  }
}

const createUuidStub: (options: NullUuidOptions) => () => string = (
  options
) => {
  return () => {
    if (Array.isArray(options)) {
      const uuid = options.shift();
      if (!uuid) {
        throw new Error("Uuid: Null instance ran out of configured Uuids");
      }
      return uuid;
    } else {
      return options ?? "00000000-0000-0000-0000-000000000000";
    }
  };
};
