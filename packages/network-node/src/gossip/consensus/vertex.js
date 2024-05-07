import SafeJSON from "@modality-tools/utils/SafeJSON";

export const TOPIC = "/consensus/vertex";

export async function handler(event) {
  const text = new TextDecoder().decode(event.detail.data)
  const obj = SafeJSON.parse(text);
  return obj;
}