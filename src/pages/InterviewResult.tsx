
import Container from "@/components/ui/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  MessageSquare,
  Video,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
            {analysis?.feedback && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Feedback Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {analysis?.feedback?.overall || '—'}
                  </div>
                </CardContent>
              </Card>
            )}
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
            {((session?.questions && session.questions.length > 0) || (session?.questions_data?.questions?.length > 0)) && (
              <TabsTrigger value="questions">
                <AlertCircle className="h-4 w-4 mr-2" />
                Questions
              </TabsTrigger>
            )}
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
                    {(analysis?.feedback?.strengths || []).map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {(analysis?.feedback?.improvements || []).map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p>{analysis?.feedback?.overall || '—'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Additional communication/non-verbal cards can be added when data is available */}

            
          </TabsContent>

          <TabsContent value="questions" className="space-y-8">
            {(session?.questions || session?.questions_data?.questions || []).map((q: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{q.question || q.text || `Question ${index + 1}`}</CardTitle>
                    {typeof q?.feedback?.score === 'number' && (
                      <Badge className={q.feedback.score >= 80 ? "bg-green-500" : q.feedback.score >= 60 ? "bg-amber-500" : "bg-red-500"}>
                        {q.feedback.score}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {q.answer && (
                    <div>
                      <h3 className="font-medium mb-2">Your Answer</h3>
                      <div className="bg-muted/30 p-4 rounded-md border text-foreground/90">
                        {q.answer}
                      </div>
                    </div>
                  )}
                  {q.feedback && (
                    <div>
                      <h3 className="font-medium mb-2">Feedback</h3>
                      <div className="bg-primary/5 p-4 rounded-md border border-primary/20 text-foreground/90">
                        {typeof q.feedback === 'string' ? q.feedback : q.feedback.overall_feedback || '—'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          {/* Video and recommendations tabs are omitted until real data exists */}
        </Tabs>
      </div>
    </Container>
  );
};

export default InterviewResult;
