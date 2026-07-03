"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Video,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detectViolationsAction } from "@/app/actions";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

type ProctoringStatus = "secure" | "violation" | "initializing";

const VIOLATION_CHECK_INTERVAL_MS = 1500; // Check for violations every 1.5 seconds

// Suppress repeat log entries for the same violation within this window so a
// persistent condition (e.g. a phone in frame) doesn't flood the log each tick.
const VIOLATION_LOG_COOLDOWN_MS = 30000;

// Returns the violation messages not seen within the cooldown window, recording
// each returned message's time in `lastLoggedAt` (mutated in place) so the next
// tick can suppress it. This is what keeps a persistent condition to one entry.
export function selectFreshViolations(
  messages: string[],
  lastLoggedAt: Record<string, number>,
  now: number,
  cooldownMs: number = VIOLATION_LOG_COOLDOWN_MS,
): string[] {
  const fresh = messages.filter(
    (m) => !(m in lastLoggedAt) || now - lastLoggedAt[m] >= cooldownMs,
  );
  for (const m of fresh) {
    lastLoggedAt[m] = now;
  }
  return fresh;
}

interface ProctoringPanelProps {
    violations: string[];
    setViolations: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ProctoringPanel({ violations, setViolations }: ProctoringPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<ProctoringStatus>("initializing");
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoggedAtRef = useRef<Record<string, number>>({});

  const captureFrameAndCheckViolation = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      const imageDataUri = canvas.toDataURL("image/jpeg", 0.7);

      try {
        const newViolations = await detectViolationsAction(imageDataUri);
        if (newViolations && newViolations.length > 0) {
          const fresh = selectFreshViolations(
            newViolations,
            lastLoggedAtRef.current,
            Date.now(),
          );
          if (fresh.length > 0) {
            const timestamp = new Date().toLocaleTimeString();
            setViolations((prev) => [
              ...prev,
              ...fresh.map((v) => `${timestamp}: ${v}`),
            ]);
          }
          setStatus("violation");
        }
      } catch (error) {
        console.error("Failed to check for violations", error);
      } finally {
        setIsProcessing(false);
      }
    } else {
        setIsProcessing(false);
    }
  }, [isProcessing, setViolations]);


  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // Audio processed separately if needed
        });
        // Unmounted before the camera was ready — release it immediately.
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("secure");
      } catch (err) {
        console.error("Camera setup failed:", err);
        setStatus("violation");
        setViolations((prev) => [...prev, "Camera access denied or failed."]);
      }
    }

    setupCamera();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [setViolations]);

  useEffect(() => {
    if (status !== 'initializing') {
      intervalIdRef.current = setInterval(captureFrameAndCheckViolation, VIOLATION_CHECK_INTERVAL_MS);
    }
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [status, captureFrameAndCheckViolation]);


  const StatusIcon =
    status === "secure" && violations.length === 0 ? ShieldCheck : AlertTriangle;
  const statusColor =
    status === "secure" && violations.length === 0 ? "text-green-500" : "text-destructive";

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 left-2">
                <Badge variant="secondary">
                    <Video className="mr-1.5 h-3 w-3" />
                    Your Camera
                </Badge>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
      <Separator />
      <div className="p-4">
        <CardTitle className="flex items-center justify-between text-lg">
            <span>Proctoring Status</span>
            {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-1">
            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
            <span className={`font-semibold ${statusColor}`}>
                {status === 'secure' && violations.length === 0 && 'System Secure'}
                {(status === 'violation' || violations.length > 0) && 'Potential Violation Detected'}
                {status === 'initializing' && 'Initializing...'}
            </span>
        </CardDescription>
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden p-4">
            <h3 className="mb-2 font-semibold text-lg">Violation Log</h3>
            <ScrollArea className="h-full rounded-md border p-2 bg-muted/50">
            {violations.length > 0 ? (
                <ul className="space-y-2 text-sm p-2">
                {violations.map((violation, index) => (
                    <li key={index} className="text-destructive flex gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{violation}</span>
                    </li>
                ))}
                </ul>
            ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    <p>No violations detected yet.</p>
                </div>
            )}
            </ScrollArea>
        </div>
    </div>
  );
}
