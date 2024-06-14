import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

import Backend from "../lib/Backend.mjs";
import RoundRow from "../components/RoundRow.jsx";

export const layout = "HeaderFooter";

export default function Page() {
  const [status, setStatus] = React.useState();

  React.useEffect(() => {
    (async () => {
      const r = await Backend.get("/");
      setStatus(r.data.status);
    })();
  }, []);
  
  return (
    <StyledDiv>
      <div to={`/rounds/${status?.round}`}>
        <div className="RoundRows">
          <RoundRow round={5} />
          <RoundRow round={4} />
          <RoundRow round={3} />
          <RoundRow round={2} />
          <RoundRow round={1} />
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
