import SafeJSON from "@modality-dev/utils/SafeJSON";
import PeerIdHelpers from "../../PeerIdHelpers.js";

export const TOPIC = "/consensus/vertex";

export async function handler(node, event) {
  // todo check if i am in this epoch sequencers

  const local_dag = node.storage?.local_dag;
  if (!local_dag) {
    return;
  }

  const text = new TextDecoder().decode(event.detail.data);
  const vertex = SafeJSON.parse(text);

  // TODO check if sender is this epoch sequencer
  // TODO actually sign vertex
  const signed_vertex = { ...vertex };
  await node.services.reqres.call(
    vertex.sequencer,
    "/consensus/sign_vertex",
    signed_vertex
  );
  return vertex;
}
