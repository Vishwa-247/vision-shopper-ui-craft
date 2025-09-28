import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle } from "lucide-react";

interface ProfileSectionProps {
  title: string;
  description: string;
  isCompleted: boolean;
  completionPercentage: number;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function ProfileSection({ 
  title, 
  description, 
  isCompleted, 
  completionPercentage, 
  children, 
  icon 
}: ProfileSectionProps) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isCompleted ? "default" : "outline"}
              className={isCompleted ? "bg-success text-success-foreground" : ""}
            >
              {isCompleted ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Circle className="h-3 w-3 mr-1" />
              )}
              {completionPercentage}%
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}