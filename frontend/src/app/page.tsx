"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { CameraControls } from "@/components/CameraControls";
import { Viewport } from "@/components/Viewport";
import { InspectorPanel } from "@/components/InspectorPanel";
import { HistoryStrip } from "@/components/HistoryStrip";
import { UploadModal } from "@/components/UploadModal";
import { CategoriesModal } from "@/components/CategoriesModal";
import { GeminiModal } from "@/components/GeminiModal";
import { WasteWiseDashboard } from "@/components/WasteWiseDashboard";
import { SystemGuideModal } from "@/components/SystemGuideModal";
import { useCamera } from "@/lib/useCamera";
import {
  analyzeLiveFrame,
  analyzeImageFile,
  getBackendHealth,
  getCategories,
} from "@/lib/api";
import {
  DetectionItem,
  DetectionHistoryItem,
  HealthResponse,
  SupportedCategory,
  WorkspaceMode,
  MainNavTab,
} from "@/lib/types";

function ensureUniqueDetectionIds(detections: DetectionItem[]): DetectionItem[] {
  const usedIds = new Set<string>();

  return detections.map((detection) => {
    const baseId = detection.id;
    let id = baseId;
    let duplicateIndex = 1;
    while (usedIds.has(id)) {
      id = `${baseId}_${duplicateIndex}`;
      duplicateIndex += 1;
    }
    usedIds.add(id);
    return id === detection.id ? detection : { ...detection, id };
  });
}

