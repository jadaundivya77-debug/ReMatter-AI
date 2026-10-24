import React from "react";
import { DetectionHistoryItem, DetectionItem } from "@/lib/types";
import { History, Trash2, Clock } from "lucide-react";

interface HistoryStripProps {
  history: DetectionHistoryItem[];
  onSelectHistoryItem: (det: DetectionItem) => void;
  onClearHistory: () => void;
  selectedId?: string;
}

export const HistoryStrip: React.FC<HistoryStripProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
  selectedId,
}) => {
  const getStatusDotColor = (recyclability?: string) => {
    switch (recyclability) {
      case "Recyclable":
        return "bg-emerald-500";
      case "Conditionally recyclable":
        return "bg-sky-500";
      case "Reusable":
        return "bg-indigo-500";
      case "Compostable":
        return "bg-lime-500";
      case "Needs verification":
        return "bg-amber-500";
      case "Special handling required":
      case "Special handling":
        return "bg-amber-500";
      case "Generally non-recyclable":
      case "Non-recyclable":
        return "bg-rose-500";
      default:
        return "bg-zinc-400";
    }
  };

  return (
    <div
      className="h-20 bg-white border-t border-[#E4E4E7] px-4 py-2 flex flex-col shrink-0 select-none z-10"
      aria-label="Recent Detections"
    >
      {/* Top Header of the Strip */}
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5 text-[#18181B]">
          <History className="w-3 h-3 text-[#71717A]" />
          <span className="font-semibold text-xs tracking-tight">
            Recent Detections
          </span>
          <span className="text-[10px] text-[#71717A] font-mono">
            ({history.length})
          </span>
        </div>

        {history.length > 0 && (
          <button
            id="clear-history-strip-btn"
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1 text-[11px] text-[#71717A] hover:text-rose-700 px-1.5 py-0.5 rounded hover:bg-zinc-100 transition-colors"
            title="Clear all recorded detection history"
            aria-label="Clear all recorded detection history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Chips Horizontal Track */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
        {history.length === 0 ? (
          <div className="text-[11px] text-[#71717A] flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#71717A]" />
            <span>
              No detections recorded yet. Point camera at items or upload a still
              image.
            </span>
          </div>
        ) : (
          history.map((item, idx) => {
            const isSelected = selectedId === item.detection.id;
            const dotColor = getStatusDotColor(
              item.detection.intelligence?.recyclability_state ||
              item.detection.intelligence?.recyclability
            );

            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => onSelectHistoryItem(item.detection)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left shrink-0 transition-colors ${
                  isSelected
                    ? "bg-[#18181B] text-white border-[#18181B] shadow-xs"
                    : "bg-[#F7F8FA] hover:bg-zinc-100 text-[#18181B] border-[#E4E4E7]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium capitalize leading-none">
                      {item.detection.class_name}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? "text-zinc-400" : "text-[#71717A]"
                      }`}
                    >
                      {Math.round(item.detection.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] mt-0.5">
                    <span
                      className={
                        isSelected ? "text-emerald-400" : "text-emerald-700"
                      }
                    >
                      {item.detection.intelligence.category}
                    </span>
                    <span
                      className={isSelected ? "text-zinc-500" : "text-zinc-400"}
                    >
                      •
                    </span>
                    <span
                      className={
                        isSelected ? "text-zinc-400" : "text-[#71717A]"
                      }
                    >
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
