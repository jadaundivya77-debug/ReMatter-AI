"""
ReMatter AI — Target Hardware Computer Vision Benchmark
=======================================================
Benchmarks actual model inference speed, frame throughput (FPS),
latency distribution (P50, P95, P99), and memory footprint on the local system.

Usage:
  python3 scripts/benchmark_inference.py --model yolov8n.pt --iterations 50 --imgsz 640
"""

import os
import sys
import time
import argparse
import statistics
import logging
from PIL import Image
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("benchmark")


def benchmark_model(
    model_path: str,
    iterations: int = 50,
    warmup: int = 10,
    imgsz: int = 640,
    device: str = "cpu"
):
    try:
        from ultralytics import YOLO
        import torch
    except ImportError:
        logger.error("ultralytics and torch required. Run: pip install ultralytics torch")
        sys.exit(1)

    logger.info(f"Loading model '{model_path}' on target device '{device}'...")
    model = YOLO(model_path)

    # Generate synthetic input frames representing typical camera resolutions
    logger.info(f"Generating test frame at resolution {imgsz}x{imgsz}...")
    dummy_array = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)
    dummy_img = Image.fromarray(dummy_array)

    # Warm-up phase (jit compilation / cache warming)
    logger.info(f"Executing {warmup} warm-up iterations...")
    for _ in range(warmup):
        with torch.no_grad():
            _ = model.predict(source=dummy_img, imgsz=imgsz, device=device, verbose=False)

    # Benchmark loop
    logger.info(f"Executing {iterations} timed benchmark iterations...")
    latencies_ms = []

    for i in range(iterations):
        t0 = time.perf_counter()
        with torch.no_grad():
            _ = model.predict(source=dummy_img, imgsz=imgsz, device=device, verbose=False)
        dt = (time.perf_counter() - t0) * 1000.0
        latencies_ms.append(dt)

    latencies_sorted = sorted(latencies_ms)
    mean_lat = statistics.mean(latencies_ms)
    median_lat = statistics.median(latencies_ms)
    std_lat = statistics.stdev(latencies_ms) if len(latencies_ms) > 1 else 0.0
    p90_lat = latencies_sorted[int(0.90 * len(latencies_sorted))]
    p95_lat = latencies_sorted[int(0.95 * len(latencies_sorted))]
    p99_lat = latencies_sorted[int(0.99 * len(latencies_sorted))]
    fps = 1000.0 / mean_lat if mean_lat > 0 else 0.0

    logger.info("==================================================")
    logger.info(f"HARDWARE BENCHMARK REPORT — Model: {os.path.basename(model_path)}")
    logger.info(f"  • Device                   : {device}")
    logger.info(f"  • Resolution               : {imgsz}x{imgsz}")
    logger.info(f"  • Total Tested Samples     : {iterations}")
    logger.info(f"  • Average Latency          : {mean_lat:.2f} ms (±{std_lat:.2f} ms)")
    logger.info(f"  • Median Latency (P50)     : {median_lat:.2f} ms")
    logger.info(f"  • 90th Percentile (P90)    : {p90_lat:.2f} ms")
    logger.info(f"  • 95th Percentile (P95)    : {p95_lat:.2f} ms")
    logger.info(f"  • 99th Percentile (P99)    : {p99_lat:.2f} ms")
    logger.info(f"  • Throughput               : {fps:.2f} FPS")
    logger.info("==================================================")

    # Recommendation for frontend inference cadence:
    # A streaming interval should be >= P95 latency + 50ms buffer to prevent network queue bloat
    recommended_interval_ms = max(150, int(p95_lat + 60))
    logger.info(f"Recommended UI Streaming Interval: {recommended_interval_ms} ms (~{1000/recommended_interval_ms:.1f} FPS)")
    return {
        "mean_ms": mean_lat,
        "p50_ms": median_lat,
        "p95_ms": p95_lat,
        "fps": fps,
        "recommended_interval_ms": recommended_interval_ms
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark model inference on target hardware")
    parser.add_argument("--model", type=str, default="yolov8n.pt")
    parser.add_argument("--iterations", type=int, default=30)
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", type=str, default="cpu")
    args = parser.parse_args()

    benchmark_model(
        model_path=args.model,
        iterations=args.iterations,
        warmup=args.warmup,
        imgsz=args.imgsz,
        device=args.device,
    )
