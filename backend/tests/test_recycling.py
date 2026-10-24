"""
Unit tests for ReMatter AI's Recycling Intelligence Layer.
Covers:
1. Independent material classification & confidence representation
2. All 7 explicit recyclability states (never assuming recyclability by form factor)
3. Structured reuse projects, difficulty, tools, safety precautions & hazard warnings
4. Extensible local guidance and municipal disclaimers
5. FastAPI endpoints (/api/intelligence/{class} and /api/reuse/{class})
"""

from typing import get_args
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.recycling import recycling_service
from app.models.schemas import RecyclabilityState


client = TestClient(app)


class TestMaterialClassification:
    def test_independent_material_representation(self):
        """Object label, likely material, and confidence are independently modeled."""
        intel = recycling_service.get_intelligence("bottle")
        mat = intel.material_classification

        assert "Polyethylene" in mat.likely_material or "PET" in mat.likely_material
        assert len(mat.candidates) >= 2
        assert mat.confidence_level in ["High", "Medium", "Low / Uncertain"]
        assert mat.uncertainty_reason is not None

    def test_uncertainty_flagged_for_ambiguous_materials(self):
        """Cups and unknown objects flag material uncertainty."""
        cup_intel = recycling_service.get_intelligence("cup")
        assert cup_intel.material_classification.confidence_level in ["Medium", "Low / Uncertain"]
        assert "polyethylene" in cup_intel.material_classification.uncertainty_reason.lower() or "lining" in cup_intel.material_classification.uncertainty_reason.lower()


class TestRecyclabilityStates:
    def test_all_seven_explicit_states_exist(self):
        """Verify the 7 explicit recyclability states are valid and defined."""
        expected_states = {
            "Recyclable",
            "Conditionally recyclable",
            "Reusable",
            "Compostable",
            "Special handling required",
            "Generally non-recyclable",
            "Needs verification",
        }
        all_literals = set(get_args(RecyclabilityState))
        assert expected_states == all_literals

    def test_cans_are_recyclable(self):
        """Metal cans are highly recyclable with explicit rationale."""
        intel = recycling_service.get_intelligence("can")
        assert intel.recyclability_state == "Recyclable"
        assert "aluminum" in intel.state_rationale.lower() or "infinitely" in intel.state_rationale.lower()

    def test_bottles_are_conditionally_recyclable(self):
        """Bottles require checking resin codes (#1, #2) and caps/labels."""
        intel = recycling_service.get_intelligence("bottle")
        assert intel.recyclability_state == "Conditionally recyclable"
        assert "resin" in intel.state_rationale.lower() or "code" in intel.state_rationale.lower()

    def test_produce_is_compostable(self):
        """Organic items like bananas and apples are compostable, not curbside recyclable."""
        banana_intel = recycling_service.get_intelligence("banana")
        assert banana_intel.recyclability_state == "Compostable"

        apple_intel = recycling_service.get_intelligence("apple")
        assert apple_intel.recyclability_state == "Compostable"

    def test_electronics_require_special_handling(self):
        """Electronics with lithium batteries require e-waste dropoff, not curbside bins."""
        phone_intel = recycling_service.get_intelligence("cell phone")
        assert phone_intel.recyclability_state == "Special handling required"
        assert "battery" in phone_intel.state_rationale.lower() or "fire" in phone_intel.state_rationale.lower()

        laptop_intel = recycling_service.get_intelligence("laptop")
        assert laptop_intel.recyclability_state == "Special handling required"

    def test_paper_cups_generally_non_recyclable(self):
        """Single-use hot beverage cups have polyethylene lining and are generally non-recyclable."""
        cup_intel = recycling_service.get_intelligence("cup")
        assert cup_intel.recyclability_state == "Generally non-recyclable"
        assert "coating" in cup_intel.state_rationale.lower() or "lining" in cup_intel.state_rationale.lower()

    def test_backpacks_are_reusable(self):
        """Textiles like backpacks are reusable through donation."""
        bp_intel = recycling_service.get_intelligence("backpack")
        assert bp_intel.recyclability_state == "Reusable"

    def test_unknown_items_need_verification(self):
        """Unrecognized classes never default to recyclable."""
        fallback = recycling_service.get_intelligence("unknown_widget_xyz")
        assert fallback.recyclability_state == "Needs verification"


class TestStructuredReuseKnowledgeBase:
    def test_bottle_has_practical_reuse_projects(self):
        """Clean bottles have 3-5 structured practical reuse ideas."""
        guidance = recycling_service.get_reuse_guidance("bottle")
        assert guidance.suitable is True
        assert 3 <= len(guidance.ideas) <= 5

        for idea in guidance.ideas:
            assert idea.title
            assert idea.difficulty in ["Easy", "Moderate", "Advanced"]
            assert len(idea.materials_needed) > 0
            assert len(idea.instructions) > 0
            assert len(idea.safety_precautions) > 0

    def test_hazardous_items_block_unsafe_reuse(self):
        """Laptops and cell phones contain safety warnings against puncture/battery hazards."""
        phone_reuse = recycling_service.get_reuse_guidance("cell phone")
        assert phone_reuse.warning is not None
        assert "battery" in phone_reuse.warning.lower() or "puncture" in phone_reuse.warning.lower()


class TestLocalGuidance:
    def test_unverified_disclaimer_present(self):
        """Local guidance provides explicit jurisdiction, verified status, and caveat disclaimer."""
        intel = recycling_service.get_intelligence("bottle")
        loc = intel.local_guidance
        assert loc.jurisdiction
        assert isinstance(loc.facility_acceptance_verified, bool)
        assert loc.disclaimer
        assert "vary" in loc.disclaimer.lower() or "verify" in loc.disclaimer.lower() or "authority" in loc.disclaimer.lower()

    def test_region_override(self):
        """Region override is reflected in returned jurisdiction."""
        intel = recycling_service.get_intelligence("can", region_override="US-CA-94102")
        assert "US-CA-94102" in intel.local_guidance.region_code


class TestApiRoutes:
    def test_get_intelligence_endpoint(self):
        """GET /api/intelligence/{class_name} returns typed 200 payload."""
        response = client.get("/api/intelligence/bottle")
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "Plastic"
        assert data["recyclability_state"] == "Conditionally recyclable"
        assert "material_classification" in data
        assert "reuse_suitability" in data
        assert "local_guidance" in data

    def test_get_reuse_endpoint(self):
        """GET /api/reuse/{class_name} returns dedicated reuse guidance."""
        response = client.get("/api/reuse/bottle")
        assert response.status_code == 200
        data = response.json()
        assert data["suitable"] is True
        assert len(data["ideas"]) >= 3
