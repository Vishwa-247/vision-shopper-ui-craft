
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import InterviewTypeSelector from "@/components/interview/InterviewTypeSelector";
// import TechnicalInterviewSetup from "@/components/interview/TechnicalInterviewSetup";
// import InterviewSetup from "@/components/interview/InterviewSetup";
// import Container from "@/components/ui/Container";
// import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { useToast } from "@/hooks/use-toast";

// const staticQuestions = {
//   "Software Engineer": [
//     "Tell me about your experience with agile development methodologies.",
//     "How do you approach debugging complex issues in your code?",
//     "Describe a time when you had to design a scalable web application.",
//     "How do you use version control in your workflow?",
//     "Tell me about a challenging project you've worked on and how you handled it."
//   ],
//   "Frontend Developer": [
//     "Explain how React hooks work and their advantages over class components.",
//     "How do you optimize website performance?",
//     "What strategies do you use for responsive design?",
//     "How do you approach testing frontend applications?",
//     "How do you ensure cross-browser compatibility in your web applications?"
//   ],
//   "Backend Developer": [
//     "How do you design database schemas for scalability?",
//     "What security measures do you implement in your APIs?",
//     "How have you implemented microservices architecture?",
//     "Explain your approach to error handling in a backend application.",
//     "How do you handle API versioning?"
//   ],
//   "Data Scientist": [
//     "How do you handle data preparation and cleaning?",
//     "Which machine learning algorithms have you used and in what contexts?",
//     "How do you validate your models?",
//     "How do you translate business problems into data science solutions?",
//     "How do you communicate technical findings to non-technical stakeholders?"
//   ],
//   "DevOps Engineer": [
//     "Describe your experience setting up CI/CD pipelines.",
//     "How do you approach infrastructure automation?",
//     "What monitoring and logging practices do you implement?",
//     "How do you ensure security in your DevOps processes?",
//     "How do you handle incident response in a production environment?"
//   ],
//   "ML Engineer": [
//     "Explain your experience with deploying machine learning models to production.",
//     "How do you ensure the quality and reliability of machine learning systems?",
//     "Describe your approach to feature engineering and selection.",
//     "How do you handle the challenges of training models on large datasets?",
//     "How do you keep up with the rapidly evolving field of machine learning?"
//   ],
//   "Full Stack Developer": [
//     "How do you manage the frontend and backend parts of an application?",
//     "What's your approach to ensuring data consistency across the stack?",
//     "Tell me about a full stack project you've worked on from inception to deployment.",
//     "How do you handle authentication and authorization in a full stack app?",
//     "What strategies do you use for state management across the entire application?"
//   ],
//   "Cloud Architect": [
//     "How do you approach designing multi-region, highly available cloud architectures?",
//     "Describe your experience with cloud cost optimization.",
//     "How do you implement security in cloud environments?",
//     "Explain how you manage cloud infrastructure at scale.",
//     "How do you approach migrating legacy applications to the cloud?"
//   ],
//   "Default": [
//     "Tell me about your background and experience.",
//     "What are your strengths and weaknesses?",
//     "How do you stay updated with the latest technologies?",
//     "How do you approach problem-solving?",
//     "Where do you see yourself in 5 years?"
//   ]
// };

// enum InterviewStage {
//   TypeSelection = "type_selection",
//   Setup = "setup", 
//   Questions = "questions",
//   Recording = "recording",
//   Complete = "complete",
// }

// const MockInterview = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [isLoading, setIsLoading] = useState(false);
//   const [stage, setStage] = useState<InterviewStage>(InterviewStage.TypeSelection);
//   const [selectedInterviewType, setSelectedInterviewType] = useState<string>("");
//   const [questions, setQuestions] = useState<string[]>([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingComplete, setRecordingComplete] = useState(false);
//   const [interviewId, setInterviewId] = useState<string>("mock-001");

