import SafeJSON from '@modality-dev/utils/SafeJSON';
import Keypair from '@modality-dev/utils/Keypair';

export default class Round {
  constructor({ round, procedures = {} }) {
    this.round = round;
    this.procedures = procedures;
    return this;
  }

  static getIdFor({ round }) {
    return `/consensus/round/${round}`;
  }

  getId() {
    return this.constructor.getIdFor({
      round: this.round,
    });
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
      producers: this.producers,
    });
  }
}