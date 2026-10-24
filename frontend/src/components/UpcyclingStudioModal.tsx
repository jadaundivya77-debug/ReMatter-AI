"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Wrench,
  AlertCircle,
  Copy,
  Check,
  Zap,
} from "lucide-react";

export interface UpcycledProjectData {
  src: string;
  title: string;
  category: string;
  co2: string;
  lifespan: string;
  diversion: string;
  energy: string;
  materials?: string[];
  steps: {
    phase: string;
    text: string;
  }[];
  safety?: string;
}

interface UpcyclingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: UpcycledProjectData | null;
  objectLabel: string;
  materialName: string;
}

export const UpcyclingStudioModal: React.FC<UpcyclingStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  objectLabel,
  materialName,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / project.steps.length) * 100);

  const handleCopyWorkflow = () => {
    const text = `ReMatter Circular Transformation Blueprint: ${project.title}
Material: ${materialName} (${objectLabel})
Sustainability Impact:
- CO2e Avoided: ${project.co2}
- Lifespan Extension: ${project.lifespan}
- Landfill Diversion: ${project.diversion}
- Energy Conserved: ${project.energy}

Step-by-Step Creation Workflow:
${project.steps.map((s, i) => `${i + 1}. [${s.phase}] ${s.text}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] text-emerald-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Fullscreen Upcycling Studio
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs font-mono text-zinc-500">
                  Source: {objectLabel} ({materialName})
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight mt-0.5">
                {project.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWorkflow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
              title="Copy Workflow Instructions"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Copy Blueprint</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              aria-label="Close Fullscreen Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#F7F8FA]">
          {/* Left Hero Column: Transformed Product & Sustainability Stats */}
          <div className="lg:col-span-5 space-y-5">
            {/* High-Resolution Transformed Output Visual */}
            <div className="relative rounded-2xl overflow-hidden border border-emerald-300/80 shadow-md bg-zinc-950 group">
              <img
                src={project.src}
                alt={project.title}
                className="w-full h-72 sm:h-84 object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Transformed Output
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-mono">
                  100% Upcycled
                </span>
              </div>

              <div className="absolute bottom-3.5 left-4 right-4 text-white">
                <p className="text-xs text-emerald-300 font-mono tracking-wider uppercase font-semibold">
                  {project.category}
                </p>
                <h3 className="text-lg font-bold text-white drop-shadow-xs mt-0.5">
                  {project.title}
                </h3>
              </div>
            </div>

            {/* Environmental Sustainability Dashboard */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Sustainability Impact Ledger
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Calculated eco-benefits of circular redirection
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono">
                  Active Lifecycle
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-600" />
                    Carbon Avoided
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-800 mt-1">
                    {project.co2}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    vs single-use landfill decomposition
                  </span>
                </div>

                <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-teal-900 uppercase tracking-wider flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-teal-600" />
                    Utility Lifespan
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-teal-800 mt-1">
                    {project.lifespan}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    extended functional household life
                  </span>
                </div>

                <div className="bg-sky-50/50 rounded-xl p-3 border border-sky-100 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                    Landfill Diversion
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-sky-800 mt-1">
                    {project.diversion}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    zero solid waste contamination
                  </span>
                </div>

                <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" />
                    Energy Conserved
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-amber-800 mt-1">
                    {project.energy}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    smelting/refining energy preserved
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Workflow Column: Interactive Step-by-Step DIY Timeline */}
          <div className="lg:col-span-7 space-y-5">
            {/* Workflow Progress Tracker */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Step-by-Step Creation Workflow
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Interactive phase-by-phase transformation guide
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {completedCount} / {project.steps.length} Completed
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    {progressPercent}% Progress
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Step-by-Step Action Cards */}
            <div className="space-y-3">
              {project.steps.map((st, sIdx) => {
                const isChecked = !!completedSteps[sIdx];
                return (
                  <div
                    key={sIdx}
                    onClick={() => toggleStep(sIdx)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer select-none ${
                      isChecked
                        ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
                        : "bg-white border-zinc-200 hover:border-zinc-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-300 flex items-center justify-center text-xs font-bold">
                            {sIdx + 1}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-wide ${
                              isChecked ? "text-emerald-900 line-through" : "text-zinc-900"
                            }`}
                          >
                            {st.phase}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Phase {sIdx + 1}
                          </span>
                        </div>
                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            isChecked ? "text-zinc-500 line-through" : "text-zinc-700"
                          }`}
                        >
                          {st.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safety & Handling Precautions Callout */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 space-y-0.5">
                <span className="font-bold block">Safety & Precaution Protocol:</span>
                <p className="text-amber-900/90 leading-relaxed text-[11px] sm:text-xs">
                  Always inspect for sharp edges before cutting. Use protective craft gloves when deburring metal or slicing rigid plastics. Wash thoroughly with mild soapy water to remove chemical or beverage residues before home reuse.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-white flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>ReMatter AI Circular Transformation Intelligence</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#18181B] hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
