import React from "react";
import {
  Play,
  Square,
  RefreshCw,
  Sliders,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";
import { CameraStatus, WorkspaceMode } from "@/lib/types";

interface CameraControlsProps {
  mode: WorkspaceMode;
  status: CameraStatus;
  onStart: () => void;
  onStop: () => void;
  onTriggerUpload: () => void;
  onRefreshDetection: () => void;
  onClearHistory: () => void;
  confidence: number;
  onConfidenceChange: (val: number) => void;
  iouThreshold?: number;
  onIouChange?: (val: number) => void;
  intervalMs?: number;
  onIntervalChange?: (val: number) => void;
  smoothingEnabled?: boolean;
  onSmoothingToggle?: () => void;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (id: string) => void;
  detectionCount: number;
  inferenceTimeMs?: number;
  isThrottling?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  mode,
  status,
  onStart,
  onStop,
  onTriggerUpload,
  onRefreshDetection,
  onClearHistory,
  confidence,
  onConfidenceChange,
  iouThreshold = 0.45,
  onIouChange,
  intervalMs = 300,
  onIntervalChange,
  smoothingEnabled = true,
  onSmoothingToggle,
  devices,
  selectedDeviceId,
  onDeviceChange,
  detectionCount,
  inferenceTimeMs,
  isThrottling,
}) => {
  const isStreaming = status === "streaming";
  const isRequesting = status === "requesting_permission";

  return (
    <div className="bg-white border-b border-[#E4E4E7] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      {/* Primary Action Buttons */}
      <div className="flex items-center gap-1.5">
        {mode === "live" ? (
          !isStreaming ? (
            <button
              id="camera-start-btn"
              type="button"
              onClick={onStart}
              disabled={isRequesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18181B] hover:bg-zinc-800 active:bg-zinc-950 text-white font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {isRequesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isRequesting ? "Connecting..." : "Start Camera"}</span>
            </button>
          ) : (
            <button
              id="camera-stop-btn"
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Camera</span>
            </button>
          )
        ) : (
          <button
            id="upload-image-control-btn"
            type="button"
            onClick={onTriggerUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18181B] hover:bg-zinc-800 text-white font-medium transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        )}

        {/* Rescan / Refresh Button */}
        <button
          id="refresh-detection-btn"
          type="button"
          onClick={onRefreshDetection}
          disabled={isThrottling}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E4E4E7] hover:bg-zinc-50 text-[#18181B] transition-colors disabled:opacity-50"
          title="Force refresh inference on current frame"
          aria-label="Refresh detection"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#71717A] ${isThrottling ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Clear History Button */}
        <button
          id="clear-history-toolbar-btn"
          type="button"
          onClick={onClearHistory}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E4E4E7] hover:bg-rose-50 hover:border-rose-200 text-[#71717A] hover:text-rose-700 transition-colors"
          title="Clear detection history"
          aria-label="Clear detection history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear History</span>
        </button>

        {/* Device Switcher (if multiple cameras exist) */}
        {mode === "live" && devices.length > 1 && (
          <div className="flex items-center gap-1 border-l border-[#E4E4E7] pl-2">
            <Camera className="w-3.5 h-3.5 text-[#71717A]" />
            <select
              value={selectedDeviceId}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="bg-[#F7F8FA] border border-[#E4E4E7] rounded px-2 py-1 text-xs text-[#18181B] focus:outline-hidden focus:border-zinc-400"
            >
              <option value="">Default Camera</option>
              {devices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Threshold Slider & Telemetry */}
      <div className="flex items-center gap-3">
        {/* Confidence Threshold Slider */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#71717A]">
            <Sliders className="w-3 h-3 text-[#71717A]" />
            <span className="text-[11px] font-medium">Confidence:</span>
          </div>
          <input
            id="confidence-slider"
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={confidence}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-[#E4E4E7] rounded-lg appearance-none cursor-pointer accent-[#18181B]"
            aria-label="Confidence threshold"
          />
          <span className="font-mono text-[11px] text-[#18181B] w-7 font-medium">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* NMS IoU Overlap Slider */}
        {onIouChange && (
          <div className="hidden lg:flex items-center gap-1.5 border-l border-[#E4E4E7] pl-3">
            <span className="text-[11px] text-[#71717A]">NMS Overlap:</span>
            <input
              id="iou-slider"
              type="range"
              min={0.15}
              max={0.75}
              step={0.05}
              value={iouThreshold}
              onChange={(e) => onIouChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-[#E4E4E7] rounded-lg appearance-none cursor-pointer accent-[#18181B]"
              title="Non-Maximum Suppression (NMS) IoU overlap threshold for cluttered objects"
              aria-label="NMS overlap threshold"
            />
            <span className="font-mono text-[11px] text-[#18181B] w-6">
              {Math.round(iouThreshold * 100)}%
            </span>
          </div>
        )}

        {/* Inference Stream Cadence */}
        {mode === "live" && onIntervalChange && (
          <div className="hidden md:flex items-center gap-1 border-l border-[#E4E4E7] pl-3">
            <span className="text-[11px] text-[#71717A]">Cadence:</span>
            <select
              value={intervalMs}
              onChange={(e) => onIntervalChange(parseInt(e.target.value, 10))}
              className="bg-[#F7F8FA] border border-[#E4E4E7] rounded px-1.5 py-0.5 text-[11px] font-mono text-[#18181B]"
              title="Camera frame streaming interval in milliseconds"
            >
              <option value={180}>180ms (5.5 FPS)</option>
              <option value={280}>280ms (3.5 FPS)</option>
              <option value={400}>400ms (2.5 FPS)</option>
              <option value={600}>600ms (1.6 FPS)</option>
            </select>
          </div>
        )}

        {/* Temporal Box Smoothing Toggle */}
        {onSmoothingToggle && (
          <button
            type="button"
            onClick={onSmoothingToggle}
            className={`hidden xl:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              smoothingEnabled
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium"
                : "bg-zinc-100 text-zinc-500 border-zinc-200"
            }`}
            title="Temporal EMA box smoothing: reduces visual jitter across consecutive video frames"
          >
            <span>Smoothing</span>
            <span className="font-mono font-bold text-[10px]">{smoothingEnabled ? "ON" : "OFF"}</span>
          </button>
        )}

        {/* Live Telemetry */}
        <div className="flex items-center gap-2 border-l border-[#E4E4E7] pl-3">
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-[#71717A]">Objects:</span>
            <span
              className={`font-mono font-semibold px-1.5 py-0.2 rounded text-[11px] ${
                detectionCount > 0
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-zinc-100 text-[#71717A]"
              }`}
            >
              {detectionCount}
            </span>
          </div>

          {inferenceTimeMs !== undefined && (
            <div className="flex items-center gap-1 text-[11px] hidden sm:flex">
              <span className="text-[#71717A]">Latency:</span>
              <span className="font-mono text-[#18181B]">
                {inferenceTimeMs}ms
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
