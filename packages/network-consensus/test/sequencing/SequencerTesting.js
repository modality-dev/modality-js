import Devnet from "@modality-dev/network-configs/Devnet";
import NetworkDatastoreBuilder from "@modality-dev/network-datastore/NetworkDatastoreBuilder";
import SameProcess from "../../src/communication/SameProcess";
import RoundRobin from "../../src/randomness/RoundRobin";

export default class SequencerTesting {
  constructor() {
    this.seqs = null;
    this.communication = null;
  }

  static async setup({node_count = 1, SequencerModule, randomness = new RoundRobin()}) {
    const r = new SequencerTesting();
    const scribe_keypairs = await Devnet.getKeypairsDict(node_count);
    const dsb = await NetworkDatastoreBuilder.createInMemory();
    await dsb.setupGenesisScribes(scribe_keypairs);
    const communication = new SameProcess();
    const seqs = await dsb.createSequencers(SequencerModule, {
      randomness,
      communication,
    });
    for (const seq of Object.values(seqs)) {
      seq.intra_round_wait_time_ms = 0;
    }
    communication.scribe_sequencers = {...seqs};
    r.seqs = seqs;
    r.communication = communication;
    return r;
  }

  getSequencer(pubkey) {
    return this.seqs[pubkey];
  }

  onlineSequencerEntries() {
    return Object.fromEntries(Object.entries(this.seqs).filter((seq) => !this.communication.offline_sequencers.includes(seq[0])));
  }

  runUntilRound(round, signal) {
    return Promise.all(Object.values(this.onlineSequencerEntries()).map((seq) => seq.runUntilRound(round, signal)));
  }
}