//   // Static mock interviews data
//   const recentInterviews = [
//     { id: "mock-001", job_role: "Frontend Developer", tech_stack: "React, TypeScript", experience: "3-5", created_at: new Date().toISOString(), user_id: "mock-user", completed: true },
//     { id: "mock-002", job_role: "Full Stack Engineer", tech_stack: "Node.js, Express, MongoDB", experience: "1-3", created_at: new Date().toISOString(), user_id: "mock-user", completed: false },
//     { id: "mock-003", job_role: "Data Scientist", tech_stack: "Python, TensorFlow, PyTorch", experience: "5+", created_at: new Date().toISOString(), user_id: "mock-user", completed: true },
//   ];

//   const handleTypeSelection = (type: string) => {
//     setSelectedInterviewType(type);
//     setStage(InterviewStage.Setup);
//   };
//     const handleInterviewSetup = (role: string, techStack: string, experience: string) => {
    
//     // Generate a mock interview ID
//     const mockId = `mock-${Date.now()}`;
//     setInterviewId(mockId);
    
//     // Get questions based on role
//     const jobType = role.includes("Frontend") ? "Frontend Developer" :
//                     role.includes("Backend") ? "Backend Developer" :
//                     role.includes("Full") ? "Full Stack Developer" :
//                     role.includes("Data") ? "Data Scientist" :
//                     role.includes("DevOps") ? "DevOps Engineer" :
//                     role.includes("ML") ? "ML Engineer" :
//                     role.includes("Cloud") ? "Cloud Architect" : "Default";
    
//     const interviewQuestions = staticQuestions[jobType as keyof typeof staticQuestions] || staticQuestions["Default"];
    
//     // Set up the questions
//     setQuestions(interviewQuestions);
//     setCurrentQuestionIndex(0);
    
//     // Update UI
//     toast({
//       title: "Interview Created",
//       description: "Your mock interview has been set up successfully.",
//     });
    
//     setIsLoading(false);
//     setStage(InterviewStage.Questions);
//   };

//   const handleAnswerSubmitted = () => {
//     setRecordingComplete(true);
//     toast({
//       title: "Answer Recorded",
//       description: "Your answer has been recorded successfully.",
//     });
//   };

//   const handleNextQuestion = () => {
//     setRecordingComplete(false);
    
//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex(prev => prev + 1);
//       setStage(InterviewStage.Questions);
//     } else {
//       // Interview is complete, navigate directly to results
//       navigate(`/interview-result/mock-001`);
//     }
//   };

//   const startRecording = () => {
//     setIsRecording(true);
//   };
  
//   const stopRecording = () => {
//     setIsRecording(false);
//     handleAnswerSubmitted(); // Auto-submit when recording stops
//   };
  
//   const handleCancel = () => {
//     setStage(InterviewStage.Questions);
//   };

//   const handleDownloadInterview = () => {
//     toast({
//       title: "Interview Downloaded",
//       description: "Your interview has been downloaded successfully.",
//     });
//   };

//   const resumeInterview = (interview: any) => {
//     // Set up with static interview questions
//     const jobType = interview.job_role.includes("Frontend") ? "Frontend Developer" :
//                     interview.job_role.includes("Backend") ? "Backend Developer" :
//                     interview.job_role.includes("Full") ? "Full Stack Developer" :
//                     interview.job_role.includes("Data") ? "Data Scientist" :
//                     interview.job_role.includes("DevOps") ? "DevOps Engineer" :
//                     interview.job_role.includes("ML") ? "ML Engineer" :
//                     interview.job_role.includes("Cloud") ? "Cloud Architect" : "Default";
    
//     const interviewQuestions = staticQuestions[jobType as keyof typeof staticQuestions] || staticQuestions["Default"];
    
//     setQuestions(interviewQuestions);
//     setCurrentQuestionIndex(0);
//     setInterviewId(interview.id);
//     setStage(InterviewStage.Questions);
//   };

