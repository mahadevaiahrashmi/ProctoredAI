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
import { generateExamSessionPrompt } from "@/ai/flows/generate-exam-session-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PermissionState = "prompt" | "granted" | "denied";

export default function ExamInitiationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sessionPrompt, setSessionPrompt] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cameraPermission, setCameraPermission] =
    useState<PermissionState>("prompt");
  const [micPermission, setMicPermission] =
    useState<PermissionState>("prompt");

  useEffect(() => {
    async function getSessionPrompt() {
      try {
        setLoadingPrompt(true);
        const { sessionStartPrompt } = await generateExamSessionPrompt({
          studentName: "Alex Doe",
          examName: "Introduction to Quantum Physics",
        });
        setSessionPrompt(sessionStartPrompt);
      } catch (e) {
        setError("Failed to load exam instructions. Please try again later.");
        console.error(e);
      } finally {
        setLoadingPrompt(false);
      }
    }
    getSessionPrompt();
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setCameraPermission("granted");
      setMicPermission("granted");
      // Stop tracks immediately as we only needed to check for permission
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Permission denied:", err);
      // Heuristic to guess which permission was denied.
      // This isn't foolproof but works for many cases.
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraPermission("denied");
          setMicPermission("denied");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (step === 1) {
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
              <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                <h3 className="font-semibold text-lg text-center">Instructions</h3>
                {loadingPrompt ? (
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

            {step === 1 && (
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
                onClick={() => setStep(1)}
                disabled={loadingPrompt || !!error}
              >
                {loadingPrompt ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Start System Check <ChevronRight />
                  </>
                )}
              </Button>
            )}
            {step === 1 && (
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
