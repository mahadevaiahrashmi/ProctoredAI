"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Home, AlertTriangle, CheckCircle, Loader2, Award, FileText, BarChart, Percent, XCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { gradeExamAction, summarizeAlertsAction } from '@/app/actions';
import { type GradeExamOutput } from '@/ai/flows/grade-exam';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ChatTutor from '@/components/chat-tutor';

function ResultsContent() {
  const [examResults, setExamResults] = useState<{
    questions: any[];
    answers: Record<number, string | string[]>;
    violations: string[];
    title: string;
  } | null>(null);
  const [gradingReport, setGradingReport] = useState<GradeExamOutput | null>(null);
  const [violationSummary, setViolationSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const resultsString = sessionStorage.getItem('examResults');
      if (resultsString) {
        const parsedResults = JSON.parse(resultsString);
        setExamResults(parsedResults);
      } else {
        setError("Could not load exam results.");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to parse exam results.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!examResults) return;

    async function getReports() {
      try {
        setLoading(true);
        setError(null);
        
        const [report, summary] = await Promise.all([
          gradeExamAction(examResults.questions, examResults.answers),
          summarizeAlertsAction(examResults.violations)
        ]);
        
        setGradingReport(report);
        setViolationSummary(summary);

      } catch (e) {
        console.error(e);
        setError("An error occurred while generating your performance report.");
      } finally {
        setLoading(false);
      }
    }

    getReports();
  }, [examResults]);

  const hasViolations = examResults?.violations && examResults.violations.length > 0;

  const renderLoadingState = () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">
                Grading Your Exam...
            </CardTitle>
            <CardDescription>
                Our AI is analyzing your answers. This may take a moment.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
        </CardContent>
         <CardFooter className="flex justify-center">
          <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please Wait
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  if (loading) {
    return renderLoadingState();
  }

  if (error) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-2xl shadow-lg">
                 <CardHeader className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">An Error Occurred</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Return to Home
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!gradingReport || !examResults) {
    return null; // Should be handled by error state
  }
  
  const getQuestionById = (id: number) => examResults.questions.find(q => q.id === id);

  return (
    <div className="min-h-screen bg-secondary/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card className="shadow-2xl border-t-4 border-primary">
            <CardHeader className="text-center p-8 bg-card">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10`}>
                <Award className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-3xl font-bold">
                Exam Report for "{examResults.title}"
            </CardTitle>
            <CardDescription className="text-lg">
                Here's a detailed breakdown of your performance.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
                {/* Overall Score & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <Card className="p-4">
                        <CardHeader>
                            <Percent className="mx-auto h-8 w-8 text-muted-foreground" />
                            <CardTitle className="text-4xl font-bold text-primary mt-2">{gradingReport.overallScore}%</CardTitle>
                            <CardDescription>Overall Score</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="p-4 md:col-span-2 text-left">
                        <CardHeader>
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <CardTitle className="mt-2">Performance Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{gradingReport.summaryReport}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Question Breakdown */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xl flex items-center gap-2"><BarChart /> Question-by-Question Analysis</h3>
                    <Accordion type="single" collapsible className="w-full">
                        {gradingReport.gradedQuestions.map((gradedQ) => {
                        const question = getQuestionById(gradedQ.questionId);
                        if (!question) return null;

                        const userAnswer = examResults.answers[gradedQ.questionId] || "Not answered";

                        return (
                            <AccordionItem value={`item-${gradedQ.questionId}`} key={gradedQ.questionId}>
                            <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                                <div className="flex items-center gap-4 text-left">
                                {gradedQ.isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> : <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                                <span className="flex-1 font-medium">Question {gradedQ.questionId}: {question.text}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 space-y-4 bg-secondary/50 rounded-b-md">
                                    <div className="prose prose-sm max-w-none">
                                        <p><strong>Your Answer:</strong> {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}</p>
                                        <p><strong>Correct Answer:</strong> {question.answer}</p>
                                        <p><strong>Feedback:</strong> {gradedQ.feedback}</p>
                                    </div>
                            </AccordionContent>
                            </AccordionItem>
                        )
                        })}
                    </Accordion>
                </div>

            </CardContent>
            {/* Proctoring Summary */}
            {hasViolations && (
            <CardContent className="px-8 pb-8">
                <Card className="bg-destructive/5 border-destructive/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-destructive">
                            <AlertTriangle />
                            Proctoring Violation Report
                        </CardTitle>
                        <CardDescription className="text-destructive/90 pt-2">
                            {violationSummary}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h4 className="font-semibold mb-2">Detailed Log:</h4>
                        <ScrollArea className="h-40 w-full rounded-md border bg-background p-2">
                            <ul className="p-2 text-sm text-destructive/90">
                            {examResults.violations.map((violation, index) => (
                                <li key={index} className="flex items-start gap-2 py-1.5 border-b border-destructive/10 last:border-b-0">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{violation}</span>
                                </li>
                            ))}
                            </ul>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </CardContent>
            )}
        </Card>
        
        {/* AI Tutor Chat */}
        <Card className="shadow-2xl">
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <div className='p-2 bg-primary/10 rounded-full'>
                        <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle>AI Tutor</CardTitle>
                        <CardDescription>Have questions about your results? Ask me anything!</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChatTutor 
                    examContext={{
                        examTitle: examResults.title,
                        questions: examResults.questions,
                        userAnswers: examResults.answers,
                        gradingReport,
                    }}
                />
            </CardContent>
        </Card>


        <div className='text-center py-4'>
            <Button asChild size="lg">
                <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}


export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
            <ResultsContent />
        </Suspense>
    )
}
