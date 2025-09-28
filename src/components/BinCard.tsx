import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface BinCardProps {
  type: "dry" | "wet" | "metal";
  fillLevel: number;
  status: "normal" | "warning" | "full";
}

const binConfig = {
  dry: {
    name: "Dry Waste",
    icon: "🗑️",
    color: "text-muted-foreground"
  },
  wet: {
    name: "Wet Waste", 
    icon: "🥬",
    color: "text-success"
  },
  metal: {
    name: "Metal Waste",
    icon: "🔩",
    color: "text-muted-foreground"
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "full": return "danger";
    case "warning": return "warning";
    default: return "success";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "full": return "Full";
    case "warning": return "Nearly Full";
    default: return "Good";
  }
};

export function BinCard({ type, fillLevel, status }: BinCardProps) {
  const config = binConfig[type];
  
  return (
    <Card className="p-6 bg-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <Trash2 className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{config.name}</h3>
            <p className="text-sm text-muted-foreground">Bin Status</p>
          </div>
        </div>
        <Badge 
          variant={getStatusColor(status) === "success" ? "default" : "destructive"}
          className={`
            ${getStatusColor(status) === "success" ? "bg-success text-white" : ""}
            ${getStatusColor(status) === "warning" ? "bg-warning text-foreground" : ""}
            ${getStatusColor(status) === "danger" ? "bg-danger text-white" : ""}
          `}
        >
          {getStatusText(status)}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fill Level</span>
          <span className="font-medium text-foreground">{fillLevel}%</span>
        </div>
        <Progress 
          value={fillLevel} 
          className="h-3 bg-secondary"
        />
      </div>
    </Card>
  );
}