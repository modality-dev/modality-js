import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import LinkerLine from 'linkerline';

import Backend from '../lib/Backend.mjs';

export const layout = "HeaderFooter";

export default function ScribePage({round, scribe}) {

  const [page, setPage] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const r = await Backend.get(`/rounds/${round}/scribes/${scribe}`);
      console.log(r.data);
      setPage(r.data.page);
    })();
  }, [round]);

  React.useEffect(() => {
    const acks = Object.keys(page.acks || {});
    const connections = acks.map(awk_scribe => (
      [
        {round, scribe},
        {round: round+1, scribe: awk_scribe},
      ]
    ));
    for (const conn of connections) {
      const node1 = this.document.getElementById(`scribe-page-round-${conn[0].round}-scribe-${conn[0].scribe}`);
      const node2 = this.document.getElementById(`scribe-page-round-${conn[1].round}-scribe-${conn[1].scribe}`);
      if (node1 && node2) {
        new LinkerLine({
          end: node1,
          start: node2,
          color: "blue",
          size: 1,
          startSocket: "bottom",
          endSocket: "top",
          startPlug: "behind",
          endPlug: "arrow3",
          path: 'straight'
        });
      }
    }
  }, [page]);

  return (
    <StyledDiv id={`scribe-page-round-${round}-scribe-${scribe}`}>
      <Link to={`/rounds/${status?.round}/scribe/${"..."}`}>
        <div className="Page">
          {page?.is_section_leader && <div className="section-leader">§</div>}
          {page?.is_certified && <div className="certified">✓</div>}
          {/* <div className="sequenced">#</div> */}
        </div>
      </Link>
    </StyledDiv>
  );
}

const StyledDiv = styled.div/*css*/ `
  & {
    margin: 20px;
    border: 1px solid #ccc;
    width: 85px;
    height: 110px;
    min-width: 85px;
    position: relative;
    .section-leader,
    .certified,
    .sequenced {
      position: absolute;
    }
    .section-leader {
      top: 5px;
      left: 5px;
    }
    .certified {
      bottom: 5px;
      left: 5px;
    }
    .sequenced {
      bottom: 5px;
      right: 5px;
    }
  }
`;