//   const renderStage = () => {
//     switch (stage) {
//       case InterviewStage.Questions:
//         if (questions.length === 0) {
//           return (
//             <div className="text-center py-12">
//               <p>No questions available. Please set up a new interview.</p>
//             </div>
//           );
//         }
        
//         return (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             <div className="space-y-6">
//               <div className="mb-6 flex items-center justify-between">
//                 <Button 
//                   variant="ghost" 
//                   size="sm" 
//                   onClick={() => setStage(InterviewStage.TypeSelection)}
//                   className="text-muted-foreground"
//                 >
//                   <ChevronLeft className="mr-2 h-4 w-4" />
//                   Cancel Interview
//                 </Button>
                
//                 <span className="text-sm text-muted-foreground">
//                   Question {currentQuestionIndex + 1} of {questions.length}
//                 </span>
//               </div>
              
//               <Card className="mb-8">
//                 <CardHeader>
//                   <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
//                   <CardDescription>
//                     Take a moment to think about your answer before recording.
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="p-4 bg-muted rounded-md text-lg">
//                     {questions[currentQuestionIndex]}
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <div className="flex justify-center mt-4">
//                 <Button 
//                   size="lg"
//                   onClick={() => setStage(InterviewStage.Recording)}
//                 >
//                   Ready to Answer
//                 </Button>
//               </div>

//               <Card className="mt-8">
//                 <CardHeader>
//                   <CardTitle>Interview Tips</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     <li className="flex items-start gap-2">
//                       <div className="rounded-full bg-primary/10 p-1 mt-0.5">
//                         <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
//                       </div>
//                       <span>Speak clearly and at a moderate pace</span>
//                     </li>
//                     <li className="flex items-start gap-2">
//                       <div className="rounded-full bg-primary/10 p-1 mt-0.5">
//                         <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
//                       </div>
//                       <span>Maintain eye contact with the camera</span>
//                     </li>
//                     <li className="flex items-start gap-2">
//                       <div className="rounded-full bg-primary/10 p-1 mt-0.5">
//                         <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
//                       </div>
//                       <span>Structure your answers using the STAR method</span>
//                     </li>
//                     <li className="flex items-start gap-2">
//                       <div className="rounded-full bg-primary/10 p-1 mt-0.5">
//                         <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
//                       </div>
//                       <span>Take a brief pause before answering to collect your thoughts</span>
//                     </li>
//                   </ul>
//                 </CardContent>
//               </Card>
//             </div>
            
//             <div className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Camera Preview</CardTitle>
//                   <CardDescription>
//                     Check your camera and microphone before starting
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <VideoRecorder 
//                     onRecordingComplete={() => {}}
//                     isRecording={false}
//                     startRecording={() => {}}
//                     stopRecording={() => {}}
//                   />
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Save Your Interview</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-muted-foreground mb-4">
//                     Download your interview session for future reference or to share with mentors.
//                   </p>
//                   <Button 
//                     variant="outline" 
//                     className="w-full" 
//                     onClick={handleDownloadInterview}
//                   >
//                     <Download className="mr-2 h-4 w-4" />
//                     Download Interview
//                   </Button>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         );
      
//       case InterviewStage.Recording:
//         return (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             <div>
//               <div className="mb-6">
//                 <h2 className="text-xl font-semibold mb-2">
//                   Question {currentQuestionIndex + 1}:
//                 </h2>
//                 <div className="p-4 bg-muted rounded-md text-lg mb-4">
//                   {questions[currentQuestionIndex]}
//                 </div>
//                 <p className="text-muted-foreground">
//                   When you're ready, click "Start Recording" and begin your answer. We'll analyze both your verbal response and facial expressions.
//                 </p>
//               </div>
              
