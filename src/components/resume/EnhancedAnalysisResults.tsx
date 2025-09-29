import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  Target, 
  Star, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface AnalysisData {
  overall_score: number;
  action_verb_score: number;
  star_methodology_score: number;
  ats_score: number;
  action_verb_analysis?: {
    score: number;
    found_verbs: Array<{
      verb: string;
      category: string;
      strength_score: number;
      alternatives: string[];
    }>;
    categories: Record<string, number>;
    recommendations: string[];
  };
  star_analysis?: {
    score: number;
    bullet_analysis: Array<{
      bullet: string;
      star_score: number;
      improvements: string[];
    }>;
    recommendations: string[];
  };
  sections_analysis?: Record<string, { score: number; feedback: string }>;
  recommendations?: string[];
  keyword_analysis?: {
    matching_keywords: string[];
    missing_keywords: string[];
    keyword_density: number;
  };
}

interface EnhancedAnalysisResultsProps {
  analysisData: AnalysisData;
  jobRole: string;
}

export const EnhancedAnalysisResults: React.FC<EnhancedAnalysisResultsProps> = ({
  analysisData,
  jobRole
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-primary/10 text-primary border-primary/20';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const ScoreCard: React.FC<{ 
    title: string; 
    score: number; 
    icon: React.ReactNode; 
    description: string 
  }> = ({ title, score, icon, description }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold">{title}</h3>
          </div>
          <Badge variant="outline" className={getScoreBadgeColor(score)}>
            {Math.round(score)}%
          </Badge>
        </div>
        <Progress value={score} className="mb-2" />
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Overall Score Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Resume Analysis Complete</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Analysis for <strong>{jobRole}</strong> position
            </p>
            <div className={`text-4xl font-bold ${getScoreColor(analysisData.overall_score)}`}>
              {Math.round(analysisData.overall_score)}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Action Verbs"
          score={analysisData.action_verb_score}
          icon={<Zap className="h-5 w-5 text-yellow-600" />}
          description="Strength and diversity of action verbs"
        />
        <ScoreCard
          title="STAR Method"
          score={analysisData.star_methodology_score}
          icon={<Star className="h-5 w-5 text-blue-600" />}
          description="Achievement structure quality"
        />
        <ScoreCard
          title="ATS Score"
          score={analysisData.ats_score}
          icon={<Target className="h-5 w-5 text-green-600" />}
          description="Applicant Tracking System compatibility"
        />
        <ScoreCard
          title="Keywords"
          score={analysisData.keyword_analysis?.keyword_density || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          description="Job-relevant keyword density"
        />
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="action-verbs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="action-verbs">Action Verbs</TabsTrigger>
          <TabsTrigger value="star-analysis">STAR Analysis</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="action-verbs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Action Verbs Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.action_verb_analysis && (
                <div className="space-y-4">
                  {/* Categories Breakdown */}
                  <div>
                    <h4 className="font-semibold mb-2">Categories Found:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(analysisData.action_verb_analysis.categories).map(([category, count]) => (
                        <Badge key={category} variant="outline">
                          {category}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Strong Verbs Found */}
                  <div>
                    <h4 className="font-semibold mb-2">Strong Action Verbs Found:</h4>
                    <ScrollArea className="h-32">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {analysisData.action_verb_analysis.found_verbs
                          .filter(verb => verb.strength_score >= 4)
                          .map((verb, index) => (
                          <Badge key={index} variant="outline" className="justify-start">
                            {verb.verb} ({verb.strength_score}/5)
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {analysisData.action_verb_analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="star-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                STAR Methodology Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.star_analysis && (
                <div className="space-y-4">
                  {/* Bullet Points Analysis */}
                  <div>
                    <h4 className="font-semibold mb-2">Bullet Points Analysis:</h4>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {analysisData.star_analysis.bullet_analysis.map((bullet, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className={getScoreBadgeColor(bullet.star_score * 100)}>
                                  STAR Score: {Math.round(bullet.star_score * 100)}%
                                </Badge>
                              </div>
                              <p className="text-sm">{bullet.bullet}</p>
                              {bullet.improvements.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Improvements:</p>
                                  <ul className="space-y-1">
                                    {bullet.improvements.map((improvement, idx) => (
                                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                        <Lightbulb className="h-3 w-3 mt-0.5" />
                                        {improvement}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* STAR Recommendations */}
                  <div>
                    <h4 className="font-semibold mb-2">STAR Methodology Recommendations:</h4>
                    <ul className="space-y-1">
                      {analysisData.star_analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Keyword Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.keyword_analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-600">Matching Keywords:</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.keyword_analysis.matching_keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Missing Keywords:</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.keyword_analysis.missing_keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Overall Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.recommendations?.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};