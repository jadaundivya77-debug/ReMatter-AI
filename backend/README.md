# ReMatter AI — Backend Service

FastAPI-powered computer vision backend and deterministic recycling intelligence layer for real-time waste analysis, material classification, safe circular reuse, and localized disposal recommendations.

---

## Architecture Overview

```
                         ┌────────────────────────────────────────┐
                         │       Ultralytics YOLO Engine          │
                         │  (Geometric Contour / Object Detection) │
                         └───────────────────┬────────────────────┘
                                             │ Label & Bounding Box
                                             ▼
                         ┌────────────────────────────────────────┐
                         │      Recycling Intelligence Layer      │
                         │       (app/services/recycling.py)      │
                         ├────────────────────────────────────────┤
                         │ • Material Classification (Likely Mat, │
                         │   Resin Candidates, Uncertainty Level) │
                         │ • Explicit Recyclability State (7-tier)│
                         │ • Structured Reuse Knowledge Base      │
                         │   (Difficulty, Tools, Steps, Safety)   │
                         │ • Extensible Local Jurisdiction Policy │
                         │ • Physical Verification Checklist      │
                         └───────────────────┬────────────────────┘
                                             │
                                             ▼
                            Typed Pydantic Schemas / REST API
```

---

## 1. Recycling Intelligence Schema

All responses adhere to strict Pydantic v2 schemas defined in `app/models/schemas.py`:

### The 7 Explicit Recyclability States
Rather than binary "Recyclable / Trash" assumptions, ReMatter AI assigns one of 7 explicit states based on material physics, sorting machinery physics (MRF screens), and municipal capabilities:

