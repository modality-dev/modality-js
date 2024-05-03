import { createLibp2p } from 'libp2p'

// protocols
import { tcp } from '@libp2p/tcp';
import { webSockets } from "@libp2p/websockets";
// import { webRTC, webRTCDirect } from '@libp2p/webrtc'

// encryption
import { noise } from '@chainsafe/libp2p-noise'
import { plaintext } from "@libp2p/plaintext";

// multiplexers
import { yamux } from '@chainsafe/libp2p-yamux'

// protocols
import { identify } from '@libp2p/identify'

export default async function createLibp2pNode({
  port,
  enableNAT,
  enableWebSockets,
  enableWebRTC,
  enableWebRTCDirect,
  disableEncryption,
  enableServeAsRelay,
  enableListenViaRelay,
  ...options
} = {}) {
  const transports =
    [
      tcp(),
      webSockets()
    ];

  const connectionEncryption = disableEncryption
    ? [plaintext()]
    : [noise()];

  const nat = enableNAT
    ? {
        enabled: true,
      }
    : {};

  const relay = {
    enabled: true,
  };
  if (enableServeAsRelay) {
    relay.hop = {
      enabled: true,
    };
    relay.advertise = {
      enabled: true,
    };
  }
  if (enableListenViaRelay) {
    relay.autoRelay = {
      enabled: true,
      maxListeners: 2,
    };
  }

  const node = await createLibp2p({
    transports,
    connectionEncryption,
    streamMuxers: [yamux()],
    relay,
    nat,
    services: {
      identify: identify(),
    },
    ...options,
  });

  const stop = async () => {
    await node.stop();
    process.exit(0);
  };

  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  return node;
}