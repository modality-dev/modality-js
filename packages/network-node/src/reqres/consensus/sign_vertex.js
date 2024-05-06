export const PATH = '/consensus/sign_vertex';

export function handler({peer, data}) {
  console.log({ data });
  return {ok: true};
}