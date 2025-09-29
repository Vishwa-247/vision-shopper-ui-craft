import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Brain, 
  ArrowLeft, 
  Briefcase, 
  History,
  ChevronRight,
  Loader2
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
    setCurrentStep('upload');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedProfileResume(null);
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
        title: "Analysis Complete!",
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
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Resume Analyzer</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enhanced AI-powered analysis with action words and STAR methodology scoring
            </p>
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-6 w-6" />
                        Job Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="jobRole">Job Role / Position *</Label>
                        <Input
                          id="jobRole"
                          placeholder="e.g., Software Engineer, Product Manager"
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                        <Textarea
                          id="jobDescription"
                          placeholder="Paste the job description here for more targeted analysis..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          rows={6}
                        />
                      </div>
                      
                      <Button onClick={handleJobRoleNext} className="w-full">
                        Continue to Upload
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {currentStep === 'upload' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-6 w-6" />
                        Upload Resume
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="resume-upload"
                        />
                        <Label htmlFor="resume-upload" className="cursor-pointer">
                          <Button variant="outline" className="mt-4" asChild>
                            <span>Choose File</span>
                          </Button>
                        </Label>
                        {selectedFile && (
                          <p className="text-sm text-primary mt-2">
                            Selected: {selectedFile.name}
                          </p>
                        )}
                      </div>
                      
                      {selectedFile && (
                        <Button 
                          onClick={handleAnalyze} 
                          className="w-full mt-4"
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
                              Analyze Resume
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {currentStep === 'results' && analysisResults && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold">Analysis Results</h2>
                      <Button variant="outline" onClick={startNewAnalysis}>
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