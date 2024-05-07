import * as ConsensusVertex from "../gossip/consensus/vertex.js";
import * as ConsensusVertexCertificate from "../gossip/consensus/vertex_certificate.js";

export const SEQUENCER_TOPIC_MODULES = [
  ConsensusVertex,
  ConsensusVertexCertificate,
];

export async function addSequencerEventListeners(node) {
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