import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Eye, MessageSquare } from "lucide-react";
import { CheckCircle, XCircle } from "lucide-react";

interface MetricsPanelProps {
  facialData: {
    confident: number;
    stressed: number;
    nervous: number;
  };
  behaviorData: {
    blink_count: number;
    looking_at_camera: boolean;
    head_pose: { pitch: number; yaw: number; roll: number };
  };
  communicationData: {
    filler_word_count: number;
    words_per_minute: number;
    clarity_score: number;
  };
  isVisible: boolean;
}

const MetricBar = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colorClasses = {
    green: "bg-gradient-to-r from-green-500 to-green-400 shadow-green-500/50",
    amber: "bg-gradient-to-r from-amber-500 to-amber-400 shadow-amber-500/50",
    red: "bg-gradient-to-r from-red-500 to-red-400 shadow-red-500/50",
    blue: "bg-gradient-to-r from-blue-500 to-blue-400 shadow-blue-500/50"
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-semibold">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 bg-secondary/30 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full transition-all duration-500 ease-out ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
};

const MetricsPanel = ({ facialData, behaviorData, communicationData, isVisible }: MetricsPanelProps) => {
  if (!isVisible) return null;
  
  return (
    <Card className="w-64 shadow-2xl border-2 border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl rounded-2xl">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          Live Metrics
          <div className="ml-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-green-500 ml-1">LIVE</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Facial Expression */}
        <div>
          <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
            <span>😊</span> Facial Expression
          </div>
          <div className="space-y-2">
            <MetricBar label="Confident" value={facialData.confident} color="green" />
            <MetricBar label="Stressed" value={facialData.stressed} color="amber" />
            <MetricBar label="Nervous" value={facialData.nervous} color="red" />
          </div>
        </div>
        
        {/* Behavior */}
        <div className="border-t-2 border-white/10 pt-4">
          <div className="text-xs font-medium mb-3 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Behavior
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col bg-white/20 dark:bg-black/20 rounded-xl p-3 border border-white/10">
              <span className="text-muted-foreground text-[10px] font-medium">Blinks</span>
              <span className="font-bold text-lg">{behaviorData.blink_count}</span>
            </div>
            <div className="flex flex-col bg-white/20 dark:bg-black/20 rounded-xl p-3 border border-white/10">
              <span className="text-muted-foreground text-[10px] font-medium">Camera</span>
              <div className="flex items-center gap-1 mt-1">
                {behaviorData.looking_at_camera ? (
                  <><CheckCircle className="h-4 w-4 text-green-500 animate-pulse" /> <span className="text-green-500 text-[10px] font-semibold">Yes</span></>
                ) : (
                  <><XCircle className="h-4 w-4 text-red-500 animate-pulse" /> <span className="text-red-500 text-[10px] font-semibold">No</span></>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Communication */}
        <div className="border-t-2 border-white/10 pt-4">
          <div className="text-xs font-medium mb-3 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Communication
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-white/20 dark:bg-black/20 rounded-xl p-3 border border-white/10">
              <span className="text-muted-foreground font-medium">Filler words</span>
              <span className="font-bold text-sm">{communicationData.filler_word_count}</span>
            </div>
            <div className="flex justify-between items-center bg-white/20 dark:bg-black/20 rounded-xl p-3 border border-white/10">
              <span className="text-muted-foreground font-medium">Pace</span>
              <span className="font-bold text-sm">{communicationData.words_per_minute} WPM</span>
            </div>
            <MetricBar label="Clarity" value={communicationData.clarity_score / 100} color="blue" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsPanel;
