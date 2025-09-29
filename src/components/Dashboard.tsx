import { useState, useEffect } from "react";
import { BinCard } from "./BinCard";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface BinData {
  type: "dry" | "wet" | "metal";
  complianceScore: number;
  status: "normal" | "warning" | "full";
}

export function Dashboard() {
  const [binData, setBinData] = useState<BinData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Mock data with dry bin at 23%
  const mockBinData: BinData[] = [
    { type: "dry", complianceScore: 23, status: "normal" },
    { type: "wet", complianceScore: 85, status: "warning" },
    { type: "metal", complianceScore: 45, status: "normal" }
  ];

  // Use mock data instead of Supabase data
  const convertSupabaseData = (data: any[]): BinData[] => {
    // Override with mock data, setting dry bin to 23%
    return mockBinData;
  };

  // Fetch bin data from Supabase
  const fetchBinData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bins')
        .select('*')
        .order('bin_type');

      if (error) {
        console.error('Error fetching bin data:', error);
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Failed to fetch bin data",
          variant: "destructive",
        });
        return;
      }

      // Always use mock data
      setBinData(mockBinData);
      setIsConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Network error:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchBinData();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('bins_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bins' },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchBinData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    fetchBinData();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bin Cards */}
          {binData.map((bin) => (
            <BinCard 
              key={bin.type}
              type={bin.type}
              complianceScore={bin.complianceScore}
              status={bin.status}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}