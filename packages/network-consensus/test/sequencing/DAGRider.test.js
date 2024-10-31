import { jest, expect, describe, test, it } from "@jest/globals";

import { setTimeout as setTimeoutPromise } from 'timers/promises';

import Page from "@modality-dev/network-datastore/data/Page";

import NetworkDatastoreBuilder from "@modality-dev/network-datastore/NetworkDatastoreBuilder";

import Devnet from "@modality-dev/network-configs/Devnet";

import DAGRider from "../../src/sequencing/DAGRider";
import RoundRobin from "../../src/election/RoundRobin";

import SequencerTesting from "./SequencerTesting";

describe("DAGRider", () => {
  // to make testing easy to understand
  // round robin is used to elect leaders
  const randomness = new RoundRobin();

  // when rounds are fully connected, pages a few rounds back can be sequenced
  // in particular,
  test("sequencing given fully connected rounds", async () => {
    const NODE_COUNT = 3;
    let pages, page, page1;

    // setup
    const scribes = await Devnet.getPubkeys(NODE_COUNT);
    const scribe_keypairs = await Devnet.getKeypairsDict(NODE_COUNT);
    const ds_builder = await NetworkDatastoreBuilder.createInMemory();
    const binder = new DAGRider({
      datastore: ds_builder.datastore,
      randomness,
    });
    ds_builder.scribes = [...scribes];
    ds_builder.scribe_keypairs = scribe_keypairs;

    // round 1
    await ds_builder.addFullyConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).toBeNull();

    // round 2
    await ds_builder.addFullyConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();

    // round 3
    await ds_builder.addFullyConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(3);
    expect(page).toBeNull();

    // round 4
    await ds_builder.addFullyConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).not.toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(3);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(4);
    expect(page).toBeNull();
    pages = await binder.findOrderedPagesInSection(null, 1);
    expect(pages.length).toBe(1); // first section is only one page
    expect(pages.at(-1).scribe).toBe(page1.scribe);

    // round 8
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    pages = await binder.findOrderedPagesInSection(1, 5);
    expect(pages.length).toBe(4 * NODE_COUNT);
    expect(pages.at(-1).scribe).toBe(scribes[1]);

    // round 12
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    pages = await binder.findOrderedPagesInSection(5, 9);
    expect(pages.length).toBe(4 * NODE_COUNT);
    expect(pages.at(-1).scribe).toBe(scribes[2]);

    // round 16
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    await ds_builder.addFullyConnectedRound();
    pages = await binder.findOrderedPagesInSection(9, 13);
    expect(pages.length).toBe(4 * NODE_COUNT);
    expect(pages.at(-1).scribe).toBe(scribes[0]);

    let leaders = await binder.findOrderedLeadersBetween(1, 16);
    expect(leaders.length).toBe(4);
  });

  test("sequencing given consensus threshold connected rounds", async () => {
    const NODE_COUNT = 5;
    let pages, page, page1;

    // setup
    const scribes = await Devnet.getPubkeys(NODE_COUNT);
    const scribe_keypairs = await Devnet.getKeypairsDict(NODE_COUNT);
    const ds_builder = await NetworkDatastoreBuilder.createInMemory();
    const binder = new DAGRider({
      datastore: ds_builder.datastore,
      randomness,
    });
    ds_builder.scribes = [...scribes];
    ds_builder.scribe_keypairs = scribe_keypairs;

    // round 1
    await ds_builder.addConsensusConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).toBeNull();

    // round 2
    await ds_builder.addConsensusConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();

    // round 3
    await ds_builder.addConsensusConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(3);
    expect(page).toBeNull();

    // round 4
    await ds_builder.addConsensusConnectedRound();
    page1 = await binder.findLeaderInRound(1);
    expect(page1).not.toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(3);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(4);
    expect(page).toBeNull();
    pages = await binder.findOrderedPagesInSection(null, 1);
    expect(pages.length).toBe(1); // first section is only one page
    expect(pages.at(-1).scribe).toBe(page1.scribe);

    // round 8
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    pages = await binder.findOrderedPagesInSection(1, 5);
    // given consensus connected rounds, how many nodes in round n-1
    // won't be acked by our nodes in round n?
    const ONE_ROUND_DROPOFF =
      NODE_COUNT - DAGRider.consensusThresholdFor(NODE_COUNT);
    expect(pages.length).toBe(4 * NODE_COUNT - ONE_ROUND_DROPOFF);
    expect(pages.at(-1).scribe).toBe(scribes[1]);

    // round 12
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    pages = await binder.findOrderedPagesInSection(5, 9);
    // further sections still dropoff one page, but also pickup the previously dropped page
    // netting 0 = - ONE_ROUND_DROPOFF + ONE_ROUND_DROPOFF
    // await binder.saveOrderedPageNumbers(1, 9);
    // await ds_builder.datastore.writeToDirectory(process.env.WRITE_TO_DIR);
    expect(pages.length).toBe(4 * NODE_COUNT);
    expect(pages.at(-1).scribe).toBe(scribes[2]);

    // round 16
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    await ds_builder.addConsensusConnectedRound();
    pages = await binder.findOrderedPagesInSection(9, 13);
    expect(pages.length).toBe(4 * NODE_COUNT);
    expect(pages.at(-1).scribe).toBe(scribes[3]);
  });

  test("event handling", async () => {
    const NODE_COUNT = 3;

    let page, ack, round;

    // setup
    const scribes = await Devnet.getPubkeys(NODE_COUNT);
    const scribe_keypairs = await Devnet.getKeypairsDict(NODE_COUNT);

    const ds_builder = await NetworkDatastoreBuilder.createInMemory();
    ds_builder.scribes = [...scribes];
    ds_builder.scribe_keypairs = scribe_keypairs;
    ds_builder.datastore.setCurrentRound(1);
    await ds_builder.addFullyConnectedRound();

    const datastores = [
      await ds_builder.datastore.cloneToMemory(),
      await ds_builder.datastore.cloneToMemory(),
      await ds_builder.datastore.cloneToMemory(),
    ];

    const seq1 = new DAGRider({
      datastore: datastores[0],
      randomness,
      pubkey: scribes[0],
      keypair: scribe_keypairs[scribes[0]],
      communication_enabled: true,
    });

    const seq2 = new DAGRider({
      datastore: datastores[1],
      randomness,
      pubkey: scribes[1],
      keypair: scribe_keypairs[scribes[1]],
    });

    const seq3 = new DAGRider({
      datastore: datastores[2],
      randomness,
      pubkey: scribes[2],
      keypair: scribe_keypairs[scribes[2]],
    });

    // round 1
    page = await seq1.findLeaderInRound(1);
    expect(page).toBeNull();

    // round 2 from perspective of scribe 1
    round = 2;
    page = Page.from({
      round,
      scribe: scribes[0],
      last_round_certs: await seq1.getTimelyCertsAtRound(round - 1),
      events: [],
    });
    await page.generateSig(scribe_keypairs[scribes[0]]);
    await page.save({ datastore: seq1.datastore });
    ack = await seq1.onReceiveDraftPage(page);
    await seq1.onReceivePageAck(ack);

    ack = await seq2.onReceiveDraftPage(page);
    await seq1.onReceivePageAck(ack);

    ack = await seq3.onReceiveDraftPage(page);
    await seq1.onReceivePageAck(ack);

    await page.reload({ datastore: seq1.datastore });
    await page.generateCert(scribe_keypairs[scribes[0]]);
    expect(page.cert).not.toBeNull();
    expect(Object.keys(page.acks).length).toBe(3);
    expect(await page.validateCert({ acks_needed: 3 })).toBe(true);

    let cert_page = await seq2.onReceiveCertifiedPage(
      await page.toJSONObject()
    );
    expect(cert_page).not.toBe(null);
    cert_page = await seq2.onReceiveCertifiedPage({
      ...(await page.toJSONObject()),
      cert: null,
    });
    expect(cert_page).toBeNull();
  });

  test("run sequencers", async () => {
    const NODE_COUNT = 9;
    const my_seq_id = Devnet.pubkeyOf(0);

    const st = await SequencerTesting.setup({node_count: NODE_COUNT, SequencerModule: DAGRider, RandomnessModule: RoundRobin});
    await st.runUntilRound(9);
    const seq1 = st.getSequencer(my_seq_id);

    const leader1 = await seq1.findLeaderInRound(1);
    expect(leader1).not.toBeNull();
    const leader5 = await seq1.findLeaderInRound(5);
    expect(leader5).not.toBeNull();
    const pages = await seq1.findOrderedPagesInSection(null, 5);
    expect(pages.length).toBe(NODE_COUNT * 4 + 1);
  });

  test("given f = 0, one bad sequence, network stalls", async () => {
    const NODE_COUNT = 3;
    const BAD_NODE_COUNT = 1;
    const offline_seq_id = Devnet.pubkeyOf(NODE_COUNT - 1);

    const st = await SequencerTesting.setup({node_count: NODE_COUNT, SequencerModule: DAGRider, RandomnessModule: RoundRobin});
    st.communication.offline_sequencers = [offline_seq_id];

    const abortController = new AbortController();
    setTimeoutPromise(3000).then(() => { abortController.abort() });    
    await expect(st.runUntilRound(9, abortController.signal)).rejects.toThrow("aborted");

    st.communication.offline_sequencers = [];
    await st.runUntilRound(9);

    const my_seq_id = Devnet.pubkeyOf(0);
    const seq1 = st.getSequencer(my_seq_id);
    const leader1 = await seq1.findLeaderInRound(1);
    expect(leader1).not.toBeNull();
    const leader5 = await seq1.findLeaderInRound(5);
    expect(leader5).not.toBeNull();
    const pages = await seq1.findOrderedPagesInSection(null, 5);
    expect(pages.length).toBe((NODE_COUNT) * 4 + 1);
  });

  test("given f = 1, one bad sequencer not elected leader, network can sequence", async () => {
    const NODE_COUNT = 4;
    const BAD_NODE_COUNT = 1;
    const my_seq_id = Devnet.pubkeyOf(0);
    const offline_seq_id = Devnet.pubkeyOf(3);

    const st = await SequencerTesting.setup({node_count: NODE_COUNT, SequencerModule: DAGRider, RandomnessModule: RoundRobin});
    st.communication.offline_sequencers = [offline_seq_id];
    await st.runUntilRound(9);

    const seq1 = st.getSequencer(my_seq_id);
    const leader1 = await seq1.findLeaderInRound(1);
    expect(leader1).not.toBeNull();
    const leader5 = await seq1.findLeaderInRound(5);
    expect(leader5).not.toBeNull();
    const pages = await seq1.findOrderedPagesInSection(null, 5);
    expect(pages.length).toBe((NODE_COUNT - BAD_NODE_COUNT) * 4 + 1 + BAD_NODE_COUNT);

    // bring back the offline sequencer
    st.communication.offline_sequencers = [];
    await st.runUntilRound(13);
    const pages_r0t9 = await seq1.findOrderedPagesInSection(null, 9);
    // bad node not yet producing pages
    expect(pages_r0t9.length).toBe(1 + (NODE_COUNT - BAD_NODE_COUNT) * 8 + 1);

    await st.runUntilRound(17);
    const pages_r0t13 = await seq1.findOrderedPagesInSection(null, 13);
    // bad node may have caught up and is producing pages
    expect(pages_r0t13.length).toBeGreaterThanOrEqual(1 + (NODE_COUNT - BAD_NODE_COUNT) * 12 + 1);
  });
});
