import LocalDAG from "@modality-dev/network-consensus/LocalDAG";
import Keypair from "@modality-dev/utils/Keypair";

export async function addLocalDAGStorage(node, conf) {
  node.storage ||= {};
  node.storage.local_dag = await LocalDAG.createWith({
    storage_path: conf.storage,
  });
  const keypair = await Keypair.fromJSON(conf.keypair);
  await node.storage.local_dag.setup({keypair});
}
