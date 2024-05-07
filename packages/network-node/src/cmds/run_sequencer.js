import createLibp2pNode from "../createLibp2pNode.js";
import PeerIdHelpers from "../PeerIdHelpers.js";
import { parseConfigArgs } from "../parseConfigArgs.js";

import { addSequencerEventListeners } from "../gossip/index.js";
import { addLocalDAGStorage } from "../storage.js";


async function addPeerDiscoveryEventListeners(node) {
  node.addEventListener("peer:connect", (evt) => {
    console.log("connected to: ", evt.detail.toString());
  });

  node.addEventListener('peer:discovery', (evt) => {
    console.log('found peer: ', evt.detail.toString())
  })
}

export default async function run({ config, keypair, listen, storage }) {
  const conf = parseConfigArgs({ config, keypair, listen, storage });
  const peerId = await PeerIdHelpers.createFromJSON(conf.keypair);

  const node = await createLibp2pNode({
    peerId,
    addresses: {
      listen: [conf.listen],
    },
    bootstrappers: conf.bootstrappers,
  });

  await addLocalDAGStorage(node, conf);

  await addPeerDiscoveryEventListeners(node);
  await addSequencerEventListeners(node);

  console.log("Listener ready, listening on:");
  node.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
}

import cliCalls from "cli-calls";
await cliCalls(import.meta, run);
