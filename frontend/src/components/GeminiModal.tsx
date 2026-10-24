import React, { useState } from "react";
import { X, Sparkles, Key, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConnected?: () => void;
}

export const GeminiModal: React.FC<GeminiModalProps> = ({
  isOpen,
  onClose,
  onKeyConnected,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setStatus("loading");
    setMessage("Validating engine authorization key with Neural Core...");

    try {
      const res = await fetch("/api/config/gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to validate Neural Engine key.");
      }

      setStatus("success");
      setMessage(data.message || "Waste-YOLO Neural Core activated successfully!");
      if (onKeyConnected) {
        onKeyConnected();
      }
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 1600);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not connect to Neural Engine.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#18181B] text-emerald-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                ReMatter Waste-YOLO Neural Core
              </h3>
              <p className="text-[11px] text-zinc-500">
                Custom trained deep learning waste detector & circular intelligence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConnect} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Neural Engine Activation Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter engine authorization key..."
                required
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between">
              <span>Activates dense multi-object detection & circular upcycling models</span>
            </p>
          </div>

          {/* Feedback status message */}
          {status !== "idle" && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                status === "loading"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : status === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}
            >
              {status === "loading" && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0 mt-0.5" />}
              {status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {status === "error" && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <span className="leading-snug">{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading" || !apiKey.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#18181B] hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting Neural Core...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Activate Neural Core</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
