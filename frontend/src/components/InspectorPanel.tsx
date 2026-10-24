import React, { useState } from "react";
import { DetectionItem } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { UpcyclingStudioModal } from "./UpcyclingStudioModal";
import {
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  Trash2,
  PackageCheck,
  X,
  ChevronDown,
  Wrench,
  Leaf,
  ShieldAlert,
  Maximize2,
  Filter,
  CheckCircle2,
  Upload,
  Factory,
  RefreshCw,
  Zap,
} from "lucide-react";

interface InspectorPanelProps {
  selectedDetection: DetectionItem | null;
  onClearSelection: () => void;
  allDetections: DetectionItem[];
  onSelectDetection: (det: DetectionItem) => void;
  onTriggerUpload?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedDetection,
  onClearSelection,
  allDetections,
  onSelectDetection,
  onTriggerUpload,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(true);

  const toggleCheck = (idx: number) => {
    const key = `${selectedDetection?.id}_${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getUpcycledVisual = (label: string, material?: string) => {
    const text = `${label} ${material || ""}`.toLowerCase();

    // 1. Organic / Food / Fruit scraps
    if (
      text.includes("apple") ||
      text.includes("banana") ||
      text.includes("orange") ||
      text.includes("food") ||
      text.includes("organic") ||
      text.includes("vegetable") ||
      text.includes("fruit") ||
      text.includes("bread") ||
      text.includes("compost")
    ) {
      return {
        src: "/upcycling/organic_compost.jpg",
        title: "Nutrient-Rich Aerobic Compost & Garden Bio-Fertilizer",
        category: "Soil Regeneration & Biocycle",
        co2: "420g CO₂e avoided (zero landfill methane)",
        lifespan: "Permanent Soil Enrichment",
        diversion: "100% Organics Diverted",
        energy: "Zero Synthetic Fertilizer Energy",
        factory_transformation:
          "Municipal anaerobic digestion & composting facilities ferment food scraps into certified Class-A soil humus conditioner and capture methane gas to generate clean municipal electricity.",
        steps: [
          { phase: "Phase 1: Fraction Sorting", text: "Remove any plastic produce stickers, twist ties, or non-biodegradable packaging." },
          { phase: "Phase 2: Carbon Balance", text: "Chop food scraps finely and blend with dry carbon 'browns' (shredded cardboard, dry leaves, or sawdust) at a 1:2 ratio." },
          { phase: "Phase 3: Aerobic Aeration", text: "Place in an aerated compost bin or tumbler; turn every 4 days to supply oxygen and promote beneficial thermophilic bacteria." },
          { phase: "Phase 4: Botanical Feeding", text: "In 4-8 weeks, cure into rich, dark, earthy compost and top-dress house plants, garden beds, or vegetable patches." },
        ],
      };
    }

    // 2. Glass containers / bottles / jars
    if (
      text.includes("glass") ||
      text.includes("jar") ||
      (text.includes("bottle") && text.includes("glass")) ||
      text.includes("wine")
    ) {
      return {
        src: "/upcycling/glass_terrarium.jpg",
        title: "Minimalist Botanical Succulent & Moss Terrarium",
        category: "Biophilic Interior Ecology",
        co2: "310g CO₂e avoided",
        lifespan: "Permanent Utility",
        diversion: "100% Landfill Diverted",
        energy: "100% Furnace Remelt Energy Saved",
        factory_transformation:
          "Glass cullet is crushed and melted in remelt furnaces at 1500°C to blow new glass bottles and jars infinitely without any structural loss in molecular purity.",
        steps: [
          { phase: "Phase 1: Sterilization", text: "Wash glass thoroughly with hot water and dry with a lint-free cloth." },
          { phase: "Phase 2: Drainage Bed", text: "Layer 1 inch of clean gravel or activated charcoal at the base for root aeration." },
          { phase: "Phase 3: Botanical Planting", text: "Add cactus potting soil and delicately embed miniature succulents, pebbles, and moss." },
          { phase: "Phase 4: Microclimate Setup", text: "Mist lightly with clean water; place on a bright desk or windowsill for biophilic elegance." },
        ],
      };
    }

    // 3. Cardboard / Paper / Carton / Box
    if (
      text.includes("box") ||
      text.includes("cardboard") ||
      text.includes("paper") ||
      text.includes("carton")
    ) {
      return {
        src: "/upcycling/cardboard_craft.jpg",
        title: "Artisan Modular Desktop Stationery Organizer",
        category: "Zero-Waste Workspace Utility",
        co2: "165g CO₂e avoided",
        lifespan: "+18 Months Extended Utility",
        diversion: "100% Landfill Diverted",
        energy: "92% Virgin Wood Pulp Energy Preserved",
        factory_transformation:
          "Recycled corrugated paperboard is slurried with water into brown pulp, filtered of inks and tape, and rolled into sturdy fluted corrugated sheets for new shipping boxes and egg cartons.",
        steps: [
          { phase: "Phase 1: Disassembly & Flattening", text: "Carefully slit tape seams, remove shipping labels, and flatten clean corrugated cardboard flutes." },
          { phase: "Phase 2: Precision Slot Cutting", text: "Mark 3 modular divider compartments and cut matching interlocking interlocking slots using a craft ruler and safety blade." },
          { phase: "Phase 3: Interlocking Assembly", text: "Slot divider ribs together firmly; reinforce edges with non-toxic craft glue or decorative natural paper tape." },
          { phase: "Phase 4: Desk Organization", text: "Deploy as a clean desktop caddy for pens, notebooks, scissors, stationery, and small succulent planters." },
        ],
      };
    }

    // 4. Aluminum / Tin / Metal Cans
    if (
      text.includes("can") ||
      text.includes("tin") ||
      text.includes("aluminum") ||
      text.includes("metal")
    ) {
      return {
        src: "/upcycling/can_organizer.jpg",
        title: "Rustic Desk Organizer & Artisan Tool Caddy",
        category: "Sustainable Workspace Utility",
        co2: "220g CO₂e avoided",
        lifespan: "+48 Months Utility",
        diversion: "100% Landfill Diverted",
        energy: "95% Smelting Energy Conserved",
        factory_transformation:
          "Aluminum cans are shredded, de-coated, and melted into high-grade rolling ingots. A recycled can returns to grocery shelves as a brand new beverage can in as little as 60 days!",
        steps: [
          { phase: "Phase 1: Deburring & Safety", text: "Crimp and fold the inner cut edge using pliers to remove sharp hazards." },
          { phase: "Phase 2: Degrease & Dry", text: "Rinse interior with mild dish soap and dry completely to prevent spot oxidation." },
          { phase: "Phase 3: Artisan Twine Wrap", text: "Spiral natural jute twine around the canister using water-based non-toxic sealant." },
          { phase: "Phase 4: Workspace Utility", text: "Organize drafting markers, scissors, cables, or artist brushes to declutter your desk." },
        ],
      };
    }

    // 5. Cups (Paper / Coffee cups)
    if (text.includes("cup")) {
      return {
        src: "/upcycling/cup_seedling.jpg",
        title: "Biodegradable Nursery Seedling Starter",
        category: "Organic Soil Regeneration",
        co2: "95g CO₂e avoided",
        lifespan: "+6 Months Organic Cycle",
        diversion: "100% Natural Soil Return",
        energy: "Zero Industrial Reprocessing",
        factory_transformation:
          "Specialized hydrapulping mills separate the poly-lining from high-grade white paper fibers to manufacture recycled paper towels and kraft shipping envelopes.",
        steps: [
          { phase: "Phase 1: Base Aeration", text: "Puncture 3 small drainage perforations through the bottom rim using a pushpin." },
          { phase: "Phase 2: Soil Enrichment", text: "Fill cup 3/4 with peat-free organic seed compost and moisten lightly with spray mist." },
          { phase: "Phase 3: Seed Sowing", text: "Press herb or vegetable seeds 0.25 inches deep and set in a warm, indirect sunlit spot." },
          { phase: "Phase 4: Direct Ground Planting", text: "Once roots establish, plant the entire paper pot directly into outdoor soil—it naturally enriches the earth." },
        ],
      };
    }

    // 6. Plastic Bottles / Containers / Jugs (Default Plastic)
    if (
      text.includes("bottle") ||
      text.includes("plastic") ||
      text.includes("pet") ||
      text.includes("polyethylene")
    ) {
      return {
        src: "/upcycling/bottle_planter.jpg",
        title: "Self-Watering Hydroponic Botanical Planter",
        category: "Zero-Waste Horticultural Design",
        co2: "185g CO₂e avoided",
        lifespan: "+36 Months Utility",
        diversion: "100% Landfill Diverted",
        energy: "88% Less Energy vs Virgin Resin",
        factory_transformation:
          "PET plastic bottles are washed, optically sorted, shredded into clean flakes, and extruded into recycled polyester fleece clothing, tote bag yarn, or new thermoformed food containers.",
        steps: [
          { phase: "Phase 1: Decontamination", text: "Strip exterior labels, remove plastic cap ring, and rinse with warm water." },
          { phase: "Phase 2: Precision Cut", text: "Slice horizontally across the bottle 4 inches below the shoulder neck seam." },
          { phase: "Phase 3: Capillary Wick Setup", text: "Pierce bottle cap with a 5mm hole, thread a 10-inch braided cotton wick, and invert top cone into base." },
          { phase: "Phase 4: Planting & Auto-Hydration", text: "Fill upper cone with potting soil & microgreen seeds; fill base with water for passive wicking." },
        ],
      };
    }

    // Universal Fallback
    return {
      src: "/upcycling/cardboard_craft.jpg",
      title: "Modular Circular Container & Organizer",
      category: "Sustainable Resource Recovery",
      co2: "120g CO₂e avoided",
      lifespan: "+24 Months Utility",
      diversion: "100% Landfill Diverted",
      energy: "Direct Material Re-utility",
      factory_transformation:
        "Materials are optically separated at the Materials Recovery Facility (MRF), baled into industrial commodity bundles, and shipped to regional reclaimers for circular manufacturing.",
      steps: [
        { phase: "Phase 1: Fraction Sorting", text: "Disassemble components into clean single-material fractions." },
        { phase: "Phase 2: Structural Trimming", text: "Cut along natural molded structural ridges for optimal durability." },
        { phase: "Phase 3: Hardware Sorting", text: "Deploy as stackable sorting trays for hardware, craft beads, or seed markers." },
      ],
    };
  };

  const upcycledVisual = selectedDetection
    ? getUpcycledVisual(
        selectedDetection.class_name,
        selectedDetection.intelligence?.material_classification?.likely_material ||
          selectedDetection.intelligence?.material
      )
    : null;

  return (
    <aside
      className="w-full md:w-84 lg:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 h-full overflow-hidden select-none z-20"
      aria-label="Object Inspector and Upcycling Guide"
    >
      {/* 1. Inspector Panel Top Bar */}
      <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            Waste Analysis & Upcycling
          </span>
          {allDetections.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
              {allDetections.length} items
            </span>
          )}
        </div>

        {selectedDetection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Deselect object"
            aria-label="Deselect object"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Top Dropdown Selector for All Wastage (When Detections Exist) */}
      {allDetections.length > 0 && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-900">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Detected Wastage ({allDetections.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click to inspect</span>
          </label>
          <div className="relative">
            <select
              value={selectedDetection?.id || ""}
              onChange={(e) => {
                const found = allDetections.find((d) => d.id === e.target.value);
                if (found) onSelectDetection(found);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer capitalize"
            >
              <option value="" disabled>
                -- Choose any detected waste item --
              </option>
              {allDetections.map((det, idx) => (
                <option key={`${det.id}-${idx}`} value={det.id}>
                  #{idx + 1} {det.class_name.toUpperCase()} — {det.intelligence?.recyclability_state || det.intelligence?.recyclability || "Detected"} ({Math.round(det.confidence * 100)}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. Horizontal / Compact List of All Detected Waste Items (Always Visible beside image) */}
      {allDetections.length > 0 && (
        <div className="px-3 py-2 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              All Detected Wastage in Photo
            </span>
            <span className="text-[10px] text-slate-400">
              Click to view creation guide
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {allDetections.map((det, idx) => {
              const isSelected = selectedDetection?.id === det.id;
              const recState =
                det.intelligence?.recyclability_state ||
                det.intelligence?.recyclability ||
                "";
              const isRecyclable =
                recState === "Recyclable" || recState === "Conditionally recyclable";
              const isOrganic = recState === "Compostable";
              const isSpecial = recState === "Special handling required";

              return (
                <button
                  key={`${det.id}-${idx}`}
                  type="button"
                  onClick={() => onSelectDetection(det)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-slate-900 text-white font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected
                        ? "bg-blue-400"
                        : isRecyclable
                        ? "bg-blue-500"
                        : isOrganic
                        ? "bg-amber-500"
                        : isSpecial
                        ? "bg-purple-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <span className="text-xs capitalize">{det.class_name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                    {Math.round(det.confidence * 100)}%
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Main Inspector Body Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedDetection ? (
          <>
            {/* Object Header & Recyclability State Card */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 shadow-2xs">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Active Inspected Waste
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 capitalize tracking-tight mt-0.5">
                    {selectedDetection.class_name}
                  </h3>
                </div>
                <StatusBadge
                  status={
                    selectedDetection.intelligence?.recyclability_state ||
                    selectedDetection.intelligence?.recyclability
                  }
                  size="md"
                />
              </div>

              {/* Recyclability State Rationale */}
              {selectedDetection.intelligence?.state_rationale && (
                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mb-2 leading-relaxed">
                  {selectedDetection.intelligence.state_rationale}
                </p>
              )}

              {/* Likely Material & Confidence Bar */}
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500">
                    Material:{" "}
                    <strong className="text-slate-900 font-semibold">
                      {selectedDetection.intelligence?.material_classification?.likely_material ||
                        selectedDetection.intelligence?.material ||
                        "Mixed Fractions"}
                    </strong>
                  </span>
                  <span className="font-mono font-bold text-blue-600">
                    {Math.round(selectedDetection.confidence * 100)}% Confidence
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(selectedDetection.confidence * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 🌟 5. PROMINENT "WHAT CAN BE CREATED WITH THIS WASTE" SECTION */}
            {(() => {
              const recState = selectedDetection.intelligence?.recyclability_state;
              const isNonRecyclable =
                recState === "Generally non-recyclable" ||
                (recState as string) === "Non-recyclable";

              if (isNonRecyclable) {
                return (
                  <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-rose-950 font-bold">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <h4 className="text-xs">Landfill Residual Waste</h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                        Non-Recyclable
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 leading-snug">
                      This object consists of composite or contaminated materials that cannot be safely upcycled into domestic items without toxic leach risk or processed in single-stream recycling facilities.
                    </p>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-800 space-y-1">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                        <Trash2 className="w-3.5 h-3.5 text-slate-600" />
                        Recommended Disposal Action:
                      </span>
                      <p className="text-slate-600 leading-snug">
                        {selectedDetection.intelligence?.disposal_recommendation ||
                          selectedDetection.intelligence?.recommended_disposal}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs space-y-0">
                  {/* Section Title Banner: Sleek Slate-900 */}
                  <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                          Circular Economy Innovation
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          What Can Be Created With This Waste
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-blue-300 font-semibold">
                      Upcycling Studio
                    </span>
                  </div>

                  {/* Transformed Visual Photo Preview */}
                  {upcycledVisual && (
                    <div
                      onClick={() => setIsStudioOpen(true)}
                      className="relative group overflow-hidden bg-slate-950 cursor-pointer"
                      title="Click to view full-screen Upcycling Studio"
                    >
                      <img
                        src={upcycledVisual.src}
                        alt={upcycledVisual.title}
                        className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-blue-300 text-[10px] font-bold tracking-wide">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Transformed Creation</span>
                        </span>
                        <span className="p-1 rounded-full bg-black/60 backdrop-blur-md text-white/80 group-hover:text-white group-hover:scale-110 transition-all">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      {/* Bottom Banner Title */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                        <p className="text-[10px] text-blue-300 font-mono tracking-wider uppercase font-semibold">
                          {upcycledVisual.category}
                        </p>
                        <h4 className="text-xs font-bold leading-tight mt-0.5 text-white drop-shadow-xs">
                          {upcycledVisual.title}
                        </h4>
                      </div>
                    </div>
                  )}

                  {/* Creation Details Body */}
                  {upcycledVisual && (
                    <div className="p-4 space-y-3.5 bg-white">
                      {/* Colorful Impact Metrics: Green, Blue, Amber */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                          <span className="text-emerald-800 block text-[9px] font-bold uppercase">Carbon Avoided</span>
                          <span className="font-extrabold text-emerald-700 text-xs block mt-0.5">
                            🌱 {upcycledVisual.co2}
                          </span>
                        </div>
                        <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-blue-800 block text-[9px] font-bold uppercase">Utility Lifespan</span>
                          <span className="font-extrabold text-blue-700 text-xs block mt-0.5">
                            🔄 {upcycledVisual.lifespan}
                          </span>
                        </div>
                      </div>

                      {/* Industrial Factory Transformation Note */}
                      {upcycledVisual.factory_transformation && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                            <Factory className="w-3.5 h-3.5 text-blue-600" />
                            <span>Industrial Factory Transformation</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {upcycledVisual.factory_transformation}
                          </p>
                        </div>
                      )}

                      {/* Expandable Step-by-Step DIY Creation Guide */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setIsWorkflowExpanded((prev) => !prev)}
                          className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-blue-600" />
                            <span>DIY Creation Guide ({upcycledVisual.steps.length} Phases)</span>
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                              isWorkflowExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isWorkflowExpanded && (
                          <div className="p-3 space-y-2 border-t border-slate-100 bg-white">
                            {upcycledVisual.steps.map((st, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 text-[11px] leading-snug p-2 rounded-lg bg-slate-50/80 border border-slate-100"
                              >
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                                  {i + 1}
                                </span>
                                <div>
                                  <span className="font-bold text-slate-900 block mb-0.5">
                                    {st.phase}
                                  </span>
                                  <span className="text-slate-600">{st.text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Fullscreen Creation Workshop CTA Button */}
                      <button
                        type="button"
                        onClick={() => setIsStudioOpen(true)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Launch Fullscreen Workshop</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Responsible Municipal Disposal Route */}
            <div className="border border-[#E4E4E7] rounded-xl p-3.5 bg-white shadow-2xs">
              <div className="flex items-center gap-1.5 mb-1.5 text-[#18181B]">
                <Trash2 className="w-3.5 h-3.5 text-zinc-600" />
                <h4 className="text-xs font-bold">Responsible Disposal Recommendation</h4>
              </div>
              <p className="text-xs text-[#18181B] leading-relaxed bg-[#F7F8FA] p-2.5 rounded-lg border border-[#E4E4E7] font-normal">
                {selectedDetection.intelligence?.disposal_recommendation ||
                  selectedDetection.intelligence?.recommended_disposal}
              </p>
            </div>

            {/* Interactive Physical Verification Checklist */}
            {selectedDetection.intelligence?.verification_checklist?.length > 0 && (
              <div className="border border-amber-200 rounded-xl p-3.5 bg-amber-50/30">
                <div className="flex items-center gap-1.5 mb-1 text-amber-900">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                  <h4 className="text-xs font-bold">Physical Verification Checklist</h4>
                </div>
                <p className="text-[11px] text-[#71717A] mb-2 leading-relaxed">
                  Verify these conditions before placing in recycling bins or crafting:
                </p>

                <div className="space-y-1.5">
                  {selectedDetection.intelligence.verification_checklist.map((step, idx) => {
                    const isChecked = !!checkedItems[`${selectedDetection.id}_${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleCheck(idx)}
                        className={`flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                          isChecked
                            ? "bg-white border-emerald-300 text-zinc-400"
                            : "bg-white/90 border-[#E4E4E7] text-[#18181B] hover:bg-white"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </div>
                        <span className={`leading-tight ${isChecked ? "line-through" : ""}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State when no item is selected or no photo uploaded yet */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                Upload An Image to Discover Upcycling Creations
              </h4>
              <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
                Upload any photo of waste from your device or pick a preset sample. Our AI will detect all items with bounding boxes and show what can be created from each!
              </p>
            </div>

            {onTriggerUpload && (
              <button
                type="button"
                onClick={onTriggerUpload}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image from Device</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Upcycling Studio Modal */}
      {selectedDetection && upcycledVisual && (
        <UpcyclingStudioModal
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          project={upcycledVisual}
          objectLabel={selectedDetection.class_name}
          materialName={
            selectedDetection.intelligence?.material_classification?.likely_material ||
            selectedDetection.intelligence?.material ||
            "Recyclable Material"
          }
        />
      )}
    </aside>
  );
};
