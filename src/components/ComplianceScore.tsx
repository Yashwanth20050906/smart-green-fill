import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceScoreProps {
  score: number;
}

const getScoreStatus = (score: number) => {
  if (score >= 80) return { status: "excellent", color: "success", icon: CheckCircle };
  if (score >= 60) return { status: "good", color: "warning", icon: AlertTriangle };
  return { status: "poor", color: "danger", icon: XCircle };
};

const getScoreText = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  return "Needs Attention";
};

export function ComplianceScore({ score }: ComplianceScoreProps) {
  const { status, color, icon: Icon } = getScoreStatus(score);
  
  return (
    <Card className="p-8 bg-gradient-to-br from-card to-secondary border-border shadow-medium">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center
            ${color === "success" ? "bg-success/10" : ""}
            ${color === "warning" ? "bg-warning/10" : ""}
            ${color === "danger" ? "bg-danger/10" : ""}
          `}>
            <Icon className={`w-8 h-8
              ${color === "success" ? "text-success" : ""}
              ${color === "warning" ? "text-warning" : ""}
              ${color === "danger" ? "text-danger" : ""}
            `} />
          </div>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">{score}%</h2>
          <p className="text-muted-foreground mb-3">Overall Compliance Score</p>
          <Badge 
            className={`
              ${color === "success" ? "bg-success text-white" : ""}
              ${color === "warning" ? "bg-warning text-foreground" : ""}
              ${color === "danger" ? "bg-danger text-white" : ""}
            `}
          >
            {getScoreText(score)}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Based on waste sorting accuracy and bin management
        </p>
      </div>
    </Card>
  );
}