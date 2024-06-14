import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import ScribePage from "./ScribePage";

import Backend from '../lib/Backend.mjs';

export const layout = "HeaderFooter";

export default function RoundRow({ round }) {

  const [scribes, setScribes] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const r = await Backend.get(`/rounds/${round}`);
      setScribes(r.data.round.scribes);
    })();
  }, [round]);

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
