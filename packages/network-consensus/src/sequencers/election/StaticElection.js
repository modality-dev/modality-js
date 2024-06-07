export default class StaticElection {
  static name = "static";

  constructor({ initial_sequencers }) {
    this.sequencers = initial_sequencers;
  }

  getSequencersForEpoch(epoch, local_dag) {
    return this.sequencers;
  }
}
