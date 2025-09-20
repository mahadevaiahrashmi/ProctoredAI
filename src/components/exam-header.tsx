"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExamHeaderProps {
  examTitle: string;
  totalQuestions: number;
  onTimeUp: () => void;
  children?: ReactNode;
}

// Set exam duration based on number of questions (e.g., 1.5 minutes per question)
const DURATION_PER_QUESTION_S = 90; 

export default function ExamHeader({ examTitle, totalQuestions, onTimeUp, children }: ExamHeaderProps) {
  const [timeLeft, setTimeLeft] = useState(totalQuestions * DURATION_PER_QUESTION_S);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const timeColor = timeLeft < 300 ? "bg-destructive/80" : "bg-primary/80";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        {children}
        <h1 className="text-lg font-semibold md:text-xl truncate">{examTitle}</h1>
      </div>
      <Badge variant="outline" className={`text-lg tabular-nums ${timeColor} text-primary-foreground border-0`}>
        <Timer className="mr-2 h-5 w-5" />
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Badge>
    </header>
  );
}
