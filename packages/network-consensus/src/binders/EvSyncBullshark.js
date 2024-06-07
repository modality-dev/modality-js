import Binder from "./Binder";

// like Bullshark, but instead of a fallback leader
// unordered pages from sufficiently older rounds are discarded.
// requiring resubmission of discarded commits, but bounds memory usage
export default class EvSyncBullshark extends Binder {
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

  /// bullshark has:
  /// * wave round 1 leader (based on predefined randomness)
  /// * wave round 1 fallback leader (based on randomness of wave round 4, only used during asynchrony)
  /// * wave round 3 leader (based on predefined randomness)
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

  async findOrderedPagesInChapter(start_round, end_round) {
    const starting_leader = await this.findLeaderInRound(start_round);
    const ending_leader = await this.findLeaderInRound(end_round);
    return this.findCausallyLinkedPages(ending_leader, starting_leader);
  }
}
