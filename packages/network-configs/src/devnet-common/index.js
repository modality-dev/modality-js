import { readFile } from "fs/promises";

const keypairs = JSON.parse(
  await readFile(new URL("./keypairs.json", import.meta.url))
);

export default {
  name: "devnet-common",
  keypairs,
};
