# ReMatter AI — Frontend Studio

Next.js App Router workspace for real-time webcam waste detection and recycling intelligence inspection.

## Features

- **Live Webcam Studio:** Real-time camera streaming with permission handling, retry controls, and device selection.
- **Precision Overlays:** Normalized bounding boxes with studio reticles and click-to-select capabilities.
- **Waste Inspector:** Displays detected object, confidence, candidate physical materials, recyclability rating, interactive verification checklist, disposal route, and reuse ideas.
- **Image Upload Analysis:** High-resolution photo upload with drag-and-drop dropzone.
- **Detection History Filmstrip:** Bottom history bar recording detection events with one-click inspection and clear functionality.
- **Intelligent Cadence Throttling:** Request in-flight locking prevents flooding backend inference queues.

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create `.env.local` if custom backend URL is desired:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```
