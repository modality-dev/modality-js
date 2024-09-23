import Page from "@modality-dev/network-datastore/data/Page";
import Round from "@modality-dev/network-datastore/data/Round";
import RoundMessage from "@modality-dev/network-datastore/data/RoundMessage";
import ContractCommitEvent from "@modality-dev/network-datastore/data/ContractCommitEvent";

import { setTimeout, setImmediate } from "timers/promises";
import { Mutex } from "async-mutex";

const INTRA_ROUND_WAIT_TIME_MS = 50;
const NO_EVENTS_ROUND_WAIT_TIME_MS = 15000;
const NO_EVENTS_POLL_WAIT_TIME_MS = 500;

export default class Sequencer {
  constructor({
    datastore,
    randomness,
    sequencer_first_round = 1,
    pubkey,
    keypair,
    communication,
  }) {
    this.datastore = datastore;
    this.randomness = randomness;
    this.sequencer_first_round = sequencer_first_round;
    this.pubkey = pubkey;
    this.keypair = keypair;
    this.communication = communication;
    this.mutex = new Mutex();
  }

  static getRoundProps(round, sequencer_first_round) {
    const binder_round = round - sequencer_first_round + 1;
    const binder_wave = this.getWaveOfRound(round, sequencer_first_round);
    const binder_wave_round = this.getWaveRoundOfRound(
      round,
      sequencer_first_round
    );
    return {
      round,
      binder_round,
      binder_wave,
      binder_wave_round,
    };
  }

