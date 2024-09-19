import SafeJSON from "@modality-dev/utils/SafeJSON";
// import "@modality-dev/network-consensus";

export const TOPIC = "/consensus/page_draft";

export async function handler(node, event) {
  // todo check if i am in this epoch sequencers

  const local_dag = node.storage?.local_dag;
  if (!local_dag) {
    return;
  }

  const text = new TextDecoder().decode(event.detail.data);
  const page = SafeJSON.parse(text);

  await node.storage.sequencer.communication.onReceivePageDraft(page);
  // const page_ack = { };
  // await node.services.reqres.call(
  //   page.scribe,
  //   "/consensus/scribes/page_ack",
  //   page_ack
  // );
  // return page_ack;
}
