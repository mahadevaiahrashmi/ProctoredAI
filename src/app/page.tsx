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
  VideoOff,
  ShieldAlert,
  Lock,
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
import { generateExamAction, getProviderCapabilitiesAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type PermissionState = "prompt" | "granted" | "denied";

// Bump when the proctoring privacy notice text materially changes, so a recorded
// consent can be traced to the exact notice version the user agreed to.
const PROCTORING_NOTICE_VERSION = "v1";

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
  const [proctoringConsent, setProctoringConsent] = useState(false);

  // Whether the active AI provider can analyze webcam frames. When false (e.g.
  // a text-only Ollama model), proctoring is impossible and only the
  // unproctored path is offered. `null` while the capability check is in flight.
  const [visionSupported, setVisionSupported] = useState<boolean | null>(null);

  useEffect(() => {
    getProviderCapabilitiesAction()
      .then(caps => setVisionSupported(caps.vision))
      .catch(() => setVisionSupported(true)); // assume capable if the check fails
  }, []);

  // Record whether this session is proctored, then proceed to the exam. For a
  // proctored session we also persist a consent record (when the user agreed and
  // which notice version they saw) so it can be surfaced as an audit trail.
  const startExam = useCallback(
    (proctored: boolean) => {
      const config = proctored
        ? {
            proctored: true,
            consent: {
              acceptedAt: new Date().toISOString(),
              noticeVersion: PROCTORING_NOTICE_VERSION,
            },
          }
        : { proctored: false };
      sessionStorage.setItem("examConfig", JSON.stringify(config));
      router.push("/exam");
    },
    [router]
  );

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
    // Only ask for camera/mic when proctoring is actually available for the
    // active provider. On text-only providers we go straight to unproctored.
    if (step === 2 && visionSupported) {
      requestPermissions();
    }
  }, [step, visionSupported, requestPermissions]);

  const allPermissionsGranted =
    cameraPermission === "granted" && micPermission === "granted";
  const permissionsDenied =
    cameraPermission === "denied" || micPermission === "denied";

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

            {step === 2 && visionSupported === false && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-center">System Check</h3>
                <Alert>
                  <ShieldAlert className="h-5 w-5" />
                  <AlertTitle>Proctoring unavailable</AlertTitle>
                  <AlertDescription>
                    The configured AI provider cannot analyze webcam video, so
                    this exam will run <strong>unproctored</strong>. Your results
                    will be clearly labeled as taken without proctoring.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {step === 2 && visionSupported !== false && (
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
                {permissionsDenied ? (
                  <Alert>
                    <ShieldAlert className="h-5 w-5" />
                    <AlertTitle>Camera/microphone blocked</AlertTitle>
                    <AlertDescription>
                      Proctoring needs both permissions. Enable them in your
                      browser settings and refresh, or continue without
                      proctoring &mdash; your results will be labeled as
                      unproctored.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-3">
                  <div className="space-y-2 rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Lock className="h-4 w-4" /> Privacy notice
                    </div>
                    <p>
                      During a proctored exam your webcam is sampled about every
                      1.5&nbsp;seconds, and each snapshot is sent to the
                      configured AI provider for automated proctoring analysis.
                      ProctoredAI does not store these snapshots &mdash; there is
                      no server-side database &mdash; and they are used only to
                      flag possible violations, processed under the
                      provider&apos;s own privacy policy. You can decline and take
                      the exam unproctored instead.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <Checkbox
                      id="proctoring-consent"
                      checked={proctoringConsent}
                      onCheckedChange={(v) => setProctoringConsent(v === true)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="proctoring-consent"
                      className="cursor-pointer text-sm font-normal leading-snug"
                    >
                      I consent to webcam monitoring for this exam, including
                      sending periodic snapshots to the AI provider for
                      proctoring.
                    </Label>
                  </div>
                </div>
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
            {step === 2 && visionSupported === false && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => startExam(false)}
              >
                <VideoOff /> Start Unproctored Exam
              </Button>
            )}
            {step === 2 && visionSupported !== false && (
              <div className="flex w-full flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => startExam(true)}
                  disabled={!allPermissionsGranted || !proctoringConsent}
                >
                  {!allPermissionsGranted
                    ? "Waiting for Permissions..."
                    : !proctoringConsent
                      ? "Consent Required to Proctor"
                      : "Start Proctored Exam"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => startExam(false)}
                >
                  <VideoOff /> Take Without Camera (Unproctored)
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
