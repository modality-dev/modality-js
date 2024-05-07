import { expect, describe, test } from "@jest/globals";

import createTestNode from "../../createTestNode";
import node1_config from "../../../fixtures/configs/node1.json";
import node2_config from "../../../fixtures/configs/node2.json";

import { addSequencerEventListeners } from "../../../src/gossip";

describe("reqres /consensus/status", () => {
  it("should work", async () => {
    const node1 = await createTestNode(node1_config);
    const node2 = await createTestNode(node2_config);

    await addSequencerEventListeners(node1);
    await addSequencerEventListeners(node2);

    const r = await node1.services.reqres.call(node2.peerId, "/consensus/status", { data: "data" });
    expect(r.ok).toBe(true);
  });
});