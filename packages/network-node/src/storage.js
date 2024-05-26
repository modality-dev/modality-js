import NetworkDatastore from "@modality-dev/network-datastore";
import LocalDAG from "@modality-dev/network-consensus/LocalDAG";
import Keypair from "@modality-dev/utils/Keypair";

export async function addLocalDAGStorage(node, conf) {
  node.storage ||= {};
  node.storage.datastore = await NetworkDatastore.createWith({
    storage_path: conf.storage,
  });
  const keypair = await Keypair.fromJSON(conf.keypair);
  node.storage.local_dag = await LocalDAG.create(node.storage.datastore);
  await node.storage.local_dag.setup({keypair});
}