  static calculate2fplus1(num_of_peers) {
    return Math.floor((num_of_peers * 2.0) / 3.0) + 1;
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
  
  async onReceiveDraftPage(page_data) {
    const page = await Page.fromJSONObject(page_data);
    if (!page.validateSig()) {
      console.warn("invalid sig");
      return;
    }

    const round_scribes = await this.getScribesAtRound(page.round);
    if (!round_scribes.includes(page.scribe)) {
      console.warn(
        `ignoring non-scribe ${page.scribe} at round ${page.round}`
      );
      return;
    }

    const current_round = await this.getCurrentRound();

    if (page.round > current_round) {
      return this.onReceiveDraftPageFromLaterRound(page_data);
    } else if (page.round < current_round) {
      return this.onReceiveDraftPageFromEarlierRound(page_data);
    } else {
      return this.onReceiveDraftPageFromCurrentRound(page_data);
    }
  }

  async onReceiveDraftPageFromEarlierRound(page_data) {
    const current_round = await this.getCurrentRound();
    const page = await Page.fromJSONObject(page_data);
    // console.warn(`received draft for earlier round: round ${page.round} draft received but currently on round ${current_round}`);

    // TODO provide same late ack if asked again

    // provide late ack
    if (this.pubkey) {
      const ack = await page.generateLateAck(this.keypair, current_round);
      if (this.communication) {
        const last_round_certs = await this.getTimelyCertSigsAtRound(
          current_round - 1
        );
        await this.communication.sendPageLateAck({
          from: this.pubkey,
          to: ack.scribe,
          ack_data: ack,
          extra: { last_round_certs },
        });
      }
      return ack;
    }
  }

  async onReceiveDraftPageFromLaterRound(page_data) {
    const current_round = await this.getCurrentRound();
    const page = await Page.fromJSONObject(page_data);
    // console.warn(`received draft for later round: round ${page.round} draft received but currently on round ${current_round}`);

    await RoundMessage.fromJSONObject({
      round: page.round,
      scribe: page.scribe,
      type: "draft",
      seen_at_round: current_round,
      content: page_data,
    }).save({ datastore: this.datastore });

    // TODO considering bumping rounds!
    // TODO req and verify acker's last_round_certs chain
    if (current_round < page.round) {
      if (
        !this.latest_seen_at_round ||
        page_data.round > this.latest_seen_at_round
      ) {
        this.latest_seen_at_round = page_data.round;
        return;
      }
    }
  }

  async onReceiveDraftPageFromCurrentRound(page_data) {
    const current_round = await this.getCurrentRound();
    const page = await Page.fromJSONObject(page_data);

    if (this.pubkey) {
      const ack = await page.generateAck(this.keypair);
      if (this.communication) {
        await this.communication.sendPageAck({
          from: this.pubkey,
          to: ack.scribe,
          ack_data: ack,
        });
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

    const round_scribes = await this.getScribesAtRound(ack.acker);
    if (!round_scribes.includes(ack.acker)) {
      console.warn(
        `ignoring non-scribe ack ${ack.acker} at round ${ack.round}`
      );
      return;
    }

    const page = await Page.findOne({
      datastore: this.datastore,
      round,
      scribe: whoami,
    });
    if (page) {
      await this.mutex.runExclusive(async () => {
        await page.addAck(ack);
        await page.save({ datastore: this.datastore });
      });
    }
  }

  async onReceivePageLateAck(ack) {
    return;
  }

  async onReceiveCertifiedPage(page_data) {
    const page = await Page.fromJSONObject(page_data);
    if (!page.validateSig()) {
      return null;
    }

    const round = await this.getCurrentRound();
    if (page.round < round) {
      // console.log({round}, page_data);
      // return this.onReceiveLateCertifiedPage(page_data);
    } else if (page.round > round) {
      return this.onReceiveCertifiedPageFromLaterRound(page_data);
    }

    return this.onReceiveCertifiedPageFromCurrentRound(page_data);
  }

  async onReceiveCertifiedPageFromLaterRound(page_data) {
    const current_round = await this.getCurrentRound();
    const page = await Page.fromJSONObject(page_data);

    await RoundMessage.fromJSONObject({
      round: page.round,
      scribe: page.scribe,
      type: "certified",
      seen_at_round: current_round,
      content: page_data,
    }).save({ datastore: this.datastore });

    // TODO considering bumping rounds!
    // TODO req and verify acker's last_round_certs chain
    if (current_round < page.round) {
      if (
        !this.latest_seen_at_round ||
        page_data.round > this.latest_seen_at_round
      ) {
        this.latest_seen_at_round = page_data.round;
        return;
      }
    }
  }

  async onReceiveCertifiedPageFromCurrentRound(page_data) {
    const page = await Page.fromJSONObject(page_data);
    if (!page.validateSig()) {
      return null;
    }
    const round = page.round;

    const last_round_threshold = await this.consensusThresholdForRound(
      round - 1
    );
    const current_round_threshold =
      await this.consensusThresholdForRound(round);

    if (
      round > 1 &&
      Object.keys(page.last_round_certs).length < last_round_threshold
    ) {
      return null;
    }

    const has_valid_cert = await page.validateCert({
      acks_needed: current_round_threshold,
    });
    if (!has_valid_cert) {
      return null;
    }

    await page.save({ datastore: this.datastore });
    return page;
  }

  async getOrFetchLastRoundCerts(round) {
    const last_round = round - 1;
    let last_round_certs = await this.getTimelyCertSigsAtRound(last_round);
    const last_round_scribes = await this.getScribesAtRound(last_round);

    const threshold = this.constructor.calculate2fplus1(
      last_round_scribes.length
    );
    if (Object.keys(last_round_certs) >= threshold) {
      return last_round_certs;
    }

    if (this.communication) {
      for (const scribe of last_round_scribes) {
        const page_data =
          await this.communication.fetchScribeRoundCertifiedPage({
            from: this.pubkey,
            to: scribe,
            scribe,
            round: last_round,
          });
        if (page_data) {
          const page = await Page.fromJSONObject(page_data);
          if (page.validateCert({ acks_needed: threshold })) {
            await page.save({ datastore: this.datastore });
          }
        }
      }
    }

    last_round_certs = await this.getTimelyCertSigsAtRound(last_round);

    return last_round_certs;
  }

  async getTimelyCertsAtRound(round) {
    const pages = (
      await Page.findAllInRound({ datastore: this.datastore, round })
    ).filter((i) => !i.seen_at_round);
    return pages.reduce((acc, i) => {
      acc[i.scribe] = i;
      return acc;
    }, {});
  }

  async getTimelyCertSigsAtRound(round) {
    const pages = (
      await Page.findAllInRound({ datastore: this.datastore, round })
    ).filter((i) => !i.seen_at_round);
    return pages.reduce((acc, i) => {
      acc[i.scribe] = {
        scribe: i.scribe,
        cert: i.cert,
        round: i.round,
      };
      return acc;
    }, {});
  }

  async speedUpToLatestUncertifiedRound() {
    let round_certified = true;
    while (round_certified) {
      let round = await this.getCurrentRound() + 1;
      const last_round_certs = await this.getOrFetchLastRoundCerts(round);
      const existing_certs = await RoundMessage.findAllInRoundOfType({
        datastore: this.datastore,
        round: round - 1,
        type: "certified",
      });
      for (const draft of existing_certs) {
        const draft_content = draft.content;
        await this.datastore.datastore.delete(draft.getId());
        await this.onReceiveCertifiedPage(draft_content);
      }
      const threshold = await this.consensusThresholdForRound(round - 1);
      const cert_count = Object.keys(last_round_certs).length;
      if (cert_count && threshold && cert_count >= threshold) {
        await this.bumpCurrentRound(); 
      } else {
        round_certified = false;
      }
    }
  }

  async runRound(signal) {
    const scribe = await this.keypair?.asPublicAddress();

    await this.speedUpToLatestUncertifiedRound();
    let round = await this.getCurrentRound();

    const last_round_certs = await this.getOrFetchLastRoundCerts(round);
    const last_round_scribes = await this.getScribesAtRound(round - 1);

    const threshold = await this.consensusThresholdForRound(round - 1);
    const cert_count = Object.keys(last_round_certs).length;
    if (cert_count < threshold) {
      throw new Error("not enough certs to start round");
    }

    const current_round_threshold = await this.consensusThresholdForRound(round);
    const existing_this_round_certs = await RoundMessage.findAllInRoundOfType({
      datastore: this.datastore,
      round: round,
      type: "certified",
    });
    if (existing_this_round_certs.length >= current_round_threshold) {
      await this.bumpCurrentRound();
      round = await this.getCurrentRound();
    }

    let cc_events = await ContractCommitEvent.findAll({ datastore: this.datastore });
    let keep_waiting_for_events = (cc_events.length === 0);
    if (keep_waiting_for_events) {
      setTimeout(this.no_events_round_wait_time_ms ?? NO_EVENTS_ROUND_WAIT_TIME_MS).then(() => {
        keep_waiting_for_events = false;
      });
    }
    while (keep_waiting_for_events) {
      await setTimeout(this.no_events_poll_wait_time_ms ?? NO_EVENTS_POLL_WAIT_TIME_MS);
      cc_events = await ContractCommitEvent.findAll({ datastore: this.datastore });
      if (cc_events.length > 0) {
        keep_waiting_for_events = false;
      }
    }
    const events = [];
    for (const cc_event of cc_events) {
      events.push({
        contract_id: cc_event.contract_id,
        commit_id: cc_event.commit_id,
      });
      await cc_event.delete({ datastore: this.datastore });
    }
    const page = Page.from({
      round,
      scribe,
      last_round_certs,
      events,
    });
    await page.generateSig(this.keypair);
    await page.save({ datastore: this.datastore });

    if (this.communication) {
      const page_data = await page.toDraftJSONObject();
      await this.communication.broadcastDraftPage({
        from: this.pubkey,
        page_data,
      });
    }

    // handle enqueue round messages
    const existing_drafts = await RoundMessage.findAllInRoundOfType({
      datastore: this.datastore,
      round,
      type: "draft",
    });
    for (const draft of existing_drafts) {
      // console.log("existing draft", draft);
      const draft_content = draft.content;
      await this.datastore.datastore.delete(draft.getId());
      await this.onReceiveDraftPage(draft_content);
    }

    let keep_waiting_for_acks = this.latest_seen_at_round ? false : true;
    let keep_waiting_for_certs = true;
    while (keep_waiting_for_acks || keep_waiting_for_certs) {
      if (this.latest_seen_at_round && this.latest_seen_at_round > round) {
        await this.jumpToRound(
          this.latest_seen_at_round,
          this.latest_seen_at_last_round_certs
        );
        this.latest_seen_at_round = null;
        return;
      }
      if (signal?.aborted) {
        throw new Error("aborted");
      }
      if (keep_waiting_for_acks) {
        await page.reload({ datastore: this.datastore });
        const valid_acks = await page.countValidAcks();
        if (valid_acks >= current_round_threshold) {
          await page.generateCert(this.keypair);
          if (this.communication) {
            await this.communication.broadcastCertifiedPage({
              from: this.pubkey,
              page_data: await page.toJSONObject(),
            });
          }
          keep_waiting_for_acks = false;
        }
      }
      if (keep_waiting_for_certs) {
        const current_round_certs =
          await this.getTimelyCertsAtRound(round);
        if (
          Object.keys(current_round_certs).length >= current_round_threshold
        ) {
          keep_waiting_for_certs = false;
        }
      }
      const wait_in_ms =
        this.intra_round_wait_time_ms ?? INTRA_ROUND_WAIT_TIME_MS;
      if (wait_in_ms) {
        await setTimeout(wait_in_ms);
      } else {
        await setImmediate();
      }
    }
    await this.bumpCurrentRound();
  }

  async onFetchScribeRoundCertifiedPageRequest({ round, scribe }) {
    return this.findPage({ round, scribe });
  }

  async requestRoundDataFromPeers(round) {
    const scribes = await this.getScribesAtRound(round);
    for (const scribe of scribes) {
      const page = await this.communication.fetchScribeRoundCertifiedPage({
        from: this.pubkey,
        to: scribe,
        scribe,
        round,
      });
      if (page) {
        await this.onReceiveCertifiedPage(page);
      }
    }
  }

  async jumpToRound(round_num) {
    const current_round_num = await this.getCurrentRound();
    for (let i = current_round_num + 1; i < round_num; i++) {
      // TODO maybe handle jumping from earlier rounds
      // const roundi = Round.from({ round: i });
      // roundi.scribes = await this.getScribesAtRound(i);
      // await roundi.save({ datastore: this.datastore });
    }
    const round = Round.from({ round: round_num });
    round.scribes = await this.getScribesAtRound(round_num);
    await round.save({ datastore: this.datastore });
    await this.datastore.setCurrentRound(round_num);
  }

  async bumpCurrentRound() {
    const round_num = await this.getCurrentRound();
    const round = Round.from({ round: round_num });
    round.scribes = await this.getScribesAtRound(round_num);
    await round.save({ datastore: this.datastore });
    await this.datastore.bumpCurrentRound();
  }

  async runUntilRound(round, signal) {
    let current_round = await this.getCurrentRound();
    while (current_round < round) {
      if (signal?.aborted) {
        throw new Error("aborted");
      }
      await this.runRound(signal);
      current_round = await this.getCurrentRound();
    }
  }

  async run(signal) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.runRound(signal);
    }
  }
}
