import createLibp2pNode from "../createLibp2pNode.js";
import PeerIdHelpers from "../PeerIdHelpers.js";
import { parseConfigArgs } from "../parseConfigArgs.js";

import { SEQUENCER_TOPIC_MODULES } from '../gossip/index.js';

async function addSequencerEventListeners(node) {
  for (const module of SEQUENCER_TOPIC_MODULES) {
    node.services.pubsub.subscribe(module.TOPIC);
  }
  node.services.pubsub.addEventListener("message", (message) => {
    const topic = message.detail.topic;
    for (const module of SEQUENCER_TOPIC_MODULES) {
      if (topic === module.TOPIC) {
        module.handler(message);
      }
    }
  });
}

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

  await addPeerDiscoveryEventListeners(node);
  await addSequencerEventListeners(node);

  console.log("Listener ready, listening on:");
  node.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
}

import cliCalls from "cli-calls";
await cliCalls(import.meta, run);
