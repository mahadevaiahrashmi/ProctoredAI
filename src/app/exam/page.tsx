"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

import { examData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProctoringPanel from "@/components/proctoring-panel";
import ExamHeader from "@/components/exam-header";
import QuestionDisplay from "@/components/question-display";
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
import { PanelLeft } from "lucide-react";

export default function ExamPage() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});

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
    // In a real app, you would save the answers to a database.
    console.log("Submitting answers:", answers);
    router.push("/submitted");
  };

  return (
    <div className="flex h-full min-h-screen flex-col bg-background">
      <ExamHeader
        examTitle={examData.title}
        totalQuestions={totalQuestions}
        onTimeUp={handleSubmit}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="lg:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Proctoring Panel</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[350px] bg-background">
            <SheetHeader>
              <SheetTitle className="sr-only">Proctoring Panel</SheetTitle>
            </SheetHeader>
            <ProctoringPanel />
          </SheetContent>
        </Sheet>
      </ExamHeader>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          <div className="flex h-full flex-col">
            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-lg mb-6 lg:hidden">
              <ProctoringPanel />
            </div>

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
        <aside className="hidden w-[400px] flex-col border-l bg-card p-4 lg:flex">
          <ProctoringPanel />
        </aside>
      </div>
    </div>
  );
}
