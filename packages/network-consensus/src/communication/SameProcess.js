import * as Devnet from "@modality-dev/network-configs/devnet-common/index";

export default class SameProcess {
  constructor({ scribe_sequencers } = {}) {
    this.scribe_sequencers = scribe_sequencers;
    this.offline_sequencers = [];
  }

  async broadcastDraftPage({ from, page_data }) {
    if (this.offline_sequencers.includes(from)) {
      return;
    }
    for (const to_seq of Object.values(this.scribe_sequencers)) {
      if (this.offline_sequencers.includes(to_seq.pubkey)) {
        continue;
      }
      await to_seq?.onReceiveDraftPage(page_data);
    }
  }

  async sendPageAck({ from, to, ack_data }) {
    if (this.offline_sequencers.includes(from)) {
      return;
    }
    if (this.offline_sequencers.includes(to)) {
      return;
    }
    const to_seq = this.scribe_sequencers[to];
    await to_seq?.onReceivePageAck(ack_data);
  }

  async sendPageLateAck({ from, to, ack_data }) {
    if (this.offline_sequencers.includes(from)) {
      return;
    }
    if (this.offline_sequencers.includes(to)) {
      return;
    }
    const to_seq = this.scribe_sequencers[to];
    await to_seq?.onReceivePageLateAck(ack_data);
  }

  async broadcastCertifiedPage({ from, page_data }) {
    if (this.offline_sequencers.includes(from)) {
      return;
    }
    for (const to_seq of Object.values(this.scribe_sequencers)) {
      if (this.offline_sequencers.includes(to_seq.pubkey)) {
        continue;
      }
      await to_seq?.onReceiveCertifiedPage(page_data);
    }
  }

  async fetchScribeRoundCertifiedPage({ from, to, scribe, round }) {
    if (this.offline_sequencers.includes(from)) {
      return;
    }
    const to_seq = this.scribe_sequencers[to];
    return to_seq?.onFetchScribeRoundCertifiedPageRequest({scribe, round});
  };
}
