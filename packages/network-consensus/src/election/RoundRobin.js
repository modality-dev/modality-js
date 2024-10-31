export default class RoundRobin {
  constructor() {}

  async pickOne({ options, input }) {
    // absolute first round is round 1
    const i = parseInt(JSON.parse(input).round - 1) % options.length;
    return options[i];
  }
}
