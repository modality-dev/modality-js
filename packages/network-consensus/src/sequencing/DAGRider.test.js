import { jest, expect, describe, test, it } from "@jest/globals";

import Keypair from "@modality-dev/utils/Keypair";
import NetworkDatastore from "@modality-dev/network-datastore";

import Page from "@modality-dev/network-datastore/data/Page";
import Round from "@modality-dev/network-datastore/data/Round";
import RoundRobin from "../randomness/RoundRobin";
import SameProcess from "../communication/SameProcess";

import NetworkDatastoreBuilder from "@modality-dev/network-datastore/NetworkDatastoreBuilder";

import * as Devnet from "@modality-dev/network-configs/devnet-common/index";

import DAGRider from "./DAGRider";

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

  test.skip("no sequencing given under threshold connected rounds", async () => {});

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
      keypair: scribe_keypairs[scribes[0]],
      communication_enabled: true,
    });

    const seq2 = new DAGRider({
      datastore: datastores[1],
      randomness,
      keypair: scribe_keypairs[scribes[1]],
    });

    const seq3 = new DAGRider({
      datastore: datastores[2],
      randomness,
      keypair: scribe_keypairs[scribes[2]],
    });

    // round 1
    page = await seq1.findLeaderInRound(1);
    expect(page).toBeNull();

    // round 2 from perspective of scribe 1
    round = 2;
    page = new Page({
      round,
      scribe: scribes[0],
      last_round_certs: await seq1.datastore.getTimelyCertsAtRound(round - 1),
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

    const scribe_keypairs = await Devnet.getKeypairsDict(NODE_COUNT);
    const dsb = await NetworkDatastoreBuilder.createInMemory();
    await dsb.setupGenesisScribes(scribe_keypairs);
    const communication = new SameProcess();
    const seqs = await dsb.createSequencers(DAGRider, {
      randomness,
      communication,
    });
    communication.scribe_sequencers = seqs;
    for (const seq of Object.values(seqs)) {
      seq.intra_round_wait_time_ms = 0;
    }

    await Promise.all(Object.values(seqs).map((seq) => seq.runUntilRound(9)));

    const seq1 = seqs[Object.keys(seqs)[0]];

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

    const scribe_keypairs = await Devnet.getKeypairsDict(NODE_COUNT);
    const dsb = await NetworkDatastoreBuilder.createInMemory();
    await dsb.setupGenesisScribes(scribe_keypairs);
    const communication = new SameProcess();
    const seqs = await dsb.createSequencers(DAGRider, {
      randomness,
      communication,
    });
    const bad_seq_id = Object.keys(seqs)[1];
    const good_seqs = {
      ...seqs,
    };
    delete good_seqs[bad_seq_id];
    communication.scribe_sequencers = {...good_seqs};
    for (const seq of Object.values(seqs)) {
      seq.intra_round_wait_time_ms = 0;
    }

    await Promise.all(Object.values(good_seqs).map((seq) => seq.runUntilRound(9)));

    const seq1 = good_seqs[Object.keys(good_seqs)[0]];
    const leader1 = await seq1.findLeaderInRound(1);
    expect(leader1).not.toBeNull();
    const leader5 = await seq1.findLeaderInRound(5);
    expect(leader5).not.toBeNull();
    const pages = await seq1.findOrderedPagesInSection(null, 5);
    expect(pages.length).toBe((NODE_COUNT - BAD_NODE_COUNT) * 4 + 1 + BAD_NODE_COUNT);
  });

  test.skip("given f = 0, one bad sequence, network stalls", async () => {
    const NODE_COUNT = 3;
    const BAD_NODE_COUNT = 1;

    const scribe_keypairs = await Devnet.getKeypairsDict(NODE_COUNT);
    const dsb = await NetworkDatastoreBuilder.createInMemory();
    await dsb.setupGenesisScribes(scribe_keypairs);
    const communication = new SameProcess();
    const seqs = await dsb.createSequencers(DAGRider, {
      randomness,
      communication,
    });
    const bad_seq_id = Object.keys(seqs)[1];
    const good_seqs = {
      ...seqs,
    };
    delete good_seqs[bad_seq_id];
    communication.scribe_sequencers = {...good_seqs};
    for (const seq of Object.values(seqs)) {
      seq.intra_round_wait_time_ms = 0;
    }

    await new Promise((resolve, reject) => {
      setTimeout(async () => {
        await Promise.all(Object.values(good_seqs).map((seq) => seq.runUntilRound(9))).then(resolve);
      }, 2000).then(reject);
    });

    const seq1 = good_seqs[Object.keys(good_seqs)[0]];
    const leader1 = await seq1.findLeaderInRound(1);
    expect(leader1).not.toBeNull();
    const leader5 = await seq1.findLeaderInRound(5);
    expect(leader5).not.toBeNull();
    const pages = await seq1.findOrderedPagesInSection(null, 5);
    expect(pages.length).toBe((NODE_COUNT - BAD_NODE_COUNT) * 4 + 1 + BAD_NODE_COUNT);
  });
});
