"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Send, PanelLeft, VideoOff } from "lucide-react";

import { type Question } from "@/ai/flows/generate-exam-questions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProctoringPanel from "@/components/proctoring-panel";
import ExamHeader from "@/components/exam-header";
import QuestionDisplay from "@/components/question-display";
import FloatingCamera from "@/components/floating-camera";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { examData as staticExamData } from "@/lib/data";


export default function ExamPage() {
  const router = useRouter();
  const [examData, setExamData] = useState<{title: string, questions: Question[] } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [violations, setViolations] = useState<string[]>([]);
  // Whether this session is proctored. Set on the setup page; defaults to true
  // for direct navigation. When false, the proctoring UI and camera are skipped.
  const [proctored, setProctored] = useState(true);
  // Consent record from the setup page (proctored sessions only). Forwarded to
  // the results page as an audit trail; null for unproctored/legacy sessions.
  const [consent, setConsent] = useState<{
    acceptedAt: string;
    noticeVersion: string;
  } | null>(null);

  useEffect(() => {
    try {
      const examDataString = sessionStorage.getItem('examData');
      if (examDataString) {
        const parsedData = JSON.parse(examDataString);
        setExamData(parsedData);
      } else {
        // Fallback to static data if nothing is in session storage
        setExamData(staticExamData);
      }
    } catch (error) {
      console.error("Failed to parse exam data from sessionStorage", error);
      setExamData(staticExamData);
    }

    try {
      const configString = sessionStorage.getItem('examConfig');
      if (configString) {
        const parsedConfig = JSON.parse(configString);
        setProctored(parsedConfig.proctored !== false);
        setConsent(parsedConfig.consent ?? null);
      }
    } catch (error) {
      console.error("Failed to parse exam config from sessionStorage", error);
    }
  }, []);

  if (!examData) {
     return (
      <div className="flex h-full min-h-screen flex-col bg-background p-8">
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-[calc(100vh-12rem)] w-full" />
      </div>
    );
  }

  const totalQuestions = examData.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const currentQuestion = examData.questions[currentQuestionIndex];

  const handleAnswerChange = (answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    // Store results in session storage to pass to the results page
    sessionStorage.setItem('examResults', JSON.stringify({
      questions: examData.questions,
      answers: answers,
      violations: violations, // Pass violations to the results page
      title: examData.title,
      proctored: proctored, // Whether proctoring was active this session
      consent: proctored ? consent : null, // Consent audit record (proctored only)
    }));
    router.push(`/results`);
  };

  return (
    <div className="flex h-full min-h-screen flex-col bg-background">
      <ExamHeader
        examTitle={examData.title}
        totalQuestions={totalQuestions}
        onTimeUp={handleSubmit}
      >
        {proctored && (
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="lg:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Proctoring Panel</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[350px] bg-background">
              <SheetHeader className="p-4 border-b">
                  <SheetTitle className="sr-only">Proctoring</SheetTitle>
              </SheetHeader>
              <ProctoringPanel violations={violations} setViolations={setViolations} />
            </SheetContent>
          </Sheet>
        )}
      </ExamHeader>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          <div className="flex h-full flex-col">
            {proctored && (
              <div className="lg:hidden">
                <FloatingCamera />
              </div>
            )}
            {!proctored && (
              <div className="lg:hidden mb-4 flex items-center gap-2 rounded-md border border-dashed bg-muted/50 p-3 text-sm text-muted-foreground">
                <VideoOff className="h-4 w-4 shrink-0" />
                <span>Unproctored session &mdash; camera monitoring is off.</span>
              </div>
            )}

            <div className="flex h-full flex-col rounded-xl border bg-card text-card-foreground shadow-lg">
              <div className="p-6">
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
                <Progress value={progress} className="mt-2" />
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <QuestionDisplay
                  question={currentQuestion}
                  onAnswerChange={handleAnswerChange}
                  currentAnswer={answers[currentQuestion.id]}
                />
              </div>

              <div className="flex items-center justify-between border-t p-4">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                {currentQuestionIndex === totalQuestions - 1 ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>
                        <Send />
                        Submit Exam
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will end the exam and submit your answers. You
                          cannot undo this action.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit}>
                          Submit
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
        {proctored ? (
          <aside className="hidden w-[400px] flex-col border-l bg-card p-4 lg:flex">
            <ProctoringPanel violations={violations} setViolations={setViolations} />
          </aside>
        ) : (
          <aside className="hidden w-[400px] flex-col border-l bg-card p-6 lg:flex">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <VideoOff className="h-8 w-8" />
              <h3 className="font-semibold text-foreground">Unproctored Session</h3>
              <p className="text-sm">
                Camera monitoring is off for this exam. Your results will be
                labeled as taken without proctoring.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
