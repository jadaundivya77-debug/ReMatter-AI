"use client";

import React, { useState } from "react";
import {
  X,
  BarChart3,
  Camera,
  Upload,
  Layers,
  Sparkles,
  Truck,
  Building2,
  FileText,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Leaf,
  ShieldCheck,
  Compass,
  ArrowRight,
} from "lucide-react";

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToTab: (tab: "analytics" | "vision") => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({
  isOpen,
  onClose,
  onSwitchToTab,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<"overview" | "analytics" | "vision" | "dataset">("overview");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Platform Guide: What Does This Platform Do & Where Are All Features?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Understand the municipal analytics, pre-loaded data values, and image upcycling studio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/70 flex gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveGuideTab("overview")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === "overview"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>1. Platform Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGuideTab("dataset")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === "dataset"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>2. What Are The Pre-Loaded Values?</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGuideTab("analytics")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === "analytics"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3. Municipal Analytics Features (C6)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGuideTab("vision")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === "vision"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>4. Image Upload & Upcycling Studio</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white text-zinc-800 text-xs leading-relaxed">
          {activeGuideTab === "overview" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mb-1.5">
                  Two Unified Systems In One Platform
                </span>
                <h3 className="text-sm font-bold text-zinc-900 mb-1">
                  ReMatter AI combines Municipal Data Analytics (Problem C6) with Citizen AI Vision
                </h3>
                <p className="text-zinc-600">
                  This website solves both macro-level city logistics (how garbage trucks collect waste across 5 city wards) and micro-level citizen action (uploading a photo to detect garbage and learn what can be created from each waste item).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <BarChart3 className="w-4 h-4" />
                    <span>Mode 1: WasteWise Analytics (Problem C6)</span>
                  </div>
                  <p className="text-zinc-600">
                    Built for municipal city managers, mayors, and waste authorities. Analyzes 6 months of garbage collection truck logs without requiring expensive IoT sensors on every trash can.
                  </p>
                  <ul className="space-y-1 text-zinc-700">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Tracks Total Waste, Clean Recycling %, and Composting %</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Collection Reliability Index (CRI %) & Missed Truck Routes</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Fair per-capita comparison across 5 city wards</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToTab("analytics");
                      onClose();
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Go to Municipal Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Mode 2: AI Waste Detector & Upcycling</span>
                  </div>
                  <p className="text-zinc-600">
                    Built for citizens, schools, and recycling stations. Upload any photo from your laptop/phone or turn on your webcam to detect every piece of waste with bounding boxes.
                  </p>
                  <ul className="space-y-1 text-zinc-700">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Automatic Bounding Boxes on all detected items</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Interactive list & dropdown to pick any detected waste</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>"What Can Be Created With This Waste" DIY & recycling ideas</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToTab("vision");
                      onClose();
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Go to AI Waste Detector</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === "dataset" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-950 mb-1">
                  Why Are Those Numbers Already There? (14,827 Tonnes, 34% Recycling, etc.)
                </h3>
                <p className="text-blue-900">
                  These numbers are not fake or static placeholders! They are computed dynamically in real-time by the Python analytics engine (<code className="bg-blue-100 px-1 py-0.5 rounded text-blue-950 font-mono">analytics.py</code>) using a realistic <strong>6-Month Municipal Benchmark Dataset</strong> covering 180 operational days and 900 truck collection records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">14,827.39 Tonnes</span>
                  <span className="font-bold text-zinc-900 block text-xs mt-0.5">Total Waste Generated</span>
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Sum of all waste gathered by municipal collection trucks across all 5 wards over the 180-day audit period.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
                  <span className="text-emerald-700 text-[10px] uppercase font-bold block">34.01% Recycling</span>
                  <span className="font-bold text-zinc-900 block text-xs mt-0.5">Clean Recycling Rate</span>
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Calculated mathematically as <span className="font-mono text-zinc-800">(Recycled kg / Total Waste kg) × 100</span>. Measures bottles, cans, and paper diverted to MRFs.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
                  <span className="text-teal-700 text-[10px] uppercase font-bold block">33.64% Composting</span>
                  <span className="font-bold text-zinc-900 block text-xs mt-0.5">Organic Diversion</span>
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Food and green yard waste diverted to municipal composting, keeping organics out of landfills where they produce methane.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
                  <span className="text-amber-700 text-[10px] uppercase font-bold block">94.9% Reliability</span>
                  <span className="font-bold text-zinc-900 block text-xs mt-0.5">Collection Reliability (CRI)</span>
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Out of 900 scheduled truck routes, 14 were missed due to mechanical breakdowns or road closures. Missing records are explicitly audited, not ignored!
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
                  <span className="text-emerald-700 text-[10px] uppercase font-bold block">9,906 MT CO₂e</span>
                  <span className="font-bold text-zinc-900 block text-xs mt-0.5">Emissions Avoided</span>
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Calculated using EPA WARM factors: avoided landfill methane emissions plus preserved smelting and virgin refining energy.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
                  <span className="text-zinc-700 text-[10px] uppercase font-bold block">5 City Wards</span>
                  <span className="font-bold text-zinc-900 block text-xs mt-0.5">Diverse Municipal Profiles</span>
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Downtown Core (dense commercial), North Heights (high compliance), Green Valley (residential), West Suburbs, and Industrial Logistics Park.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 block">Want to test with your own city's data?</span>
                  <span className="text-zinc-500 text-[11px]">You can click "Download CSV Records" to inspect the raw file, or "Import Custom CSV" to upload your own municipal records!</span>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === "analytics" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">
                Where Are The Municipal Analytics Features (Problem C6)?
              </h3>
              <p className="text-zinc-600">
                When you are on the <strong>WasteWise Analytics</strong> tab, the dashboard provides 4 core analytical views right below the top KPI summary cards:
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
                  <span className="font-bold text-zinc-900 text-xs block">
                    📈 Tab 1: Waste Generation & Composition Trends
                  </span>
                  <p className="text-zinc-600 text-[11px] mt-0.5">
                    Shows dynamic time-series charts across Daily, Weekly, or Monthly views. Displays the stacked volume of Organic vs. Recyclable vs. Residual landfill waste with hover tooltips and stream breakdown progress bars.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
                  <span className="font-bold text-zinc-900 text-xs block">
                    🏘️ Tab 2: Normalized Neighbourhood Comparison
                  </span>
                  <p className="text-zinc-600 text-[11px] mt-0.5">
                    <strong>Critical C6 Requirement:</strong> Ensures neighbourhoods with more frequent collections aren't unfairly penalized. Normalizes waste by population (<code className="font-mono bg-zinc-200 px-1 py-0.2 rounded">kg/capita/day</code>) and household density (<code className="font-mono bg-zinc-200 px-1 py-0.2 rounded">kg/household/month</code>).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
                  <span className="font-bold text-zinc-900 text-xs block">
                    🚛 Tab 3: Fleet Reliability & Missed Pickups (CRI)
                  </span>
                  <p className="text-zinc-600 text-[11px] mt-0.5">
                    Audits collection truck reliability. Missing records are treated as missed service events rather than assuming 0kg of waste was produced, preventing biased data.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
                  <span className="font-bold text-zinc-900 text-xs block">
                    ⚖️ Tab 4: Before vs. After Policy Intervention
                  </span>
                  <p className="text-zinc-600 text-[11px] mt-0.5">
                    Evaluates documented municipal interventions (e.g. City Organics Diversion Mandate). Compares pre-policy vs. post-policy recycling rates and residual landfill reduction.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <span className="font-bold text-emerald-950 text-xs block">
                    📄 Executive Operational Report
                  </span>
                  <p className="text-emerald-900 text-[11px] mt-0.5">
                    Click the <strong>"Executive Report"</strong> button in the top right to generate a printable municipal audit report ready for city council presentations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === "vision" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">
                How To Upload an Image & Discover Upcycling Creations
              </h3>
              <p className="text-zinc-600">
                Switch to the <strong>"AI Waste Detector & Upcycling Studio"</strong> tab at the very top of the header:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1">
                  <span className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    Step 1: Upload Image from Device
                  </span>
                  <p className="text-zinc-600 text-[11px]">
                    Click "Upload Image from Device" or drag-and-drop any photo of garbage from your computer. You can also pick one of our pre-set samples (Desk Waste, Bottles & Cans, Organic Food).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1">
                  <span className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Step 2: See Bounding Boxes
                  </span>
                  <p className="text-zinc-600 text-[11px]">
                    The AI processes the image and draws clear, color-coded bounding boxes around every detected waste item (plastic bottles, aluminum cans, coffee cups, cardboard, food scraps).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1">
                  <span className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Step 3: Pick from Dropdown or List
                  </span>
                  <p className="text-zinc-600 text-[11px]">
                    Beside the image, you'll see a complete list of all detected waste items and a dropdown selector. Click any item to inspect it!
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/50 space-y-1">
                  <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Step 4: "What Can Be Created With This Waste"
                  </span>
                  <p className="text-emerald-900 text-[11px]">
                    Instantly shows what can be created from that waste! (e.g. Self-watering planters from bottles, desk caddies from cans, terrariums from jars, compost from organics), complete with DIY instructions and industrial recycling details.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500">
            ReMatter AI • Problem Statement C6 Municipal Waste Intelligence
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Got It, Back to Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
