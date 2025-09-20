"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Camera,
  Mic,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  FileText,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateExamAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PermissionState = "prompt" | "granted" | "denied";

export default function ExamInitiationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sessionPrompt, setSessionPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("");
  const [examTopic, setExamTopic] = useState("Quantum Physics");

  const [cameraPermission, setCameraPermission] =
    useState<PermissionState>("prompt");
  const [micPermission, setMicPermission] =
    useState<PermissionState>("prompt");

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !examTopic) {
      setError("Please enter both your name and an exam topic.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { examData, sessionPrompt } = await generateExamAction(
        examTopic,
        studentName
      );
      sessionStorage.setItem("examData", JSON.stringify(examData));
      setSessionPrompt(sessionPrompt);
      setStep(1);
    } catch (e) {
      setError("Failed to generate exam. Please try a different topic or try again later.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setCameraPermission("granted");
      setMicPermission("granted");
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Permission denied:", err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraPermission("denied");
          setMicPermission("denied");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (step === 2) {
      requestPermissions();
    }
  }, [step, requestPermissions]);

  const allPermissionsGranted =
    cameraPermission === "granted" && micPermission === "granted";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl">
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Proctored Exam Setup</CardTitle>
              <CardDescription className="mt-2">
                Follow the steps to begin your exam securely.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 0 && (
                <form onSubmit={handleGenerateExam} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="student-name" className="flex items-center gap-2"><User /> Your Name</Label>
                        <Input 
                            id="student-name"
                            value={studentName}
                            onChange={e => setStudentName(e.target.value)}
                            placeholder="e.g. Alex Doe"
                            required
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="exam-topic" className="flex items-center gap-2"><FileText /> Exam Topic</Label>
                        <Input 
                            id="exam-topic"
                            value={examTopic}
                            onChange={e => setExamTopic(e.target.value)}
                            placeholder="e.g. Quantum Physics, World History"
                            required
                        />
                     </div>
                </form>
            )}

            {step === 1 && (
              <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                <h3 className="font-semibold text-lg text-center">Instructions</h3>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {sessionPrompt}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-center">System Check</h3>
                <p className="text-muted-foreground text-center">
                  We need to access your camera and microphone for proctoring.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between rounded-md border p-4">
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-primary" />
                      <span className="font-medium">Camera Access</span>
                    </div>
                    {cameraPermission === "prompt" && <Loader2 className="h-5 w-5 animate-spin" />}
                    {cameraPermission === "granted" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {cameraPermission === "denied" && <XCircle className="h-5 w-5 text-destructive" />}
                  </li>
                  <li className="flex items-center justify-between rounded-md border p-4">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-primary" />
                      <span className="font-medium">Microphone Access</span>
                    </div>
                    {micPermission === "prompt" && <Loader2 className="h-5 w-5 animate-spin" />}
                    {micPermission === "granted" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {micPermission === "denied" && <XCircle className="h-5 w-5 text-destructive" />}
                  </li>
                </ul>
                {cameraPermission === "denied" || micPermission === "denied" ? (
                  <Alert variant="destructive">
                    <AlertTitle>Permissions Required</AlertTitle>
                    <AlertDescription>
                      You must grant both camera and microphone permissions to start the exam. Please enable them in your browser settings and refresh the page.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {step === 0 && (
                <Button
                size="lg"
                className="w-full"
                type="submit"
                form="exam-generation-form"
                onClick={handleGenerateExam}
                disabled={loading || !studentName || !examTopic}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Generate Exam & Proceed <ChevronRight />
                  </>
                )}
              </Button>
            )}
            {step === 1 && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={loading || !!error}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Start System Check <ChevronRight />
                  </>
                )}
              </Button>
            )}
            {step === 2 && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push("/exam")}
                disabled={!allPermissionsGranted}
              >
                {allPermissionsGranted ? "Start Exam" : "Waiting for Permissions..."}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
