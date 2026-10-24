"""
ReMatter AI — Waste YOLO Fine-Tuning & Evaluation Pipeline
==========================================================
Trains and rigorously benchmarks an Ultralytics YOLO detector on the
prepared waste dataset with tailored data augmentations for cluttered scenes.

Augmentation Architecture for Cluttered Waste:
- Mosaic (1.0): Blends 4 images into one, forcing the model to detect small, occluded,
  and tightly grouped debris in cluttered piles.
- MixUp (0.15): Blends pairs of images to simulate visual clutter and transparent plastics.
- HSV Jitter (h=0.015, s=0.7, v=0.4): Robustness to direct sunlight, shadows, and low-light indoors.
- FlipLR (0.5): Horizontal orientation invariance.
- NMS IoU threshold: 0.45 to resolve densely stacked containers.

Evaluation Tracking:
- Evaluates on the held-out test split (zero scene leakage).
- Logs Box Precision (P), Recall (R), mAP@0.5, mAP@0.5:0.95, and per-class metrics.
- Saves best weights to `weights/waste_yolov8.pt` for plug-and-play use via `REMATTER_MODEL`.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_waste_yolo")


def train_waste_model(
    data_yaml: str,
    base_weights: str = "yolov8n.pt",
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 16,
    device: str = "cpu",
    output_dir: str = "runs/waste_train",
    save_weights_path: str = "weights/waste_yolov8.pt",
):
    """
    Executes YOLO fine-tuning with waste-tailored hyperparameters
    and runs full evaluation on the test split.
    """
    try:
        from ultralytics import YOLO
    except ImportError:
        logger.error("ultralytics package not installed. Run: pip install ultralytics")
        sys.exit(1)

    if not os.path.exists(data_yaml):
        logger.error(
            f"Dataset configuration '{data_yaml}' not found. "
            "Please run scripts/prepare_taco_dataset.py first."
        )
        return

    logger.info(f"Initializing YOLO model from base weights: {base_weights}")
    model = YOLO(base_weights)

    logger.info(
        f"Starting waste fine-tuning: epochs={epochs}, imgsz={imgsz}, "
        f"batch={batch}, device={device}"
    )

    # Train with augmentations optimized for real-world waste scenes
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        project=output_dir,
        name="waste_experiment",
        # Cluttered waste augmentations
        mosaic=1.0,         # Mix 4 images into 1 (vital for small occluded waste)
        mixup=0.15,         # Blend image pairs
        hsv_h=0.015,        # Hue shift
        hsv_s=0.7,          # Saturation shift
        hsv_v=0.4,          # Value/brightness shift
        fliplr=0.5,         # Horizontal flip
        iou=0.45,           # NMS IoU threshold for overlapping waste
        save=True,
        save_period=10,
        val=True,
        plots=True,
    )

    logger.info("Training complete. Running rigorous evaluation on held-out test split...")
    
    # Evaluate model on the test partition
    test_metrics = model.val(
        data=data_yaml,
        split="test",
        imgsz=imgsz,
        batch=batch,
        device=device,
        plots=True,
    )

    # Extract metrics
    box_metrics = test_metrics.box
    map50 = box_metrics.map50
    map50_95 = box_metrics.map
    precision = box_metrics.mp
    recall = box_metrics.mr

    logger.info("==================================================")
    logger.info("TEST SPLIT EVALUATION RESULTS:")
    logger.info(f"  • Mean Average Precision (mAP@0.5)     : {map50:.4f}")
    logger.info(f"  • Mean Average Precision (mAP@0.5:0.95): {map50_95:.4f}")
    logger.info(f"  • Overall Precision (P)                : {precision:.4f}")
    logger.info(f"  • Overall Recall (R)                   : {recall:.4f}")
    logger.info("==================================================")

    # Per-class breakdown
    if hasattr(test_metrics, "names"):
        logger.info("PER-CLASS EVALUATION BREAKDOWN:")
        for idx, cls_name in test_metrics.names.items():
            cls_map50 = box_metrics.maps[idx] if idx < len(box_metrics.maps) else 0.0
            logger.info(f"  [{idx}] {cls_name:<20} mAP@0.5: {cls_map50:.4f}")

    # Copy best weights to target destination
    best_weights = Path(output_dir) / "waste_experiment" / "weights" / "best.pt"
    if best_weights.exists():
        Path(save_weights_path).parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy2(best_weights, save_weights_path)
        logger.info(f"Best weights exported to: {save_weights_path}")
        logger.info("To activate, set: export REMATTER_MODEL=" + str(Path(save_weights_path).resolve()))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO on waste dataset")
    parser.add_argument("--data", type=str, default="data/yolo_waste/waste_dataset.yaml")
    parser.add_argument("--weights", type=str, default="yolov8n.pt")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", type=str, default="cpu")
    parser.add_argument("--save-path", type=str, default="weights/waste_yolov8.pt")
    args = parser.parse_args()

    train_waste_model(
        data_yaml=args.data,
        base_weights=args.weights,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        save_weights_path=args.save_path,
    )
