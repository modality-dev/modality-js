import LocalDAG from "@modality-tools/network-consensus/LocalDAG";
import Keypair from "@modality-tools/utils/Keypair";

export async function addLocalDAGStorage(node, conf) {
  node.storage ||= {};
  node.storage.local_dag = await LocalDAG.createWith({
    storage_path: conf.storage,
  });
  const keypair = await Keypair.fromJSON(conf.keypair);
  await node.storage.local_dag.setup({keypair});
}
