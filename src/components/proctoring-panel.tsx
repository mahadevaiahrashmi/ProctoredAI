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

type ProctoringStatus = "secure" | "violation" | "initializing";

const VIOLATION_CHECK_INTERVAL_MS = 8000; // Check for violations every 8 seconds

export default function ProctoringPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<ProctoringStatus>("initializing");
  const [violations, setViolations] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

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
          const timestamp = new Date().toLocaleTimeString();
          setViolations((prev) => [
            ...prev,
            ...newViolations.map((v) => `${timestamp}: ${v}`),
          ]);
          setStatus("violation");
        } else {
           // If no new violations, and there were previous violations, we can keep the status as violation. 
           // If you want it to return to secure, uncomment the next line.
           // if (violations.length === 0) setStatus("secure");
        }
      } catch (error) {
        console.error("Failed to check for violations", error);
      } finally {
        setIsProcessing(false);
      }
    } else {
        setIsProcessing(false);
    }
  }, [isProcessing]);


  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // Audio processed separately if needed
        });
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
  }, []);

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
    status === "secure" ? ShieldCheck : AlertTriangle;
  const statusColor =
    status === "secure" ? "text-green-500" : "text-destructive";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Proctoring Status</span>
          {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
            <span className={`font-semibold ${statusColor}`}>
                {status === 'secure' && 'System Secure'}
                {status === 'violation' && 'Potential Violation Detected'}
                {status === 'initializing' && 'Initializing...'}
            </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
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
        <div className="flex-1 overflow-hidden">
            <h3 className="mb-2 font-semibold">Violation Log</h3>
            <ScrollArea className="h-full rounded-md border p-2">
            {violations.length > 0 ? (
                <ul className="space-y-2 text-sm">
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
      </CardContent>
    </Card>
  );
}
