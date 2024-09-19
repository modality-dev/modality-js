import NetworkDatastore from "@modality-dev/network-datastore";
import Keypair from "@modality-dev/utils/Keypair";
import DAGRider from "@modality-dev/network-consensus/sequencing/DAGRider";
import RoundRobin from "@modality-dev/network-consensus/randomness/RoundRobin";

import ConsensusCommunication from "./lib/ConsensusCommunication.js";

export async function attachDatastore(node, conf) {
  node.storage ||= {};
  node.storage.datastore = await NetworkDatastore.createWith({
    storage_path: conf.storage,
  });
  node.storage.keypair = await Keypair.fromJSON(conf.keypair);
  node.storage.sequencer = new DAGRider({
    datastore: node.storage.datastore,
    pubkey: conf.keypair.id,
    keypair: conf.keypair,
    randomness: new RoundRobin(),
  });
  node.storage.sequencer.communication = new ConsensusCommunication({sequencer: node.storage.sequencer});
  // node.storage.local_dag = await LocalDAG.create(node.storage.datastore);
  // await node.storage.local_dag.setup({ keypair });
}