//               <Card className="mt-8">
//                 <CardHeader>
//                   <CardTitle>Answering Tips</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     <li className="flex items-start gap-2">
//                       <div className="rounded-full bg-primary/10 p-1 mt-0.5">
//                         <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
//                       </div>
//                       <span>Use specific examples from your experience</span>
//                     </li>
//                     <li className="flex items-start gap-2">
//                       <div className="rounded-full bg-primary/10 p-1 mt-0.5">
//                         <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
//                       </div>
//                       <span>Avoid filler words like "um" and "uh"</span>
//                     </li>
//                     <li className="flex items-start gap-2">
//                       <div className="rounded-full bg-primary/10 p-1 mt-0.5">
//                         <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
//                       </div>
//                       <span>Speak confidently and maintain good posture</span>
//                     </li>
//                   </ul>
//                 </CardContent>
//               </Card>
//             </div>
            
//             <div className="space-y-6">
//               <VideoRecorder 
//                 onRecordingComplete={handleAnswerSubmitted}
//                 isRecording={isRecording}
//                 startRecording={startRecording}
//                 stopRecording={stopRecording}
//               />
              
//               <div className="mt-6 flex justify-center space-x-4">
//                 {recordingComplete ? (
//                   <Button 
//                     onClick={handleNextQuestion}
//                     className="px-6 py-3 bg-primary text-white rounded-lg flex items-center space-x-2"
//                   >
//                     <span>Next Question</span>
//                     <ChevronRight size={16} />
//                   </Button>
//                 ) : (
//                   <Button 
//                     variant="outline" 
//                     onClick={handleCancel}
//                   >
//                     Cancel
//                   </Button>
//                 )}
//               </div>
//             </div>
//           </div>
//         );
      
//       default:
//         return null;
//     }
//   };

//   const renderRecentInterviews = () => {
//     return (
//       <div className="mt-12">
//         <h2 className="text-xl font-semibold mb-4">Recent Mock Interviews</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {recentInterviews.map((interview) => (
//             <Card key={interview.id} className="overflow-hidden">
//               <CardHeader className="pb-4">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <CardTitle className="text-lg">{interview.job_role}</CardTitle>
//                     <CardDescription>{new Date(interview.created_at).toLocaleDateString()}</CardDescription>
//                   </div>
//                   <div className={`px-2 py-1 text-xs font-medium rounded-full ${
//                     interview.completed ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
//                   }`}>
//                     {interview.completed ? "Completed" : "In Progress"}
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center gap-2 mb-4">
//                   {interview.tech_stack.split(',').map((tech, i) => (
//                     <div key={i} className="px-2 py-1 text-xs font-medium rounded-full bg-secondary">
//                       {tech.trim()}
//                     </div>
//                   ))}
//                 </div>
//                 <div className="mt-4">
//                   <Button 
//                     variant="outline" 
//                     className="w-full" 
//                     onClick={() => {
//                       if (interview.completed) {
//                         navigate(`/interview-result/${interview.id}`);
//                       } else {
//                         resumeInterview(interview);
//                       }
//                     }}
//                   >
//                     {interview.completed ? "View Results" : "Resume Interview"}
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <Container className="py-12">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold tracking-tight mb-2">
//           Mock Interview
//         </h1>
//         <p className="text-muted-foreground max-w-2xl">
//           Practice your interview skills with our AI-powered mock interview simulator.
//         </p>
//       </div>

//       {stage === InterviewStage.TypeSelection && (
//         <div className="space-y-8">
//           <InterviewTypeSelector onSelectType={handleTypeSelection} selectedType={selectedInterviewType} />
//           {renderRecentInterviews()}
//         </div>
//       )}
      
//       {stage === InterviewStage.Setup && (
//             <div className="space-y-8">
//               {selectedInterviewType === 'technical' ? (
//                 <TechnicalInterviewSetup 
//                   onSubmit={handleInterviewSetup} 
//                   onBack={() => setStage(InterviewStage.TypeSelection)}
//                   isLoading={isLoading} 
//                 />
//               ) : (
//                 <InterviewSetup 
//                   onSubmit={handleInterviewSetup} 
//                   isLoading={isLoading} 
//                 />
//               )}
//               {selectedInterviewType !== 'technical' && renderRecentInterviews()}
//             </div>
//           )}
          
