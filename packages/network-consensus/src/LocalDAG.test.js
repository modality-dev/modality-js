import LocalDAG from "./LocalDAG";

describe("LocalDAG", () => {
  it("should work", async () => {
    const w1 = await LocalDAG.createInMemory();
    const w2 = await LocalDAG.createInMemory();
    const w3 = await LocalDAG.createInMemory();

    await w1.setup();
    await w2.setup();
    await w3.setup();

    for (let i = 0; i < 3; i++) {
      const v_1 = await w1.createVertex();
      const v_2 = await w2.createVertex();
      const v_3 = await w3.createVertex();

      await w1.addVertexFromValues(v_1);
      await w2.addVertexFromValues(v_1);
      await w3.addVertexFromValues(v_1);

      await w1.addVertexFromValues(v_2);
      await w2.addVertexFromValues(v_2);
      await w3.addVertexFromValues(v_2);

      await w1.addVertexFromValues(v_3);
      await w2.addVertexFromValues(v_3);
      await w3.addVertexFromValues(v_3);

      await w1.bumpRound();
      await w2.bumpRound();
      await w3.bumpRound();
    }

    const r1v = await w1.getKnownVerticesIdsOfRound(1);
    const r3v = await w1.getKnownVerticesIdsOfRound(3);
    expect(r1v.length).toBe(3);
    expect(r3v.length).toBe(3);

    const r1v_to_r3v = await w1.findPathBetweenVertices(r1v[0], r3v[0]);
    expect(r1v_to_r3v).toBeTruthy();
    expect(r1v_to_r3v.length).toBe(3);

    const strong_r1v_to_r3v = await w1.findTimelyPathBetweenVertices(r1v[0], r3v[0]);
    expect(strong_r1v_to_r3v).toBeTruthy();
    expect(strong_r1v_to_r3v.length).toBe(3);
  });
});
