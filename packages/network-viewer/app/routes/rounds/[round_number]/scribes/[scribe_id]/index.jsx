import React from "react";
import styled from "styled-components";
import { Link, useParams } from 'react-router-dom';

import Backend from '../../../../../lib/Backend.mjs';

export const layout = "HeaderFooter";

export default function Page() {
  const [page, setPage] = React.useState();
  const { round_number, scribe_id } = useParams();

  React.useEffect(() => {
    (async () => {
      const r = await Backend.get(`/rounds/${round_number}/scribes/${scribe_id}`);
      setPage(r.data.page);
    })();
  }, [round_number, scribe_id]);


  return (<StyledDiv>
    <div>
      <a href={`/rounds/${round_number}`}>Round {round_number}</a>
    </div>
    <div>
      Scribe: {scribe_id}
    </div>
    <br />
    <div>
      Is Ordered: {page?.page_number ? 'true' : 'false'}
      <br />
      Page Number: {page?.page_number}
    </div>
    <br />
    <div>
      <div>Is Certified: {page?.is_certified ? 'true' : ''}</div>
      <br />
      <div>
        Acks:
        {Object.values(page?.acks || {}).sort((a,b) => a.scribe.localeCompare(b.scribe)).map(ack => (<div key={`${ack.scribe}`}>
          * <a href={`/rounds/${ack.round}/scribes/${ack.scribe}`}>{ack.scribe}</a>
        </div>))}
      </div>
      <br />
      <div>
        Late Acks:
        {page?.late_acks?.sort((a,b) => a.scribe.localeCompare(b.scribe)).map(ack => (<div key={`${ack.round}-${ack.scribe}`}>
          * Round {ack.round} from {ack.scribe}
        </div>))}
      </div>
    </div>
    <br />
    <div>
      Is Section Leader: {page?.is_section_leader ? 'true' : 'false'}
    </div>
    <br />
  </StyledDiv>);
}


const StyledDiv = styled.div/*css*/ `
`;
