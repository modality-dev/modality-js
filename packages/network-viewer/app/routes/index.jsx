import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

import Backend from "../lib/Backend.mjs";
import ScribePage from "../components/ScribePage.jsx";
import LinkerLine from 'linkerline';

export const layout = "HeaderFooter";

export default function Page() {
  const [status, setStatus] = React.useState();

  React.useEffect(() => {
    (async () => {
      const r = await Backend.get("/");
      setStatus(r.data.status);
    })();
  }, []);

  React.useEffect(() => {
    const connections = [
      [
        { round: 1, scribe: 1 },
        { round: 2, scribe: 1 },
      ],
      [
        { round: 1, scribe: 2 },
        { round: 2, scribe: 2 },
      ],
      [
        { round: 1, scribe: 3 },
        { round: 2, scribe: 3 },
      ],
      [
        { round: 1, scribe: 4 },
        { round: 2, scribe: 4 },
      ],
      [
        { round: 1, scribe: 5 },
        { round: 2, scribe: 5 },
      ],
      [
        { round: 1, scribe: 6 },
        { round: 2, scribe: 6 },
      ],
      [
        { round: 1, scribe: 7 },
        { round: 2, scribe: 7 },
      ],
      [
        { round: 1, scribe: 8 },
        { round: 2, scribe: 8 },
      ],
      [
        { round: 1, scribe: 9 },
        { round: 2, scribe: 9 },
      ],
      [
        { round: 1, scribe: 1 },
        { round: 2, scribe: 2 },
      ],
      [
        { round: 1, scribe: 2 },
        { round: 2, scribe: 3 },
      ],
      [
        { round: 1, scribe: 3 },
        { round: 2, scribe: 4 },
      ],
      [
        { round: 1, scribe: 4 },
        { round: 2, scribe: 5 },
      ],
      [
        { round: 1, scribe: 5 },
        { round: 2, scribe: 6 },
      ],
      [
        { round: 1, scribe: 6 },
        { round: 2, scribe: 7 },
      ],
      [
        { round: 1, scribe: 7 },
        { round: 2, scribe: 8 },
      ],
      [
        { round: 1, scribe: 8 },
        { round: 2, scribe: 9 },
      ],
      [
        { round: 1, scribe: 9 },
        { round: 2, scribe: 1 },
      ],
    ];
    for (const conn of connections) {
      const node1 = document.getElementById(`scribe-page-round-${conn[0].round}-scribe-${conn[0].scribe}`);
      const node2 = document.getElementById(`scribe-page-round-${conn[1].round}-scribe-${conn[1].scribe}`);
      if (node1 && node2) {
        new LinkerLine({
          end: node1,
          start: node2,
          color: "blue",
          size: 3,
          startSocket: "top",
          endSocket: "bottom",
          startPlug: "behind",
          endPlug: "arrow3",
          path: 'straight'
        });
      }
    }
  });

  return (
    <StyledDiv>
      <div to={`/rounds/${status?.round}`}>
        Current Round: {status?.round}
        <div className="RoundRows">
          <div className="RoundRow">
            <ScribePage round={1} scribe={1} />
            <ScribePage round={1} scribe={2} />
            <ScribePage round={1} scribe={3} />
            <ScribePage round={1} scribe={4} />
            <ScribePage round={1} scribe={5} />
            <ScribePage round={1} scribe={6} />
            <ScribePage round={1} scribe={7} />
            <ScribePage round={1} scribe={8} />
            <ScribePage round={1} scribe={9} />
          </div>
          <div className="RoundRow">
            <ScribePage round={2} scribe={1} />
            <ScribePage round={2} scribe={2} />
            <ScribePage round={2} scribe={3} />
            <ScribePage round={2} scribe={4} />
            <ScribePage round={2} scribe={5} />
            <ScribePage round={2} scribe={6} />
            <ScribePage round={2} scribe={7} />
            <ScribePage round={2} scribe={8} />
            <ScribePage round={2} scribe={9} />
          </div>
        </div>
      </div>
    </StyledDiv>
  );
}

const StyledDiv = styled.div/*css*/ `
  .RoundRows {
    display: flex;
    flex-direction: column;
  }
  .RoundRow {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
  }
`;
