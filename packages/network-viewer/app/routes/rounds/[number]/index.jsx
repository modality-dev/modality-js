import React from "react";
import { Link } from 'react-router-dom';

import Backend from '../../../lib/Backend.mjs';

export const layout = "HeaderFooter";

export default function Page() {
  const [status, setStatus] = React.useState();

  React.useEffect(() => {
    (async () => {
      const r = await Backend.get('/');
      setStatus(r.data.status);
    })();
  }, []);

  return (
    <div>
      <Link to={`/rounds/${status?.round}`}>Current Round: {status?.round}</Link>
    </div>
  );
}