| Recyclability State | Definition & Conditions | Example |
| :--- | :--- | :--- |
| `Recyclable` | Material and form factor are universally accepted by modern MRFs without specialized separation. | Clean aluminum cans, steel tin food cans |
| `Conditionally recyclable` | Dependent on polymer resin type (#1 PET vs #5 PP vs #7 composite), rinsing, and cap retention. | Water bottles, detergent jugs, glass jars |
| `Reusable` | Durable items designed for prolonged lifespans, best routed to donation, thrift, or community reuse. | Backpacks, glassware, intact ceramic tableware |
| `Compostable` | Pure organic biomass suitable for municipal or residential aerobic composting. | Fruit rinds, vegetable scraps, yard waste |
| `Special handling required` | Contains chemical, fire, or toxic heavy-metal hazards. Strictly prohibited from curbside single-stream bins. | Cell phones, laptops, lithium-ion batteries |
| `Generally non-recyclable` | Mixed composite materials, thin plastic films, or poly-coated fiberboard that clog optical sorters or cannot be economically separated. | Single-use hot beverage cups (polyethylene lining), plastic straws, black plastic |
| `Needs verification` | Visual detection ambiguity or unknown class; user must inspect embossed SPI resin stamp or local facility guide. | Unlabeled widgets, composites, novel packaging |

### Independent Material Representation
Optical detection recognizes object silhouette geometry, not chemical composition. `MaterialClassification` decouples object labels from material composition:
- `primary_material`: Most probable physical substrate (e.g. `PET Plastic (#1)`).
- `material_candidates`: Full list of plausible resins/alloys.
- `material_confidence`: Explicit certainty tier (`High`, `Medium`, `Low / Uncertain`).
- `uncertainty_explanation`: Technical explanation of optical ambiguity (e.g., optical contour cannot differentiate PET from glass without inspecting specular highlights or SPI resin codes).
- `condition_assessment`: Explicit note that physical contamination (grease, chemicals, bio-hazards) requires manual verification.

### Structured Reuse Projects
For suitable items, the knowledge base provides 3 to 5 actionable upcycling projects:
- `title`: Actionable project name.
- `difficulty`: `Easy` (<15 mins), `Moderate` (requires tools), or `Advanced`.
- `materials_needed`: Required household supplies.
- `instructions`: Step-by-step assembly guide.
- `safety_precautions`: Puncture, edge, or ventilation warnings.
- `safety_warning`: Prominent hazard warning that blocks reuse for chemical, battery, or toxic hazards.

### Local Guidance & Extensibility
Jurisdiction-specific guidance flags curbside acceptance without fabricating municipal acceptance:
- `region_code`: Regional identifier (e.g. `DEFAULT_SINGLE_STREAM` or postal code).
- `facility_acceptance_verified`: Boolean indicating if MRF acceptance is confirmed with evidence.
- `disclaimer`: Explicit warning that local rules vary by municipality.

---

## 2. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service readiness probe and active model status |
| `POST` | `/api/detect/frame` | Real-time base64 video frame analysis (low-latency live camera streaming, <1ms knowledge lookup) |
| `POST` | `/api/detect` | Multipart form-data image upload (high-resolution still photos) |
| `GET` | `/api/intelligence/{class_name}` | Full recycling intelligence and material evaluation for a specific object class (optional `?region=US-CA-94102`) |
| `GET` | `/api/reuse/{class_name}` | Dedicated structured reuse projects, instructions, tools, and safety warnings |
| `GET` | `/api/categories` | Catalog of canonical waste streams and disposal rules |
| `GET` | `/docs` | Interactive Swagger/OpenAPI documentation |

---

## 3. How to Extend the Knowledge Base

The domain knowledge base resides in `app/services/recycling.py`.

### Adding a New Object Class
To add guidance for a new object label (e.g., `carton` or `light_bulb`):
1. Open `app/services/recycling.py`.
2. Add an entry to the `RECYCLING_KNOWLEDGE_BASE` dictionary:
```python
"carton": {
    "category": "Paper",
    "material": {
        "primary_material": "Aseptic / Poly-coated Paperboard (Tetra Pak)",
        "material_candidates": ["74% Paperboard, 22% Polyethylene, 4% Aluminum foil"],
        "material_confidence": "High",
        "uncertainty_explanation": "Cartons appear as paperboard but feature bonded multi-layer polyethylene and aluminum liners."
    },
    "recyclability": "Conditionally recyclable",
    "recyclability_rationale": "Accepted in municipalities equipped with hydrapulpers capable of separating paper fiber from polyethylene/foil liners.",
    "verification_checklist": [
        "Empty all liquid contents completely.",
        "Do not flatten if your local MRF uses 3D ballistic separators; leave cap on."
    ],
    "recommended_disposal": "Check local curbside guidelines for milk/juice cartons. Place in curbside bin only if cartons are explicitly listed.",
    "reuse": {
        "is_suitable": True,
        "safety_warning": "Rinse thoroughly with soap and dry completely before reuse to prevent mold or bacterial growth.",
        "ideas": [
            {
                "title": "Seedling Nursery Starter Pot",
                "difficulty": "Easy",
                "materials_needed": ["Scissors", "Potting soil", "Seeds"],
                "instructions": "Cut off the top third of the carton, punch 3 small drainage holes in the bottom, fill with potting soil, and plant seeds.",
                "safety_precautions": "Handle scissors carefully when puncturing drainage holes."
            }
        ]
    },
    "local_guidance": {
        "region_code": "DEFAULT_SINGLE_STREAM",
        "facility_acceptance_verified": False,
        "guidance_notes": "Carton Council programs operate in approximately 62% of US households.",
        "disclaimer": "Carton acceptance varies widely. Check your municipal recycling guide before placing in curbside bins."
    },
    "caveat": "Multi-material laminated packaging requires specialized hydro-separation mills."
}
```

### Adding Regional Municipal Profiles
To support specific municipal rules (e.g. New York City DSNY, San Francisco Recology, or European dual-stream systems):
1. Add an entry to `REGIONAL_RULES` in `app/services/recycling.py` keyed by region code (e.g. `US-CA-SFO`).
2. Map material acceptance rules and local facility website links.
3. When `get_intelligence(class_name, region_override="US-CA-SFO")` is invoked, the service will merge regional acceptance notes with verified facility flags.

---

## 4. Running Tests

The test suite validates all 7 explicit recyclability states, independent material classification, reuse safety constraints, and API endpoints:

```bash
# Activate virtual environment
source venv/bin/activate

# Run full test suite with verbose reporting
PYTHONPATH=. ./venv/bin/pytest tests/test_recycling.py -v
```

All 16 unit tests verify:
- Independent material classification & uncertainty flag generation
- Correct assignment of all 7 states (e.g., cans are `Recyclable`, bottles are `Conditionally recyclable`, produce is `Compostable`, phones/laptops are `Special handling required`, paper cups are `Generally non-recyclable`, backpacks are `Reusable`, unknown items are `Needs verification`)
- Safety hazard warnings for lithium-ion batteries and electronic devices
- 3 to 5 structured reuse projects for suitable items with tools, instructions, and precautions
- Regional guidance overrides and unverified MRF disclaimers
- FastAPI response serialization and schemas

---

## 5. Limitations & Boundaries

1. **Optical Geometry vs. Material Physics:** Computer vision object detection identifies visual silhouettes and bounding boxes. It does **not** perform spectrometry, infrared resin identification, or chemical analysis.
2. **Contamination Assessment:** While cameras detect visible gross contamination, optical feeds cannot verify chemical residues (e.g., motor oil or pesticides in containers) or bacteriological contamination. Physical inspection is mandatory.
3. **No Automatic Facility Guarantees:** Waste acceptance depends on whether the destination Material Recovery Facility (MRF) has optical NIR sorters, eddy current separators, and commercial contracts for secondary commodities. ReMatter AI explicitly highlights when local acceptance is unverified.
4. **Deterministic Latency:** The knowledge base executes in memory (<0.1ms per lookup). No generative AI large language model is called on video frames, maintaining responsive 30+ FPS detection pipelines.
