export const PATH = '/consensus/sign_vertex';

export function handler({peer, data}) {
  // TODO record signed vertex (timely or late)
  // if threshold met for signed vertices:
  //   * record vertex certificate
  //   * gossip vertex certificate
  return {ok: true};
}