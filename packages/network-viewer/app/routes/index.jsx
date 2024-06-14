import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

import Backend from "../lib/Backend.mjs";
import RoundRow from "../components/RoundRow.jsx";

export const layout = "HeaderFooter";

export default function Page() {
  const [status, setStatus] = React.useState();
  const [minRound, setMinRound] = React.useState(0);
  const [maxRound, setMaxRound] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      const r = await Backend.get("/");
      setStatus(r.data.status);
      setMaxRound(r.data.status.round);
      setMinRound(Math.max(r.data.status.round - 10, 1));
    })();
  }, []);

  const roundsToShow = Array.from(
    { length: maxRound === 0 ? 0 : maxRound - minRound + 1 },
    (_, i) => minRound + i
  ).reverse();

  return (
    <StyledDiv>
      <div to={`/rounds/${status?.round}`}>
        <div className="RoundRows">
          {roundsToShow.map((round) => (
            <RoundRow key={round} round={round} />
          ))}
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
