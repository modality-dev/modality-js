export default class Epoch {
  constructor({ epoch, sequencers, validators }) {
    this.epoch = epoch;
    this.sequencers = sequencers;
    return this;
  }
}