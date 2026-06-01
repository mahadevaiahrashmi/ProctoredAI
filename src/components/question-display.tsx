"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/ai/flows/generate-exam-questions";


interface QuestionDisplayProps {
  question: Question;
  onAnswerChange: (answer: string | string[]) => void;
  currentAnswer?: string | string[];
}

export default function QuestionDisplay({
  question,
  onAnswerChange,
  currentAnswer,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{question.text}</h2>
      {question.type === "multiple-choice" && question.options && (
        <RadioGroup
          onValueChange={onAnswerChange}
          value={currentAnswer as string}
          className="space-y-2"
        >
          {question.options.map((option, index) => (
            <Label
              key={index}
              className={`flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50 ${
                currentAnswer === option
                  ? "bg-accent border-accent-foreground/50"
                  : ""
              }`}
            >
              <RadioGroupItem value={option} id={`q${question.id}-o${index}`} />
              <span>{option}</span>
            </Label>
          ))}
        </RadioGroup>
      )}
      {question.type === "text" && (
        <div>
          <Label htmlFor={`q${question.id}-text-input`} className="sr-only">Your Answer</Label>
          <Textarea
            id={`q${question.id}-text-input`}
            placeholder="Type your answer here..."
            value={currentAnswer as string || ""}
            onChange={(e) => onAnswerChange(e.target.value)}
            rows={8}
            className="text-base"
          />
        </div>
      )}
    </div>
  );
}
