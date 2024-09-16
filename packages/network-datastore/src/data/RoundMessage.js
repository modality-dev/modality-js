import SafeJSON from "@modality-dev/utils/SafeJSON";
import Keypair from "@modality-dev/utils/Keypair";

export default class RoundMessage {
  constructor({ round, scribe, type, content, seen_at_round }) {
    this.round = round;
    this.scribe = scribe;
    this.type = type;
    this.seen_at_round = seen_at_round;
    this.content = content;
    return this;
  }

  static getIdFor({ round, type, scribe }) {
    return `/consensus/round_messages/${round}/type/${type}/scribe/${scribe}`;
  }

  getId() {
    return this.constructor.getIdFor({
      round: this.round,
      scribe: this.scribe,
      type: this.type,
    });
  }

  static fromJSONString(json) {
    if (!json) return null;
    return new RoundMessage(SafeJSON.parse(json));
  }

  static fromJSONObject(obj) {
    return new RoundMessage(obj);
  }

  static async findAllInRoundOfType({ datastore, round, type }) {
    const prefix = `/consensus/round_messages/${round}/type/${type}/scribe`;
    const it = datastore.iterator({ prefix });
    const r = [];
    for await (const [key, value] of it) {
      const scribe = key.split(`${prefix}/`)[1];
      const msg = await this.findOne({ datastore, round, type, scribe });
      if (msg) {
        r.push(msg);
      }
    }
    return r;
  }

  static async findOne({ datastore, round, type, scribe }) {
    const v = await datastore.get(this.getIdFor({ round, type, scribe }));
    return this.fromJSONString(v.toString());
  }

  async save({ datastore }) {
    return datastore.put(this.getId(), this.toJSON());
  }

  toJSON() {
    return JSON.stringify({
      round: this.round,
      scribe: this.scribe,
      type: this.type,
      seen_at_round: this.seen_at_round,
      content: this.content,
    });
  }
}
