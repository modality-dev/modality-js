import { setupServer } from "@thylacine-js/webapi-express";
import NetworkDatastore from '@modality-dev/network-datastore';
import NetworkDatastoreBuilder from "@modality-dev/network-datastore/NetworkDatastoreBuilder";

import DAGRider from "@modality-dev/network-consensus/binders/DAGRider";
import RoundRobin from "@modality-dev/network-consensus/randomness/RoundRobin";

import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = `${__dirname}/`;

export default async function main({port, datastore}) {
  port = port || 3001;

  const server = await setupServer({ appDir, validateCors: () => true });

  if (datastore === 'mock') {
    const SCRIBES = 5;
    const ROUNDS = 12;
    const builder = await NetworkDatastoreBuilder.createInMemory();
    const scribes = await NetworkDatastoreBuilder.generateScribes(SCRIBES);
    builder.scribes = Object.keys(scribes);
    await builder.addFullyConnectedRound();
    for (let i = 1; i < ROUNDS; i++) {
      await builder.addConsensusConnectedRound();
    }
    const randomness = new RoundRobin();
    const binder = new DAGRider({
      datastore: builder.datastore,
      randomness,
    });
    await binder.saveOrderedPageNumbers(1, ROUNDS);
    server.datastore_builder = builder;
    server.datastore = builder.datastore;
  } else if (datastore) {
    server.datastore = await NetworkDatastore.createInDirectory(datastore);
  } else {
    server.datastore = await NetworkDatastore.createInMemory();
  }
  server.listen(port, () => {
    console.log(`listening on http://0.0.0.0:3001`);
  }); 
}

import cliCalls from "cli-calls";
cliCalls(import.meta, main);