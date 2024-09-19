export const PATH = "/consensus/scribes/page_ack";

export function handler({ peer, data }) {
  // TODO record signed vertex (timely or late)
  // if threshold met for signed vertices:
  //   * record vertex certificate
  //   * gossip vertex certificate
  return { ok: true };
}
