import NetworkDatastore from "@modality-dev/network-datastore";

import Page from "../../src/data/Page";
import Round from "../../src/data/Round";

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default class DatastoreBuilder {
  constructor() {
    this.datastore = null;
    this.round_num = 0;
    this.scribes = [];
    this.late_acks = {};
    this.next_round_late_acks = {};
  }

  static async createInMemory() {
    const builder = new DatastoreBuilder();
    builder.datastore = await NetworkDatastore.createInMemory();
    return builder;
  }

  static async createInDirectory(path) {
    const builder = new DatastoreBuilder();
    builder.datastore = await NetworkDatastore.createInDirectory(path);
    return builder;
  }

  async addFullyConnectedRound({ failures = 0 } = {}) {
    const round_num = ++this.round_num;
    const round = new Round({ round: round_num });
    round.scribes = [...this.scribes];
    await round.save({ datastore: this.datastore });
    const scribes = shuffleArray(this.scribes);
    for (const scribe of scribes) {
      if (failures > 0) {
        failures--;
        continue;
      }
      const page = new Page({ scribe, round: round_num, events: [] });
      if (round_num > 1) {
        for (const peer_scribe of scribes) {
          const peer_prev_page = await Page.findOne({
            datastore: this.datastore,
            round: round_num - 1,
            scribe: peer_scribe,
          });
          await page.addAck({
            round: peer_prev_page?.round,
            scribe: peer_scribe,
          });
        }
      }
      await page.save({ datastore: this.datastore });
    }
  }

  async addConsensusConnectedRound({ failures = 0 } = {}) {
    const round_num = ++this.round_num;
    const round = new Round({ round: round_num });
    round.scribes = [...this.scribes];
    await round.save({ datastore: this.datastore });
    const scribes = shuffleArray(this.scribes);
    const consensus_threshold = Math.floor(this.scribes.length * 2.0 / 3.0) + 1;
    for (const scribe of scribes) {
      if (failures > 0) {
        failures--;
        continue;
      }
      const page = new Page({ scribe, round: round_num, events: [] });
      if (round_num > 1) {
        // prioritize self ack
        const acking_scribes = [scribe, ...shuffleArray([...scribes].filter(i => i !== scribe))];
        let acks_so_far = 0;
        for (const peer_scribe of acking_scribes) {
          const peer_prev_page = await Page.findOne({
            datastore: this.datastore,
            round: round_num - 1,
            scribe: peer_scribe,
          });
          if (peer_prev_page) {
            if (acks_so_far >= consensus_threshold) {
              this.next_round_late_acks[scribe] = [
                ...(this.next_round_late_acks[scribe] || []),
                {
                  round: peer_prev_page?.round,
                  scribe: peer_scribe,
                }
              ];
            } else {
              page.acks[peer_scribe] = {
                round: peer_prev_page?.round,
                scribe: peer_scribe,
              };
              acks_so_far++;
            }
          }
        }
      }
      const late_acks = this.late_acks[scribe] || [];
      for (const late_ack of late_acks) {
        await page.addLateAck(late_ack);
      }
      this.late_acks[scribe] = [];
      await page.save({ datastore: this.datastore });
    }
    this.late_acks = this.next_round_late_acks;
    this.next_round_late_acks = {};
  }


}
