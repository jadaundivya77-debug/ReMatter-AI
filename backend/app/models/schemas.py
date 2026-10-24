from typing import List, Optional, Literal
from pydantic import BaseModel, Field, computed_field


class PixelCoords(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    width: int
    height: int


class BoundingBox(BaseModel):
    # Normalized coordinates (0.0 to 1.0) for resolution-independent overlay alignment
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float
    # Absolute pixel coordinates
    pixel: PixelCoords


# Requirement 2: Explicit recyclability states
RecyclabilityState = Literal[
    "Recyclable",
    "Conditionally recyclable",
    "Reusable",
    "Compostable",
    "Special handling required",
    "Generally non-recyclable",
    "Needs verification",
]


class ReuseIdea(BaseModel):
    title: str = Field(..., description="Actionable title for the upcycling project")
    difficulty: Literal["Easy", "Moderate", "Advanced"] = Field(
        ..., description="Practical effort level required"
    )
    materials_needed: List[str] = Field(
        default_factory=list, description="Common household tools or supplies required"
    )
    instructions: str = Field(
        ..., description="Concise, step-by-step guidance for completing the project"
    )
    safety_precautions: str = Field(
        ..., description="Specific precautions to prevent injury or contamination"
    )


class ReuseSuitability(BaseModel):
    is_suitable: bool = Field(
        ..., description="Whether this object is physically and safely suited for reuse"
    )
    ideas: List[ReuseIdea] = Field(
        default_factory=list, description="Structured practical upcycling ideas"
    )
    safety_warning: Optional[str] = Field(
        None,
        description="Crucial warning when chemical, heat, battery, or food-contact hazards make reuse unsafe",
    )

    @computed_field
    @property
    def suitable(self) -> bool:
        return self.is_suitable

    @computed_field
    @property
    def warning(self) -> Optional[str]:
        return self.safety_warning


class LocalGuidance(BaseModel):
    region_code: str = Field(
        default="DEFAULT_SINGLE_STREAM",
        description="Active jurisdiction rule profile",
    )
    facility_acceptance_verified: bool = Field(
        default=False,
        description="Whether local municipal MRF acceptance has been specifically verified with evidence",
    )
    guidance_notes: str = Field(
        ..., description="Specific sorting notes applicable to baseline or regional MRFs"
    )
    disclaimer: str = Field(
        ...,
        description="Explicit note stating if regional rules are unverified or vary by zip code",
    )

    @computed_field
    @property
    def jurisdiction(self) -> str:
        return self.region_code

    @computed_field
    @property
    def curbside_accepted(self) -> bool:
        notes = self.guidance_notes.lower()
        return "accepted" in notes or "curbside" in notes and "reject" not in notes and "exclusively accept" not in notes


class MaterialClassification(BaseModel):
    primary_material: str = Field(..., description="Most probable dominant material")
    material_candidates: List[str] = Field(
        default_factory=list,
        description="Plausible physical materials for this object type",
    )
    material_confidence: Literal["High", "Medium", "Low / Uncertain"] = Field(
        ..., description="Confidence level regarding physical composition"
    )
    uncertainty_explanation: str = Field(
        ..., description="Reason why physical composition cannot be deduced purely from optical shape"
    )
    condition_assessment: str = Field(
        default="Unassessed via camera stream; physical check required for food residue, chemical contamination, or structural degradation",
        description="Status of physical condition or contamination assessment",
    )

    @computed_field
    @property
    def likely_material(self) -> str:
        return self.primary_material

    @computed_field
    @property
    def candidates(self) -> List[str]:
        return self.material_candidates

    @computed_field
    @property
    def confidence_level(self) -> str:
        return self.material_confidence

    @computed_field
    @property
    def uncertainty_reason(self) -> str:
        return self.uncertainty_explanation

    @computed_field
    @property
    def condition_assessed(self) -> str:
        return self.condition_assessment


class RecyclingIntelligence(BaseModel):
    category: str = Field(..., description="Canonical waste category")
    material: MaterialClassification = Field(
        ..., description="Independent material classification with uncertainty metrics"
    )
    # Retained for direct backward-compatibility with existing consumers
    material_candidates: List[str] = Field(
        default_factory=list,
        description="Plausible physical materials for this object type",
    )
    recyclability: RecyclabilityState = Field(
        ...,
        description="Explicit recyclability status according to material and facility capability",
    )
    recyclability_rationale: str = Field(
        ..., description="Technical rationale behind the recyclability decision"
    )
    verification_checklist: List[str] = Field(
        default_factory=list,
        description="Physical checks user must perform before disposal",
    )
    recommended_disposal: str = Field(..., description="Actionable disposal routing")
    # Retained for direct backward-compatibility
    reuse_ideas: List[str] = Field(
        default_factory=list,
        description="Summary list of reuse titles",
    )
    reuse: ReuseSuitability = Field(
        ..., description="Detailed structured reuse and upcycling knowledge base"
    )
    local_guidance: LocalGuidance = Field(
        ..., description="Jurisdiction-specific guidance and MRF acceptance status"
    )
    caveat: str = Field(
        ...,
        description="Explicit limitation note explaining why object recognition alone does not prove material composition",
    )

    @computed_field
    @property
    def material_classification(self) -> MaterialClassification:
        return self.material

    @computed_field
    @property
    def recyclability_state(self) -> RecyclabilityState:
        return self.recyclability

    @computed_field
    @property
    def state_rationale(self) -> str:
        return self.recyclability_rationale

    @computed_field
    @property
    def disposal_recommendation(self) -> str:
        return self.recommended_disposal

    @computed_field
    @property
    def reuse_suitability(self) -> ReuseSuitability:
        return self.reuse


class DetectionItem(BaseModel):
    id: str
    class_name: str
    class_id: int
    confidence: float
    bbox: BoundingBox
    intelligence: RecyclingIntelligence


class ImageDimensions(BaseModel):
    width: int
    height: int


class DetectionResponse(BaseModel):
    detections: List[DetectionItem]
    count: int
    image_dimensions: ImageDimensions
    inference_time_ms: float
    model_name: str
    model_type: str
    active_threshold: float
    frame_id: Optional[int] = Field(None, description="Sequence identifier echoed from client to drop out-of-order frames")
    iou_threshold: Optional[float] = Field(None, description="Active NMS IoU overlap threshold")


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    model_loaded: bool
    model_name: str
    device: str
    supported_classes_count: int


class ModelMetadataResponse(BaseModel):
    model_name: str = Field(..., description="Model file basename or identifier")
    model_path: str = Field(..., description="Configured model weights path")
    model_type: str = Field(..., description="Explicit description of training dataset (e.g. COCO baseline vs TACO waste fine-tuned)")
    is_waste_specific: bool = Field(..., description="True if trained directly on waste taxonomy, False if generic COCO baseline")
    device: str = Field(..., description="Inference device (cpu/cuda/mps)")
    supported_classes_count: int = Field(..., description="Number of detectable categories")
    classes: List[str] = Field(default_factory=list, description="Ordered list of detectable class names")
    default_confidence: float = Field(..., description="Baseline confidence threshold")
    default_iou_threshold: float = Field(..., description="NMS IoU overlap threshold")
    waste_taxonomy_mapping: dict = Field(default_factory=dict, description="Mapping of object labels to canonical waste streams")
    concurrency_limit: int = Field(..., description="Maximum simultaneous active model inference requests")


class MaterialEvaluationRequest(BaseModel):
    object_label: str = Field(..., description="Detected or user-specified object category")
    image_crop_base64: Optional[str] = Field(None, description="Optional base64 cropped image of the object")
    context_notes: Optional[str] = Field(None, description="Optional context (e.g. 'from takeout restaurant', 'opaque jug')")


class MaterialEvaluationResponse(BaseModel):
    object_label: str
    likely_material: str
    material_candidates: List[str]
    material_confidence: Literal["High", "Medium", "Low / Uncertain"]
    material_confidence_score: float = Field(..., ge=0.0, le=1.0, description="Numerical confidence (0.0 - 1.0) distinct from object detection confidence")
    uncertainty_score: float = Field(..., ge=0.0, le=1.0, description="Uncertainty magnitude (0.0 = absolute certainty, 1.0 = purely ambiguous)")
    uncertainty_explanation: str
    condition_assessment: str
    optical_limits_note: str


class SupportedCategory(BaseModel):
    name: str
    description: str
    icon_name: str
    known_coco_examples: List[str]
    disposal_overview: str

