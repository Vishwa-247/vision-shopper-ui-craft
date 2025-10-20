import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Users, Calculator, Clock, Target } from "lucide-react";
import GlassMorphism from "@/components/ui/GlassMorphism";

interface InterviewType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  questionCount: number;
  difficulty: string;
  topics: string[];
}

const interviewTypes: InterviewType[] = [
  {
    id: "technical",
    name: "Technical Interview",
    description: "Programming concepts, algorithms, data structures, system design",
    icon: <Code className="h-6 w-6" />,
    duration: "45-60 mins",
    questionCount: 8,
    difficulty: "Medium to Hard",
    topics: ["DSA", "System Design", "Programming Languages", "Databases"]
  },
  {
    id: "aptitude", 
    name: "Aptitude Test",
    description: "Logical reasoning, quantitative aptitude, verbal ability",
    icon: <Calculator className="h-6 w-6" />,
    duration: "30-45 mins", 
    questionCount: 15,
    difficulty: "Easy to Medium",
    topics: ["Logical Reasoning", "Quantitative Aptitude", "Verbal Ability", "Analytical Skills"]
  },
  {
    id: "hr",
    name: "HR Interview", 
    description: "Behavioral questions, company culture fit, career goals",
    icon: <Users className="h-6 w-6" />,
    duration: "20-30 mins",
    questionCount: 6,
    difficulty: "Easy to Medium", 
    topics: ["Behavioral Questions", "Leadership", "Communication", "Career Goals"]
  }
];

interface InterviewTypeSelectorProps {
  onSelectType: (type: string) => void;
  selectedType?: string;
}

const InterviewTypeSelector = ({ onSelectType, selectedType }: InterviewTypeSelectorProps) => {
  return (
    <GlassMorphism className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Interview Type</h2>
        <p className="text-muted-foreground">
          Select the type of interview you want to practice for. Each type focuses on different skills and competencies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interviewTypes.map((type) => (
          <Card 
            key={type.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 rounded-2xl border-2 ${
              selectedType === type.id 
                ? "ring-4 ring-primary/30 border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-2xl scale-105" 
                : "border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl hover:border-primary/50 hover:bg-white/60 dark:hover:bg-black/60"
            }`}
            onClick={() => onSelectType(type.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg">
                  {type.icon}
                </div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{type.name}</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {type.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {type.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {type.questionCount} questions
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Badge variant="outline" className="text-xs px-3 py-1 rounded-full border-2 border-primary/30 bg-primary/10 text-primary font-semibold">
                    {type.difficulty}
                  </Badge>
                  <div className="flex flex-wrap gap-2">
                    {type.topics.slice(0, 3).map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-secondary to-secondary/80 text-foreground font-medium">
                        {topic}
                      </Badge>
                    ))}
                    {type.topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-secondary to-secondary/80 text-foreground font-medium">
                        +{type.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="mt-8 text-center">
          <Button 
            onClick={() => onSelectType(selectedType)}
            className="px-10 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-accent text-white font-semibold border-2 border-primary/20"
          >
            Continue with {interviewTypes.find(t => t.id === selectedType)?.name}
          </Button>
        </div>
      )}
    </GlassMorphism>
  );
};

export default InterviewTypeSelector;