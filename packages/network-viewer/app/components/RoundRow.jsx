import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import ScribePage from "./ScribePage";
import LinkerLine from 'linkerline';

export const layout = "HeaderFooter";

export default function  RoundRow({ round }) {

  React.useEffect(() => {
    const connections = [
      [
        { round: round, scribe: 1 },
        { round: round+1, scribe: 1 },
      ],
      [
        { round: round, scribe: 2 },
        { round: round+1, scribe: 2 },
      ],
      [
        { round: round, scribe: 3 },
        { round: round+1, scribe: 3 },
      ],
      [
        { round: round, scribe: 4 },
        { round: round+1, scribe: 4 },
      ],
      [
        { round: round, scribe: 5 },
        { round: round+1, scribe: 5 },
      ],
      [
        { round: round, scribe: 6 },
        { round: round+1, scribe: 6 },
      ],
      [
        { round: round, scribe: 7 },
        { round: round+1, scribe: 7 },
      ],
      [
        { round: round, scribe: 8 },
        { round: round+1, scribe: 8 },
      ],
      [
        { round: round, scribe: 9 },
        { round: round+1, scribe: 9 },
      ],
      [
        { round: round, scribe: 1 },
        { round: round+1, scribe: 2 },
      ],
      [
        { round: round, scribe: 2 },
        { round: round+1, scribe: 3 },
      ],
      [
        { round: round, scribe: 3 },
        { round: round+1, scribe: 4 },
      ],
      [
        { round: round, scribe: 4 },
        { round: round+1, scribe: 5 },
      ],
      [
        { round: round, scribe: 5 },
        { round: round+1, scribe: 6 },
      ],
      [
        { round: round, scribe: 6 },
        { round: round+1, scribe: 7 },
      ],
      [
        { round: round, scribe: 7 },
        { round: round+1, scribe: 8 },
      ],
      [
        { round: round, scribe: 8 },
        { round: round+1, scribe: 9 },
      ],
      [
        { round: round, scribe: 9 },
        { round: round+1, scribe: 1 },
      ],
    ];
    for (const conn of connections) {
      const node1 = this.document.getElementById(`scribe-page-round-${conn[0].round}-scribe-${conn[0].scribe}`);
      const node2 = this.document.getElementById(`scribe-page-round-${conn[1].round}-scribe-${conn[1].scribe}`);
      if (node1 && node2) {
        new LinkerLine({
          end: node1,
          start: node2,
          color: "blue",
          size: 3,
          startSocket: "bottom",
          endSocket: "top",
          startPlug: "behind",
          endPlug: "arrow3",
          path: 'straight'
        });
      }
    }
  });

  const scribes = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9
  ]

  return (
    <StyledDiv className="RoundRow" id={`RoundRow-round-${round}`}>
      <div className="RoundInfo">
        <div>Round: {round}</div>
        <div>Scribes: {scribes.length}</div>
      </div>
      {scribes.map(scribe => (
        <ScribePage key={scribe} round={round} scribe={scribe} />
      ))}
    </StyledDiv>
  );
}

const StyledDiv = styled.div/*css*/ `
.RoundInfo {
  width: 150px;
  display: flex;
  flex-shrink: 0;
  flex-grow: 0;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
`;
