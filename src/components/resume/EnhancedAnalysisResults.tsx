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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const ScoreCard: React.FC<{ 
    title: string; 
    score: number; 
    icon: React.ReactNode; 
    description: string 
  }> = ({ title, score, icon, description }) => (
    <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              {icon}
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <Badge variant="outline" className={`${getScoreBadgeColor(score)} font-semibold`}>
            {Math.round(score)}%
          </Badge>
        </div>
        <Progress value={score} className="mb-3 h-2" />
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Overall Score Header */}
      <Card className="border border-border bg-card bg-primary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/20">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Resume Analysis Complete
              </h2>
            </div>
            <p className="text-muted-foreground mb-6 text-lg">
              Analysis for <Badge variant="outline" className="mx-1 bg-primary/10 text-primary border-primary/20">{jobRole}</Badge> position
            </p>
            <div className="relative">
              <div className={`text-6xl font-bold ${getScoreColor(analysisData.overall_score)} mb-2`}>
                {Math.round(analysisData.overall_score)}%
              </div>
              <Progress 
                value={analysisData.overall_score} 
                className="w-32 mx-auto h-2 mb-2"
              />
              <p className="text-sm text-muted-foreground font-medium">Overall Score</p>
            </div>
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
          <div className="grid gap-4">
            {/* Priority Recommendations */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5" />
                  High Priority Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-orange-100/50 rounded-lg border border-orange-200">
                    <Lightbulb className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Strengthen Action Verbs</p>
                      <p className="text-xs text-orange-700 mt-1">Replace weak verbs like "worked" and "helped" with strong action verbs like "developed", "implemented", "optimized"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-100/50 rounded-lg border border-orange-200">
                    <Lightbulb className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Quantify Achievements</p>
                      <p className="text-xs text-orange-700 mt-1">Add specific numbers, percentages, and metrics to demonstrate impact (e.g., "Increased efficiency by 40%")</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skill Recommendations */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Target className="h-5 w-5" />
                  Skills & Keywords to Add
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">Missing Technical Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Cloud Computing", "DevOps", "Agile", "CI/CD", "Docker", "Kubernetes"].map((skill) => (
                        <Badge key={skill} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">Industry Keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Machine Learning", "API Development", "Data Analysis", "System Design"].map((keyword) => (
                        <Badge key={keyword} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* STAR Method Examples */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Star className="h-5 w-5" />
                  STAR Method Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-100/50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-2">Before:</p>
                    <p className="text-xs text-muted-foreground italic">"Worked on a team project to improve the system"</p>
                  </div>
                  <div className="p-3 bg-green-100/50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-2">After (STAR Method):</p>
                    <p className="text-xs text-green-700">
                      <strong>Situation:</strong> Legacy system experiencing 30% performance degradation<br/>
                      <strong>Task:</strong> Led a 4-person team to optimize system architecture<br/>
                      <strong>Action:</strong> Implemented caching strategies and database indexing<br/>
                      <strong>Result:</strong> Improved system performance by 45% and reduced load times by 2.3 seconds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overall Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Additional Recommendations
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
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm">Consider adding a "Projects" section to showcase hands-on technical experience</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm">Include certifications relevant to the {jobRole} role to strengthen your candidacy</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm">Optimize formatting for ATS systems by using standard section headers and bullet points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};