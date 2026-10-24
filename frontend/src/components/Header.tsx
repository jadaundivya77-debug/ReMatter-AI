import {
  Video,
  UploadCloud,
  Circle,
  HelpCircle,
  Sparkles,
  BarChart3,
  Camera,
  BookOpen,
} from "lucide-react";
import { HealthResponse, WorkspaceMode, CameraStatus, MainNavTab } from "@/lib/types";

interface HeaderProps {
  mainTab: MainNavTab;
  onMainTabChange: (tab: MainNavTab) => void;
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  health: HealthResponse | null;
  cameraStatus: CameraStatus;
  onOpenCategoriesModal: () => void;
  onOpenGeminiModal: () => void;
  onOpenGuideModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mainTab,
  onMainTabChange,
  mode,
  onModeChange,
  health,
  cameraStatus,
  onOpenCategoriesModal,
  onOpenGeminiModal,
  onOpenGuideModal,
}) => {
  const isHealthy = health?.status === "healthy";

  return (
    <header className="h-13 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-30 shadow-2xs">
      {/* Brand & Workspace Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs tracking-tight shadow-xs">
            <span className="text-blue-400">R</span>M
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight block">
              ReMatter
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              Municipal Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Center: High-End Segmented Navigation Switcher */}
      <nav aria-label="Application Workspace" className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            id="tab-analytics-btn"
            type="button"
            onClick={() => onMainTabChange("analytics")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mainTab === "analytics"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Executive Analytics (C6)</span>
          </button>

          <button
            id="tab-vision-btn"
            type="button"
            onClick={() => onMainTabChange("vision")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mainTab === "vision"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Waste Photo Studio</span>
          </button>
        </div>

        {/* Vision Sub-mode Switcher (Only visible in Vision mode) */}
        {mainTab === "vision" && (
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              id="mode-image-upload-btn"
              type="button"
              onClick={() => onModeChange("upload")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                mode === "upload"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UploadCloud className="w-3 h-3 text-blue-600" />
              <span>Photo Upload</span>
            </button>
            <button
              id="mode-live-webcam-btn"
              type="button"
              onClick={() => onModeChange("live")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                mode === "live"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Video className="w-3 h-3 text-emerald-600" />
              <span>Live Feed</span>
            </button>
          </div>
        )}
      </nav>

      {/* Right Controls: Guide, Backend, Settings */}
      <div className="flex items-center gap-2.5">
        {/* Platform Explanation Guide Button */}
        <button
          id="platform-guide-btn"
          type="button"
          onClick={onOpenGuideModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          title="Learn what this website does and where all features are"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Guide & FAQ</span>
          <span className="sm:hidden">Guide</span>
        </button>

        {/* Backend Status Pill */}
        <div
          id="backend-status-pill"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs"
          title={isHealthy ? "FastAPI backend online" : "Backend offline"}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-slate-700 font-semibold text-[11px]">
            {isHealthy ? "API Online" : "Offline"}
          </span>
        </div>

        {/* Neural Core Button */}
        <button
          id="neural-core-btn"
          type="button"
          onClick={onOpenGeminiModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          title="Configure Waste-YOLO Neural Core settings"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden lg:inline text-[11px]">Model Engine</span>
        </button>

        {/* Knowledge Catalog Trigger */}
        <button
          id="categories-guide-btn"
          type="button"
          onClick={onOpenCategoriesModal}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          title="Categories & Recycling Rules"
          aria-label="View Waste Categories and Recycling Rules"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
