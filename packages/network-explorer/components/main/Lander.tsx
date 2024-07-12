import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Clock,
  CreditCardIcon,
  Eclipse,
  FuelIcon,
  Globe,
  Shield,
} from "lucide-react";

export const Lander = () => {
  return (
    <div className="">
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold">The Modality Blockchain Explorer</h1>
        <div className="flex items-center mt-4 space-x-4">
          <Button variant="outline">All Filters</Button>
          <Input
            placeholder="Search by Address / Txn Hash / Block / Token / Domain Name"
            className="flex-1"
          />
          <Button variant="default">Search</Button>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium">MOD PRICE</div>
                <div className="text-2xl font-bold">$0.0000000003</div>
                <div className="text-sm text-green-500">(+5.93%)</div>
              </div>
              <Eclipse className="h-6 w-6" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium">MARKET CAP</div>
                <div className="text-2xl font-bold">$370,990,097,303.00</div>
              </div>
              <Globe className="h-6 w-6" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium">TRANSACTIONS</div>
                <div className="text-2xl font-bold">2,433.84 M (13.4 TPS)</div>
              </div>
              <CreditCardIcon className="h-6 w-6" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium">MED GAS PRICE</div>
                <div className="text-2xl font-bold">2 Gwei ($0.13)</div>
              </div>
              <FuelIcon className="h-6 w-6" />
            </CardHeader>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium">LAST FINALIZED BLOCK</div>
                <div className="text-2xl font-bold">20267113</div>
              </div>
              <Clock className="h-6 w-6" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium">LAST SAFE BLOCK</div>
                <div className="text-2xl font-bold">20267177</div>
              </div>
              <Shield className="h-6 w-6" />
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div className="text-sm font-medium">Latest Blocks</div>
              <Button variant="outline" size="sm">
                Customize
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">20267204</div>
                    <div className="text-xs text-muted-foreground">
                      5 secs ago
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    Fee Recipient: beaverbuild
                  </div>
                  <div className="text-sm font-medium">96 txns in 12 secs</div>
                  <div className="text-sm font-medium">0.02291 Eth</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">20267203</div>
                    <div className="text-xs text-muted-foreground">
                      17 secs ago
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    Fee Recipient: beaverbuild
                  </div>
                  <div className="text-sm font-medium">173 txns in 12 secs</div>
                  <div className="text-sm font-medium">0.07171 Eth</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <div className="text-sm font-medium">Latest Transactions</div>
              <Button variant="outline" size="sm">
                Customize
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">0x590235bc7f1...</div>
                    <div className="text-xs text-muted-foreground">
                      5 secs ago
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    From: 0x95222290...5CC4BAfe5
                  </div>
                  <div className="text-sm font-medium">
                    To: 0x27c229FE...741aA48c0
                  </div>
                  <div className="text-sm font-medium">0.05373 Eth</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">0xc6a4fbba2b5...</div>
                    <div className="text-xs text-muted-foreground">
                      5 secs ago
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    From: 0x8aB45df9...e0D3C6dc4
                  </div>
                  <div className="text-sm font-medium">
                    To: 0x69963768...F838Fc98B
                  </div>
                  <div className="text-sm font-medium">0 Eth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
