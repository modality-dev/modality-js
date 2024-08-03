import { Lander } from "@/components/main";
import RoundDetail from "@/components/round";
import db from "@/db/drizzle";
import { keyValues } from "@/db/schema";

export default async function Page() {
  const data = await db.select().from(keyValues);
  console.log({ data });
  return (
    <main className="flex flex-col items-center justify-center">
      <Lander status={""} round={3} />
      {/* <RoundDetail ackAmount={3} minRound={1} maxRound={12} /> */}
    </main>
  );
}
