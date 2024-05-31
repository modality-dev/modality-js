import Binder from "./Binder";

export default class Bullshark extends Binder {
  constructor({ datastore, randomness }) {
    super({ datastore, randomness });
  }

  async findFirstPageInRound(round) {
    throw new Error('Not implemented');
  }

  async findOrderedPagesInChapter(start_round, end_round) {
    throw new Error('Not implemented');
  }
}