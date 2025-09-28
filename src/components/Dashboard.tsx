import { useState, useEffect } from "react";
import { BinCard } from "./BinCard";
import { ComplianceScore } from "./ComplianceScore";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BinData {
  type: "dry" | "wet" | "metal";
  fillLevel: number;
  status: "normal" | "warning" | "full";
}

// Mock data - replace with ESP32 API calls
const mockBinData: BinData[] = [
  { type: "dry", fillLevel: 45, status: "normal" },
  { type: "wet", fillLevel: 78, status: "warning" },
  { type: "metal", fillLevel: 92, status: "full" }
];

export function Dashboard() {
  const [binData, setBinData] = useState<BinData[]>(mockBinData);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Calculate compliance score based on bin status
  const calculateComplianceScore = (bins: BinData[]) => {
    const scores = bins.map(bin => {
      if (bin.status === "full") return 30;
      if (bin.status === "warning") return 70;
      return 95;
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const complianceScore = calculateComplianceScore(binData);

  // Simulate ESP32 data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random fill level changes
      setBinData(prev => prev.map(bin => {
        const change = Math.random() * 6 - 3; // -3 to +3% change
        const newLevel = Math.max(0, Math.min(100, bin.fillLevel + change));
        
        let status: "normal" | "warning" | "full" = "normal";
        if (newLevel >= 95) status = "full";
        else if (newLevel >= 80) status = "warning";
        
        return { ...bin, fillLevel: Math.round(newLevel), status };
      }));
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    // In real app, this would fetch from ESP32
    setLastUpdate(new Date());
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Smart Waste Management</h1>
            <p className="text-muted-foreground">Real-time bin monitoring system</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-2">
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Compliance Score */}
          <div className="lg:col-span-1">
            <ComplianceScore score={complianceScore} />
          </div>

          {/* Bin Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {binData.map((bin) => (
              <BinCard 
                key={bin.type}
                type={bin.type}
                fillLevel={bin.fillLevel}
                status={bin.status}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}