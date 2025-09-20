"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Home, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
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
import { summarizeAlertsAction } from '@/app/actions';

function ResultsContent() {
  const searchParams = useSearchParams();
  const violations = searchParams.getAll('violations');
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    async function getSummary() {
      if (violations.length > 0) {
        setLoadingSummary(true);
        const result = await summarizeAlertsAction(violations);
        setSummary(result);
        setLoadingSummary(false);
      } else {
        setSummary("No violations were detected during the exam.");
        setLoadingSummary(false);
      }
    }
    getSummary();
  }, [violations]);

  const hasViolations = violations.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${hasViolations ? 'bg-amber-100' : 'bg-green-100'}`}>
            {hasViolations ? (
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            ) : (
              <CheckCircle className="h-10 w-10 text-green-600" />
            )}
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">
            Exam Submitted
          </CardTitle>
          <CardDescription>
            Your answers have been submitted for grading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Proctoring Summary</h3>
            <div className="rounded-md border bg-secondary/50 p-4 text-sm">
                {loadingSummary ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating summary...</span>
                    </div>
                ) : (
                    <p>{summary}</p>
                )}
            </div>
          </div>
          {hasViolations && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Violation Details</h3>
              <ScrollArea className="h-48 w-full rounded-md border">
                <ul className="p-4 text-sm">
                  {violations.map((violation, index) => (
                    <li key={index} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                      <span>{violation}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </CardContent>
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


export default function ResultsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResultsContent />
        </Suspense>
    )
}
