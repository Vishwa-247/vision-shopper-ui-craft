import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  Target,
  TrendingUp,
  Star,
  Briefcase,
  ArrowRight,
  User
} from "lucide-react";
import Container from "@/components/ui/Container";
import { useToast } from "@/hooks/use-toast"; 
import ResumePreview from "@/components/profile/ResumePreview";
import JobRoleSuggestions from "@/components/resume/JobRoleSuggestions";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

export default function ResumeAnalyzer() {
  const [step, setStep] = useState<'job-role' | 'upload' | 'analysis'>('job-role');
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadResume, applyExtractedData } = useProfile();

  const handleJobRoleSubmit = () => {
    if (!jobRole.trim()) {
      toast({
        title: "Job role required",
        description: "Please enter the job role you're applying for.",
        variant: "destructive"
      });
      return;
    }
    setStep('upload');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.docx'))) {
      setFile(selectedFile);
      setAnalysisResult(null);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive"
      });
    }
  };

  const analyzeResume = async () => {
    if (!file || !jobRole) return;

    setIsAnalyzing(true);
    setStep('analysis');
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_role', jobRole);
      formData.append('job_description', jobDescription);

      // Call resume analyzer via API Gateway
      console.log('🚀 Sending resume analysis request...', {
        file: file.name,
        jobRole,
        jobDescription: jobDescription.substring(0, 100) + '...'
      });
      
      const response = await fetch('http://localhost:8000/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to analyze resume: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Analysis result received:', {
        success: result.success,
        analysisKeys: Object.keys(result.analysis || {}),
        analysisScore: result.analysis?.overall_score
      });
      
      // The backend returns the analysis directly
      const analysisData = result.analysis;
      console.log('🔍 Processing analysis data:', analysisData);
      
      if (!analysisData) {
        console.error('❌ No analysis data in response:', result);
        throw new Error('No analysis data received from server');
      }
      
      const analysisResults = {
        score: analysisData.overall_score || 0,
        jobMatchScore: analysisData.job_match_score || 0,
        atsScore: analysisData.ats_score || 0,
        strengths: analysisData.strengths || [],
        weaknesses: analysisData.weaknesses || [],
        skillGaps: analysisData.skill_gaps || [],
        recommendations: analysisData.recommendations || [],
        keywords: analysisData.keywords_found || [],
        missingKeywords: analysisData.missing_keywords || [],
        jobRole: jobRole,
        parsedContent: result.extracted_text || '',
        deepAnalysis: analysisData.deep_analysis || null,
        sectionsAnalysis: analysisData.sections_analysis || {},
        improvementPriority: analysisData.improvement_priority || [],
        roleSpecificAdvice: analysisData.role_specific_advice || [],
        extractedData: result.extracted_data || null
      };
      
      console.log('✅ Final analysis results:', analysisResults);
      setAnalysisResult(analysisResults);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `Your resume has been analyzed for ${jobRole} positions!`
      });

      // Note: Profile update functionality removed as requested
      // Users can manually update their profile if needed
    } catch (error) {
      console.error("💥 Analysis failed:", error);
      setIsAnalyzing(false);
      
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('📝 Error details:', errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: `Something went wrong: ${errorMessage}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async (extractedData: any) => {
    if (!user) return;
    
    try {
      toast({
        title: "🤖 Updating Profile...",
        description: "Applying extracted data to your profile sections.",
      });

      const success = await applyExtractedData(extractedData);
      
      if (success) {
        toast({
          title: "✅ Profile Updated!",
          description: "Your profile has been updated with the analyzed resume data.",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Update Failed",
        description: "Couldn't update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startOver = () => {
    setStep('job-role');
    setJobRole("");
    setJobDescription("");
    setFile(null);
    setAnalysisResult(null);
  };

  return (
    <Container className="py-8 mt-20">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Resume Analyzer</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get AI-powered insights about your resume tailored to specific job roles. 
            Discover strengths, identify gaps, and receive personalized recommendations.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className={`flex items-center gap-2 ${step === 'job-role' ? 'text-primary' : step === 'upload' || step === 'analysis' ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'job-role' ? 'bg-primary text-white' : step === 'upload' || step === 'analysis' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              1
            </div>
            Job Role
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : step === 'analysis' ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-primary text-white' : step === 'analysis' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            Upload Resume
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 ${step === 'analysis' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'analysis' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              3
            </div>
            Analysis
          </div>
        </div>


        {/* Step 1: Job Role Input */}
        {step === 'job-role' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Role Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <JobRoleSuggestions onSelectRole={setJobRole} />
              
              <div className="space-y-2">
                <Label htmlFor="jobRole">Job Role/Position *</Label>
                <Input
                  id="jobRole"
                  placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here for more accurate analysis..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Adding a job description will help provide more targeted recommendations
                </p>
              </div>

              <Button onClick={handleJobRoleSubmit} className="w-full">
                Continue to Upload
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Section */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your Resume
                <Badge variant="secondary" className="ml-2">
                  For {jobRole}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <Input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports PDF and DOCX formats
                  </p>
                </div>
              </div>
              
              {file && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-medium">{file.name}</span>
                      <Badge variant="secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  </div>

                  {/* Resume Preview */}
                  <ResumePreview file={file} fullView={true} />

                  <div className="flex gap-2">
                    <Button onClick={analyzeResume} className="flex-1">
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze for {jobRole}
                    </Button>
                    <Button variant="outline" onClick={() => setStep('job-role')}>
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Analysis Progress */}
        {step === 'analysis' && isAnalyzing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 animate-pulse text-primary" />
                  <span className="font-medium">AI Analysis in Progress for {jobRole}</span>
                </div>
                <Progress value={66} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Parsing content, analyzing skills against job requirements, and generating insights...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {step === 'analysis' && analysisResult && !isAnalyzing && (
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Overall Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-primary">
                      {analysisResult.score}/100
                    </div>
                    <Progress value={analysisResult.score} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.score >= 80 ? "Excellent" : 
                       analysisResult.score >= 60 ? "Good" : "Needs Improvement"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-500" />
                    Job Match
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-green-600">
                      {analysisResult.jobMatchScore}/100
                    </div>
                    <Progress value={analysisResult.jobMatchScore} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      Match for {jobRole}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    ATS Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-blue-600">
                      {analysisResult.atsScore}/100
                    </div>
                    <Progress value={analysisResult.atsScore} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      ATS Friendly
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resume Preview with Analysis */}
            {file && <ResumePreview 
              file={file} 
              showAnalysis={true} 
              fullView={true} 
              analysisData={{
                extracted_text: analysisResult.parsedContent,
                analysis: {
                  overall_score: analysisResult.score,
                  strengths: analysisResult.strengths,
                  weaknesses: analysisResult.weaknesses,
                  keywords_found: analysisResult.keywords,
                  sections_analysis: analysisResult.sectionsAnalysis
                },
                word_count: analysisResult.parsedContent ? analysisResult.parsedContent.split(' ').length : 0,
                page_count: Math.ceil((analysisResult.parsedContent?.length || 0) / 3000)
              }}
            />}

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Gaps for {jobRole}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.skillGaps.map((skill: string, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Keywords Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Found Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Missing Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.missingKeywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deep Analysis */}
            {analysisResult.deepAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Deep Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(analysisResult.deepAnalysis).map(([key, value]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {key.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {value.score}/100
                          </span>
                        </div>
                        <Progress value={value.score} className="h-2" />
                        <p className="text-xs text-muted-foreground">{value.details}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations for {jobRole}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button variant="outline" size="lg" onClick={startOver} className="flex-1">
                Analyze Another Role
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}