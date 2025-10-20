
import { useState } from "react";
import { Briefcase, Code, Clock, HelpCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassMorphism from "../ui/GlassMorphism";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface InterviewSetupProps {
  onSubmit: (role: string, techStack: string, experience: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const InterviewSetup = ({ onSubmit, onBack, isLoading = false }: InterviewSetupProps) => {
  const [role, setRole] = useState("");
  const [techStack, setTechStack] = useState("");
  const [experience, setExperience] = useState("1-3");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use default values if fields are empty
    const finalRole = role.trim() || "Software Engineer";
    const finalTechStack = techStack.trim() || "React, JavaScript";
    
    onSubmit(finalRole, finalTechStack, experience);
  };

  const experienceOptions = [
    { value: "0-1", label: "0-1 years" },
    { value: "1-3", label: "1-3 years" },
    { value: "3-5", label: "3-5 years" },
    { value: "5+", label: "5+ years" },
  ];

  const popularRoles = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer", 
    "Full Stack Developer",
    "DevOps Engineer",
    "Data Scientist",
    "ML Engineer",
    "Cloud Architect"
  ];

  const popularTechStacks = [
    "React, Node.js",
    "JavaScript, React",
    "Python, Django",
    "Java, Spring",
    "AWS, Docker, Kubernetes",
    "Python, TensorFlow, PyTorch",
    "Go, Docker",
    "Angular, .NET"
  ];

  return (
    <div className="space-y-6">
      {onBack && (
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Interview Setup</h2>
            <p className="text-muted-foreground">
              Configure your mock interview session
            </p>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle size={18} />
            How to Start a Mock Interview
          </CardTitle>
          <CardDescription>
            Follow these steps to begin your practice interview session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 list-decimal pl-5">
            <li><strong>Select a Job Role</strong> - Choose from popular options or enter your own</li>
            <li><strong>Specify Tech Stack</strong> - List the technologies relevant to the role</li>
            <li><strong>Set Experience Level</strong> - Choose your experience range</li>
            <li><strong>Click "Start Interview"</strong> - Begin your practice session</li>
          </ol>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
            <span className="font-medium">Note:</span> Interviews start quickly (within 10 seconds) with pre-defined questions based on your selection.
          </div>
        </CardContent>
      </Card>
      
      <GlassMorphism className="p-6 max-w-2xl mx-auto" intensity="medium">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="role"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <Briefcase size={16} />
              Job Role
            </label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="w-full px-5 py-3 bg-white/20 dark:bg-black/20 border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground transition-all duration-300 placeholder:text-muted-foreground/50"
            />
            <div className="pt-3 flex flex-wrap gap-2">
              {popularRoles.map((popularRole) => (
                <button
                  key={popularRole}
                  type="button"
                  onClick={() => setRole(popularRole)}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-secondary to-secondary/80 text-foreground rounded-full hover:scale-105 hover:shadow-md transition-all duration-200 border border-border/30"
                >
                  {popularRole}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="techStack"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <Code size={16} />
              Tech Stack
            </label>
            <input
              id="techStack"
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="e.g., React, Python"
              className="w-full px-5 py-3 bg-white/20 dark:bg-black/20 border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground transition-all duration-300 placeholder:text-muted-foreground/50"
            />
            <div className="pt-3 flex flex-wrap gap-2">
              {popularTechStacks.map((stack) => (
                <button
                  key={stack}
                  type="button"
                  onClick={() => setTechStack(stack)}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-secondary to-secondary/80 text-foreground rounded-full hover:scale-105 hover:shadow-md transition-all duration-200 border border-border/30"
                >
                  {stack}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="experience"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <Clock size={16} />
              Experience
            </label>
            <div className="grid grid-cols-4 gap-3">
              {experienceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setExperience(option.value)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    experience === option.value
                      ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg scale-105"
                      : "bg-white/20 dark:bg-black/20 text-foreground hover:bg-white/30 dark:hover:bg-black/30 hover:scale-102 border-2 border-border/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-4 text-white font-semibold bg-gradient-to-r from-primary to-primary/80 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-primary/20"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Setting Up...
              </div>
            ) : (
              "Start Interview"
            )}
          </button>
        </form>
      </GlassMorphism>
    </div>
  );
};

export default InterviewSetup;
