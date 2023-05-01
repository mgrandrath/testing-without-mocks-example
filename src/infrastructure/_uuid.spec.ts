import { describe, expect, it } from "vitest";
import { Uuid } from "./uuid";

describe("Uuid", () => {
  describe("uuidV4", () => {
    it("should return a uuid v4", () => {
      const uuid = Uuid.create();
      const result = uuid.uuidV4();

      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    describe("null instance", () => {
      it("should return a default uuid", () => {
        const uuid = Uuid.createNull();
        const result = uuid.uuidV4();

        expect(result).toEqual("00000000-0000-0000-0000-000000000000");
      });

      it("should return a configurable uuid", () => {
        const uuid = Uuid.createNull("1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed");
        const result = uuid.uuidV4();

        expect(result).toEqual("1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed");
      });

      it("should return a configurable list of uuids", () => {
        const uuid = Uuid.createNull([
          "4646149f-3d3e-491d-bd68-7f20a9f8f679",
          "5205a6ad-898d-4476-906b-2dce69c20aa9",
          "75bc8dc5-8127-4bf4-be5d-9ece0d4412ec",
        ]);

        expect(uuid.uuidV4()).toEqual("4646149f-3d3e-491d-bd68-7f20a9f8f679");
        expect(uuid.uuidV4()).toEqual("5205a6ad-898d-4476-906b-2dce69c20aa9");
        expect(uuid.uuidV4()).toEqual("75bc8dc5-8127-4bf4-be5d-9ece0d4412ec");
      });

      it("should throw an error when the list of configured uuids runs out", () => {
        const uuid = Uuid.createNull([
          "4646149f-3d3e-491d-bd68-7f20a9f8f679",
          "5205a6ad-898d-4476-906b-2dce69c20aa9",
        ]);

        expect(uuid.uuidV4()).toEqual(expect.any(String));
        expect(uuid.uuidV4()).toEqual(expect.any(String));
        expect(() => uuid.uuidV4()).toThrow(
          "Uuid: Null instance ran out of configured Uuids"
        );
      });
    });
  });
});
