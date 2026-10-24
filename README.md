# ReMatter AI — Real-Time Waste Detection & Recycling Intelligence Workspace

ReMatter AI is a real-time computer vision workspace for waste identification, material inspection, strict recyclability evaluation, and circular reuse recommendations. 

A user turns on their webcam, points it at waste items, and the AI detects multiple objects in the frame simultaneously, identifies their likely material composition, evaluates recyclability, and provides concrete disposal instructions and reuse ideas.

---

## Key Capabilities

1. **Live Webcam Studio:** Real-time camera streaming with permission handling, retry controls, and multi-camera device switching.
2. **Multiple Object Detection:** Ultralytics YOLO vision pipeline delivering normalized, resolution-independent bounding box overlays.
3. **Interactive Visual Inspector:** Clickable bounding boxes with studio reticles allowing users to select and inspect individual detected objects.
4. **Decoupled Recycling Knowledge Layer:** Domain intelligence is strictly decoupled from visual object recognition.
5. **Independent Material Classification:** Object labels, likely materials, material confidence levels ("High", "Medium", "Low / Uncertain"), uncertainty explanations, and condition/contamination assessments are modeled independently.
6. **7 Explicit Recyclability States:** Never assumes items are recyclable by form factor:
   - `Recyclable` (e.g., clean aluminum and steel cans)
   - `Conditionally recyclable` (e.g., bottles dependent on SPI resin codes #1/#2)
   - `Reusable` (e.g., backpacks, durable tableware)
   - `Compostable` (e.g., fruit rinds, food scraps)
   - `Special handling required` (e.g., electronics, lithium-ion battery fire hazards)
   - `Generally non-recyclable` (e.g., poly-coated coffee cups, plastic cutlery)
   - `Needs verification` (e.g., unknown objects, composite packaging)
7. **Structured Reuse Knowledge Base:** 3 to 5 practical upcycling projects for suitable items with difficulty levels ("Easy", "Moderate", "Advanced"), required tools, step-by-step instructions, safety precautions, and safety warnings that block unsafe reuse of chemicals, e-waste, and batteries.
8. **Extensible Local Jurisdiction Guidance:** Location-aware rule profiles with verified facility flags and disclaimers when municipal data is unverified.
9. **High-Resolution Image Analysis:** File upload dropzone supporting JPEG, PNG, and WebP photos with detection overlays and confidence adjustment.
10. **Detection History Filmstrip:** Horizontal filmstrip recording recent detections with instant re-inspection and clear-history controls.
11. **Sub-Millisecond Fast Lookups:** Zero per-frame LLM calls; pure deterministic in-memory lookup keeping camera feeds fast.

---

## AI Architecture & Model Replacement

ReMatter AI starts with a pretrained **Ultralytics YOLO** baseline (`yolov8n.pt`) to establish a zero-friction, production-ready pipeline.

### Swapping for a Waste-Specific Model
The backend is architected to allow any fine-tuned or waste-specific model weights (e.g. trained on TACO, WasteNet, or proprietary datasets) to replace the baseline without altering any application code:

1. Place your custom weights in the project (e.g., `backend/weights/waste_yolo.pt`).
2. Update the environment variable:
   ```env
   MODEL_PATH=/path/to/waste_yolo.pt
   ```
3. Restart the backend. The backend dynamically loads the new model and exposes its class names.

> **Model Limitation Note:** The active baseline model detects visual shapes and COCO taxonomy classes. Because visual optical sensors cannot verify polymer grade (e.g., PET #1 vs composite #7) or microscopic grease contamination, items are classified into sensible categories but marked **"Needs verification"** with physical checks.

---

## Tech Stack

- **Frontend:**
  - Next.js 16 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS v4
  - Lucide React icons
- **Backend:**
  - Python 3.10+ (FastAPI)
  - Ultralytics YOLO
  - PyTorch
  - Pillow & OpenCV
  - Pydantic v2
  - Uvicorn ASGI server

---

## Quickstart: Running the Application

### 1. Start the Backend

In a terminal:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000`.
- Health probe: `http://localhost:8000/health`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Start the Frontend

In a second terminal:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Project Structure

```
Re-matter AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # /health, /api/detect, /api/detect/frame, /api/categories, /api/intelligence, /api/reuse
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py           # Pydantic models for BoundingBox, DetectionItem, RecyclingIntelligence, ReuseIdea
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── detector.py          # YOLO inference wrapper (loads outside request loop)
│   │   │   └── recycling.py         # Recycling Knowledge Layer & Structured Reuse Catalog
│   │   ├── config.py                # App configuration (MODEL_PATH, CORS, PORT)
│   │   └── main.py                  # FastAPI app entry point & lifespan handler
│   ├── tests/
│   │   └── test_recycling.py        # 16 Unit tests for states, safety warnings, and schemas
│   ├── requirements.txt             # Python backend dependencies
│   ├── .env.example                 # Backend environment variable template
│   └── README.md                    # Data schema and knowledge extension guide
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css          # Design system & light-themed studio tokens
│   │   │   ├── layout.tsx           # Studio root layout & typography
│   │   │   └── page.tsx             # Studio workspace page & frame throttling loop
│   │   ├── components/
│   │   │   ├── Header.tsx           # Studio header, mode switcher, health pill
│   │   │   ├── Viewport.tsx         # Central camera/image viewport with normalized overlays
│   │   │   ├── CameraControls.tsx   # Play/stop, retry, device switcher, threshold slider
│   │   │   ├── InspectorPanel.tsx   # Waste inspector, verification checklists, disposal routing
│   │   │   ├── HistoryStrip.tsx     # Bottom detection history filmstrip
│   │   │   ├── StatusBadge.tsx      # Recyclability and status pills
│   │   │   ├── UploadModal.tsx      # Image upload dropzone modal
│   │   │   └── CategoriesModal.tsx  # Waste categories reference modal
│   │   └── lib/
│   │       ├── api.ts               # Backend API client with abort signals
│   │       ├── types.ts             # TypeScript interfaces matching backend models
│   │       └── useCamera.ts         # Webcam hook with stream management & device enumeration
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── .env.example                     # Root environment configuration
└── README.md                        # Master documentation
```

---

## Model Licensing & Ethics
- **Ultralytics YOLO:** Licensed under AGPL-3.0 (with commercial licenses available directly from Ultralytics).
- **COCO Dataset Pretraining:** Distributed under Creative Commons Attribution 4.0 International.
- **Verification Rule:** ReMatter AI explicitly avoids claiming custom model training on the baseline release. Users are instructed through both the UI and documentation that visual shape detection is distinct from certified material characterization.
