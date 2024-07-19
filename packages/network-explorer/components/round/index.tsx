import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Clock, Flame, Info } from "lucide-react";

type RoundDetailProps = {
  ackAmount: number;
  minRound: number;
  maxRound: number;
};

export default function RoundDetail({
  ackAmount,
  minRound,
  maxRound,
}: RoundDetailProps) {
  return (
    <div className="p-6 rounded-lg max-w-5xl mx-auto">
      <div className="flex space-x-4 mb-6">
        <Button variant="default">Overview</Button>
        <Button variant="ghost">Consensus Info</Button>
        <Button variant="ghost">MEV Info</Button>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Round Height:</span>
          </div>
          <span>{maxRound}</span>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Status:</span>
          </div>
          <Badge variant="secondary">Unfinalized</Badge>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span>Timestamp:</span>
          </div>
          <span>17 secs ago (Jul-12-2024 04:52:11 PM +UTC)</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Proposed On:</span>
          </div>
          <span>Block proposed on slot 9498259, epoch 296820</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Transactions:</span>
          </div>
          <span>
            <a href="#" className="text-blue-500">
              188 transactions
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-500">
              73 contract internal transactions
            </a>{" "}
            in this block
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Withdrawals:</span>
          </div>
          <span>
            <a href="#" className="text-blue-500">
              16 withdrawals
            </a>{" "}
            in this block
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Fee Recipient:</span>
          </div>
          <span>
            <a href="#" className="text-blue-500">
              beaverbuild
            </a>{" "}
            in 12 secs
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Block Reward:</span>
          </div>
          <span>
            0.051057149881485093 ETH (0 + 0.111853006332849361 -
            0.060795856451364268)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Total Difficulty:</span>
          </div>
          <span>58,750,003,716,598,352,816,469</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Size:</span>
          </div>
          <span>78,491 bytes</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Gas Used:</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>13,947,484 (46.49%)</span>
            <Progress value={46.49} className="w-32 h-2" />
            <span className="text-red-500">-7% Gas Target</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Gas Limit:</span>
          </div>
          <span>30,000,000</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Base Fee Per Gas:</span>
          </div>
          <span>0.000000004358912077 ETH (4.358912077 Gwei)</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Flame className="h-5 w-5 text-red-500" />
            <span>Burnt Fees:</span>
          </div>
          <span>0.060795856451364268 ETH</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span>Extra Data:</span>
          </div>
          <span>beaverbuild.org (Hex:0x62657665726275696c642e6f7267)</span>
        </div>
      </div>
    </div>
  );
}
