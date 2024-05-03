import { PEER_1, PEER_2, PEER_3 } from "../fixtures/DemoPeers.js";

import createLibp2pNode from "../createLibp2pNode.js";
import PeerIdHelpers from "../PeerIdHelpers.js";
import { multiaddr } from '@multiformats/multiaddr'

import { streamToConsole } from "../StreamHelpers.js";

export default async function run({ping, peerNumber = 1}) {
  const peer = peerNumber === 1 ? PEER_1 : PEER_2;
  const peerId = await PeerIdHelpers.createFromJSON(peer.peerId);
  const node = await createLibp2pNode({
    peerId,
    addresses: {
      listen: peer.listeners,
    },
  });

  // console.log(node.getMultiaddrs())
// process.exit(0)
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

  if (ping) {
    const ma = multiaddr("/ip4/127.0.0.1/tcp/9090/ws");
    // const ma = multiaddr("/ip4/0.0.0.0/tcp/9090/p2p/12D3KooWLGfBkUYjRWcq7LpZLpHbondoRKi7pMyCTsyMM5XAqcJy");
    // const ma = multiaddr("/ip4/0.0.0.0/tcp/9090/p2p/12D3KooWLGfBkUYjRWcq7LpZLpHbondoRKi7pMyCTsyMM5XAqcJy");
    // const conn = await node.dial(multiaddr("/ip4/127.0.0.1/tcp/9090/p2p/12D3KooWLGfBkUYjRWcq7LpZLpHbondoRKi7pMyCTsyMM5XAqcJy"))
    // const r = await node.dial(ma);
    const stream = await node.dialProtocol(ma, "/ipfs/id/1.0.0");
    streamToConsole(stream);
    // console.info('connected to', conn.remotePeer, 'on', conn.remoteAddr)
    // return conn
  }

}

import cliCalls from "cli-calls";
await cliCalls(import.meta, run);
