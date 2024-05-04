import createLibp2pNode from "../createLibp2pNode.js";
import PeerIdHelpers from "../PeerIdHelpers.js";
import { multiaddr } from '@multiformats/multiaddr'
import { pipe } from "it-pipe";

import { streamToConsole } from "../StreamHelpers.js";
import { parseConfigArgs } from "../parseConfigArgs.js";

export default async function run({config, keypair, listen, storage}) {
  const conf = parseConfigArgs({config, keypair, listen, storage});
  const peerId = await PeerIdHelpers.createFromJSON(conf.keypair);
  const node = await createLibp2pNode({
    peerId,
    addresses: {
      listen: [conf.listen],
    },
  });

  // Log a message when a remote peer connects to us
  node.addEventListener("peer:connect", (evt) => {
    const remotePeer = evt.detail;
    console.log("connected to: ", remotePeer.toString());
  });

  // Handle messages for the protocol
  await node.handle("/chat/1.0.0", async ({ stream }) => {
    // Send stdin to the stream
    stdinToStream(stream);
    // Read the stream and output to console
    streamToConsole(stream);
  });

  // Output listen addresses to the console
  console.log("Listener ready, listening on:");
  node.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
}

import cliCalls from "cli-calls";
await cliCalls(import.meta, run);
