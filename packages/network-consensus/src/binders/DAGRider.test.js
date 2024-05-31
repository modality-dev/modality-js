import { jest, expect, describe, test } from "@jest/globals";

import Keypair from "@modality-dev/utils/Keypair";
import NetworkDatastore from "@modality-dev/network-datastore";

import Page from "../data/Page";
import Round from '../data/Round';
import RoundRobin from '../randomness/RoundRobin';

import DAGRider from "./DAGRider";

describe("DAGRider", () => {
  it("should work", async () => {
    const datastore = await NetworkDatastore.createInMemory();

    const keypair1 = await Keypair.generate();
    const keypair1_pubkey = await keypair1.asPublicAddress();
    const keypair2 = await Keypair.generate();
    const keypair2_pubkey = await keypair2.asPublicAddress();
    const keypair3 = await Keypair.generate();
    const keypair3_pubkey = await keypair3.asPublicAddress();
    const scribes = [keypair1_pubkey, keypair2_pubkey, keypair3_pubkey];

    const round1 = new Round({round: 1});
    round1.scribes = [...scribes];
    await round1.save({datastore});

    const randomness = new RoundRobin();
    const binder = new DAGRider({datastore, randomness});

    for (const round_num of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const round = new Round({round: round_num});
      round.scribes = [...scribes];
      await round.save({datastore});
      for (const scribe of scribes) {
        const page = new Page({scribe, round: round_num, events: []});
        if (round_num > 1) {
          for (const peer_scribe of scribes) {
            const peer_prev_page = await Page.findOne({datastore, round: round_num - 1, scribe: peer_scribe});
            page.acks[peer_scribe] = {
              round: peer_prev_page?.round,
              scribe: peer_scribe,
            }
          }
        }
        await page.save({datastore});
      }
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

    pages = await binder.findOrderedPagesInChapter(null, 1);
    expect(pages.length).toBe(1); // first chapter is only one page
    expect(pages.at(-1).scribe).toBe(page1.scribe);
    
    pages = await binder.findOrderedPagesInChapter(1, 5);
    expect(pages.length).toBe(4*3);
    expect(pages.at(-1).scribe).toBe(page.scribe);

    pages = await binder.findOrderedPagesInChapter(5, 9);
    expect(pages.length).toBe(4*3);
  });
});