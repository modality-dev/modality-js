import { LevelDatastore } from "datastore-level";
import LevelMem from "level-mem";
import LevelRocksDb from "level-rocksdb";

import Keypair from "@modality-tools/utils/Keypair";

export default class NetworkDatastore {
  constructor() {
    this.datastore = null;
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
    return new LocalDAG(datastore);
  }

  static async createInDirectory(path) {
    const datastore = new LevelDatastore(path, {
      db: LevelRocksDb,
    });
    await datastore.open();
    return new LocalDAG(datastore);
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
}
