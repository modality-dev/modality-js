import { setupServer } from "@thylacine-js/webapi-express";
import NetworkDatastore from '@modality-dev/network-datastore';

import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = `${__dirname}/`;

export default async function main({port, datastore}) {
  port = port || 3001;

  const server = await setupServer({ appDir, validateCors: () => true });

  let _datastore;
  if (_datastore) {
    _datastore = await NetworkDatastore.createInDirectory(datastore);
  } else {
    _datastore = await NetworkDatastore.createInMemory();
  }
  server.datastore = _datastore;
  server.listen(port, () => {
    console.log(`listening on http://0.0.0.0:3001`);
  }); 
}

import cliCalls from "cli-calls";
cliCalls(import.meta, main);