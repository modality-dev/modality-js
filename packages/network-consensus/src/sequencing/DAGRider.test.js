import { jest, expect, describe, test, it } from "@jest/globals";

import Keypair from "@modality-dev/utils/Keypair";
import NetworkDatastore from "@modality-dev/network-datastore";

import Page from "@modality-dev/network-datastore/data/Page";
import Round from "@modality-dev/network-datastore/data/Round";
import RoundRobin from "../randomness/RoundRobin";

import NetworkDatastoreBuilder from "@modality-dev/network-datastore/NetworkDatastoreBuilder";

import * as Devnet from '@modality-dev/network-configs/devnet-common/index';

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
    ds_builder.scribe_keypairs =  scribe_keypairs;
    
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
    const ONE_ROUND_DROPOFF = NODE_COUNT - DAGRider.consensusThresholdFor(NODE_COUNT);
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

  test.skip("no sequencing given under threshold connected rounds", async() => {
  });
});