//           {stage !== InterviewStage.TypeSelection && stage !== InterviewStage.Setup && renderStage()}
//     </Container>
//   );
// };

// export default MockInterview;




import InterviewCapture from "@/components/interview/InterviewCapture";
import InterviewTypeSelector from "@/components/interview/InterviewTypeSelector";
import MetricsPanel from "@/components/interview/MetricsPanel";
import TechnicalInterviewSetup from "@/components/interview/TechnicalInterviewSetup";
import UnifiedInterviewSetup from "@/components/interview/UnifiedInterviewSetup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Container from "@/components/ui/Container";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const staticQuestions = {
  "Software Engineer": [
    "Tell me about your experience with agile development methodologies.",
    "How do you approach debugging complex issues in your code?",
    "Describe a time when you had to design a scalable web application.",
    "How do you use version control in your workflow?",
    "Tell me about a challenging project you've worked on and how you handled it.",
  ],
  "Frontend Developer": [
    "Explain how React hooks work and their advantages over class components.",
    "How do you optimize website performance?",
    "What strategies do you use for responsive design?",
    "How do you approach testing frontend applications?",
    "How do you ensure cross-browser compatibility in your web applications?",
  ],
  "Backend Developer": [
    "How do you design database schemas for scalability?",
    "What security measures do you implement in your APIs?",
    "How have you implemented microservices architecture?",
    "Explain your approach to error handling in a backend application.",
    "How do you handle API versioning?",
  ],
  "Data Scientist": [
    "How do you handle data preparation and cleaning?",
    "Which machine learning algorithms have you used and in what contexts?",
    "How do you validate your models?",
    "How do you translate business problems into data science solutions?",
    "How do you communicate technical findings to non-technical stakeholders?",
  ],
  "DevOps Engineer": [
    "Describe your experience setting up CI/CD pipelines.",
    "How do you approach infrastructure automation?",
    "What monitoring and logging practices do you implement?",
    "How do you ensure security in your DevOps processes?",
    "How do you handle incident response in a production environment?",
  ],
  "ML Engineer": [
    "Explain your experience with deploying machine learning models to production.",
    "How do you ensure the quality and reliability of machine learning systems?",
    "Describe your approach to feature engineering and selection.",
    "How do you handle the challenges of training models on large datasets?",
    "How do you keep up with the rapidly evolving field of machine learning?",
  ],
  "Full Stack Developer": [
    "How do you manage the frontend and backend parts of an application?",
    "What's your approach to ensuring data consistency across the stack?",
    "Tell me about a full stack project you've worked on from inception to deployment.",
    "How do you handle authentication and authorization in a full stack app?",
    "What strategies do you use for state management across the entire application?",
  ],
  "Cloud Architect": [
    "How do you approach designing multi-region, highly available cloud architectures?",
    "Describe your experience with cloud cost optimization.",
    "How do you implement security in cloud environments?",
    "Explain how you manage cloud infrastructure at scale.",
    "How do you approach migrating legacy applications to the cloud?",
  ],
  Default: [
    "Tell me about your background and experience.",
    "What are your strengths and weaknesses?",
    "How do you stay updated with the latest technologies?",
    "How do you approach problem-solving?",
    "Where do you see yourself in 5 years?",
  ],
};

enum InterviewStage {
  TypeSelection = "type_selection",
  Setup = "setup",
  Questions = "questions",
  Recording = "recording",
  Complete = "complete",
}

const MockInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<InterviewStage>(
    InterviewStage.TypeSelection
  );
  const [selectedInterviewType, setSelectedInterviewType] =
    useState<string>("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [interviewId, setInterviewId] = useState<string>("mock-001");
  const [metricsData, setMetricsData] = useState({
    facialData: { confident: 0, stressed: 0, nervous: 0 },
    behaviorData: {
      blink_count: 0,
      looking_at_camera: false,
      head_pose: { pitch: 0, yaw: 0, roll: 0 },
    },
    communicationData: {
      filler_word_count: 0,
      words_per_minute: 0,
      clarity_score: 0,
    },
  });

  // Add aggregated face metrics for submission
  const [aggregatedFaceMetrics, setAggregatedFaceMetrics] = useState({
    frameCount: 0,
    totalConfident: 0,
    totalStressed: 0,
    totalNervous: 0,
    blinkCount: 0,
    lookingAtCameraCount: 0,
  });

  const handleTypeSelection = (type: string) => {
    setSelectedInterviewType(type);
    setStage(InterviewStage.Setup);
  };
  const handleInterviewSetup = (
    dataOrRole: any,
    techStack?: string,
    experience?: string
  ) => {
    // Support both old 3-param format and new single object format
    let data = dataOrRole;
    if (typeof dataOrRole === "string" && techStack && experience) {
      // Old format: handleInterviewSetup(role, techStack, experience)
      data = { role: dataOrRole, techStack, experience };
    }

    // Generate a mock interview ID
    const mockId = `mock-${Date.now()}`;
    setInterviewId(mockId);

    // Get questions based on role or interview type
    const role = data.role || selectedInterviewType;
    const jobType = role.includes("Frontend")
      ? "Frontend Developer"
      : role.includes("Backend")
      ? "Backend Developer"
      : role.includes("Full")
      ? "Full Stack Developer"
      : role.includes("Data")
      ? "Data Scientist"
      : role.includes("DevOps")
      ? "DevOps Engineer"
      : role.includes("ML")
      ? "ML Engineer"
      : role.includes("Cloud")
      ? "Cloud Architect"
      : "Default";

    const interviewQuestions =
      staticQuestions[jobType as keyof typeof staticQuestions] ||
      staticQuestions["Default"];

    // Set up the questions
    setQuestions(interviewQuestions);
    setCurrentQuestionIndex(0);

    // Update UI
    toast({
      title: "Interview Created",
      description: "Your mock interview has been set up successfully.",
    });

    setIsLoading(false);
    setStage(InterviewStage.Questions);
  };

  const handleAnswerSubmitted = () => {
    setRecordingComplete(true);
    toast({
      title: "Answer Recorded",
      description: "Your answer has been recorded successfully.",
    });
  };

  const handleNextQuestion = () => {
    setRecordingComplete(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setStage(InterviewStage.Questions);
    } else {
      // Interview is complete, navigate directly to results
      navigate(`/interview-result/mock-001`);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    handleAnswerSubmitted(); // Auto-submit when recording stops
  };

  const handleCancel = () => {
    setStage(InterviewStage.Questions);
  };

  const handleDownloadInterview = () => {
    toast({
      title: "Interview Downloaded",
      description: "Your interview has been downloaded successfully.",
    });
  };

  const resumeInterview = (interview: any) => {
    // Set up with static interview questions
    const jobType = interview.job_role.includes("Frontend")
      ? "Frontend Developer"
      : interview.job_role.includes("Backend")
      ? "Backend Developer"
      : interview.job_role.includes("Full")
      ? "Full Stack Developer"
      : interview.job_role.includes("Data")
      ? "Data Scientist"
      : interview.job_role.includes("DevOps")
      ? "DevOps Engineer"
      : interview.job_role.includes("ML")
      ? "ML Engineer"
      : interview.job_role.includes("Cloud")
      ? "Cloud Architect"
      : "Default";

    const interviewQuestions =
      staticQuestions[jobType as keyof typeof staticQuestions] ||
      staticQuestions["Default"];

    setQuestions(interviewQuestions);
    setCurrentQuestionIndex(0);
    setInterviewId(interview.id);
    setStage(InterviewStage.Questions);
  };

  const renderStage = () => {
    switch (stage) {
      case InterviewStage.Questions:
        if (questions.length === 0) {
          return (
            <div className="text-center py-12">
              <p>No questions available. Please set up a new interview.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="mb-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStage(InterviewStage.TypeSelection)}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Cancel Interview
                </Button>

                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                  <CardDescription>
                    Take a moment to think about your answer before recording.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-md text-lg">
                    {questions[currentQuestionIndex]}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-4">
                <Button
                  size="lg"
                  onClick={() => setStage(InterviewStage.Recording)}
                >
                  Ready to Answer
                </Button>
              </div>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Interview Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>Speak clearly and at a moderate pace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>Maintain eye contact with the camera</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>Structure your answers using the STAR method</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>
                        Take a brief pause before answering to collect your
                        thoughts
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border-2 border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    📹 Camera Preview
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Check your camera and microphone before starting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Preview only - no capture here for now */}
                  <div className="rounded-xl border-2 border-white/20 p-4 text-sm text-muted-foreground bg-white/20 dark:bg-black/20 backdrop-blur-sm">
                    Your camera preview will appear when you start the interview.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Save Your Interview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Download your interview session for future reference or to
                    share with mentors.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadInterview}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Interview
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case InterviewStage.Recording:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-8">
                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Question Progress
                    </h2>
                    <div className="px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/30">
                      <span className="text-sm font-semibold text-primary">
                        {currentQuestionIndex + 1} / {questions.length}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary/30 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-4">
                  Question {currentQuestionIndex + 1}:
                </h2>
                <div className="p-6 bg-gradient-to-br from-white/50 to-white/20 dark:from-black/50 dark:to-black/20 rounded-2xl border-2 border-white/10 backdrop-blur-xl shadow-2xl text-lg font-medium">
                  {questions[currentQuestionIndex]}
                </div>
                <p className="text-muted-foreground mt-4 text-center">
                  When you're ready, click "Start Recording" and begin your
                  answer. We'll analyze both your verbal response and facial
                  expressions.
                </p>
              </div>

              <Card className="mt-8 rounded-2xl border-2 border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    💡 Answering Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 p-3 bg-white/20 dark:bg-black/20 rounded-xl border border-white/10">
                      <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                        <span className="block h-2 w-2 rounded-full bg-primary"></span>
                      </div>
                      <span className="font-medium">Use specific examples from your experience</span>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-white/20 dark:bg-black/20 rounded-xl border border-white/10">
                      <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                        <span className="block h-2 w-2 rounded-full bg-primary"></span>
                      </div>
                      <span className="font-medium">Avoid filler words like "um" and "uh"</span>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-white/20 dark:bg-black/20 rounded-xl border border-white/10">
                      <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                        <span className="block h-2 w-2 rounded-full bg-primary"></span>
                      </div>
                      <span className="font-medium">Speak confidently and maintain good posture</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <InterviewCapture
                onFaceFrame={async (jpegBase64) => {
                  try {
                    const res = await fetch('http://localhost:5000/analyze', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ image: jpegBase64 }),
                    });
                    if (!res.ok) return;
                    const data = await res.json();

                    // Update real-time display
                    setMetricsData(prev => ({
                      ...prev,
                      facialData: {
                        confident: (data.metrics?.confident ?? 0) * 100,
                        stressed: (data.metrics?.stressed ?? 0) * 100,
                        nervous: (data.metrics?.nervous ?? 0) * 100,
                      },
                      behaviorData: {
                        blink_count: data.face_tracking?.blink_count ?? 0,
                        looking_at_camera: !!data.face_tracking?.looking_at_camera,
                        head_pose: data.face_tracking?.head_pose ?? { pitch: 0, yaw: 0, roll: 0 },
                      },
                    }));

                    // Aggregate metrics for submission
                    setAggregatedFaceMetrics(prev => ({
                      frameCount: prev.frameCount + 1,
                      totalConfident: prev.totalConfident + (data.metrics?.confident ?? 0),
                      totalStressed: prev.totalStressed + (data.metrics?.stressed ?? 0),
                      totalNervous: prev.totalNervous + (data.metrics?.nervous ?? 0),
                      blinkCount: prev.blinkCount + (data.face_tracking?.blink_count ?? 0),
                      lookingAtCameraCount: prev.lookingAtCameraCount + (data.face_tracking?.looking_at_camera ? 1 : 0),
                    }));
                  } catch (e) {
                    console.error('Face frame analysis error:', e);
                  }
                }}
                onAudioReady={async (blob) => {
                  try {
                    // Calculate averages from aggregated metrics
                    const avgMetrics = {
                      avg_confident: aggregatedFaceMetrics.frameCount > 0 
                        ? (aggregatedFaceMetrics.totalConfident / aggregatedFaceMetrics.frameCount) * 100 
                        : 50,
                      avg_stressed: aggregatedFaceMetrics.frameCount > 0 
                        ? (aggregatedFaceMetrics.totalStressed / aggregatedFaceMetrics.frameCount) * 100 
                        : 20,
                      avg_nervous: aggregatedFaceMetrics.frameCount > 0 
                        ? (aggregatedFaceMetrics.totalNervous / aggregatedFaceMetrics.frameCount) * 100 
                        : 15,
                      blink_count: aggregatedFaceMetrics.blinkCount,
                      looking_at_camera_percent: aggregatedFaceMetrics.frameCount > 0 
                        ? (aggregatedFaceMetrics.lookingAtCameraCount / aggregatedFaceMetrics.frameCount) * 100 
                        : 50,
                    };

                    const fd = new FormData();
                    fd.append('audio', blob, 'answer.webm');
                    fd.append('question_id', String(currentQuestionIndex));
                    fd.append('face_metrics', JSON.stringify(avgMetrics));

                    const resp = await fetch(`http://localhost:8000/interviews/${interviewId}/answer`, {
                      method: 'POST',
                      body: fd,
                    });
                    
                    const result = await resp.json();
                    
                    if (result.success) {
                      setRecordingComplete(true);
                      
                      // Reset aggregated metrics for next question
                      setAggregatedFaceMetrics({
                        frameCount: 0,
                        totalConfident: 0,
                        totalStressed: 0,
                        totalNervous: 0,
                        blinkCount: 0,
                        lookingAtCameraCount: 0,
                      });
                    }
                  } catch (err) {
                    console.error('Submit answer failed:', err);
                    toast({ title: 'Submission Error', description: 'Please try again.', variant: 'destructive' });
                  }
                }}
              />

              <MetricsPanel
                facialData={metricsData.facialData}
                behaviorData={metricsData.behaviorData}
                communicationData={metricsData.communicationData}
                isVisible={isRecording}
              />

              <div className="mt-8 flex justify-center space-x-4">
                {recordingComplete ? (
                  <Button
                    onClick={handleNextQuestion}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-primary/20 font-semibold"
                  >
                    <span>Next Question</span>
                    <ChevronRight size={18} />
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="px-8 py-4 rounded-xl border-2 border-white/20 hover:bg-white/10 hover:scale-105 transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderRecentInterviews = () => {
    return null; // Removed dummy data
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Mock Interview
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Practice your interview skills with our AI-powered mock interview
          simulator.
        </p>
      </div>

      {stage === InterviewStage.TypeSelection && (
        <div className="space-y-8">
          <InterviewTypeSelector
            onSelectType={handleTypeSelection}
            selectedType={selectedInterviewType}
          />
        </div>
      )}

      {stage === InterviewStage.Setup && (
        <div className="space-y-8">
          {selectedInterviewType === "technical" ? (
            <TechnicalInterviewSetup
              onSubmit={handleInterviewSetup}
              onBack={() => setStage(InterviewStage.TypeSelection)}
              isLoading={isLoading}
            />
          ) : (
            <UnifiedInterviewSetup
              type={selectedInterviewType as "aptitude" | "hr"}
              onSubmit={handleInterviewSetup}
            />
          )}
        </div>
      )}

      {stage !== InterviewStage.TypeSelection &&
        stage !== InterviewStage.Setup &&
        renderStage()}
    </Container>
  );
};

export default MockInterview;
