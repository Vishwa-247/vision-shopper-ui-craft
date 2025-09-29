import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Brain, 
  ArrowLeft, 
  Briefcase, 
  History,
  ChevronRight,
  Loader2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { AnalysisHistory } from '@/components/resume/AnalysisHistory';
import { ProfileResumeSelector } from '@/components/resume/ProfileResumeSelector';
import { EnhancedAnalysisResults } from '@/components/resume/EnhancedAnalysisResults';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface AnalysisStep {
  id: 'job-role' | 'upload' | 'results';
  title: string;
  completed: boolean;
}

interface ProfileResume {
  id: string;
  filename: string;
  file_path: string;
  upload_date: string;
  processing_status: string;
}

const ResumeAnalyzer = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'job-role' | 'upload' | 'results'>('job-role');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProfileResume, setSelectedProfileResume] = useState<ProfileResume | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const steps: AnalysisStep[] = [
    { id: 'job-role', title: 'Job Details', completed: !!jobRole },
    { id: 'upload', title: 'Upload Resume', completed: !!(selectedFile || selectedProfileResume) },
    { id: 'results', title: 'Analysis Results', completed: !!analysisResults }
  ];

  const handleJobRoleNext = () => {
    if (!jobRole.trim()) {
      toast({
        title: "Job Role Required",
        description: "Please enter the job role you're applying for",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Step Complete!",
      description: "Job details saved. Now upload your resume.",
    });
    setCurrentStep('upload');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedProfileResume(null);
      toast({
        title: "File Selected!",
        description: `${file.name} is ready for analysis`,
      });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "Resume Required",
        description: "Please upload a resume file",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      toast({
        title: "Analysis Starting...",
        description: "AI is analyzing your resume with advanced techniques",
      });
      
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('job_role', jobRole);
      formData.append('job_description', jobDescription);
      if (user?.id) {
        formData.append('user_id', user.id);
      }

      const response = await fetch('http://localhost:8003/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysisResults(data.analysis);
      setCurrentStep('results');
      
      toast({
        title: "🎉 Analysis Complete!",
        description: "Your resume has been analyzed with action words and STAR methodology",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisSelect = async (analysisId: string) => {
    try {
      setLoading(true);
      toast({
        title: "Loading Analysis...",
        description: "Retrieving your previous analysis results",
      });
      
      const response = await fetch(`http://localhost:8003/analysis/${analysisId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      
      const data = await response.json();
      const analysis = data.analysis;
      
      setAnalysisResults(JSON.parse(analysis.analysis_results));
      setJobRole(analysis.job_role);
      setJobDescription(analysis.job_description || '');
      setSelectedAnalysisId(analysisId);
      setCurrentStep('results');
      
      toast({
        title: "Analysis Loaded!",
        description: "Previous analysis results are now displayed",
      });
      
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewAnalysis = () => {
    setCurrentStep('job-role');
    setJobRole('');
    setJobDescription('');
    setSelectedFile(null);
    setSelectedProfileResume(null);
    setAnalysisResults(null);
    setSelectedAnalysisId('');
    toast({
      title: "New Analysis Started",
      description: "Ready to analyze another resume!",
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Header with Progress */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Brain className="h-12 w-12 text-primary" />
                <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Resume Analyzer
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Enhanced AI-powered analysis with action words and STAR methodology scoring
            </p>
            
            {/* Progress Indicator */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep === step.id 
                        ? 'bg-primary text-primary-foreground' 
                        : step.completed 
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 transition-all ${
                        steps[index + 1].completed ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                {steps.map((step) => (
                  <span key={step.id} className={currentStep === step.id ? 'text-primary font-medium' : ''}>
                    {step.title}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - History */}
              <div className="lg:col-span-1">
                <AnalysisHistory 
                  onSelectAnalysis={handleAnalysisSelect}
                  selectedAnalysisId={selectedAnalysisId}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {currentStep === 'job-role' && (
                  <Card className="border border-border bg-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        Job Information
                      </CardTitle>
                      <p className="text-muted-foreground">
                        Tell us about the position you're applying for
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="jobRole" className="text-sm font-medium">
                          Job Role / Position *
                        </Label>
                        <Input
                          id="jobRole"
                          placeholder="e.g., Software Engineer, Product Manager"
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="jobDescription" className="text-sm font-medium">
                          Job Description (Optional)
                        </Label>
                        <Textarea
                          id="jobDescription"
                          placeholder="Paste the job description here for more targeted analysis..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          rows={6}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          Including the job description will provide more accurate keyword matching
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleJobRoleNext} 
                        className="w-full h-11"
                        disabled={!jobRole.trim()}
                      >
                        Continue to Upload
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {currentStep === 'upload' && (
                  <div className="space-y-6">
                    <Card className="border border-border bg-card">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Upload className="h-6 w-6 text-primary" />
                              </div>
                              Upload Resume
                            </CardTitle>
                            <p className="text-muted-foreground mt-1">
                              Choose a resume file to analyze
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep('job-role')}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center hover:border-primary/40 transition-colors bg-primary/5">
                          <div className="flex flex-col items-center">
                            <div className="p-4 rounded-full bg-primary/10 mb-4">
                              <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Drop your resume here</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Supports PDF and DOCX files up to 10MB
                            </p>
                            <input
                              type="file"
                              accept=".pdf,.docx"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="resume-upload"
                            />
                            <Label htmlFor="resume-upload" className="cursor-pointer">
                              <Button variant="outline" className="h-11" asChild>
                                <span>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Choose File
                                </span>
                              </Button>
                            </Label>
                          </div>
                          
                          {selectedFile && (
                            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">
                                  {selectedFile.name}
                                </span>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  Ready
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {selectedFile && (
                          <Button 
                            onClick={handleAnalyze} 
                            className="w-full mt-6 h-11"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing Resume...
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                Analyze Resume with AI
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Profile Resume Selector */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <ProfileResumeSelector
                      onSelectResume={(resume) => {
                        setSelectedProfileResume(resume);
                        setSelectedFile(null);
                        toast({
                          title: "Profile Resume Selected",
                          description: `Using ${resume.filename} from your profile`,
                        });
                      }}
                      selectedResumeId={selectedProfileResume?.id}
                    />
                  </div>
                )}

                {currentStep === 'results' && analysisResults && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between p-6 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold">Analysis Complete</h2>
                          <p className="text-muted-foreground">
                            Comprehensive resume analysis with AI insights
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={startNewAnalysis}
                        className="bg-background/50 hover:bg-background"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        New Analysis
                      </Button>
                    </div>
                    
                    <EnhancedAnalysisResults
                      analysisData={analysisResults}
                      jobRole={jobRole}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResumeAnalyzer;