import Page from '@modality-dev/network-datastore/data/Page';
import Round from '@modality-dev/network-datastore/data/Round';
import Sequencer from '@modality-dev/network-consensus/sequencing/Sequencer';
import DAGRider from '@modality-dev/network-consensus/sequencing/DAGRider';
import RoundRobin from '@modality-dev/network-consensus/election/RoundRobin';

export default async function (req, res) {
  const round_number = parseInt(req.params.round_number);
  const scribe_id = req.params.scribe_id;

  const datastore = req.app.datastore;

  let prev_round;
  try {
    prev_round = await Round.findOne({round: round_number-1, datastore});
  } catch (e) {
    //
  }
  const randomness = new RoundRobin();
  const binder = new DAGRider({
    datastore,
    randomness,
  });
  const prev_round_scribes_count = prev_round?.scribes.length;
  const prev_round_threshold = Sequencer.consensusThresholdFor(prev_round_scribes_count);
  const leader = await binder.findLeaderInRound(round_number);
  const leader_scribe = leader?.scribe;
  const is_section_leader = leader_scribe === scribe_id;

  const page = await Page.findOne({round: round_number, scribe: scribe_id, datastore});
  const is_certified = Object.keys(page.acks).length >= prev_round_threshold;

  return res.json({
    ok: true, data: {
      page: {
        ...page,
        is_certified,
        is_section_leader,
      }
    }
  });
}
