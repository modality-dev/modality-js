import Page from '@modality-dev/network-datastore/data/Page';
import Round from '@modality-dev/network-datastore/data/Round';
import Binder from '@modality-dev/network-consensus/binders/Binder';
import DAGRider from '@modality-dev/network-consensus/binders/DAGRider';
import RoundRobin from '@modality-dev/network-consensus/randomness/RoundRobin';

export default async function (req, res) {
  const round_number = parseInt(req.params.round_number);
  const scribe_id = req.params.scribe_id;

  const datastore = req.app.datastore;

  let next_round;
  try {
    next_round = await Round.findOne({round: round_number+1, datastore});
  } catch (e) {
    //
  }
  const randomness = new RoundRobin();
  const binder = new DAGRider({
    datastore,
    randomness,
  });
  const next_round_scribes_count = next_round?.scribes.length;
  const next_round_threshold = Binder.consensusThresholdFor(next_round_scribes_count);
  const leader = await binder.findLeaderInRound(round_number);
  const leader_scribe = leader?.scribe;
  const is_section_leader = leader_scribe === scribe_id;

  const page = await Page.findOne({round: round_number, scribe: scribe_id, datastore});
  const is_certified = Object.keys(page.acks).length >= next_round_threshold;

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
