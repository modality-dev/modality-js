import Round from '@modality-dev/network-consensus/data/Round';

export default async function (req, res) {
  const number = parseInt(req.params.number);
  // console.log(Round);
  return res.json({
    ok: true, data: {
      round: {
        number
      }
    }
  });
}
