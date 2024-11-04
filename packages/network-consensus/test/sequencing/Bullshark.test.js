import { jest, expect, describe, test, it } from "@jest/globals";

import { setTimeout as setTimeoutPromise } from 'timers/promises';

import Keypair from "@modality-dev/utils/Keypair";
import Page from "@modality-dev/network-datastore/data/Page";
import Round from "@modality-dev/network-datastore/data/Round";

import Devnet from "@modality-dev/network-configs/Devnet";

import Bullshark from "../../src/sequencing/Bullshark";
import RoundRobin from "../../src/election/RoundRobin";

import SequencerTesting from "./SequencerTesting";

describe("Bullshark", () => {
  // to make testing easy to understand
  // round robin is used to elect leaders

  test("run sequencers", async () => {
    const NODE_COUNT = 9;
    const my_seq_id = Devnet.peeridOf(0);

    const st = await SequencerTesting.setup({node_count: NODE_COUNT, SequencerModule: Bullshark, RandomnessModule: RoundRobin});
    await st.runUntilRound(9);
    const seq1 = st.getSequencer(my_seq_id);

    const leader1 = await seq1.findLeaderInRound(1);
    expect(leader1).not.toBeNull();
    const leader5 = await seq1.findLeaderInRound(5);
    expect(leader5).not.toBeNull();
    const pages = await seq1.findOrderedPagesInSection(null, 5);
    expect(pages.length).toBe(NODE_COUNT * 4 + 1);
  });

  test("given f = 1, one bad sequencer not elected leader, network can sequence", async () => {
    const NODE_COUNT = 4;
    const BAD_NODE_COUNT = 1;
    const my_seq_id = Devnet.peeridOf(0);
    const offline_seq_id = Devnet.peeridOf(3);

    const st = await SequencerTesting.setup({node_count: NODE_COUNT, SequencerModule: Bullshark, RandomnessModule: RoundRobin});
    st.communication.offline_sequencers = [offline_seq_id];
    await st.runUntilRound(9);

    const seq1 = st.getSequencer(my_seq_id);
    const leader1 = await seq1.findLeaderInRound(1);
    expect(leader1).not.toBeNull();
    const leader5 = await seq1.findLeaderInRound(5);
    expect(leader5).not.toBeNull();
    const pages = await seq1.findOrderedPagesInSection(null, 5);
    expect(pages.length).toBe((NODE_COUNT - BAD_NODE_COUNT) * 4 + 1 + BAD_NODE_COUNT);
  });

  test("given f = 0, one bad sequence, network stalls", async () => {
    const NODE_COUNT = 3;
    const BAD_NODE_COUNT = 1;
    const offline_seq_id = Devnet.peeridOf(NODE_COUNT - 1);

    const st = await SequencerTesting.setup({node_count: NODE_COUNT, SequencerModule: Bullshark, RandomnessModule: RoundRobin});
    st.communication.offline_sequencers = [offline_seq_id];

    const abortController = new AbortController();
    setTimeoutPromise(3000).then(() => { abortController.abort() });    
    await expect(st.runUntilRound(9, abortController.signal)).rejects.toThrow("aborted");
  });
});
