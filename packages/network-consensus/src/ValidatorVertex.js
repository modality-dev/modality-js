export default class ValidatorVertex {
  constructor({ round, validator, timelyEdges, lateEdges, events }) {
    this.round = round;
    this.validator = validator;
    this.timelyEdges = timelyEdges;
    this.lateEdges = lateEdges;
    this.events = events;
    return this;
  }

  static getIdFor({ round, validator }) {
    return `/consensus/round/${round}/validator/${validator}`;
  }

  getId() {
    return this.constructor.getIdFor({
      round: this.round,
      validator: this.validator,
    });
  }

  getValues() {
    return {
      round: this.round,
      validator: this.validator,
      timelyEdges: this.timelyEdges,
      lateEdges: this.lateEdges,
      events: this.events,
    };
  }
}
