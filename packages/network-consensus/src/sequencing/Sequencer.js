import Page from "@modality-dev/network-datastore/data/Page";
import Round from "@modality-dev/network-datastore/data/Round";

export default class Sequencer {
  constructor({ datastore, randomness, first_round = 1 }) {
    this.datastore = datastore;
    this.randomness = randomness;
    this.first_round = first_round;
  }

  static calculate2fplus1(num_of_peers) {
    return Math.floor(num_of_peers * 2.0 / 3.0) + 1;
  }

  static consensusThresholdFor(num_of_peers) {
    return this.calculate2fplus1(num_of_peers);
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

  async doesPageAckLinkToPage(later_page, earlier_page) {
    if (later_page.round <= earlier_page.round) return false;
    let round = later_page.round - 1;
    let ack_set = new Set([
      ...Object.values(later_page.acks).map((i) => i.scribe),
    ]);
    while (ack_set.size && round >= earlier_page.round) {
      if (round === earlier_page.round && ack_set.has(earlier_page.scribe)) {
        return true;
      }
      const new_ack_set = new Set();
      for (const scribe of ack_set) {
        let page = await this.findPage({ round, scribe });
        if (!page) {
          throw new Error(
            `Page ${scribe} ${round} not found. You must retrieve it first.`
          );
        }
        for (const i_ack of Object.values(page.acks)) {
          new_ack_set.add(i_ack.scribe);
        }
      }
      round = round - 1;
      ack_set = new_ack_set;
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

    let ack_set = new Set([
      ...Object.values(last_page.acks).map((i) => i.scribe),
    ]);
    while (ack_set.size && round >= 1) {
      // console.log(round, 'ack_set', ack_set);
      const new_ack_set = new Set();
      // prioritize pages lexographically ordered starting at leader scribe
      const acks_list_lexiordered = [...ack_set].sort();
      const acks_list_start = Math.max(
        0,
        acks_list_lexiordered.findIndex(
          (i) => i.localeCompare(last_page.scribe) > 0
        )
      );
      const acks_list = [
        ...acks_list_lexiordered.slice(acks_list_start),
        ...acks_list_lexiordered.slice(0, acks_list_start),
      ];
      for (const scribe of acks_list) {
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
            if (await this.doesPageAckLinkToPage(after_page, page)) {
              // console.log(`
              //   processing ${last_page.round}.${last_page.scribe}
              //     skipping ${page.round}.${page.scribe}
              //     because causally linked to
              //     skipping ${after_page.round}.${after_page.scribe}
              //   `)
              should_skip = true;
            }
          }
        }
        if (!should_skip) {
          r.push({ round: page.round, scribe: page.scribe });
          for (const ack of Object.values(page.acks || {})) {
            new_ack_set.add(ack.scribe);
          }
        }
      }

      ack_set = new_ack_set;
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
          r.push(`* Late Ack of Round #${ack.round+1} from ${ack.scribe}`);
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
}
