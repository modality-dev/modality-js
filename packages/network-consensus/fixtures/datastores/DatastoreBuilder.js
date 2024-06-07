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

  async addSimpleRound({ failures = 0 } = {}) {
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
          page.acks[peer_scribe] = {
            round: peer_prev_page?.round,
            scribe: peer_scribe,
          };
        }
      }
      await page.save({ datastore: this.datastore });
    }
  }
}
