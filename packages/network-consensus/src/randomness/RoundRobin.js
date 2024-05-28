export default class RoundRobin {
  constructor({index = 0}) {
    this.index = index;
  }

  async pickOne({options}) {
    const i = this.index % options.length;
    this.index = this.index + 1;
    return options[i];
  }
}