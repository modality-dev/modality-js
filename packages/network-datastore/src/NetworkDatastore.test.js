import { jest, expect, describe, test, it } from "@jest/globals";

import NetworkDatastore from './NetworkDatastore.js';

describe("NetworkDatastore", () => {
  it("should work", async () => {
    let v;
    const datastore = await NetworkDatastore.createInMemory();
    await datastore.put('/pages/1', '');
    await datastore.put('/pages/2', '');
    await datastore.put('/pages/3', '');
    await datastore.put('/pages/4', '');
    await datastore.put('/pages/30', '');
    v = await datastore.findMaxStringKey('/pages');
    expect(v).toBe("4");
    v = await datastore.findMaxIntKey('/pages');
    expect(v).toBe(30);
  });
});