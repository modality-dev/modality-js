import Page from "@modality-dev/network-datastore/data/Page";
import Round from "@modality-dev/network-datastore/data/Round";

import { setTimeout } from 'timers/promises';

const INTRA_ROUND_WAIT_TIME_MS = 50;

export default class Sequencer {
  constructor({ datastore, randomness, sequencer_first_round = 1, keypair, communication }) {
    this.datastore = datastore;
    this.randomness = randomness;
    this.sequencer_first_round = sequencer_first_round;
    this.keypair = keypair;
    this.communication = communication;
  }

  static calculate2fplus1(num_of_peers) {
    return Math.floor(num_of_peers * 2.0 / 3.0) + 1;
  }

  static consensusThresholdFor(num_of_peers) {
    return this.calculate2fplus1(num_of_peers);
  }

  async consensusThresholdForRound(round) {
    const scribes = await this.getScribesAtRound(round);
    return this.constructor.calculate2fplus1(scribes.length);
  }

  async getCurrentRound() {
    return this.datastore.getCurrentRound();
  }

  async getPreviousRoundScribes() {
    return this.getScribesAtRound(await this.getCurrentRound() - 1);
  }

  async getCurrentRoundScribes() {
    return this.getScribesAtRound(await this.getCurrentRound());
  }

  async getNextRoundScribes() {
    return this.getScribesAtRound(await this.getCurrentRound() + 1);
  }

  async getScribesAtRound(round) {
    throw new Error("Not implemented");
  }

  // finds the first_page of a round as decided by common randomness
  // some rounds may not have a first page returning null
  async findFirstPageInRound(round) {
    throw new Error("Not implemented");
  }

  // finds the start_round_first_page
  // finds the end_round_first_page
  // returns the causally ordered pages (start_round_first_page, end_round_first_page]
  //
  // note that this ordering will include pages from older rounds that are
  // not causally connected to the start_round_first_page, but are causally
  // connected to the end_round_first_page
  //
  // when end round does not have first page, this returns null
  async findOrderedPagesInSection(start_round, end_round) {
    throw new Error("Not implemented");
  }

  async findScribesInRound(round_id) {
    const round = await Round.findOne({
      datastore: this.datastore,
      round: round_id,
    });
    if (!round) throw new Error(`Round ${round_id} not found`);
    return round.scribes;
  }

  async findPage({ round, scribe }) {
    try {
      return await Page.findOne({ datastore: this.datastore, round, scribe });
    } catch (e) {
      // noop
    }
    return null;
  }

  async doesPageCertLinkToPage(later_page, earlier_page) {
    if (later_page.round <= earlier_page.round) return false;
    let round = later_page.round - 1;
    let cert_set = new Set([
      ...Object.values(later_page.last_round_certs).map((i) => i.scribe),
    ]);
    while (cert_set.size && round >= earlier_page.round) {
      if (round === earlier_page.round && cert_set.has(earlier_page.scribe)) {
        return true;
      }
      const new_cert_set = new Set();
      for (const scribe of cert_set) {
        let page = await this.findPage({ round, scribe });
        if (!page) {
          throw new Error(
            `Page ${scribe} ${round} not found. You must retrieve it first.`
          );
        }
        for (const i_cert of Object.values(page.last_round_certs)) {
          new_cert_set.add(i_cert.scribe);
        }
      }
      round = round - 1;
      cert_set = new_cert_set;
    }
    return false;
  }

  async findCausallyLinkedPages(last_page, after_page = null) {
    const r = [];
    if (!last_page) return r;
    if (last_page === after_page) return r;
    r.push({ round: last_page.round, scribe: last_page.scribe });
    let page;
    let round = last_page.round - 1;

    // TODO prioritize pages by MIN(ack_count, 2f+1), then by leader-first-lexicographic order,
    // recursively causally order their ack linked pages with the same prioritization strategy.
    // with some binders, this prevents a scribe from silently self-acking as means of prioritizing a commit

    let cert_set = new Set([
      ...Object.values(last_page.last_round_certs).map((i) => i.scribe),
    ]);
    while (cert_set.size && round >= 1) {
      const new_cert_set = new Set();
      // prioritize pages lexographically ordered starting at leader scribe
      const certs_list_lexiordered = [...cert_set].sort();
      const certs_list_start = Math.max(
        0,
        certs_list_lexiordered.findIndex(
          (i) => i.localeCompare(last_page.scribe) > 0
        )
      );
      const certs_list = [
        ...certs_list_lexiordered.slice(certs_list_start),
        ...certs_list_lexiordered.slice(0, certs_list_start),
      ];
      for (const scribe of certs_list) {
        page = await this.findPage({ round, scribe });
        if (!page) {
          throw new Error(
            `Page ${scribe} ${round} not found. You must retrieve it first.`
          );
        }
        let should_skip = false;
        if (after_page) {
          if (
            page.scribe === after_page.scribe &&
            page.round === after_page.round
          ) {
            should_skip = true;
          } else if (page.round < after_page.round) {
            if (await this.doesPageCertLinkToPage(after_page, page)) {
              // console.log(`
              //   processing ${last_page.round}.${last_page.scribe}
              //     skipping ${page.round}.${page.scribe}
              //     because causally linked to
              //     skipping ${after_page.round}.${after_page.scribe}
              //   `)
              should_skip = true;
            } else {
              //
            }
          }
        }
        if (!should_skip) {
          r.push({ round: page.round, scribe: page.scribe });
          for (const cert of Object.values(page.last_round_certs || {})) {
            new_cert_set.add(cert.scribe);
          }
        } else {
          new_cert_set.delete(page.scribe);
        }
      }

      cert_set = new_cert_set;
      round = round - 1;
    }

    return r.reverse();
  }

