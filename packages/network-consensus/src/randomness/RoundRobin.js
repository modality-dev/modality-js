export default class RoundRobin {
  constructor() {}

  async pickOne({ options, input }) {
    const i = parseInt(input) % options.length;
    return options[i];
  }
}
