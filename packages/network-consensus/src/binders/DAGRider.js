import Binder from "./Binder.js";
import Page from '@modality-dev/network-datastore/data/Page';

export const NAME = "DAGRider";

export default class DAGRider extends Binder {
  constructor({ datastore, randomness, first_round = 1 }) {
    super({ datastore, randomness, first_round });
  }

  static getBoundRound(round, first_round = 1) {
    return round - first_round;
  }

  static getWaveOfRound(round, first_round = 1) {
    const bound_round = this.getBoundRound(round, first_round);
    return Math.floor(bound_round / 4) + 1;
  }

  static getWaveRoundOfRound(round, first_round) {
    const bound_round = this.getBoundRound(round, first_round);
    return (bound_round % 4) + 1;
  }

  static getRoundProps(round, first_round) {
    const binder_round = round - first_round + 1;
    const binder_wave = this.getWaveOfRound(round, first_round);
    const binder_wave_round = this.getWaveRoundOfRound(round, first_round);
    return {
      round,
      binder_round,
      binder_wave,
      binder_wave_round,
    };
  }

  async findLeaderInRound(round) {
    const round_props = this.constructor.getRoundProps(round, this.first_round);

    // only the first round of a wave has an leader
    if (round_props.binder_wave_round !== 1) {
      return null;
    }

    // use common coin to pick the leader
    const scribes = await this.findScribesInRound(round);
    const scribe = await this.randomness.pickOne({
      options: scribes,
      input: round,
    });

    const leader = await this.findPage({ round, scribe });
    if (!leader) {
      return null;
    }

    // ensure that in round+3, 2/3*(scribes) of the pages ack link back to the leader
    let prev_pages = new Set([leader.scribe]);
    let next_pages = new Set();
    for (const i of [1, 2, 3]) {
      for (const i_scribe of scribes) {
        const page = await this.findPage({
          round: round + i,
          scribe: i_scribe,
        });
        if (page) {
          for (const prev_page of prev_pages) {
            if (page.acks[prev_page]) {
              next_pages.add(page.scribe);
              continue;
            }
          }
        }
      }
      prev_pages = new Set([...next_pages]);
      next_pages = new Set();
    }
    if (prev_pages.size < Math.ceil((2 / 3) * scribes.length)) {
      return null;
    }

    return leader;
  }

  async findOrderedPagesInSection(start_round, end_round) {
    const starting_leader = await this.findLeaderInRound(start_round);
    const ending_leader = await this.findLeaderInRound(end_round);
    return this.findCausallyLinkedPages(ending_leader, starting_leader);
  }

  async saveOrderedPageNumbers(start_round, end_round) {
    const round_section_leaders = [];
    for (let round = start_round; round < end_round; round++) {
      const leader = await this.findLeaderInRound(round);
      if (leader) {
        round_section_leaders.push(leader);
      }
    }
    if (!round_section_leaders.length) {
      return;
    }
    const ordered_section_pages = [];
    let prev_leader;
    let page_number;
    if (start_round === 1) {
      page_number = 1;
    }
    for (const leader of round_section_leaders) {
      if (!prev_leader) {
        prev_leader = leader;
        continue;
      }
      const ordered_pages = await this.findOrderedPagesInSection(prev_leader.round, leader.round);
      const section_starting_round = prev_leader.round;
      const section_ending_round = leader.round;
      ordered_section_pages.push({
        section_starting_round: prev_leader.round,
        section_ending_round: leader.round,
        pages: ordered_pages
      });
      let section_page_number = 1;
      for (const ordered_page of ordered_pages) {
        const page = await Page.findOne({datastore: this.datastore, round: ordered_page.round, scribe: ordered_page.scribe});
        page.section_starting_round = section_starting_round;
        page.section_ending_round = section_ending_round;
        page.section_page_number = section_page_number; 
        if (page_number) {
          page.page_number = page_number;
        }
        await page.save({datastore: this.datastore});
        section_page_number++;
        if (page_number) {
          page_number++;
        }
      }
      prev_leader = leader;
    }
  }

}