export default function WorkspacePage() {
  // Modes & Status
  const [mainTab, setMainTab] = useState<MainNavTab>("analytics");
  const [mode, setMode] = useState<WorkspaceMode>("upload");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [categories, setCategories] = useState<SupportedCategory[]>([]);
  const [confidence, setConfidence] = useState<number>(0.35);
  const [iouThreshold, setIouThreshold] = useState<number>(0.45);
  const [intervalMs, setIntervalMs] = useState<number>(300);
  const [smoothingEnabled, setSmoothingEnabled] = useState<boolean>(true);

  // Detections & Inspector
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [selectedDetection, setSelectedDetection] =
    useState<DetectionItem | null>(null);
  const [history, setHistory] = useState<DetectionHistoryItem[]>([]);
  const [inferenceLatency, setInferenceLatency] = useState<number | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Uploaded Image State
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Camera hook
  const {
    videoRef,
    status: cameraStatus,
    errorMessage: cameraError,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    startStream,
    stopStream,
    captureFrame,
    stream,
  } = useCamera({ idealWidth: 1280, idealHeight: 720, facingMode: "environment" });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isAnalyzingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamLoopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Frame sequencing & temporal smoothing refs
  const frameSeqRef = useRef<number>(0);
  const lastProcessedFrameIdRef = useRef<number>(0);
  const prevDetectionsRef = useRef<DetectionItem[]>([]);

  // Calculate Intersection-over-Union (IoU) for normalized bounding boxes
  const calculateBoxIoU = useCallback(
    (b1: { x1: number; y1: number; x2: number; y2: number; width: number; height: number },
     b2: { x1: number; y1: number; x2: number; y2: number; width: number; height: number }) => {
      const x1 = Math.max(b1.x1, b2.x1);
      const y1 = Math.max(b1.y1, b2.y1);
      const x2 = Math.min(b1.x2, b2.x2);
      const y2 = Math.min(b1.y2, b2.y2);
      const interArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
      const b1Area = Math.max(0, b1.width) * Math.max(0, b1.height);
      const b2Area = Math.max(0, b2.width) * Math.max(0, b2.height);
      const unionArea = b1Area + b2Area - interArea;
      return unionArea > 0 ? interArea / unionArea : 0;
    },
    []
  );

  // Load Categories & Health on mount
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const h = await getBackendHealth();
        if (isMounted) setHealth(h);
      } catch {
        if (isMounted) {
          setHealth({
            status: "offline",
            app_name: "ReMatter AI",
            version: "1.0.0",
            model_loaded: false,
            model_name: "yolov8n.pt",
            device: "unknown",
            supported_classes_count: 0,
          });
        }
      }
    };

    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        if (isMounted) setCategories(cats);
      } catch (err) {
        console.warn("Could not load categories catalog", err);
      }
    };

    checkHealth();
    loadCategories();

    const healthInterval = setInterval(checkHealth, 10000);

    return () => {
      isMounted = false;
      clearInterval(healthInterval);
    };
  }, []);

  // Sync isAnalyzing state to ref
  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  // Append new detections to history strip (deduplicated by recent class within 3 seconds)
  const appendDetectionsToHistory = useCallback(
    (newDetections: DetectionItem[], source: "webcam" | "upload") => {
      if (newDetections.length === 0) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setHistory((prev) => {
        const recent = prev.slice(0, 30);
        const toAdd: DetectionHistoryItem[] = [];

        newDetections.forEach((det, idx) => {
          const isDuplicate = recent.some(
            (item) =>
              item.detection.class_name === det.class_name &&
              item.source === source &&
              Math.abs(item.detection.confidence - det.confidence) < 0.05
          );

          if (!isDuplicate) {
            toAdd.push({
              id: `${det.id}_${Date.now()}_${idx}`,
              timestamp: timeStr,
              source,
              detection: det,
            });
          }
        });

        return [...toAdd, ...prev].slice(0, 50);
      });
    },
    []
  );

  // Live video frame processing loop with out-of-order drop and temporal smoothing
  const processFrame = useCallback(async () => {
    if (
      mode !== "live" ||
      cameraStatus !== "streaming" ||
      !canvasRef.current ||
      isAnalyzingRef.current
    ) {
      return;
    }

    const frameBase64 = captureFrame(canvasRef.current, 0.85);
    if (!frameBase64) return;

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    const currentFrameId = ++frameSeqRef.current;
    abortControllerRef.current = new AbortController();

    try {
      const response = await analyzeLiveFrame(
        frameBase64,
        confidence,
        abortControllerRef.current.signal,
        currentFrameId,
        iouThreshold
      );

      // Prevent stale out-of-order responses from overwriting newer video state
      if (
        response.frame_id !== undefined &&
        response.frame_id < lastProcessedFrameIdRef.current
      ) {
        return;
      }
      lastProcessedFrameIdRef.current = response.frame_id ?? currentFrameId;

      // Apply Temporal Exponential Moving Average (EMA) box smoothing to eliminate visual jitter
      let finalDetections = ensureUniqueDetectionIds(response.detections);
      if (smoothingEnabled && prevDetectionsRef.current.length > 0) {
        finalDetections = response.detections.map((det) => {
          const match = prevDetectionsRef.current.find(
            (prev) =>
              prev.class_name === det.class_name &&
              calculateBoxIoU(prev.bbox, det.bbox) > 0.45
          );

          if (match) {
            // 75% new box, 25% previous box smooth interpolation
            const alpha = 0.75;
            const sX1 = alpha * det.bbox.x1 + (1 - alpha) * match.bbox.x1;
            const sY1 = alpha * det.bbox.y1 + (1 - alpha) * match.bbox.y1;
            const sX2 = alpha * det.bbox.x2 + (1 - alpha) * match.bbox.x2;
            const sY2 = alpha * det.bbox.y2 + (1 - alpha) * match.bbox.y2;
            return {
              ...det,
              bbox: {
                ...det.bbox,
                x1: Math.round(sX1 * 10000) / 10000,
                y1: Math.round(sY1 * 10000) / 10000,
                x2: Math.round(sX2 * 10000) / 10000,
                y2: Math.round(sY2 * 10000) / 10000,
                width: Math.round((sX2 - sX1) * 10000) / 10000,
                height: Math.round((sY2 - sY1) * 10000) / 10000,
              },
            };
          }
          return det;
        });
      }

      prevDetectionsRef.current = finalDetections;
      setDetections(finalDetections);
      setInferenceLatency(response.inference_time_ms);

      // Auto-select top detection if none currently selected
      if (finalDetections.length > 0) {
        setSelectedDetection((current) => {
          if (!current) return finalDetections[0];
          const matching = finalDetections.find(
            (d) => d.class_name === current.class_name
          );
          return matching || finalDetections[0];
        });
      }

      appendDetectionsToHistory(finalDetections, "webcam");
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        console.warn("Frame analysis error:", err);
      }
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [
    mode,
    cameraStatus,
    confidence,
    iouThreshold,
    smoothingEnabled,
    captureFrame,
    calculateBoxIoU,
    appendDetectionsToHistory,
  ]);

  // Cadence scheduler for video frames with user-configurable interval
  useEffect(() => {
    if (mode === "live" && cameraStatus === "streaming") {
      const scheduleNext = () => {
        streamLoopTimerRef.current = setTimeout(async () => {
          await processFrame();
          scheduleNext();
        }, Math.max(intervalMs, 1000));
      };

      scheduleNext();

      return () => {
        if (streamLoopTimerRef.current) {
          clearTimeout(streamLoopTimerRef.current);
          streamLoopTimerRef.current = null;
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [mode, cameraStatus, processFrame, intervalMs]);

  // Core uploaded image analyzer
  const analyzeUploadedFile = useCallback(
    async (file: File, conf: number) => {
      setIsAnalyzing(true);
      try {
        const response = await analyzeImageFile(file, conf);
        const detections = ensureUniqueDetectionIds(response.detections);
        setDetections(detections);
        setInferenceLatency(response.inference_time_ms);

        if (detections.length > 0) {
          setSelectedDetection(detections[0]);
        } else {
          setSelectedDetection(null);
        }

        appendDetectionsToHistory(detections, "upload");
      } catch (err) {
        console.error("Uploaded image analysis failed", err);
        alert(
          err instanceof Error
            ? err.message
            : "Failed to analyze uploaded image. Please ensure backend is running."
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [appendDetectionsToHistory]
  );

  // Handle uploaded file selection (sets up preview and triggers first analysis)
  const handleFileAnalysis = useCallback(
    (file: File) => {
      setUploadedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setUploadedImageUrl(objectUrl);
      setMode("upload");
      stopStream();
      analyzeUploadedFile(file, confidence);
    },
    [confidence, stopStream, analyzeUploadedFile]
  );

  // Re-run image analysis only when threshold slider actually changes in upload mode
  const prevConfidenceRef = useRef<number>(confidence);
  useEffect(() => {
    if (mode === "upload" && uploadedFile && prevConfidenceRef.current !== confidence) {
      prevConfidenceRef.current = confidence;
      const timer = setTimeout(() => {
        analyzeUploadedFile(uploadedFile, confidence);
      }, 350);
      return () => clearTimeout(timer);
    }
    prevConfidenceRef.current = confidence;
  }, [confidence, mode, uploadedFile, analyzeUploadedFile]);

  // Manual refresh / rescan trigger
  const handleRefreshDetection = () => {
    if (mode === "live" && cameraStatus === "streaming") {
      processFrame();
    } else if (mode === "upload" && uploadedFile) {
      handleFileAnalysis(uploadedFile);
    }
  };

  // Mode switching
  const handleModeChange = (newMode: WorkspaceMode) => {
    if (newMode === mode) return;

    if (newMode === "upload") {
      stopStream();
      setMode("upload");
    } else {
      setMode("live");
      startStream();
    }
  };

  const handleSelectSample = useCallback(
    (sampleUrl: string, sampleName: string) => {
      fetch(sampleUrl)
        .then((r) => r.blob())
        .then((b) => {
          const file = new File([b], `${sampleName}.jpg`, {
            type: "image/jpeg",
          });
          handleFileAnalysis(file);
        })
        .catch((err) => console.error("Could not load sample", err));
    },
    [handleFileAnalysis]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F7F8FA] text-[#18181B]">
      {/* Slim Top Navigation Header */}
      <Header
        mainTab={mainTab}
        onMainTabChange={(tab) => {
          if (tab === "analytics") {
            stopStream();
          }
          setMainTab(tab);
        }}
        mode={mode}
        onModeChange={handleModeChange}
        health={health}
        cameraStatus={cameraStatus}
        onOpenCategoriesModal={() => setIsCategoriesModalOpen(true)}
        onOpenGeminiModal={() => setIsGeminiModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
      />

      {/* Main Workspace Body */}
      {mainTab === "analytics" ? (
        <WasteWiseDashboard
          onSwitchToVision={() => {
            setMainTab("vision");
            setMode("upload");
          }}
          onOpenGuide={() => setIsGuideModalOpen(true)}
        />
      ) : (
        /* Vision Studio Body: Viewport + Inspector */
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Left Column: Controls + Viewport + History */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {/* Studio Controls Toolbar */}
            <CameraControls
              mode={mode}
              status={cameraStatus}
              onStart={startStream}
              onStop={stopStream}
              onTriggerUpload={() => setIsUploadModalOpen(true)}
              onRefreshDetection={handleRefreshDetection}
              onClearHistory={() => setHistory([])}
              confidence={confidence}
              onConfidenceChange={setConfidence}
              iouThreshold={iouThreshold}
              onIouChange={setIouThreshold}
              intervalMs={intervalMs}
              onIntervalChange={setIntervalMs}
              smoothingEnabled={smoothingEnabled}
              onSmoothingToggle={() => setSmoothingEnabled((prev) => !prev)}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onDeviceChange={setSelectedDeviceId}
              detectionCount={detections.length}
              inferenceTimeMs={inferenceLatency}
              isThrottling={isAnalyzing}
            />

            {/* Central Camera / Image Viewport */}
            <Viewport
              mode={mode}
              cameraStatus={cameraStatus}
              errorMessage={cameraError}
              stream={stream}
              videoRef={videoRef}
              canvasRef={canvasRef}
              uploadedImageUrl={uploadedImageUrl}
              detections={detections}
              selectedDetection={selectedDetection}
              onSelectDetection={setSelectedDetection}
              onStartCamera={startStream}
              onTriggerUpload={() => setIsUploadModalOpen(true)}
              onSelectFile={handleFileAnalysis}
              onSelectSample={handleSelectSample}
              isAnalyzing={isAnalyzing}
            />

            {/* Bottom History Filmstrip */}
            <HistoryStrip
              history={history}
              onSelectHistoryItem={(det) => setSelectedDetection(det)}
              onClearHistory={() => setHistory([])}
              selectedId={selectedDetection?.id}
            />
          </div>

          {/* Compact Right Column: Waste Inspector Panel */}
          <InspectorPanel
            selectedDetection={selectedDetection}
            onClearSelection={() => setSelectedDetection(null)}
            allDetections={detections}
            onSelectDetection={setSelectedDetection}
            onTriggerUpload={() => setIsUploadModalOpen(true)}
          />
        </main>
      )}

      {/* Upload Image Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSelectFile={handleFileAnalysis}
        onSelectSample={handleSelectSample}
      />

      {/* Waste Categories & Guidelines Modal */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
      />

      {/* ReMatter Custom Waste-YOLO Neural Core Modal */}
      <GeminiModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onKeyConnected={() => {
          getBackendHealth().then((h) => setHealth(h)).catch(() => {});
          if (uploadedFile) {
            handleFileAnalysis(uploadedFile);
          }
        }}
      />

      {/* System Guide & Feature Explanation Modal */}
      <SystemGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onSwitchToTab={(tab) => {
          setMainTab(tab);
          if (tab === "vision") setMode("upload");
        }}
      />
    </div>
  );
}
