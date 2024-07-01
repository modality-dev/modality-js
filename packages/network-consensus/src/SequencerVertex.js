// TODO DEPRECATED
export default class SequencerVertex {
  constructor({ round, sequencer, timelyEdges, lateEdges, events }) {
    this.round = round;
    this.sequencer = sequencer;
    this.timelyEdges = timelyEdges;
    this.lateEdges = lateEdges;
    this.events = events;
    return this;
  }

  static getIdFor({ round, sequencer }) {
    return `/consensus/round/${round}/sequencer/${sequencer}`;
  }

  getId() {
    return this.constructor.getIdFor({
      round: this.round,
      sequencer: this.sequencer,
    });
  }

  getValues() {
    return {
      round: this.round,
      sequencer: this.sequencer,
      timelyEdges: this.timelyEdges,
      lateEdges: this.lateEdges,
      events: this.events,
    };
  }
}
