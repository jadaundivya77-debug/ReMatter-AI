import React from "react";
import { RecyclabilityStatus } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Info,
} from "lucide-react";

interface StatusBadgeProps {
  status: RecyclabilityStatus | string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const normalized = status ? status.trim() : "";

  let bgClass = "bg-zinc-100 text-zinc-700 border-zinc-200";
  let icon = <HelpCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />;

  switch (normalized) {
    case "Recyclable":
      bgClass = "bg-emerald-600 text-white border-emerald-700 shadow-xs font-semibold";
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />;
      break;
    case "Conditionally recyclable":
      bgClass = "bg-sky-600 text-white border-sky-700 shadow-xs font-semibold";
      icon = <Info className="w-3.5 h-3.5 text-white shrink-0" />;
      break;
    case "Reusable":
      bgClass = "bg-indigo-600 text-white border-indigo-700 shadow-xs font-semibold";
      icon = <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />;
      break;
    case "Compostable":
      bgClass = "bg-lime-600 text-white border-lime-700 shadow-xs font-semibold";
      icon = <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />;
      break;
    case "Special handling required":
    case "Special handling":
      bgClass = "bg-amber-600 text-white border-amber-700 shadow-xs font-semibold";
      icon = <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />;
      break;
    case "Generally non-recyclable":
    case "Non-recyclable":
      bgClass = "bg-rose-600 text-white border-rose-700 shadow-xs font-semibold";
      icon = <XCircle className="w-3.5 h-3.5 text-white shrink-0" />;
      break;
    case "Needs verification":
      bgClass = "bg-amber-100 text-amber-900 border-amber-300 font-semibold";
      icon = <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />;
      break;
    default:
      bgClass = "bg-zinc-200 text-zinc-800 border-zinc-300 font-medium";
      icon = <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />;
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1"
      : size === "lg"
      ? "text-xs px-2.5 py-1 gap-1.5 font-medium"
      : "text-xs px-2 py-0.5 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium select-none ${bgClass} ${sizeClasses}`}
    >
      {icon}
      <span>{normalized || "Unknown"}</span>
    </span>
  );
};
