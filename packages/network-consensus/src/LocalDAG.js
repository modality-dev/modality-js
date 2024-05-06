import { LevelDatastore } from "datastore-level";
import LevelMem from "level-mem";
import LevelRocksDb from "level-rocksdb";

import Keypair from "@modality-tools/utils/Keypair";
import ValidatorVertex from "./ValidatorVertex.js";

export default class LocalDAG {
  constructor(datastore) {
    this.datastore = datastore;
    this.round = null;
    this.keypair = null;
    this.whoami = null;
    return this;
  }

  static async createWith({ datastore, storage_type, storage_path }) {
    if (datastore) {
      await datastore.open();
      return new LocalDAG(datastore);
    }

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

  async setup({ keypair, round, vertices } = {}) {
    this.round = round || 1;

    if (!keypair) {
      keypair = await Keypair.generate();
    }
    this.keypair = keypair;
    this.whoami = await keypair.asPublicAddress();

    if (vertices && vertices.length) {
      for (const values of vertices) {
        await this.addVertexFromValues(values);
      }
      const max_round = Math.max(
        ...vertices
          .map((i) => i.round)
      );
      this.round = max_round + 1;
    }
  }

  bumpRound() {
    this.round = this.round + 1;
  }

  async createVertex(events = []) {
    return new ValidatorVertex({
      round: this.round,
      validator: this.whoami,
      timelyEdges: await this.getTimelyEdges(),
      lateEdges: await this.getLateEdges(),
      events,
    });
  }

  async addVertex(vertex) {
    const k = vertex.getId();
    const v = JSON.stringify(vertex.getValues());
    await this.datastore.put(k, v);
  }

  async addVertexFromValues(vertexValues, noteIfLate = true) {
    const vertex = new ValidatorVertex(vertexValues);
    const id = vertex.getId();
    await this.datastore.put(id, JSON.stringify(vertex.getValues()));
    if (noteIfLate & (vertex.round < this.round - 1)) {
      await this.datastore.put(`/consensus/late/${id}`, { seen_at_round: this.round });
    }
  }

  async getVertexId({ validator, round }) {
    return ValidatorVertex.getIdFor({ validator, round });
  }

  async getVertex({ validator, round }) {
    const id = ValidatorVertex.getIdFor({ validator, round });
    return this.getVertexById(id);
  }

  async getVertexById(id) {
    const rawData = await this.datastore.get(id).catch((e) => {
      if (e.code === "ERR_NOT_FOUND") {
        return null;
      } else {
        throw e;
      }
    });
    const data = JSON.parse(rawData);
    return new ValidatorVertex(data);
  }

  async findPathBetweenVertices(firstValidatorVertexId, lastValidatorVertexId) {
    const firstValidatorVertexJSONString = await this.datastore.get(
      firstValidatorVertexId
    );
    if (!firstValidatorVertexJSONString) {
      return null;
    }
    const firstValidatorVertex = JSON.parse(firstValidatorVertexJSONString);
    const lastValidatorVertexJSONString = await this.datastore.get(
      lastValidatorVertexId
    );
    if (!lastValidatorVertexJSONString) {
      return null;
    }
    const lastValidatorVertex = JSON.parse(lastValidatorVertexJSONString);
    if (firstValidatorVertex.round >= lastValidatorVertex.round) {
      return null;
    }

    // assume densely connected, trace paths one at a time
    const exploringRoundEdges = [
      ...lastValidatorVertex.timelyEdges || [],
      ...lastValidatorVertex.lateEdges || [],
    ];
    if (exploringRoundEdges.find((i) => i === firstValidatorVertexId)) {
      return [lastValidatorVertexId, firstValidatorVertexId];
    }
    for (const timelyEdgeId of exploringRoundEdges) {
      const p = await this.findTimelyPathBetweenVertices(
        firstValidatorVertexId,
        timelyEdgeId
      );
      if (p) {
        return [lastValidatorVertexId, ...p];
      }
    }
  }

  async findTimelyPathBetweenVertices(
    firstValidatorVertexId,
    lastValidatorVertexId
  ) {
    const firstValidatorVertexJSONString = await this.datastore.get(
      firstValidatorVertexId
    );
    if (!firstValidatorVertexJSONString) {
      return null;
    }
    const firstValidatorVertex = JSON.parse(firstValidatorVertexJSONString);
    const lastValidatorVertexJSONString = await this.datastore.get(
      lastValidatorVertexId
    );
    if (!lastValidatorVertexJSONString) {
      return null;
    }
    const lastValidatorVertex = JSON.parse(lastValidatorVertexJSONString);
    if (firstValidatorVertex.round >= lastValidatorVertex.round) {
      return null;
    }

    // assume densely connected, trace paths one at a time
    const exploringRoundTimelyEdges = lastValidatorVertex.timelyEdges;
    if (exploringRoundTimelyEdges.find((i) => i === firstValidatorVertexId)) {
      return [lastValidatorVertexId, firstValidatorVertexId];
    }
    for (const timelyEdgeId of exploringRoundTimelyEdges) {
      const p = await this.findTimelyPathBetweenVertices(
        firstValidatorVertexId,
        timelyEdgeId
      );
      if (p) {
        return [lastValidatorVertexId, ...p];
      }
    }
  }

  async findTimelyPathsBetweenVertexAndRound(firstVertexId, round) {
    const lastIds = await this.getKnownVerticesIdsOfRound(round);
    const r = [];
    for (const lastId of lastIds) {
      const path = await this.findTimelyPathBetweenVertices(
        firstVertexId,
        lastId
      );
      r.push(path);
    }
    return r;
  }

  async findAllVerticesWithPathFromLaterVertex(vertexId, sinceRound = 0) {
    const vertex = await this.getVertexById(vertexId);
    const r = [];
    for (
      let workingRound = sinceRound + 1;
      workingRound < vertex.round;
      workingRound++
    ) {
      const roundVertexIds = await this.getKnownVerticesIdsOfRound(
        workingRound
      );
      for (const roundVertexId of roundVertexIds) {
        const path = await this.findPathBetweenVertices(
          roundVertexId,
          vertexId
        );
        if (path) {
          r.push(roundVertexId);
        }
      }
    }
    return r;
  }

  async getKnownVerticesIdsOfLastRound() {
    return this.getKnownVerticesIdsOfRound(this.round - 1);
  }

  async getKnownWitnessesOfRound(round) {
    if (round <= 0) {
      return [];
    }
    const keypairAsyncIter = this.datastore.queryKeys({
      prefix: `/consensus/round/${round}/`,
    });
    const r = [];
    for await (const keypair of keypairAsyncIter) {
      const v = await this.getVertexById(keypair.toString());
      r.push(v.validator);
    }
    return r; 
  }

  async getKnownVerticesIdsOfRound(round) {
    if (round <= 0) {
      return [];
    }
    const keypairAsyncIter = this.datastore.queryKeys({
      prefix: `/consensus/round/${round}/`,
    });
    const r = [];
    for await (const keypair of keypairAsyncIter) {
      r.push(keypair.toString());
    }
    return r;
  }

  async getAllVertexIds() {
    const keypairAsyncIter = this.datastore.queryKeys({
      prefix: `/consensus/round/`,
    });
    const r = [];
    for await (const keypair of keypairAsyncIter) {
      r.push(keypair.toString());
    }
    return r;
  }

  async getKnownUnlinkedVerticesIdsBeforeLastRound() {
    return [];
  }

  // edges to known vertices of the last round
  async getTimelyEdges() {
    return this.getKnownVerticesIdsOfLastRound();
  }

  // edges to older vertices (vertexRound <= currentRound - 2)
  // that are not connected to the known vertices in last round
  async getLateEdges() {
    return this.getKnownUnlinkedVerticesIdsBeforeLastRound();
  }
}
