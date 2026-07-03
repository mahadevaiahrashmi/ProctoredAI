"use client";

import { useState, useEffect, useRef } from "react";
import { Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FloatingCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function setupCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Unmounted before the camera was ready — release it immediately.
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } else {
            setHasCameraPermission(false);
        }
      } catch (err) {
        console.error("Camera setup failed:", err);
        setHasCameraPermission(false);
      }
    }

    setupCamera();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!hasCameraPermission) {
    return null; // Don't render anything if camera access is denied or unavailable
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-48 md:w-64">
      <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted shadow-lg">
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
      </div>
    </div>
  );
}
