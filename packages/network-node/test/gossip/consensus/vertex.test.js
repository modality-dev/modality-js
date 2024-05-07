import { jest, expect, describe, test } from "@jest/globals";

import createTestNode from "../../createTestNode";
import node1_config from "../../../fixtures/configs/node1.json";
import node2_config from "../../../fixtures/configs/node2.json";

describe("gossip /gossip/vertex", () => {
  it("should work", async () => {
    const node1 = await createTestNode(node1_config);
    const node2 = await createTestNode(node2_config);

    await node1.services.pubsub.subscribe("/gossip/vertex");
    await node2.services.pubsub.subscribe("/gossip/vertex");

    const mockListener = jest.fn();
    node2.services.pubsub.addEventListener('message', mockListener);  

    await node1.services.pubsub.publish("/gossip/vertex", { data: "data" });
    expect(mockListener).toHaveBeenCalled();
  });
});