import NetworkDatastore from "@modality-dev/network-datastore";
import Keypair from "@modality-dev/utils/Keypair";
import DAGRider from "@modality-dev/network-consensus/sequencing/DAGRider";
import RoundRobin from "@modality-dev/network-consensus/election/RoundRobin";

import ConsensusCommunication from "./lib/ConsensusCommunication.js";

export async function attachDatastore(node, conf) {
  node.storage ||= {};
  node.storage.datastore = await NetworkDatastore.createWith({
    storage_type: "directory",
    storage_path: conf.storage,
  });
  node.storage.keypair = await Keypair.fromJSON(conf.keypair);
  node.storage.sequencer = new DAGRider({
    datastore: node.storage.datastore,
    pubkey: conf.keypair.id,
    keypair: node.storage.keypair,
    randomness: new RoundRobin(),
  });
  node.storage.sequencer.communication = new ConsensusCommunication({node: node, sequencer: node.storage.sequencer});
}
