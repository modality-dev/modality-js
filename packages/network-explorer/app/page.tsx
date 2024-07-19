import { Lander } from "@/components/main";
import RoundDetail from "@/components/round";

export default async function Page() {
  return (
    <main className="flex flex-col items-center justify-center">
      {/* <Lander status={""} round={3} /> */}
      <RoundDetail ackAmount={3} minRound={1} maxRound={12} />
    </main>
  );
}
