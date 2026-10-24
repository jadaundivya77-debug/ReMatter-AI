import React, { useRef, useState, useEffect } from "react";
import {
  DetectionItem,
  WorkspaceMode,
  CameraStatus,
} from "@/lib/types";
import {
  Video,
  Upload,
  Camera,
  Scan,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

interface ViewportProps {
  mode: WorkspaceMode;
  cameraStatus: CameraStatus;
  errorMessage?: string | null;
  stream?: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  uploadedImageUrl: string | null;
  detections: DetectionItem[];
  selectedDetection: DetectionItem | null;
  onSelectDetection: (det: DetectionItem | null) => void;
  onStartCamera: () => void;
  onTriggerUpload: () => void;
  onSelectFile?: (file: File) => void;
  onSelectSample?: (sampleUrl: string, sampleName: string) => void;
  isAnalyzing: boolean;
}

export const Viewport: React.FC<ViewportProps> = ({
  mode,
  cameraStatus,
  errorMessage,
  stream,
  videoRef,
  canvasRef,
  uploadedImageUrl,
  detections,
  selectedDetection,
  onSelectDetection,
  onStartCamera,
  onTriggerUpload,
  onSelectFile,
  onSelectSample,
  isAnalyzing,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [contentAspect, setContentAspect] = useState<number>(16 / 9);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Keep video element attached to live media stream
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && cameraStatus === "streaming") {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch((playErr) => {
          console.warn("Video play error on stream update:", playErr);
        });
      }
    }
  }, [stream, cameraStatus, videoRef]);

  // Handle uploaded image load to match aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setContentAspect(img.naturalWidth / img.naturalHeight);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/") && onSelectFile) {
        onSelectFile(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onSelectFile) {
      onSelectFile(e.target.files[0]);
    }
  };

  const getStatusBorder = (recyclability?: string, isSelected?: boolean) => {
    if (isSelected) {
      return {
        border: "border-emerald-400 ring-4 ring-emerald-500/40 z-30 shadow-lg",
        bg: "bg-emerald-500/20",
        tag: "bg-[#18181B] text-emerald-300 border border-emerald-400 shadow-md",
      };
    }

    switch (recyclability) {
      case "Recyclable":
        return {
          border: "border-emerald-500 hover:border-emerald-400 z-10",
          bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
          tag: "bg-emerald-800 text-white border border-emerald-600/60 shadow-xs",
        };
      case "Conditionally recyclable":
        return {
          border: "border-sky-500 hover:border-sky-400 z-10",
          bg: "bg-sky-500/10 hover:bg-sky-500/20",
          tag: "bg-sky-800 text-white border border-sky-600/60 shadow-xs",
        };
      case "Reusable":
        return {
          border: "border-indigo-500 hover:border-indigo-400 z-10",
          bg: "bg-indigo-500/10 hover:bg-indigo-500/20",
          tag: "bg-indigo-800 text-white border border-indigo-600/60 shadow-xs",
        };
      case "Compostable":
        return {
          border: "border-lime-500 hover:border-lime-400 z-10",
          bg: "bg-lime-500/10 hover:bg-lime-500/20",
          tag: "bg-lime-800 text-white border border-lime-600/60 shadow-xs",
        };
      case "Special handling required":
      case "Special handling":
        return {
          border: "border-amber-500 hover:border-amber-400 z-10",
          bg: "bg-amber-500/10 hover:bg-amber-500/20",
          tag: "bg-amber-800 text-white border border-amber-600/60 shadow-xs",
        };
      case "Generally non-recyclable":
      case "Non-recyclable":
        return {
          border: "border-rose-500 hover:border-rose-400 z-10",
          bg: "bg-rose-500/10 hover:bg-rose-500/20",
          tag: "bg-rose-800 text-white border border-rose-600/60 shadow-xs",
        };
      default:
        return {
          border: "border-zinc-400 hover:border-zinc-300 z-10",
          bg: "bg-zinc-500/10 hover:bg-zinc-500/20",
          tag: "bg-zinc-800 text-white border border-zinc-700 shadow-xs",
        };
    }
  };

  const isLiveActive = mode === "live" && cameraStatus === "streaming";
  const isImageActive = mode === "upload" && !!uploadedImageUrl;
  const hasActiveContent = isLiveActive || isImageActive;

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 bg-[#121316] overflow-hidden flex items-center justify-center select-none transition-colors ${
        isDragOver ? "ring-4 ring-emerald-500 bg-zinc-900" : ""
      }`}
      onClick={() => onSelectDetection(null)}
    >
      {/* Hidden file input for native device upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Subtle alignment crosshair grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Floating Viewport Controls Header when Content is Active */}
      {hasActiveContent && (
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {isAnalyzing ? (
              <div className="flex items-center gap-2 bg-[#18181B]/95 backdrop-blur-md border border-blue-500/60 px-3 py-1 rounded-lg text-white text-xs font-mono shadow-md">
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Analyzing waste...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#18181B]/85 backdrop-blur-md border border-zinc-700 px-3 py-1 rounded-lg text-white text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-semibold">{detections.length} Waste Items Detected</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New Image</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Video / Image Frame Wrapper */}
      {hasActiveContent ? (
        <div
          className="relative max-w-full max-h-full flex items-center justify-center"
          style={{
            aspectRatio: contentAspect,
            width: "auto",
            height: "auto",
          }}
        >
          {/* Live Video */}
          {mode === "live" && (
            <video
              ref={(el) => {
                if (videoRef) {
                  (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                }
                if (el && stream && el.srcObject !== stream) {
                  el.srcObject = stream;
                  el.play().catch((playErr) => {
                    console.warn("Video play on ref attach interrupted:", playErr);
                  });
                }
              }}
              playsInline
              autoPlay
              muted
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth > 0 && v.videoHeight > 0) {
                  setContentAspect(v.videoWidth / v.videoHeight);
                }
              }}
              className="w-full h-full object-fill rounded-xs shadow-md"
            />
          )}

          {/* Uploaded Image */}
          {mode === "upload" && uploadedImageUrl && (
            <img
              src={uploadedImageUrl}
              alt="Analyzed target waste preview"
              onLoad={handleImageLoad}
              className="w-full h-full object-fill rounded-xs shadow-md"
            />
          )}

          {/* Precision Normalized Overlays Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {detections.map((detection, idx) => {
              const isSelected = selectedDetection?.id === detection.id;
              const styles = getStatusBorder(
                detection.intelligence?.recyclability_state ||
                  detection.intelligence?.recyclability,
                isSelected
              );
              const bbox = detection.bbox;

              const topPct = bbox.y1 * 100;
              const leftPct = bbox.x1 * 100;
              const widthPct = bbox.width * 100;
              const heightPct = bbox.height * 100;

              const recState =
                detection.intelligence?.recyclability_state ||
                detection.intelligence?.recyclability ||
                "";
              let badgeLabel = "";
              let badgeEmoji = "";
              if (recState === "Recyclable") {
                badgeLabel = "Recyclable";
                badgeEmoji = "♻️";
              } else if (recState === "Conditionally recyclable") {
                badgeLabel = "Conditional";
                badgeEmoji = "🔄";
              } else if (
                (recState as string) === "Generally non-recyclable" ||
                (recState as string) === "Non-recyclable"
              ) {
                badgeLabel = "Trash / Non-Recyclable";
                badgeEmoji = "⛔";
              } else if (recState === "Compostable") {
                badgeLabel = "Compost";
                badgeEmoji = "🌱";
              } else if (recState === "Special handling required") {
                badgeLabel = "Special / E-Waste";
                badgeEmoji = "⚠️";
              } else if (recState === "Reusable") {
                badgeLabel = "Reusable";
                badgeEmoji = "🔁";
              }

              return (
                <div
                  key={`${detection.id}-${idx}`}
                  style={{
                    top: `${topPct}%`,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDetection(detection);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select detected ${detection.class_name}`}
                  className={`absolute pointer-events-auto cursor-pointer border-2 rounded-xs transition-all duration-150 ${styles.border} ${styles.bg}`}
                >
                  {/* Corner registration marks */}
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

                  {/* Detection Label Pill */}
                  <div
                    className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap shadow-sm ${styles.tag}`}
                  >
                    <span className="capitalize font-bold">{detection.class_name}</span>
                    {badgeLabel && (
                      <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/40 text-[10px] font-bold">
                        <span>{badgeEmoji}</span>
                        <span>{badgeLabel}</span>
                      </span>
                    )}
                    <span className="text-[10px] opacity-80 font-mono">
                      {Math.round(detection.confidence * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Prominent Empty / Image Upload Screen */
        <div className="flex flex-col items-center justify-center text-center p-6 max-w-lg z-10 select-none">
          {mode === "live" && cameraStatus !== "idle" && (
            <div className="mb-4">
              {cameraStatus === "permission_denied" ? (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                  Camera permission was denied. Use image upload below instead!
                </div>
              ) : null}
            </div>
          )}

          {/* Direct Drag & Drop / Device Upload Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-8 border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl cursor-pointer transition-all space-y-3 group shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 group-hover:scale-105 transition-transform">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-white font-bold text-base tracking-tight mb-1">
                Upload Image From Device
              </h3>
              <p className="text-zinc-400 text-xs max-w-xs mx-auto leading-relaxed">
                Click to browse photo from your computer or drag and drop an image here (JPEG, PNG, WebP)
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all group-hover:bg-blue-500">
                <FolderOpen className="w-4 h-4" />
                <span>Browse Image from Device</span>
              </span>
            </div>
          </div>

          {/* Quick 1-Click Preset Samples */}
          {onSelectSample && (
            <div className="w-full mt-6 pt-5 border-t border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-3">
                Or Try One of These Sample Photos
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSample("/samples/desk_waste.jpg", "desk_waste");
                  }}
                  className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-left transition-all cursor-pointer group"
                >
                  <div className="w-full h-14 rounded-lg bg-zinc-950 overflow-hidden mb-1.5">
                    <img
                      src="/samples/desk_waste.jpg"
                      alt="Desk waste"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-semibold text-white block truncate">Desk Waste</span>
                  <span className="text-[10px] text-zinc-400 block truncate">Cup, Laptop, Apple</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSample("/samples/plastic_and_can.jpg", "plastic_and_can");
                  }}
                  className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-left transition-all cursor-pointer group"
                >
                  <div className="w-full h-14 rounded-lg bg-zinc-950 overflow-hidden mb-1.5">
                    <img
                      src="/samples/plastic_and_can.jpg"
                      alt="Plastic & Can"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-semibold text-white block truncate">Bottles & Cans</span>
                  <span className="text-[10px] text-zinc-400 block truncate">PET Plastic, Metal Can</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSample("/samples/apple_organic.jpg", "apple_organic");
                  }}
                  className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-left transition-all cursor-pointer group"
                >
                  <div className="w-full h-14 rounded-lg bg-zinc-950 overflow-hidden mb-1.5">
                    <img
                      src="/samples/apple_organic.jpg"
                      alt="Organic waste"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-semibold text-white block truncate">Organic Food</span>
                  <span className="text-[10px] text-zinc-400 block truncate">Compost Scraps</span>
                </button>
              </div>
            </div>
          )}

          {/* Alternative: Start Webcam Feed */}
          <div className="mt-4 pt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartCamera();
              }}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-blue-400" />
              <span>Or click here to start your Live Webcam feed</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
