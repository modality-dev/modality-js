import { jest, expect, describe, test } from "@jest/globals";

import devnet_static1_config from "../fixtures/devnet-static1/config.json";
import devnet_static1_keys from "../fixtures/devnet-static1/keys.json";
import Keypair from "@modality-dev/utils/Keypair";

import Network from "../src/Network";
import LocalDAG from "../src/LocalDAG";

describe("DevnetStatic1", () => {
  it("should work", async () => {
    const network = new Network(devnet_static1_config);

    // setup sequencer
    const local_dag = await LocalDAG.createInMemory();
    const keypair = await Keypair.fromJSON(devnet_static1_keys[0]);
    await local_dag.setup({keypair});

    // TODO submit events to sequencer
  });
});