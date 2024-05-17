import { jest, expect, describe, test } from "@jest/globals";
import Network from "./Network";

import devnet_static1 from "../fixtures/devnet-static1/config.json";

describe("Network", () => {
  it("should work", async () => {
    const network = new Network(devnet_static1);
    let sequencers = await network.getSequencersForEpoch(1);
    expect(sequencers.length).toBe(1);
    sequencers = await network.getSequencersForEpoch(100);
    expect(sequencers.length).toBe(1);
  });
});