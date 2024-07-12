import { LevelDatastore } from "datastore-level";
import LevelMem from "level-mem";
import LevelRocksDb from "level-rocksdb";
import SafeJSON from "@modality-dev/utils/SafeJSON";
import fs from 'fs';

import Keypair from "@modality-dev/utils/Keypair";

export default class NetworkDatastore {
  constructor(datastore) {
    this.datastore = datastore;
    return this;
  }

  static async createWith({ storage_type, storage_path }) {
    if (storage_type === "directory" && storage_path) {
      return this.createInDirectory(storage_path);
    } else {
      return this.createInMemory();
    }
  }

  static async createInMemory() {
    const datastore = new LevelDatastore(`:memory:`, {
      db: LevelMem,
    });
    await datastore.open();
    return new NetworkDatastore(datastore);
  }

  static async createInDirectory(path) {
    const datastore = new LevelDatastore(path, {
      db: LevelRocksDb,
    });
    await datastore.open();
    return new NetworkDatastore(datastore);
  }

  async writeToDirectory(path) {
    const datastore = new LevelDatastore(path, {
      db: LevelRocksDb,
    });
    await datastore.open();
    const it = await this.iterator({prefix:''});
    for await (const [key, value] of it) {
      await datastore.put(key, value);
    }
  }

  async writeToSqlExport(path) {
    const f = fs.createWriteStream(path);
    f.write('CREATE TABLE IF NOT EXISTS key_values (key TEXT PRIMARY KEY, value JSONB); \n');
    const it = await this.iterator({prefix:''});
    for await (const [key, value] of it) {
      const escapedKey = key?.replace(/'/g, "''");
      const escapedValue = value.toString().replace(/'/g, "''");
      f.write(
        `INSERT INTO key_values (key, value) VALUES ('${escapedKey}', '${escapedValue}') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;\n`); 
    }
    f.end();
  }

  async getDataByKey(key) {
    try {
      return await this.datastore.get(key);
    } catch (e) {
      if (e.code !== "ERR_NOT_FOUND") {
        throw e;
      }
    }
  }

  async setDataByKey(key, value) {
    await this.datastore.put(key, value.toString());
  }

  get(key) {
    return this.datastore.get(key);
  }

  async getString(key) {
    return (await this.datastore.get(key)).toString();
  }

  async getJSON(key) {
    return SafeJSON.parse((await this.datastore.get(key)).toString());
  }

  put(key, value) {
    return this.datastore.put(key, value);
  }

  queryKeys(opts) {
    return this.datastore.queryKeys(opts);
  }

  iterator({prefix, filters, orders}) {
    return this.datastore.db.iterator({prefix, filters, orders});
  }

  async findMaxStringKey(prefix) {
    const it = this.datastore.db.iterator({
      gt: `${prefix}/`,
      lt: `${prefix}0`,
      reverse: true, 
      limit: 1
    });
    for await (const [key, value] of it) {
      return key.split(`${prefix}/`)[1];
    }
  } 

  async findMaxIntKey(prefix) {
    let r = null;
    const it = this.datastore.db.iterator({
      gt: `${prefix}/`,
      lt: `${prefix}0`,
    });
    for await (const [key, value] of it) {
      // TODO safer
      const v = parseInt(key.split(`${prefix}/`)[1]);
      if (r === null) {
        r = v;
      } else if (v > r) {
        r = v;
      }
    }
    return r;
  } 
}
