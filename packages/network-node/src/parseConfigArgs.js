import JSONFile from "@modality-tools/utils/JSONFile"
import PeerIdHelpers from "./PeerIdHelpers.js";

export function parseConfigArgs({config, keypair, listen, storage}) {
  let c = {keypair, listen, storage};
  if (config) {
    c = JSONFile.readSync(config);
  }
  if (keypair) {
    c.keypair = keypair;
  }
  if (listen) {
    c.listen = listen;
  }
  if (storage) {
    c.storage = storage;
  }
  return c;
}