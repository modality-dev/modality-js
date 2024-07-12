import { Lander } from "@/components/main";

export default async function Page() {
  const baseUrl = "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api`, {
    headers: {
      "x-datastore": "../../network-cli/tmp/datastore",
    },
  });
  const data = await res.json();
  return (
    <main className="flex flex-col items-center justify-center">
      <Lander status={data.status} round={23} />
    </main>
  );
}
