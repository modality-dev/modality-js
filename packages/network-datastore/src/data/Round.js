import SafeJSON from "@modality-dev/utils/SafeJSON";
import Keypair from "@modality-dev/utils/Keypair";

export default class Round {
  constructor({ round, scribes = [] }) {
    this.round = round;
    this.scribes = scribes;
    return this;
  }

  static findMaxId({datastore}) {
    return datastore.findMaxIntKey(`/consensus/round`);
  }

  static getIdFor({ round }) {
    return `/consensus/round/${round}`;
  }

  getId() {
    return this.constructor.getIdFor({
      round: this.round,
    });
  }

  addScribe(scribe_peer_id) {
    this.scribes.push(scribe_peer_id);
  }

  removeScribe(scribe_peer_id) {
    this.scribes = this.scribes.filter((s) => s !== scribe_peer_id);
  }

  static fromJSON(json) {
    if (!json) return null;
    return new Round(SafeJSON.parse(json));
  }

  static async findOne({ datastore, round }) {
    const v = await datastore.get(this.getIdFor({ round }));
    return this.fromJSON(v.toString());
  }

  async save({ datastore }) {
    return datastore.put(this.getId(), this.toJSON());
  }

  toJSON() {
    return JSON.stringify({
      round: this.round,
      scribes: this.scribes,
    });
  }
}
