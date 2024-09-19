import { jest, expect, describe, test, it } from "@jest/globals";

import createTestNode from "../../createTestNode";
import node1_config from "../../../fixtures/configs/node1.json";
import node2_config from "../../../fixtures/configs/node2.json";

import { addSequencerEventListeners } from "../../../src/gossip/index.js";
import { attachDatastore } from "../../../src/storage.js";

describe("gossip /consensus/scribes", () => {
  it("should work", async () => {
    const node1 = await createTestNode(node1_config);
    await addSequencerEventListeners(node1);
    await attachDatastore(node1, node1_config);

    const node2 = await createTestNode(node2_config);
    await addSequencerEventListeners(node2);
    await attachDatastore(node2, node2_config);

    const mockListener = jest.fn();
    node2.services.pubsub.addEventListener("message", mockListener);

    const vertex = {}; // TODO await node1.storage.local_dag.createVertex([{}, {}, {}]);
    await node1.services.pubsub.publish(
      "/consensus/scribes",
      new TextEncoder().encode(JSON.stringify(vertex))
    );

    expect(mockListener).toHaveBeenCalled();
  });
});
