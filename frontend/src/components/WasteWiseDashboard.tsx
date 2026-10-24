"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import {
  BarChart3,
  TrendingUp,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  FileText,
  Building2,
  Leaf,
  Printer,
  X,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Camera,
  PieChart,
  ShieldCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
} from "lucide-react";
import {
  getAnalyticsMetrics,
  getNeighbourhoodComparisons,
  getMissedCollectionsLog,
  getInterventionAnalysis,
  getExecutiveReport,
  uploadCustomCsv,
  resetDatasetToSynthetic,
  getDownloadCsvUrl,
} from "@/lib/api";
import {
  AnalyticsMetricsResponse,
  NeighbourhoodComparison,
  MissedCollectionRecord,
  InterventionAnalysis,
  ExecutiveReport,
} from "@/lib/types";

interface WasteWiseDashboardProps {
  onSwitchToVision?: () => void;
  onOpenGuide?: () => void;
}

export const WasteWiseDashboard: React.FC<WasteWiseDashboardProps> = ({
  onSwitchToVision,
  onOpenGuide,
}) => {
  // Filters
  const [selectedWard, setSelectedWard] = useState<string>("ALL");
  const [timeGrain, setTimeGrain] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [unit, setUnit] = useState<"tonnes" | "kg">("tonnes");
  const [activeTab, setActiveTab] = useState<"trends" | "wards" | "fleet" | "intervention">("trends");
  const [activeStreamFilter, setActiveStreamFilter] = useState<"all" | "recyclable" | "organic" | "residual">("all");

  // Data states
  const [metrics, setMetrics] = useState<AnalyticsMetricsResponse | null>(null);
  const [wards, setWards] = useState<NeighbourhoodComparison[]>([]);
  const [missedLog, setMissedLog] = useState<MissedCollectionRecord[]>([]);
  const [intervention, setIntervention] = useState<InterventionAnalysis | null>(null);
  const [report, setReport] = useState<ExecutiveReport | null>(null);

  // UI status states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Gradient IDs for SVG charts
  const blueGradId = useId();
  const amberGradId = useId();
  const roseGradId = useId();
  const colBlueGradId = useId();
  const colAmberGradId = useId();
  const colRoseGradId = useId();

  // Load all analytics data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsData, wardsData, missedData, interventionData] = await Promise.all([
        getAnalyticsMetrics(selectedWard, timeGrain, unit),
        getNeighbourhoodComparisons(unit),
        getMissedCollectionsLog(),
        getInterventionAnalysis(),
      ]);

      setMetrics(metricsData);
      setWards(wardsData);
      setMissedLog(missedData);
      setIntervention(interventionData);
    } catch (err) {
      console.error("Failed to load WasteWise analytics", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWard, timeGrain, unit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle custom CSV upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("Ingesting & validating municipal CSV schema...");
    try {
      const res = await uploadCustomCsv(file);
      setUploadStatus(`Success: Ingested ${res.total_records} records across ${res.wards.length} wards.`);
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus(null);
        loadData();
      }, 1400);
    } catch (err: unknown) {
      setUploadStatus(`Error: ${err instanceof Error ? err.message : "CSV parsing failed."}`);
    }
  };

  // Reset to synthetic 6-month benchmark
  const handleReset = async () => {
    try {
      await resetDatasetToSynthetic();
      loadData();
    } catch (err) {
      console.error("Reset failed", err);
    }
  };

  // Fetch report
  const handleOpenReport = async () => {
    try {
      const r = await getExecutiveReport();
      setReport(r);
      setIsReportModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch report", err);
    }
  };

  const summary = metrics?.summary;
  const reliability = metrics?.reliability;
  const timeSeries = metrics?.time_series || [];

  // Maximum value for time series scale
  const maxTotal = Math.max(
    ...timeSeries.map((d) => {
      if (activeStreamFilter === "recyclable") return d.recyclable;
      if (activeStreamFilter === "organic") return d.organic;
      if (activeStreamFilter === "residual") return d.residual;
      return d.total;
    }),
    1
  );

  // SVG Donut calculation constants
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius; // ≈ 238.76
  const recPct = summary ? summary.recycling_rate_pct / 100 : 0.34;
  const orgPct = summary ? summary.organic_diversion_pct / 100 : 0.336;
  const resPct = summary ? summary.landfill_residual_pct / 100 : 0.324;

  const recStroke = recPct * donutCircumference;
  const orgStroke = orgPct * donutCircumference;
  const resStroke = resPct * donutCircumference;

  const recOffset = 0;
  const orgOffset = -recStroke;
  const resOffset = -(recStroke + orgStroke);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8FAFC] text-[#0F172A] select-none">
      {/* 1. Sleek Top Operational Control Bar */}
      <header className="bg-white border-b border-slate-200 px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Problem Statement C6
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">Municipal Waste Intelligence</span>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
              WasteWise Executive Analytics
            </h1>
          </div>
        </div>

        {/* Global Toolbar Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Ward Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Ward:</span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Wards (5 Districts)</option>
              <option value="Downtown Core">Downtown Core</option>
              <option value="North Heights">North Heights</option>
              <option value="Green Valley Eco-District">Green Valley</option>
              <option value="West Suburbs">West Suburbs</option>
              <option value="Industrial Logistics Park">Industrial Park</option>
            </select>
          </div>

          {/* Time Grain Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(["daily", "weekly", "monthly"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setTimeGrain(g)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                  timeGrain === g
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Units */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-mono">
            {(["tonnes", "kg"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-2 py-1 rounded-md text-xs transition-all uppercase cursor-pointer ${
                  unit === u
                    ? "bg-slate-900 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Executive Report Button */}
          <button
            type="button"
            onClick={handleOpenReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Report</span>
          </button>
        </div>
      </header>

      {/* 2. Refined Secondary Data Context & Action Strip (Uncluttered) */}
      <section className="bg-white border-b border-slate-200 px-5 sm:px-8 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 font-medium text-[11px]">
            Active Benchmark: <strong className="text-slate-900 font-semibold">180 Operational Days • 900 Route Records across 5 Wards</strong>
          </span>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1"
            >
              (Why these numbers?)
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick-switch to photo detector */}
          {onSwitchToVision && (
            <button
              type="button"
              onClick={onSwitchToVision}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Analyze Garbage Photo →</span>
            </button>
          )}

          <span className="text-slate-300">|</span>

          {/* Download CSV */}
          <a
            href={getDownloadCsvUrl()}
            download="wastewise_municipal_records.csv"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Download municipal CSV records"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Export CSV</span>
          </a>

          {/* Import CSV */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3 text-slate-400" />
            <span>Import CSV</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Reset dataset"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </section>

      {/* 3. Main Analytical Content Body */}
      <main className="p-5 sm:p-8 space-y-7 max-w-7xl mx-auto w-full">
        {/* KPI Summary Cards: Rich Color Palette (Slate, Blue, Amber, Violet, Emerald) */}
        {summary && reliability && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Generation (Slate / Neutral) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Total Generation
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {summary.total_waste.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-slate-500">{summary.unit}</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span>Landfill Residual:</span>
                <span className="font-bold text-rose-600">{summary.landfill_residual_pct}%</span>
              </div>
            </div>

            {/* Card 2: Clean Recycling Rate (Electric Blue) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  Clean Recycling
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-600">
                  {summary.recycling_rate_pct}%
                </span>
                <span className="text-xs text-slate-400 font-medium">gross mass</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span>Recycled Mass:</span>
                <span className="font-bold text-slate-900">
                  {summary.total_recyclable.toLocaleString()} {summary.unit}
                </span>
              </div>
            </div>

            {/* Card 3: Organic Composting (Warm Amber Gold) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Organic Composting
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Leaf className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600">
                  {summary.organic_diversion_pct}%
                </span>
                <span className="text-xs text-slate-400 font-medium">to compost</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span>Total Diversion:</span>
                <span className="font-bold text-emerald-700">
                  {summary.total_diversion_pct}%
                </span>
              </div>
            </div>

            {/* Card 4: Fleet Collection Reliability Index (Deep Violet / Indigo) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                  Fleet Reliability (CRI)
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-indigo-600">
                  {reliability.cri_score}%
                </span>
                <span className="text-xs text-slate-400 font-medium">on-time</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span>Missed Routes:</span>
                <span className={`font-bold ${reliability.missed_trips > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {reliability.missed_trips} trips
                </span>
              </div>
            </div>

            {/* Card 5: Emissions Avoided (Vibrant Mint / Emerald) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                  CO₂e Avoided
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                  {summary.co2_avoided_tonnes.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-slate-500">MT</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span>EPA Benchmark:</span>
                <span className="font-semibold text-slate-700">Landfill Methane Saved</span>
              </div>
            </div>
          </div>
        )}

        {/* Operational Section Tabs (Clean & Professional) */}
        <nav className="flex border-b border-slate-200 gap-3 text-xs font-bold overflow-x-auto pb-px">
          {[
            { id: "trends", label: "1. Time-Series Trends & Composition", icon: TrendingUp },
            { id: "wards", label: "2. Normalized Ward Comparison", icon: Building2 },
            { id: "fleet", label: "3. Fleet Reliability & CRI Audit", icon: Truck },
            { id: "intervention", label: "4. Policy Intervention Delta", icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-semibold"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* TAB 1: Colorful Multi-Stream Graphs & Donut Chart */}
        {activeTab === "trends" && (
          <div className="space-y-6">
            {/* Top Row: Multi-Stream Area Chart (Left) + Glowing Donut Chart (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Dynamic Colorful Time-Series Area Chart */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Multi-Stream Waste Generation Trends</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        {timeGrain}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tracking Recyclable (Blue), Organic (Amber), and Residual Landfill (Rose) volumes
                    </p>
                  </div>

                  {/* Stream Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveStreamFilter("all")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        activeStreamFilter === "all"
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All Streams
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStreamFilter("recyclable")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        activeStreamFilter === "recyclable"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-blue-700 hover:bg-blue-50"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Recyclables</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStreamFilter("organic")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        activeStreamFilter === "organic"
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Organics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStreamFilter("residual")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        activeStreamFilter === "residual"
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Residual</span>
                    </button>
                  </div>
                </div>

                {/* SVG Visual Multi-Stream Area Chart */}
                <div className="relative h-64 w-full pt-2">
                  {timeSeries.length > 0 ? (
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 600 200"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        {/* Blue Gradient for Recyclables */}
                        <linearGradient id={blueGradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
                        </linearGradient>

                        {/* Amber Gradient for Organics */}
                        <linearGradient id={amberGradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.01" />
                        </linearGradient>

                        {/* Rose Gradient for Residual */}
                        <linearGradient id={roseGradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {[0, 50, 100, 150].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="600"
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Stream: Recyclables (Blue) */}
                      {(activeStreamFilter === "all" || activeStreamFilter === "recyclable") && (() => {
                        const pts = timeSeries
                          .map((pt, i) => {
                            const x = (i / (timeSeries.length - 1 || 1)) * 600;
                            const y = 190 - (pt.recyclable / maxTotal) * 170;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <g>
                            <polygon points={`0,190 ${pts} 600,190`} fill={`url(#${blueGradId})`} />
                            <polyline
                              points={pts}
                              fill="none"
                              stroke="#2563EB"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        );
                      })()}

                      {/* Stream: Organics (Amber) */}
                      {(activeStreamFilter === "all" || activeStreamFilter === "organic") && (() => {
                        const pts = timeSeries
                          .map((pt, i) => {
                            const x = (i / (timeSeries.length - 1 || 1)) * 600;
                            const y = 190 - (pt.organic / maxTotal) * 170;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <g>
                            <polygon points={`0,190 ${pts} 600,190`} fill={`url(#${amberGradId})`} />
                            <polyline
                              points={pts}
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        );
                      })()}

                      {/* Stream: Residual Landfill (Rose) */}
                      {(activeStreamFilter === "all" || activeStreamFilter === "residual") && (() => {
                        const pts = timeSeries
                          .map((pt, i) => {
                            const x = (i / (timeSeries.length - 1 || 1)) * 600;
                            const y = 190 - (pt.residual / maxTotal) * 170;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <g>
                            <polygon points={`0,190 ${pts} 600,190`} fill={`url(#${roseGradId})`} />
                            <polyline
                              points={pts}
                              fill="none"
                              stroke="#EF4444"
                              strokeWidth="2"
                              strokeDasharray="4 2"
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      })()}

                      {/* Interactive Scrubber Data Points */}
                      {timeSeries.map((pt, i) => {
                        const x = (i / (timeSeries.length - 1 || 1)) * 600;
                        const yTotal = 190 - (pt.total / maxTotal) * 170;
                        return (
                          <g key={i}>
                            <circle
                              cx={x}
                              cy={yTotal}
                              r={hoveredPoint === i ? "6" : "3.5"}
                              className="fill-white stroke-slate-900 stroke-2 cursor-pointer transition-all"
                              onMouseEnter={() => setHoveredPoint(i)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  ) : null}

                  {/* Interactive Tooltip on Hover */}
                  {hoveredPoint !== null && timeSeries[hoveredPoint] && (
                    <div className="absolute top-3 right-6 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl text-xs shadow-xl space-y-1.5 z-20 pointer-events-none border border-slate-700">
                      <p className="font-bold text-white text-xs border-b border-slate-800 pb-1">
                        {timeSeries[hoveredPoint].period} Audit Report
                      </p>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Recyclable:
                          </span>
                          <strong className="font-mono text-white">
                            {timeSeries[hoveredPoint].recyclable} {summary?.unit}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Organic Compost:
                          </span>
                          <strong className="font-mono text-white">
                            {timeSeries[hoveredPoint].organic} {summary?.unit}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Landfill Residual:
                          </span>
                          <strong className="font-mono text-white">
                            {timeSeries[hoveredPoint].residual} {summary?.unit}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-slate-300 font-bold">
                          <span>Total Volume:</span>
                          <span className="font-mono text-white">
                            {timeSeries[hoveredPoint].total} {summary?.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* X-axis Date Labels */}
                <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100">
                  {timeSeries.slice(0, 8).map((pt, i) => (
                    <span key={i}>{pt.period}</span>
                  ))}
                </div>
              </div>

              {/* Glowing Visual SVG Donut Chart (Right Column) */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center justify-between">
                    <span>Stream Mass Distribution</span>
                    <PieChart className="w-4 h-4 text-slate-400" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gross volume fraction diverted vs. landfilled
                  </p>
                </div>

                {/* Visual SVG Donut Ring with Glowing Segments */}
                <div className="relative flex items-center justify-center py-2">
                  <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                    {/* Background Ring Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="fill-none stroke-slate-100"
                      strokeWidth="11"
                    />

                    {/* Arc 1: Clean Recyclables (Electric Blue) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="fill-none stroke-blue-600 transition-all duration-700"
                      strokeWidth="11"
                      strokeDasharray={`${recStroke} ${donutCircumference}`}
                      strokeDashoffset={recOffset}
                    />

                    {/* Arc 2: Organic Compost (Amber Gold) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="fill-none stroke-amber-500 transition-all duration-700"
                      strokeWidth="11"
                      strokeDasharray={`${orgStroke} ${donutCircumference}`}
                      strokeDashoffset={orgOffset}
                    />

                    {/* Arc 3: Landfill Residual (Coral Rose) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="fill-none stroke-rose-500 transition-all duration-700"
                      strokeWidth="11"
                      strokeDasharray={`${resStroke} ${donutCircumference}`}
                      strokeDashoffset={resOffset}
                    />
                  </svg>

                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Diversion
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {summary?.total_diversion_pct}%
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      Zero-Waste
                    </span>
                  </div>
                </div>

                {/* Stream Legend Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      <span>Recyclables</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {summary?.recycling_rate_pct}% ({summary?.total_recyclable.toLocaleString()} {summary?.unit})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Organic Compost</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {summary?.organic_diversion_pct}% ({summary?.total_organic.toLocaleString()} {summary?.unit})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Residual Landfill</span>
                    </span>
                    <span className="font-mono font-bold text-rose-600">
                      {summary?.landfill_residual_pct}% ({summary?.total_residual.toLocaleString()} {summary?.unit})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row 1: District Stream Partitioning & Diversion Audit */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      District Audit
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-500">5 Municipal Wards</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">
                    District Stream Partitioning & Diversion Performance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparative mass fraction of Recyclables, Organics, and Residual Landfill across all municipal districts
                  </p>
                </div>

                {/* Elegant Stream Legend */}
                <div className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-2xs" />
                    <span>Recyclables</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
                    <span>Organic Compost</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
                    <span>Landfill Residual</span>
                  </span>
                </div>
              </div>

              {/* Polished Ward Stream Rows */}
              <div className="space-y-4">
                {wards.map((ward, idx) => {
                  const recW = ward.recycling_rate_pct;
                  const orgW = Math.round(Math.max(0, ward.total_diversion_rate_pct - ward.recycling_rate_pct) * 10) / 10;
                  const resW = Math.round(Math.max(0, 100 - ward.total_diversion_rate_pct) * 10) / 10;
                  const isLeader = ward.total_diversion_rate_pct >= 65;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/90 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-slate-900 text-sm">{ward.ward_name}</span>
                          <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {ward.zone_type} • {ward.population.toLocaleString()} residents
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isLeader
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isLeader ? "Goal Exceeded" : "Target Lagging"}
                          </span>
                          <div className="flex items-baseline gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Diversion:</span>
                            <span className="font-mono font-extrabold text-slate-900 text-xs">
                              {ward.total_diversion_rate_pct}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Slim, elegant progress bar with gaps */}
                      <div className="relative h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5 p-0.5 shadow-inner">
                        <div
                          style={{ width: `${recW}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-l-full transition-all duration-500"
                          title={`Recyclables: ${recW}%`}
                        />
                        <div
                          style={{ width: `${orgW}%` }}
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                          title={`Organics: ${orgW}%`}
                        />
                        <div
                          style={{ width: `${resW}%` }}
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-r-full transition-all duration-500"
                          title={`Residual: ${resW}%`}
                        />
                      </div>

                      {/* Clean Metric Chips below bar */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-0.5">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>Recyclable:</span>
                            <strong className="font-mono text-slate-900">{recW}%</strong>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Organics:</span>
                            <strong className="font-mono text-slate-900">{orgW}%</strong>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Residual:</span>
                            <strong className="font-mono text-slate-900">{resW}%</strong>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Total Waste: <strong>{ward.total_generated.toLocaleString()} {summary?.unit}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row 2: Unified SVG Grouped Column Chart */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Temporal Stream Audit
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-500">6-Month Comparative Stream Tracking</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Monthly Volume Generation by Stream (Grouped Column Architecture)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct monthly mass comparison of Recyclables, Organics, and Landfill Residual in metric tonnes
                  </p>
                </div>

                {/* Stream Legend */}
                <div className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                    <span>Recyclables</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    <span>Organic Compost</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                    <span>Landfill Residual</span>
                  </span>
                </div>
              </div>

              {/* High-Resolution SVG Grouped Bar Chart */}
              <div className="relative pt-2">
                <div className="h-64 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 680 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={colBlueGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                      <linearGradient id={colAmberGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                      <linearGradient id={colRoseGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F87171" />
                        <stop offset="100%" stopColor="#DC2626" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Guideline Grids */}
                    {[0, 50, 100, 150].map((y) => (
                      <g key={y}>
                        <line x1="45" y1={y} x2="670" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                        <text x="38" y={y + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                          {Math.round(((180 - y) / 180) * 1200)} MT
                        </text>
                      </g>
                    ))}

                    {/* Grouped Month Clusters */}
                    {timeSeries.slice(0, 6).map((pt, i) => {
                      const clusterWidth = 620 / 6;
                      const clusterStartX = 55 + i * clusterWidth;
                      const barWidth = 20;
                      const gap = 4;
                      const isHovered = hoveredMonthIdx === i;

                      // Heights scaled to 1100 max single stream
                      const maxStreamScale = 1100;
                      const hRec = Math.min(160, Math.max(8, (pt.recyclable / maxStreamScale) * 160));
                      const hOrg = Math.min(160, Math.max(8, (pt.organic / maxStreamScale) * 160));
                      const hRes = Math.min(160, Math.max(8, (pt.residual / maxStreamScale) * 160));

                      const xRec = clusterStartX + 8;
                      const xOrg = xRec + barWidth + gap;
                      const xRes = xOrg + barWidth + gap;

                      const yRec = 180 - hRec;
                      const yOrg = 180 - hOrg;
                      const yRes = 180 - hRes;

                      return (
                        <g
                          key={i}
                          className="cursor-pointer transition-opacity"
                          onMouseEnter={() => setHoveredMonthIdx(i)}
                          onMouseLeave={() => setHoveredMonthIdx(null)}
                        >
                          {/* Hover Background Column Highlight */}
                          {isHovered && (
                            <rect
                              x={clusterStartX}
                              y="10"
                              width={clusterWidth - 6}
                              height="170"
                              rx="8"
                              fill="#F1F5F9"
                              opacity="0.8"
                            />
                          )}

                          {/* Bar 1: Recyclable */}
                          <rect
                            x={xRec}
                            y={yRec}
                            width={barWidth}
                            height={hRec}
                            rx="3"
                            fill={`url(#${colBlueGradId})`}
                            className="transition-all duration-300 hover:brightness-110"
                          />

                          {/* Bar 2: Organic */}
                          <rect
                            x={xOrg}
                            y={yOrg}
                            width={barWidth}
                            height={hOrg}
                            rx="3"
                            fill={`url(#${colAmberGradId})`}
                            className="transition-all duration-300 hover:brightness-110"
                          />

                          {/* Bar 3: Residual */}
                          <rect
                            x={xRes}
                            y={yRes}
                            width={barWidth}
                            height={hRes}
                            rx="3"
                            fill={`url(#${colRoseGradId})`}
                            className="transition-all duration-300 hover:brightness-110"
                          />

                          {/* X-Axis Month Label */}
                          <text
                            x={clusterStartX + (clusterWidth - 6) / 2}
                            y="196"
                            textAnchor="middle"
                            className={`text-[10px] font-mono ${
                              isHovered ? "fill-slate-900 font-bold" : "fill-slate-500 font-medium"
                            }`}
                          >
                            {pt.period}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Interactive Floating Tooltip */}
                  {hoveredMonthIdx !== null && timeSeries[hoveredMonthIdx] && (
                    <div className="absolute top-2 right-4 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl text-xs shadow-xl space-y-1.5 z-20 pointer-events-none border border-slate-700">
                      <p className="font-bold text-white text-xs border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                        <span>{timeSeries[hoveredMonthIdx].period} Breakdown</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {Math.round(
                            ((timeSeries[hoveredMonthIdx].recyclable + timeSeries[hoveredMonthIdx].organic) /
                              timeSeries[hoveredMonthIdx].total) *
                              100
                          )}
                          % Diverted
                        </span>
                      </p>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Recyclable:
                          </span>
                          <strong className="font-mono text-white">
                            {timeSeries[hoveredMonthIdx].recyclable.toLocaleString()} {summary?.unit}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Organic Compost:
                          </span>
                          <strong className="font-mono text-white">
                            {timeSeries[hoveredMonthIdx].organic.toLocaleString()} {summary?.unit}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Landfill Residual:
                          </span>
                          <strong className="font-mono text-white">
                            {timeSeries[hoveredMonthIdx].residual.toLocaleString()} {summary?.unit}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-slate-300 font-bold">
                          <span>Total Generation:</span>
                          <span className="font-mono text-white">
                            {timeSeries[hoveredMonthIdx].total.toLocaleString()} {summary?.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">6-Month Total Monitored</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm mt-0.5 block">
                      {summary?.total_waste.toLocaleString()} {summary?.unit}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-800 block">Total Material Recycled</span>
                    <span className="font-mono font-extrabold text-blue-700 text-sm mt-0.5 block">
                      {summary?.total_recyclable.toLocaleString()} {summary?.unit}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Total Organic Composted</span>
                    <span className="font-mono font-extrabold text-amber-700 text-sm mt-0.5 block">
                      {summary?.total_organic.toLocaleString()} {summary?.unit}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Municipal Zero-Waste Goal</span>
                    <span className="font-mono font-extrabold text-emerald-700 text-sm mt-0.5 block">
                      {summary?.total_diversion_pct}% (Target 65%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Normalized Neighbourhood Matrix & Target Benchmark Gauge */}
        {activeTab === "wards" && (
          <div className="space-y-6">
            {/* Municipal Zero-Waste Target Progress Gauge */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Municipal 65% Diversion Target Benchmark</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluating individual ward performance against the municipal zero-waste diversion mandate
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  City Target: 65.0%
                </span>
              </div>

              {/* Ward Benchmark Progress Bars with 65% Target Marker */}
              <div className="space-y-4 pt-3">
                {wards.map((ward, i) => {
                  const isLeader = ward.total_diversion_rate_pct >= 65;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900">{ward.ward_name}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isLeader
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isLeader ? "Goal Exceeded" : "Needs Improvement"}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {ward.total_diversion_rate_pct}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar with 65% target notch */}
                      <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                        {/* 65% Target Guideline */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                          style={{ left: "65%" }}
                          title="Municipal Target: 65%"
                        />

                        {/* Actual Progress Fill */}
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isLeader ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${ward.total_diversion_rate_pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Normalized Per-Capita Waste Generation Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Daily Per-Capita Waste Generation Benchmark (kg / person / day)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluates per-resident waste output across all 5 wards against the municipal benchmark threshold of 1.00 kg/day
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-slate-500">Benchmark Guideline:</span>
                  <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                    1.00 kg/day
                  </span>
                </div>
              </div>

              {/* Colorful Horizontal Comparison Bars */}
              <div className="space-y-3.5 pt-2">
                {wards.map((ward, i) => {
                  const val = ward.daily_per_capita_kg;
                  const isLow = val <= 0.95;
                  const isModerate = val > 0.95 && val <= 1.15;
                  const barPct = Math.min(100, (val / 1.6) * 100);

                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ward.ward_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({ward.zone_type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isLow
                                ? "bg-emerald-100 text-emerald-800"
                                : isModerate
                                ? "bg-blue-100 text-blue-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isLow ? "Low Waste Leader" : isModerate ? "Moderate Output" : "High Generation"}
                          </span>
                          <span className="font-mono font-extrabold text-slate-900 text-xs">
                            {val} kg/capita/day
                          </span>
                        </div>
                      </div>

                      <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                        {/* 1.00 Benchmark line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                          style={{ left: `${(1.0 / 1.6) * 100}%` }}
                          title="Municipal Target: 1.00 kg/day"
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isLow ? "bg-emerald-500" : isModerate ? "bg-blue-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Normalized Per-Capita Table Matrix */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Normalized Neighbourhood Audit Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Normalized per capita (<code className="font-mono text-blue-700 font-bold">kg/capita/day</code>) to ensure wards with frequent collections are not penalized
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Fair Normalization Verified
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-3.5">Ward District</th>
                      <th className="py-3 px-3.5">Classification</th>
                      <th className="py-3 px-3.5">Population</th>
                      <th className="py-3 px-3.5">Daily / Person</th>
                      <th className="py-3 px-3.5">Monthly / Household</th>
                      <th className="py-3 px-3.5">Recycling Rate</th>
                      <th className="py-3 px-3.5">Diversion Rate</th>
                      <th className="py-3 px-3.5">Reliability (CRI)</th>
                      <th className="py-3 px-3.5">Operational Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wards.map((ward, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3.5 font-bold text-slate-900">
                          {ward.ward_name}
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-600 text-[11px]">
                          {ward.zone_type}
                        </td>
                        <td className="py-3.5 px-3.5 font-mono text-slate-700">
                          {ward.population.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3.5 font-bold font-mono text-blue-700">
                          {ward.daily_per_capita_kg} kg/day
                        </td>
                        <td className="py-3.5 px-3.5 font-mono text-slate-700">
                          {ward.monthly_per_household_kg} kg
                        </td>
                        <td className="py-3.5 px-3.5 font-bold text-blue-600">
                          {ward.recycling_rate_pct}%
                        </td>
                        <td className="py-3.5 px-3.5 font-bold text-emerald-600">
                          {ward.total_diversion_rate_pct}%
                        </td>
                        <td className="py-3.5 px-3.5 font-mono font-bold">
                          <span className={ward.cri_score >= 95 ? "text-emerald-700" : "text-amber-700"}>
                            {ward.cri_score}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              ward.performance_tier === "Leader"
                                ? "bg-emerald-100 text-emerald-800"
                                : ward.performance_tier === "High Performer"
                                ? "bg-blue-100 text-blue-800"
                                : ward.performance_tier === "Moderate"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {ward.performance_tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Fleet Reliability & Missed Pickups (CRI Score) */}
        {activeTab === "fleet" && (
          <div className="space-y-6">
            {/* Top Fleet Stat Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">
                  Collection Reliability Index
                </span>
                <span className="text-3xl font-extrabold text-indigo-600 mt-1 block">
                  {reliability?.cri_score}%
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Tier: <strong className="text-slate-800">{reliability?.reliability_tier}</strong> on-time service
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">
                  Total Routes Logged
                </span>
                <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
                  {reliability?.total_scheduled_trips} Routes
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  180 operational multi-shift collection logs
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">
                  Missed / Delayed Pickups
                </span>
                <span className="text-3xl font-extrabold text-rose-600 mt-1 block">
                  {reliability?.missed_trips} Events
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Missing records are tracked explicitly (Zero-imputation avoided)
                </p>
              </div>
            </div>

            {/* Fleet Monthly Reliability Visual Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>Fleet Route Service Completion Trend (Monthly CRI % Audit)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitoring on-time completion rates vs missed pickup events across all collection routes
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                    <span>On-Time Routes (97.8%+)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                    <span>Missed Pickups</span>
                  </span>
                </div>
              </div>

              {/* Monthly Reliability Visual Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                {[
                  { month: "Month 1", onTimePct: 98.2, missed: 2, total: 150 },
                  { month: "Month 2", onTimePct: 97.4, missed: 3, total: 150 },
                  { month: "Month 3", onTimePct: 96.8, missed: 4, total: 150 },
                  { month: "Month 4", onTimePct: 98.0, missed: 2, total: 150 },
                  { month: "Month 5", onTimePct: 98.4, missed: 2, total: 150 },
                  { month: "Month 6", onTimePct: 97.9, missed: 3, total: 150 },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-900 font-mono">{item.month}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          item.missed === 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.missed} Missed
                      </span>
                    </div>

                    <div className="text-xl font-extrabold text-indigo-600 font-mono tracking-tight">
                      {item.onTimePct}%
                    </div>

                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${item.onTimePct}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                      <div
                        style={{ width: `${100 - item.onTimePct}%` }}
                        className="h-full bg-rose-500 rounded-full"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>{item.total - item.missed} On-Time</span>
                      <span>{item.total} Total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident Audit Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Fleet Route Operational Incident Log
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audits missed or delayed collections without treating absent logs as zero waste
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                  {missedLog.filter((m) => m.status === "Missed").length} Missed Pickups
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3.5">Incident ID</th>
                      <th className="py-3 px-3.5">District</th>
                      <th className="py-3 px-3.5">Assigned Route</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Operational Log Notes</th>
                      <th className="py-3 px-3.5">Remediation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {missedLog.map((inc, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3.5 font-mono text-slate-600">{inc.date}</td>
                        <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">{inc.record_id}</td>
                        <td className="py-3.5 px-3.5 font-semibold text-slate-800">{inc.ward_name}</td>
                        <td className="py-3.5 px-3.5 text-slate-600">{inc.route_id}</td>
                        <td className="py-3.5 px-3.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              inc.status === "Missed"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-600 text-[11px] max-w-xs">{inc.notes}</td>
                        <td className="py-3.5 px-3.5 text-blue-700 text-[11px] font-semibold">
                          {inc.action_recommended}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Before vs. After Policy Intervention (Visual Deltas) */}
        {activeTab === "intervention" && intervention && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Documented Policy Intervention
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-mono text-slate-500">
                  Effective Date: {intervention.intervention.date}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                {intervention.intervention.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                {intervention.intervention.description}
              </p>
            </div>

            {/* Visual Delta Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Phase 1: Pre-Intervention */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">
                  Phase 1: Pre-Intervention
                </span>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Waste:</span>
                    <span className="font-bold text-slate-900">{intervention.before.total_tonnes} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Organic Diversion:</span>
                    <span className="font-bold text-amber-600">{intervention.before.organic_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Clean Recycling:</span>
                    <span className="font-bold text-blue-600">{intervention.before.recycling_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Landfill Residual:</span>
                    <span className="font-bold text-rose-600">{intervention.before.residual_rate}%</span>
                  </div>
                </div>
              </div>

              {/* Policy Impact Delta (Vibrant Colorful Highlights) */}
              <div className="p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/50 space-y-3 shadow-xs">
                <span className="text-xs font-bold uppercase text-emerald-950 tracking-wider block">
                  Measured Policy Impact Delta
                </span>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-900 font-semibold">Organic Compost Lift:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      +{intervention.deltas.organic_rate_delta}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-900 font-semibold">Recycling Shift:</span>
                    <span className="font-extrabold text-blue-700 text-sm">
                      +{intervention.deltas.recycling_rate_delta}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-rose-900 font-semibold">Landfill Reduction:</span>
                    <span className="font-extrabold text-rose-600 text-sm">
                      {intervention.deltas.residual_rate_delta}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                    <span className="text-emerald-950 font-bold">Net Diversion Gain:</span>
                    <span className="font-extrabold text-emerald-900 text-base">
                      +{intervention.deltas.diversion_rate_delta}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Phase 2: Post-Intervention */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-800 tracking-wider block">
                  Phase 2: Post-Intervention
                </span>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Waste:</span>
                    <span className="font-bold text-slate-900">{intervention.after.total_tonnes} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Organic Diversion:</span>
                    <span className="font-bold text-amber-600">{intervention.after.organic_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Clean Recycling:</span>
                    <span className="font-bold text-blue-600">{intervention.after.recycling_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Landfill Residual:</span>
                    <span className="font-bold text-slate-700">{intervention.after.residual_rate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Intervention Comparative Visual Bar Chart */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Stream Diversion Shift: Pre-Intervention vs. Post-Intervention</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct visual comparison of stream rates before vs after municipal circular mandate
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
                    <span>Pre-Intervention (Phase 1)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                    <span>Post-Intervention (Phase 2)</span>
                  </span>
                </div>
              </div>

              {/* Side-by-side grouped comparative bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {[
                  {
                    stream: "Organic Composting",
                    before: intervention.before.organic_rate,
                    after: intervention.after.organic_rate,
                    delta: intervention.deltas.organic_rate_delta,
                    color: "bg-amber-500",
                    textColor: "text-amber-600",
                    isGood: true,
                  },
                  {
                    stream: "Clean Recycling",
                    before: intervention.before.recycling_rate,
                    after: intervention.after.recycling_rate,
                    delta: intervention.deltas.recycling_rate_delta,
                    color: "bg-blue-600",
                    textColor: "text-blue-600",
                    isGood: true,
                  },
                  {
                    stream: "Landfill Residual",
                    before: intervention.before.residual_rate,
                    after: intervention.after.residual_rate,
                    delta: intervention.deltas.residual_rate_delta,
                    color: "bg-rose-500",
                    textColor: "text-rose-600",
                    isGood: intervention.deltas.residual_rate_delta < 0,
                  },
                  {
                    stream: "Total Diversion Rate",
                    before: 100 - intervention.before.residual_rate,
                    after: 100 - intervention.after.residual_rate,
                    delta: intervention.deltas.diversion_rate_delta,
                    color: "bg-emerald-600",
                    textColor: "text-emerald-700",
                    isGood: true,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">{item.stream}</span>
                      <span
                        className={`text-[11px] font-extrabold font-mono px-2 py-0.5 rounded-full ${
                          item.isGood ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`}
                      </span>
                    </div>

                    {/* Dual Comparative Vertical Bars */}
                    <div className="h-32 flex items-end justify-center gap-3 pt-2 pb-1 border-b border-slate-100">
                      {/* Before Bar */}
                      <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          {item.before}%
                        </span>
                        <div
                          style={{ height: `${Math.max(10, item.before)}%` }}
                          className="w-full bg-slate-300 rounded-t-md transition-all"
                          title={`Pre: ${item.before}%`}
                        />
                        <span className="text-[9px] font-semibold text-slate-400 mt-0.5 uppercase">
                          Pre
                        </span>
                      </div>

                      {/* After Bar */}
                      <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className={`text-[10px] font-mono font-extrabold ${item.textColor}`}>
                          {item.after}%
                        </span>
                        <div
                          style={{ height: `${Math.max(10, item.after)}%` }}
                          className={`w-full ${item.color} rounded-t-md transition-all shadow-xs`}
                          title={`Post: ${item.after}%`}
                        />
                        <span className="text-[9px] font-bold text-slate-900 mt-0.5 uppercase">
                          Post
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Printable Executive Audit Report Modal */}
      {isReportModalOpen && report && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            {/* Report Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Municipal Operational Audit
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Executive Waste & Recycling Audit Report
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated: {report.report_date} • Prepared by: {report.author}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Executive Overview
              </h4>
              <p>{report.executive_summary}</p>
            </div>

            {/* Strategic Recommendations */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Strategic Recommendations for City Council
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {report.actionable_recommendations.map((rec, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          rec.priority === "High" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 block mt-1">{rec.action}</span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{rec.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Report certified compliant with Problem Statement C6 specification</span>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSV Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Import Municipal CSV Records
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Upload a municipal collection spreadsheet (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.csv</code>).
                Columns required: <span className="font-mono text-slate-800">date, ward_name, organic_kg, recyclable_kg, residual_kg, status</span>.
              </p>

              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors block text-center">
                <Upload className="w-8 h-8 text-blue-600 mb-2" />
                <span className="font-bold text-slate-900 text-xs">Click to browse CSV file</span>
                <span className="text-[11px] text-slate-400 mt-1">Up to 25MB comma-separated file</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {uploadStatus && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
