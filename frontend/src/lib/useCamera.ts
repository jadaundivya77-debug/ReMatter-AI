import { useState, useRef, useCallback, useEffect } from "react";
import { CameraStatus } from "./types";

interface UseCameraOptions {
  idealWidth?: number;
  idealHeight?: number;
  facingMode?: "user" | "environment";
}

export function useCamera(options: UseCameraOptions = {}) {
  const {
    idealWidth = 1280,
    idealHeight = 720,
    facingMode = "environment",
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoInputs);
    } catch (e) {
      console.warn("Could not enumerate camera devices", e);
    }
  }, []);

  // Synchronize video element srcObject whenever status becomes streaming or video element mounts
  useEffect(() => {
    if (status === "streaming" && stream && videoRef.current) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((playErr) => {
          console.warn("Video play sync error:", playErr);
        });
      }
    }
  }, [status, stream]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, []);

  const startStream = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Camera access is not supported by this browser.");
      return;
    }

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setStatus("requesting_permission");
    setErrorMessage(null);

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: selectedDeviceId
        ? {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
          }
        : {
            facingMode: { ideal: facingMode },
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
          },
    };

    try {
      let activeStream: MediaStream;
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr) {
        console.warn("Retrying camera access with standard video constraints:", constraintErr);
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = activeStream;
      setStream(activeStream);

      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
        await videoRef.current.play().catch((playErr) => {
          console.warn("Autoplay was interrupted or pending", playErr);
        });
      }

      setStatus("streaming");
      await refreshDevices();
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setStatus("permission_denied");
          setErrorMessage(
            "Camera permission was denied. Please allow camera access in your browser address bar to analyze waste live."
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setStatus("not_found");
          setErrorMessage("No video camera device was found on this system.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setStatus("error");
          setErrorMessage("Camera is currently in use by another application or blocked by the OS.");
        } else {
          setStatus("error");
          setErrorMessage(`Camera error: ${err.message || err.name}`);
        }
      } else {
        setStatus("error");
        setErrorMessage("An unexpected error occurred while accessing the webcam.");
      }
    }
  }, [idealWidth, idealHeight, facingMode, selectedDeviceId, refreshDevices]);

  // Capture current video frame to base64 jpeg
  const captureFrame = useCallback(
    (canvas: HTMLCanvasElement, quality: number = 0.85): string | null => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        return null;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, vw, vh);
      return canvas.toDataURL("image/jpeg", quality);
    },
    []
  );

  // Clean up tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    startStream,
    stopStream,
    captureFrame,
    stream,
  };
}