  async logRound(round_num) {
    const r = [`# Round #${round_num}`];
    const round = await Round.findOne({
      datastore: this.datastore,
      round: round_num,
    });
    if (!round) {
      console.log(r.join('\n'));
      return;
    }
    for (const scribe of round.scribes) {
      r.push(`## Scribe ${scribe}`);
      const page = await this.findPage({ round: round_num, scribe });
      if (page) {
        for (const ack of Object.values(page.acks)) {
          r.push(`* Ack from ${ack.scribe}`)
        }
        for (const ack of page.late_acks) {
          r.push(`* Late Ack of Round #${ack.round + 1} from ${ack.scribe}`);
        }
      }
    }
    //     console.log(`
    // ${round.scribes.map(async scribe => {
    // return `## Scribe
    // ### Acks
    // ### Late Acks
    // `}).join('\n')}
    // `);
    console.log(r.join('\n'));
  }

  async logRounds(start_round, end_round) {
    for (let round = start_round; round <= end_round; round++) {
      await this.logRound(round);
    }
  }

  async onReceiveDraftPage(page_data) {
    const page = await Page.fromJSONObject(page_data);
    if (!page.validateSig()) {
      console.warn('invalid sig')
      return;
    }

    const current_round = await this.getCurrentRound();

    if (page.round !== current_round) {
      console.warn('different round')
      return;
    }

    const current_round_scribes = await this.getCurrentRoundScribes();

    if (!current_round_scribes.includes(page.scribe)) {
      console.warn('unknown round')
      return;
    }

    if (await this.keypair?.asPublicAddress() && current_round_scribes.includes(await this.keypair?.asPublicAddress())) {
      const ack = await page.generateAck(this.keypair);
      if (this.communication) {
        await this.communication.sendPageAck({ to: ack.scribe, ack_data: ack })
      }
      return ack;
    }
  }

  async onReceivePageAck(ack) {
    if (!ack) {
      return;
    }

    const whoami = await this.keypair?.asPublicAddress();
    if (!whoami || whoami !== ack.scribe) {
      return;
    }

    const round = await this.getCurrentRound();
    if (ack.round !== round) {
      return;
    }

    const page = await Page.findOne({ datastore: this.datastore, round, scribe: whoami });
    if (page) {
      await page.addAck(ack);
      await page.save({ datastore: this.datastore });
    }
  }

  async onReceiveCertifiedPage(page_data) {
    const page = await Page.fromJSONObject(page_data);
    if (!page.validateSig()) {
      return null;
    }

    const round = await this.getCurrentRound();
    if (page.round < round) {
      return this.onReceiveLateCertifiedPage(page_data);
    } else if (page.round > round) {
      // TODO handle slowness
      return null;
    }

    const last_round_threshold = await this.consensusThresholdForRound(round - 1);
    const current_round_threshold = await this.consensusThresholdForRound(round);
    if (round > 1 && Object.keys(page.last_round_certs).length < last_round_threshold) {
      return null;
    }

    const has_valid_cert = await page.validateCert({ acks_needed: current_round_threshold });
    if (!has_valid_cert) {
      return null;
    }

    await page.save({ datastore: this.datastore });
    return page;
  }

  async runRound() {
    const scribe = await this.keypair?.asPublicAddress();
    const round = await this.getCurrentRound();
    const last_round_certs = await this.datastore.getTimelyCertsAtRound(round - 1);
    // TODO if not enough certs throws error
    const events = []; // TODO pop events off queue
    const page = new Page({
      round,
      scribe,
      last_round_certs,
      events,
    });
    await page.generateSig(this.keypair);
    await page.save({ datastore: this.datastore });
    const current_round_threshold = await this.consensusThresholdForRound(round);

    if (this.communication) {
      await this.communication.broadcastDraftPage({ page_data: await page.toDraftJSONObject() })
    }

    let keep_waiting_for_acks = true;
    let keep_waiting_for_certs = true;
    while (keep_waiting_for_acks || keep_waiting_for_certs) {
      await setTimeout(this.intra_round_wait_time_ms || INTRA_ROUND_WAIT_TIME_MS);
      if (keep_waiting_for_acks) {
        await page.reload({ datastore: this.datastore });
        const valid_acks = await page.countValidAcks();
        if (valid_acks >= current_round_threshold) {
          await page.generateCert(this.keypair);
          if (this.communication) {
            await this.communication.broadcastCertifiedPage({ page_data: await page.toJSONObject() })
          }
          keep_waiting_for_acks = false;
        }
      }
      if (keep_waiting_for_certs) {
        const current_round_certs = await this.datastore.getTimelyCertsAtRound(round);
        if (Object.keys(current_round_certs).length >= current_round_threshold) {
          keep_waiting_for_certs = false;
        }
      }
    }
    await this.bumpCurrentRound();
  }

  async bumpCurrentRound() {
    const round_num = await this.getCurrentRound(); 
    const round = new Round({ round: round_num });
    round.scribes = await this.getCurrentRoundScribes();
    await round.save({ datastore: this.datastore });
    await this.datastore.bumpCurrentRound();
  }

  async runUntilRound(round) {
    let current_round = await this.getCurrentRound();
    while (current_round < round) {
      await this.runRound();
      current_round = await this.getCurrentRound();
    }
  }

  async run() {
    while (true) {
      await this.runRound();
    }
  }
}