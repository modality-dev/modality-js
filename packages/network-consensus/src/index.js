import { SEQUENCING_METHODS } from "./sequencing";
import { ELECTION_METHODS } from "./election";

export async function setupNetworkConsensus({
  datastore,
  sequencing_method,
  election_method,
  peerid,
  keypair
}) {
  const consensus_system  = SEQUENCING_METHODS[sequencing_method].create({
    randomness: ELECTION_METHODS[election_method].create(),
    datastore,
    peerid,
    keypair,
  });
  return consensus_system;
}