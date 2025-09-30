import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Clock, ChevronDown, ChevronUp, Lightbulb, BookOpen, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Feedback {
  id: string;
  problem_id: string;
  problem_name: string;
  difficulty: string;
  category: string;
  rating: number;
  time_spent: number | null;
  struggled_areas: string[];
  detailed_feedback: string;
  ai_suggestions: {
    approachSuggestions?: string[];
    keyConcepts?: string[];
    similarProblems?: string[];
    learningResources?: Array<{
      type: string;
      title: string;
      description: string;
    }>;
    overallAdvice?: string;
  } | null;
  created_at: string;
}

export const FeedbacksList = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dsa_feedbacks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks((data as any) || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading feedbacks...</div>;
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No feedbacks yet. Start solving problems and share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Problem Feedbacks</h2>
        <Badge variant="outline">{feedbacks.length} Total</Badge>
      </div>

      <div className="grid gap-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{feedback.problem_name}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getDifficultyColor(feedback.difficulty)}>
                      {feedback.difficulty}
                    </Badge>
                    <Badge variant="outline">{feedback.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < feedback.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {feedback.time_spent && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {feedback.time_spent} min
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/dsa/${feedback.problem_id}`)}
                >
                  Try Again
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {feedback.struggled_areas && feedback.struggled_areas.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Struggled With:</p>
                  <div className="flex flex-wrap gap-2">
                    {feedback.struggled_areas.map((area, idx) => (
                      <Badge key={idx} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {feedback.detailed_feedback && (
                <div>
                  <p className="text-sm font-medium mb-2">Your Feedback:</p>
                  <p className="text-sm text-muted-foreground">{feedback.detailed_feedback}</p>
                </div>
              )}

              {feedback.ai_suggestions && (
                <Collapsible
                  open={expandedId === feedback.id}
                  onOpenChange={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      AI Suggestions & Resources
                      {expandedId === feedback.id ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    {feedback.ai_suggestions.approachSuggestions && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold">Approach Suggestions</h4>
                        </div>
                        <ul className="space-y-2">
                          {feedback.ai_suggestions.approachSuggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm flex gap-2">
                              <span className="text-blue-600 font-medium">{idx + 1}.</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.ai_suggestions.keyConcepts && (
                      <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold">Key Concepts to Review</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {feedback.ai_suggestions.keyConcepts.map((concept, idx) => (
                            <Badge key={idx} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {feedback.ai_suggestions.similarProblems && (
                      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold">Similar Problems to Practice</h4>
                        </div>
                        <ul className="space-y-1">
                          {feedback.ai_suggestions.similarProblems.map((problem, idx) => (
                            <li key={idx} className="text-sm">• {problem}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.ai_suggestions.learningResources && (
                      <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Learning Resources</h4>
                        <div className="space-y-3">
                          {feedback.ai_suggestions.learningResources.map((resource, idx) => (
                            <div key={idx} className="border-l-2 border-orange-400 pl-3">
                              <Badge variant="outline" className="mb-1">{resource.type}</Badge>
                              <p className="font-medium text-sm">{resource.title}</p>
                              <p className="text-xs text-muted-foreground">{resource.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {feedback.ai_suggestions.overallAdvice && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium italic">{feedback.ai_suggestions.overallAdvice}</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};