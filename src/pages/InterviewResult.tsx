
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Container from "@/components/ui/Container";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Video, MessageSquare, BarChart, CheckCircle, XCircle, AlertCircle, ArrowRight, BookOpen, ChevronLeft } from "lucide-react";

const InterviewResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feedback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`http://localhost:8000/interviews/${id}`);
        if (!resp.ok) throw new Error("Failed to load interview session");
        const data = await resp.json();
        setSession(data.interview || data);
        // Try overall analysis (if already completed)
        if ((data.interview?.status || data.status) === 'completed') {
          const a = await fetch(`http://localhost:8000/interviews/${id}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
          if (a.ok) {
            const aj = await a.json();
            setAnalysis(aj.analysis || aj);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Unable to load interview');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Strong</Badge>;
    if (score >= 60) return <Badge className="bg-amber-500">Average</Badge>;
    return <Badge className="bg-red-500">Needs Improvement</Badge>;
  };

  return (
    <Container>
      <div className="py-12">
        <div className="mb-8">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading interview...</div>
          )}
          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Video className="h-4 w-4" />
            <span>Interview #{id}</span>
            <span>•</span>
            <span>{session?.start_time ? new Date(session.start_time).toLocaleDateString() : ''}</span>
            <span>•</span>
            <span>{session?.duration ? `${session.duration} minutes` : ''}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Interview Result</h1>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <Badge variant="outline" className="px-3 py-1">
              {session?.job_role || '—'}
            </Badge>
            {Array.isArray(session?.tech_stack) && session.tech_stack.map((tech: string) => (
              <Badge key={tech} variant="secondary" className="px-3 py-1">{tech}</Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-3xl font-bold ${getScoreColor(analysis?.overall_score || 0)}`}>
                    {Math.round(analysis?.overall_score || 0)}%
                  </div>
                  {getScoreBadge(Math.round(analysis?.overall_score || 0))}
                </div>
                <Progress 
                  value={analysis?.overall_score || 0} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Technical Knowledge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-3xl font-bold ${getScoreColor(interviewData.feedback.technical.score)}`}>
                    {interviewData.feedback.technical.score}%
                  </div>
                  {getScoreBadge(interviewData.feedback.technical.score)}
                </div>
                <Progress 
                  value={interviewData.feedback.technical.score} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-3xl font-bold ${getScoreColor(interviewData.feedback.communication.score)}`}>
                    {interviewData.feedback.communication.score}%
                  </div>
                  {getScoreBadge(interviewData.feedback.communication.score)}
                </div>
                <Progress 
                  value={interviewData.feedback.communication.score} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs
          defaultValue="feedback"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="feedback">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="questions">
              <AlertCircle className="h-4 w-4 mr-2" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="video">
              <BarChart className="h-4 w-4 mr-2" />
              Video Analysis
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <BookOpen className="h-4 w-4 mr-2" />
              Next Steps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Technical Knowledge</CardTitle>
                <CardDescription>
                  Assessment of your technical expertise and domain knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Strengths
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {interviewData.feedback.technical.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {interviewData.feedback.technical.weaknesses.map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p>{interviewData.feedback.technical.summary}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Skills</CardTitle>
                <CardDescription>
                  Evaluation of how effectively you communicated your ideas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Strengths
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {interviewData.feedback.communication.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {interviewData.feedback.communication.weaknesses.map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p>{interviewData.feedback.communication.summary}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Non-Verbal Communication</CardTitle>
                <CardDescription>
                  Analysis of your body language, facial expressions, and engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Strengths
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {interviewData.feedback.nonVerbal.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {interviewData.feedback.nonVerbal.weaknesses.map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p>{interviewData.feedback.nonVerbal.summary}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-8">
            {interviewData.questions.map((question, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{question.question}</CardTitle>
                    <Badge 
                      className={
                        question.score >= 80 ? "bg-green-500" : 
                        question.score >= 60 ? "bg-amber-500" : "bg-red-500"
                      }
                    >
                      {question.score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Your Answer</h3>
                    <div className="bg-muted/30 p-4 rounded-md border text-foreground/90">
                      {question.answer}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Feedback</h3>
                    <div className="bg-primary/5 p-4 rounded-md border border-primary/20 text-foreground/90">
                      {question.feedback}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Confidence Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className={`text-3xl font-bold ${getScoreColor(interviewData.videoAnalysis.confidenceScore)}`}>
                      {interviewData.videoAnalysis.confidenceScore}%
                    </div>
                  </div>
                  <Progress 
                    value={interviewData.videoAnalysis.confidenceScore} 
                    className="h-2 mt-2" 
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Engagement Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className={`text-3xl font-bold ${getScoreColor(interviewData.videoAnalysis.engagementScore)}`}>
                      {interviewData.videoAnalysis.engagementScore}%
                    </div>
                  </div>
                  <Progress 
                    value={interviewData.videoAnalysis.engagementScore} 
                    className="h-2 mt-2" 
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Stress Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className={`text-3xl font-bold ${
                      interviewData.videoAnalysis.stressIndicators <= 30 ? "text-green-500" :
                      interviewData.videoAnalysis.stressIndicators <= 60 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {interviewData.videoAnalysis.stressIndicators}%
                    </div>
                  </div>
                  <Progress 
                    value={interviewData.videoAnalysis.stressIndicators} 
                    className="h-2 mt-2" 
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Timeline Analysis</CardTitle>
                <CardDescription>
                  Key moments from your interview with behavior analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviewData.videoAnalysis.timeline.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-3 rounded-md border">
                      <div className="font-mono text-muted-foreground">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        {item.note}
                      </div>
                      <Badge 
                        className={
                          item.score >= 80 ? "bg-green-500" : 
                          item.score >= 60 ? "bg-amber-500" : "bg-red-500"
                        }
                      >
                        {item.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6">
              <Button disabled>
                View Full Video Recording
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {interviewData.recommendations.map((recommendation, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-2">
                      {recommendation.type === "course" ? (
                        <BookOpen className="h-5 w-5 text-primary" />
                      ) : (
                        <Video className="h-5 w-5 text-primary" />
                      )}
                      <Badge variant="outline" className="capitalize">
                        {recommendation.type}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{recommendation.title}</CardTitle>
                    <CardDescription>
                      {recommendation.reason}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Button variant="ghost" className="w-full justify-between" asChild>
                      <Link to={recommendation.link}>
                        {recommendation.type === "course" ? "Start Learning" : "Start Practice"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Practice Again</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Apply the feedback from this session in another mock interview
                </p>
                <Button asChild>
                  <Link to="/mock-interview">
                    Start New Interview <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

export default InterviewResult;
