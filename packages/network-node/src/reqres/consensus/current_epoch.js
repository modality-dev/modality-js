export const PATH = '/consensus/current_epoch';

export function handler({peer, data}) {
  console.log({ data });
  return {ok: true};
}