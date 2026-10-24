export interface PixelCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface BoundingBox {
  x1: number; // 0.0 - 1.0 normalized
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  pixel: PixelCoords;
}

export type RecyclabilityState =
  | "Recyclable"
  | "Conditionally recyclable"
  | "Reusable"
  | "Compostable"
  | "Special handling required"
  | "Generally non-recyclable"
  | "Needs verification";

export type RecyclabilityStatus = RecyclabilityState | "Non-recyclable" | "Special handling";

export interface ReuseIdea {
  title: string;
  difficulty: "Easy" | "Moderate" | "Advanced";
  materials_needed?: string[] | string;
  instructions: string[] | string;
  safety_precautions?: string[] | string;
  food_safe?: boolean;
  heat_warning?: boolean;
}

export interface ReuseSuitability {
  object_label: string;
  suitable: boolean;
  reason: string;
  warning?: string | null;
  ideas: ReuseIdea[];
}

export interface MaterialClassification {
  object_label: string;
  likely_material: string;
  candidates: string[];
  confidence_level: "High" | "Medium" | "Low / Uncertain";
  uncertainty_reason?: string | null;
  condition_assessed?: string | null;
  contamination_notes?: string | null;
}

export interface LocalGuidance {
  jurisdiction: string;
  region_code: string;
  curbside_accepted: boolean;
  facility_acceptance_verified: boolean;
  facility_notes?: string | null;
  disclaimer: string;
}

export interface RecyclingIntelligence {
  category: string;
  material_classification: MaterialClassification;
  recyclability_state: RecyclabilityState;
  state_rationale: string;
  disposal_recommendation: string;
  reuse_suitability: ReuseSuitability;
  local_guidance: LocalGuidance;
  verification_checklist: string[];
  caveat: string;
  // Backward compatibility convenience fields
  material?: string;
  material_candidates?: string[];
  recyclability?: RecyclabilityState | string;
  recommended_disposal?: string;
  reuse_ideas?: string[];
}

export interface DetectionItem {
  id: string;
  class_name: string;
  class_id: number;
  confidence: number;
  bbox: BoundingBox;
  intelligence: RecyclingIntelligence;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DetectionResponse {
  detections: DetectionItem[];
  count: number;
  image_dimensions: ImageDimensions;
  inference_time_ms: number;
  model_name: string;
  model_type: string;
  active_threshold: number;
  frame_id?: number;
  iou_threshold?: number;
}

export interface ModelMetadataResponse {
  model_name: string;
  model_path: string;
  model_type: string;
  is_waste_specific: boolean;
  device: string;
  supported_classes_count: number;
  classes: string[];
  default_confidence: number;
  default_iou_threshold: number;
  waste_taxonomy_mapping: Record<string, string>;
  concurrency_limit: number;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "offline";
  app_name: string;
  version: string;
  model_loaded: boolean;
  model_name: string;
  device: string;
  supported_classes_count: number;
}

export interface SupportedCategory {
  name: string;
  description: string;
  icon_name: string;
  known_coco_examples: string[];
  disposal_overview: string;
}

export interface DetectionHistoryItem {
  id: string;
  timestamp: string;
  source: "webcam" | "upload";
  detection: DetectionItem;
  thumbnailUrl?: string;
}

export type CameraStatus =
  | "idle"
  | "requesting_permission"
  | "streaming"
  | "paused"
  | "permission_denied"
  | "not_found"
  | "error";

export type WorkspaceMode = "live" | "upload";

export type MainNavTab = "analytics" | "vision";

// ==========================================
// WasteWise Municipal Analytics Types (C6)
// ==========================================

export interface AnalyticsSummary {
  unit: string;
  total_waste: number;
  total_organic: number;
  total_recyclable: number;
  total_residual: number;
  recycling_rate_pct: number;
  organic_diversion_pct: number;
  total_diversion_pct: number;
  landfill_residual_pct: number;
  co2_avoided_tonnes: number;
}

export interface ReliabilityMetrics {
  cri_score: number;
  total_scheduled_trips: number;
  on_time_trips: number;
  delayed_trips: number;
  missed_trips: number;
  reliability_tier: "Excellent" | "Moderate" | "Operational Risk";
}

export interface CompositionItem {
  category: string;
  tonnes: number;
  pct: number;
  color: string;
}

export interface TimeSeriesDataPoint {
  period: string;
  total: number;
  organic: number;
  recyclable: number;
  residual: number;
  recycling_rate: number;
}

export interface AnalyticsMetricsResponse {
  summary: AnalyticsSummary;
  reliability: ReliabilityMetrics;
  composition_breakdown: CompositionItem[];
  time_series: TimeSeriesDataPoint[];
}

export interface NeighbourhoodComparison {
  ward_name: string;
  zone_type: string;
  population: number;
  households: number;
  route_id: string;
  total_generated: number;
  organic_generated: number;
  recyclable_generated: number;
  residual_generated: number;
  daily_per_capita_kg: number;
  monthly_per_household_kg: number;
  recycling_rate_pct: number;
  total_diversion_rate_pct: number;
  cri_score: number;
  missed_count: number;
  performance_tier: "Leader" | "High Performer" | "Moderate" | "Needs Intervention";
}

export interface MissedCollectionRecord {
  record_id: string;
  date: string;
  ward_name: string;
  route_id: string;
  status: "Missed" | "Delayed";
  impact_kg: number;
  notes: string;
  action_recommended: string;
}

export interface InterventionSlice {
  total_tonnes: number;
  organic_tonnes: number;
  recyclable_tonnes: number;
  residual_tonnes: number;
  recycling_rate: number;
  organic_rate: number;
  diversion_rate: number;
  residual_rate: number;
}

export interface InterventionAnalysis {
  intervention: {
    title: string;
    date: string;
    description: string;
  };
  before: InterventionSlice;
  after: InterventionSlice;
  deltas: {
    organic_rate_delta: number;
    recycling_rate_delta: number;
    residual_rate_delta: number;
    diversion_rate_delta: number;
  };
  verdict: string;
}

export interface ExecutiveReport {
  report_title: string;
  report_date: string;
  author: string;
  executive_summary: string;
  key_findings: string[];
  actionable_recommendations: {
    action: string;
    priority: "High" | "Medium" | "Low";
    details: string;
  }[];
  metrics_snapshot: AnalyticsSummary;
  reliability_snapshot: ReliabilityMetrics;
}
