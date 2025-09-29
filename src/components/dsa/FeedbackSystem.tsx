import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Video, 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  ExternalLink,
  Play,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Feedback {
  id: string;
  problemId: string;
  problemName: string;
  userId: string;
  rating: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSpent: number;
  feedback: string;
  struggledAreas: string[];
  createdAt: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  relevanceScore: number;
}

interface FeedbackSystemProps {
  problemId: string;
  problemName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  problemId,
  problemName,
  difficulty,
  category
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [struggledAreas, setStruggedAreas] = useState<string[]>([]);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState<YouTubeVideo[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const struggledAreaOptions = [
    'Understanding the problem',
    'Algorithm design',
    'Implementation',
    'Edge cases',
    'Time complexity',
    'Space complexity',
    'Debugging',
    'Testing'
  ];

  useEffect(() => {
    if (rating > 0) {
      fetchRecommendations();
    }
  }, [rating, category, difficulty]);

  const fetchRecommendations = async () => {
    if (!user?.id) return;
    
    setLoadingRecommendations(true);
    try {
      const response = await fetch('https://jwmsgrodliegekbrhvgt.supabase.co/functions/v1/youtube-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bXNncm9kbGllZ2VrYnJodmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzU3OTEsImV4cCI6MjA3MjA1MTc5MX0.Nk7JTZQx6Z5tKiVLHeZXUvy8Zkqk3Lc6pftr3H_25RY`
        },
        body: JSON.stringify({
          problemName,
          category,
          difficulty,
          userRating: rating,
          struggledAreas
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user?.id || rating === 0) {
      toast({
        title: "Incomplete Feedback",
        description: "Please provide a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://jwmsgrodliegekbrhvgt.supabase.co/functions/v1/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bXNncm9kbGllZ2VrYnJodmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzU3OTEsImV4cCI6MjA3MjA1MTc5MX0.Nk7JTZQx6Z5tKiVLHeZXUvy8Zkqk3Lc6pftr3H_25RY`
        },
        body: JSON.stringify({
          problemId,
          problemName,
          userId: user.id,
          rating,
          difficulty,
          timeSpent,
          feedback,
          struggledAreas
        })
      });

      if (response.ok) {
        toast({
          title: "Feedback Submitted!",
          description: "Thank you for your feedback. Here are some recommendations for you.",
        });
        
        // Reset form
        setRating(0);
        setFeedback('');
        setStruggedAreas([]);
        setTimeSpent(0);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStruggleArea = (area: string) => {
    setStruggedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  return (
    <div className="space-y-6">
      {/* Feedback Form */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Share Your Experience
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Help us improve by sharing your experience with "{problemName}"
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium">How was your experience?</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star 
                    className={`h-6 w-6 ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    }`} 
                  />
                </Button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 && `${rating}/5 stars`}
              </span>
            </div>
          </div>

          {/* Time Spent */}
          <div>
            <Label htmlFor="timeSpent" className="text-sm font-medium">
              Time spent (minutes)
            </Label>
            <Input
              id="timeSpent"
              type="number"
              value={timeSpent}
              onChange={(e) => setTimeSpent(Number(e.target.value))}
              placeholder="How many minutes did you spend?"
              className="mt-1"
            />
          </div>

          {/* Struggled Areas */}
          <div>
            <Label className="text-sm font-medium">What areas did you struggle with?</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {struggledAreaOptions.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={area}
                    checked={struggledAreas.includes(area)}
                    onChange={() => toggleStruggleArea(area)}
                    className="rounded border-border"
                  />
                  <Label htmlFor={area} className="text-sm font-medium flex items-center gap-2">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Feedback */}
          <div>
            <Label htmlFor="detailed-feedback" className="text-sm font-medium">
              Additional feedback (optional)
            </Label>
            <Textarea
              id="detailed-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share any additional thoughts, suggestions, or insights..."
              rows={3}
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback & Get Recommendations'}
          </Button>
        </CardContent>
      </Card>

      {/* YouTube Recommendations */}
      {(recommendations.length > 0 || loadingRecommendations) && (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Personalized Learning Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on your feedback, here are some helpful resources
            </p>
          </CardHeader>
          <CardContent>
            {loadingRecommendations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {recommendations.map((video) => (
                  <div key={video.id} className="flex gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded hover:bg-black/70 transition-colors">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {video.channelTitle}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(video.relevanceScore * 100)}% match
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(video.url, '_blank')}
                          className="h-auto p-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Watch
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};