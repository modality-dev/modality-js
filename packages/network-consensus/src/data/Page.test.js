import { jest, expect, describe, test, it } from "@jest/globals";

import Page from "./Page";
import Keypair from "@modality-dev/utils/Keypair";
import NetworkDatastore from "@modality-dev/network-datastore";

describe("Page", () => {
  it("should work", async () => {
    const datastore = await NetworkDatastore.createInMemory();

    const node1_keypair = await Keypair.generate();
    const node1_pubkey = await node1_keypair.asPublicAddress();

    const node2_keypair = await Keypair.generate();
    const node2_pubkey = await node1_keypair.asPublicAddress();

    let b1 = new Page({ scribe: node1_pubkey, round: 1, events: [] });
    await b1.addEvent({ data: "data1" });
    await b1.addEvent({ data: "data2" });
    expect(b1.events.length).toBe(2);
    let sig1 = await b1.generateSig(node1_keypair);
    let result = await b1.validateSig();
    expect(result).toBe(true);
    let b1empty = new Page({ scribe: node1_pubkey, round: 1, events: [] });
    let sig1empty = await b1empty.generateSig(node1_keypair);
    expect(sig1).not.toBe(sig1empty);

    let ack1 = await b1.generateAck(node2_keypair);
    await b1.addAck(ack1);
    expect(b1.acks[ack1[0]]).toBe(ack1[1]);
    result = await b1.validateAcks();
    expect(result).toBe(true);
    result = await b1.countValidAcks(ack1);
    expect(result).toBe(1);

    await b1.generateCert(node1_keypair);
    result = await b1.validateCert();
    expect(result).toBe(true);
    await b1.save({ datastore });

    result = b1.getId();
    expect(result).toBe(`/consensus/round/1/scribe/${node1_pubkey}`);
    const b1r = await Page.findOne({
      datastore,
      round: 1,
      scribe: node1_pubkey,
    });
    expect(b1r.cert).toBe(b1.cert);
  });
});
