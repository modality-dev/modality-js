import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

export const layout = "HeaderFooter";

export default function ScribePage({round, scribe}) {
  return (
    <StyledDiv id={`scribe-page-round-${round}-scribe-${scribe}`}>
      <Link to={`/rounds/${status?.round}/scribe/${"..."}`}>
        <div className="Page">
          <div className="section-leader">§</div>
          <div className="certified">✓</div>
          <div className="sequenced">#</div>
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
