import { jest, expect, describe, test, it } from "@jest/globals";

import Keypair from "@modality-dev/utils/Keypair";
import NetworkDatastore from "@modality-dev/network-datastore";

import Page from "@modality-dev/network-datastore/data/Page";
import Round from "@modality-dev/network-datastore/data/Round";
import RoundRobin from "../randomness/RoundRobin";

import NetworkDatastoreBuilder from "@modality-dev/network-datastore/NetworkDatastoreBuilder";

import DAGRider from "./DAGRider";

describe("DAGRider", () => {
  it("should work given fully connected rounds", async () => {
    const keypair1 = await Keypair.generate();
    const keypair1_pubkey = await keypair1.asPublicAddress();
    const keypair2 = await Keypair.generate();
    const keypair2_pubkey = await keypair2.asPublicAddress();
    const keypair3 = await Keypair.generate();
    const keypair3_pubkey = await keypair3.asPublicAddress();
    const scribes = [keypair1_pubkey, keypair2_pubkey, keypair3_pubkey];

    const ds_builder = await NetworkDatastoreBuilder.createInMemory();

    const randomness = new RoundRobin();
    const binder = new DAGRider({
      datastore: ds_builder.datastore,
      randomness,
    });

    ds_builder.scribes = scribes;
    for (let i = 0; i < 12; i++) {
      await ds_builder.addFullyConnectedRound();
    }

    let page;
    let page1 = await binder.findLeaderInRound(1);
    expect(page1).not.toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(3);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(4);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(5);
    expect(page).not.toBeNull();

    let pages;

    pages = await binder.findOrderedPagesInSection(null, 1);
    expect(pages.length).toBe(1); // first section is only one page
    expect(pages.at(-1).scribe).toBe(page1.scribe);

    pages = await binder.findOrderedPagesInSection(1, 5);
    expect(pages.length).toBe(4 * 3);
    expect(pages.at(-1).scribe).toBe(page.scribe);

    pages = await binder.findOrderedPagesInSection(5, 9);
    expect(pages.length).toBe(4 * 3);
  });

  it("should work given consensus connected rounds", async () => {
    const keypair1 = await Keypair.generate();
    const keypair1_pubkey = await keypair1.asPublicAddress();
    const keypair2 = await Keypair.generate();
    const keypair2_pubkey = await keypair2.asPublicAddress();
    const keypair3 = await Keypair.generate();
    const keypair3_pubkey = await keypair3.asPublicAddress();
    const keypair4 = await Keypair.generate();
    const keypair4_pubkey = await keypair4.asPublicAddress();
    const scribes = [keypair1_pubkey, keypair2_pubkey, keypair3_pubkey, keypair4_pubkey];
    const consensus_threshold = DAGRider.consensusThresholdFor(scribes.length);

    const ds_builder = await NetworkDatastoreBuilder.createInMemory();

    const randomness = new RoundRobin();
    const binder = new DAGRider({
      datastore: ds_builder.datastore,
      randomness,
    });

    ds_builder.scribes = scribes;
    for (let i = 0; i < 12; i++) {
      await ds_builder.addConsensusConnectedRound();
    }


    let page;
    let page1 = await binder.findLeaderInRound(1);
    expect(page1).not.toBeNull();
    page = await binder.findLeaderInRound(2);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(3);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(4);
    expect(page).toBeNull();
    page = await binder.findLeaderInRound(5);
    expect(page).not.toBeNull();

    let pages;

    pages = await binder.findOrderedPagesInSection(null, 1);
    expect(pages.length).toBe(1); // first section is only one page
    expect(pages.at(-1).scribe).toBe(page1.scribe);

    await binder.saveOrderedPageNumbers(1, 12);
    page = await Page.findOne({datastore: binder.datastore, round: 5, scribe: keypair1_pubkey});
    expect(page.page_number).not.toBeNull();
    
    // await binder.logRounds(1,5);
    // TODO
  });
});
