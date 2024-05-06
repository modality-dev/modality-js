import { CodeError, ERR_INVALID_MESSAGE, ERR_INVALID_PARAMETERS, ERR_TIMEOUT, setMaxListeners } from '@libp2p/interface'
import { pipe } from "it-pipe";
import all from 'it-all';
import * as Uint8ArrayHelpers from "uint8arrays";
import SafeJSON from "@modality-tools/utils/SafeJSON";

import * as Consensus_SignVertex from './consensus/sign_vertex.js';

export function asReqResProtocol(func) {
  return ({ stream }) => {
    pipe(
      stream.source,
      async (source) => {
        const req = {};
        req.data = [];
        for await (const datum of source) {
          req.data.push(datum);
        }
        req.source = source;
        const res = await func(req);
        return [Uint8ArrayHelpers.fromString(res)];
      },
      stream.sink
    );
  };
}

export const PROTOCOL = '/modality-network/reqres/0.0.1'
export const PROTOCOL_VERSION = '0.0.1';
export const PROTOCOL_PREFIX = 'modality-network';
export const PROTOCOL_NAME = 'reqres';
export const TIMEOUT = 10000;
export const MAX_INBOUND_STREAMS = 2;
export const MAX_OUTBOUND_STREAMS = 1;

export class ReqResService {
  constructor (components, init = {}) {
    this.components = components
    this.log = components.logger.forComponent('modality-network:reqres')
    this.started = false
    this.protocol = `/${init.protocolPrefix ?? PROTOCOL_PREFIX}/${PROTOCOL_NAME}/${PROTOCOL_VERSION}`
    this.timeout = init.timeout ?? TIMEOUT
    this.maxInboundStreams = init.maxInboundStreams ?? MAX_INBOUND_STREAMS
    this.maxOutboundStreams = init.maxOutboundStreams ?? MAX_OUTBOUND_STREAMS
    this.runOnTransientConnection = init.runOnTransientConnection ?? true
    this.handleMessage = this.handleMessage.bind(this)
  }

  async handleRequest(peer, path, data) {
    if (path === Consensus_SignVertex.PATH) {
      return Consensus_SignVertex.handler({ peer, path, data });
    } else {
      throw new CodeError('invalid path', ERR_INVALID_PARAMETERS);
    }
  }

  async start () {
    await this.components.registrar.handle(this.protocol, this.handleMessage, {
      maxInboundStreams: this.maxInboundStreams,
      maxOutboundStreams: this.maxOutboundStreams,
      runOnTransientConnection: this.runOnTransientConnection
    })
    this.started = true
  }

  async stop () {
    await this.components.registrar.unhandle(this.protocol)
    this.started = false
  }

  isStarted () {
    return this.started
  }

  async handleMessage (data) {
    this.log('incoming reqres from %p', data.connection.remotePeer)

    const { stream } = data;
    const start = Date.now()
    console.log({ stream });

    let req_data = [];
    for await (const datum of stream.source) {
      req_data = Uint8ArrayHelpers.concat([req_data, datum.subarray()]);
    }
    const jsonString = Uint8ArrayHelpers.toString(req_data);
    const req = SafeJSON.parse(jsonString);
    this.log('incoming req', data.connection.remotePeer, req.path, req.data);
    const res = await this.handleRequest(data.connection.remotePeer, req.path, req.data);
    this.log('incoming reqres from %p complete in %dms', data.connection.remotePeer, Date.now() - start);
    const res_text = JSON.stringify(res); 
    return await pipe(
      [Uint8ArrayHelpers.fromString(res_text)],
      stream,
    );
  }

  async call (peer, path, data, options) {
    this.log('peer %p', peer, path, data); 

    const connection = await this.components.connectionManager.openConnection(peer, options);
    let signal;
    let stream;
    let onAbort = () => {}
    if (options?.signal == null) {
      signal = AbortSignal.timeout(this.timeout)
      options = {
        ...options,
        signal
      }
    }

    try {
      stream = await connection.newStream(this.protocol, {
        signal
      });

      onAbort = () => {
        stream?.abort(new CodeError('fetch timeout', ERR_TIMEOUT))
      }

      signal.addEventListener('abort', onAbort, { once: true })

      const text = JSON.stringify({
        path,
        data
      });

      const r = await pipe(
        [Uint8ArrayHelpers.fromString(text)],
        stream,
        async function (source) {
          const r = [];
          for await (const data of source) {
            r.push(Uint8ArrayHelpers.toString(data.subarray()));
          }
          return JSON.parse(r.join('\n'));
        }
      );
      this.log('response', r);
      return r;
    } catch (err) {
      stream?.abort(err)
      throw err;
    } finally {
      signal.removeEventListener('abort', onAbort);
      if (stream != null) {
        await stream.close()
      }
    }
  }
}

export default function() {
  return (components) => new ReqResService(components);
}