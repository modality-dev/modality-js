import { SEQUENCER_ELECTION_MECHANISMS } from "./sequencers/election/index.js";

export default class Network {
  constructor({ initial_commit_difficulty, initial_sequencers, sequencer_election_mechanism }) {
    this.initial_commit_difficulty = initial_commit_difficulty;
    this.initial_sequencers = initial_sequencers;
    this.sequencer_election_mechanism = new SEQUENCER_ELECTION_MECHANISMS[sequencer_election_mechanism]({
      initial_sequencers,
    });
    return this;
  }

  async getSequencersForEpoch(epoch, local_dag) {
    return this.sequencer_election_mechanism.getSequencersForEpoch(epoch, local_dag);
  }

  async getCommitDifficultyForEpoch(epoch, local_dag) {
    // TODO use previous epoch to set commit difficulty
    return this.initial_commit_difficulty;
  }
}
