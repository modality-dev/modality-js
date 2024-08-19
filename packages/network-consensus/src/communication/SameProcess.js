export default class SameProcess {
  constructor({ scribe_sequencers } = {}) {
    this.scribe_sequencers = scribe_sequencers;
  }

  async broadcastDraftPage({ from, page_data }) {
    for (const to_seq of Object.values(this.scribe_sequencers)) {
      await to_seq?.onReceiveDraftPage(page_data);
    }
  }

  async sendPageAck({ from, to, ack_data }) {
    const to_seq = this.scribe_sequencers[to];
    await to_seq?.onReceivePageAck(ack_data);
  }

  async broadcastCertifiedPage({ from, page_data }) {
    for (const to_seq of Object.values(this.scribe_sequencers)) {
      await to_seq?.onReceiveCertifiedPage(page_data);
    }
  }
}
