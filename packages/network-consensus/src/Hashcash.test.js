import { jest, expect, describe, test } from "@jest/globals";
import * as Hashcash from "./Hashcash";

describe("Hashcash", () => {
  it("should work", async () => {
    const data = "data";
    const difficulty = 500;
    const nonce = await Hashcash.mine({
      data,
      difficulty,
    });
    expect(nonce).toBeTruthy();
    const validated = await Hashcash.validateNonce({
      data,
      difficulty,
      nonce,
    });
    expect(validated).toBe(true);
  });
});
