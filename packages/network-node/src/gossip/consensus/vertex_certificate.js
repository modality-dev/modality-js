import SafeJSON from "@modality-dev/utils/SafeJSON";

export const TOPIC = "/consensus/vertex_certificate";

export async function handler(node, event) {
  const text = new TextDecoder().decode(event.detail.data);
  const obj = SafeJSON.parse(text);
  console.log({ event, text, obj });
}
