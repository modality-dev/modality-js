import SafeJSON from "@modality-dev/utils/SafeJSON";
import Keypair from "@modality-dev/utils/Keypair";

// Narwhal style vertices
export default class Page {
  constructor({
    scribe,
    round,
    events = [],
    hash,
    sig,
    acks = {},
    late_acks = [],
    cert,
    is_section_leader,
    section_ending_round,
    section_starting_round,
    section_page_number,
    page_number
  }) {
    this.scribe = scribe;
    this.round = round;
    this.events = events;

    // scribe
    this.hash = hash;
    this.sig = sig;

    // peer acknowledgements
    this.acks = acks;
    this.late_acks = late_acks;

    // final cert
    this.cert = cert;

    // consensus related
    this.is_section_leader = is_section_leader;
    this.section_starting_round = section_starting_round;
    this.section_ending_round = section_ending_round;
    this.section_page_number = section_page_number;
    this.page_number = page_number;
  }

  static fromJSON(json) {
    if (!json) return null;
    return new Page(SafeJSON.parse(json));
  }

  static getIdFor({ round, scribe }) {
    return `/consensus/round/${round}/scribe/${scribe}`;
  }

  getId() {
    return this.constructor.getIdFor({
      round: this.round,
      scribe: this.scribe,
    });
  }

  static async findOne({ datastore, round, scribe }) {
    const v = await datastore.get(this.getIdFor({ round, scribe }));
    return this.fromJSON(v.toString());
  }

  async save({ datastore }) {
    return datastore.put(this.getId(), this.toJSON());
  }

  toJSON() {
    return JSON.stringify({
      scribe: this.scribe,
      round: this.round,
      events: this.events,
      hash: this.hash,
      sig: this.sig,
      acks: this.acks,
      late_acks: this.late_acks,
      cert: this.cert,
      number: this.number,
      is_section_leader: this.is_section_leader,
      section_starting_round: this.section_starting_round,
      section_ending_round: this.section_ending_round,
      section_page_number: this.section_page_number,
      page_number: this.page_number,
    });
  }

  addEvent(event) {
    this.events.push(event);
  }

  setNumber(number) {
    this.number = number;
  }

  async generateSig(keypair) {
    this.sig = await keypair.signJSON({
      scribe: this.scribe,
      round: this.round,
      events: this.events,
    });
    return this.sig;
  }

  validateSig() {
    const keypair = Keypair.fromPublicKey(this.scribe);
    return keypair.verifyJSON(this.sig, {
      scribe: this.scribe,
      round: this.round,
      events: this.events,
    });
  }

  async generateAck(keypair) {
    const peer_id = await keypair.asPublicAddress();
    const facts = {
      scribe: this.scribe,
      round: this.round,
      events: this.events,
      sig: this.sig,
    };
    const sig = await keypair.signJSON(facts);
    return {scribe: peer_id, round: (this.round - 1), sig};
  }

  async validateAck(ack) {
    // TODO
    return true;
    const keypair = Keypair.fromPublicKey(ack[0]);
    const facts = {
      scribe: this.scribe,
      round: this.round,
      events: this.events,
      sig: this.sig,
    };
    return await keypair.verifyJSON(ack[1], facts);
  }

  async addAck(ack) {
    const is_valid = await this.validateAck(ack);
    if (is_valid) {
      this.acks[ack.scribe] = ack;
      return true;
    }
  }

  validateAcks() {
    for (const ack of Object.values(this.acks)) {
      const keypair = Keypair.fromPublicKey(ack.scribe);
      if (
        !keypair.verifyJSON(ack.sig, {
          scribe: this.scribe,
          round: this.round,
          events: this.events,
          sig: this.sig,
        })
      ) {
        return false;
      }
    }
    return true;
  }

  countValidAcks() {
    let valid_acks = 0;
    for (const ack of Object.values(this.acks)) {
      const keypair = Keypair.fromPublicKey(ack.scribe);
      if (
        keypair.verifyJSON(ack.sig, {
          scribe: this.scribe,
          round: this.round,
          events: this.events,
          sig: this.sig,
        })
      ) {
        valid_acks += 1;
      }
    }
    return valid_acks;
  }

  async validateLateAck(ack) {
    // return true;
    return true;
  }

  async addLateAck(ack) {
    const is_valid = await this.validateAck(ack);
    if (is_valid) {
      this.late_acks.push(ack);
      return true;
    } 
  }

  async generateCert(keypair) {
    this.cert = await keypair.signJSON({
      scribe: this.scribe,
      round: this.round,
      events: this.events,
      acks: this.acks,
    });
    return this.cert;
  }

  async validateCert() {
    const keypair = Keypair.fromPublicKey(this.scribe);
    return keypair.verifyJSON(this.cert, {
      scribe: this.scribe,
      round: this.round,
      events: this.events,
      acks: this.acks,
    });
  }
}
