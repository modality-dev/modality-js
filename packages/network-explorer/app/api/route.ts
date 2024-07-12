// @ts-ignore
import NetworkDatastore from "@modality-dev/network-datastore";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const datastorePath = request.headers.get("x-datastore") || "";
  const networkDatastore = await NetworkDatastore.createInDirectory(
    datastorePath
  );
  console.log("networkDatastore", networkDatastore);

  const data = {
    status: {
      round: 23,
    },
    datastorePath,
    // networkDatastore,
  };

  return Response.json(data);
}
