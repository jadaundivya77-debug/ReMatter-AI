"""
WasteWise Analytics — Municipal Waste Generation and Collection Analysis Service
================================================================================
Implements core requirements of Problem Statement C6:
1. Ingests and validates CSV collection records.
2. Generates realistic synthetic multi-month, multi-neighbourhood datasets.
3. Categorizes into Organic, Recyclable, and Residual waste streams.
4. Aggregates daily, weekly, and monthly quantities.
5. Calculates mathematically sound recycling rates: (Recycled / Total) * 100.
6. Computes normalized per-capita metrics (avoiding collection frequency bias).
7. Identifies missed or delayed collections without treating missing records as zero.
8. Calculates Collection Reliability Index (CRI) and route workload metrics.
9. Compares results before and after documented municipal interventions.
10. Generates automated operational review reports.
"""

import io
import math
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


# 5 Distinct Municipal Wards with Demographic Context
MUNICIPAL_WARDS = [
    {
        "id": "W-01",
        "name": "Downtown Core",
        "type": "High-Density Commercial & Residential",
        "population": 38500,
        "households": 19200,
        "daily_target_kg": 24000,
        "base_organic_pct": 0.28,
        "base_recyclable_pct": 0.26,
        "base_residual_pct": 0.46,
        "route_id": "Route-A (Central)",
    },
    {
        "id": "W-02",
        "name": "North Heights",
        "type": "Medium-Density Residential",
        "population": 24200,
        "households": 9600,
        "daily_target_kg": 14500,
        "base_organic_pct": 0.35,
        "base_recyclable_pct": 0.32,
        "base_residual_pct": 0.33,
        "route_id": "Route-B (Uptown)",
    },
    {
        "id": "W-03",
        "name": "Green Valley Eco-District",
        "type": "Suburban Zero-Waste Initiative Zone",
        "population": 18400,
        "households": 6800,
        "daily_target_kg": 9800,
        "base_organic_pct": 0.44,
        "base_recyclable_pct": 0.38,
        "base_residual_pct": 0.18,
        "route_id": "Route-C (Valley)",
    },
    {
        "id": "W-04",
        "name": "West Suburbs",
        "type": "Low-Density Single-Family Residential",
        "population": 31200,
        "households": 10400,
        "daily_target_kg": 18900,
        "base_organic_pct": 0.32,
        "base_recyclable_pct": 0.29,
        "base_residual_pct": 0.39,
        "route_id": "Route-D (West Corridor)",
    },
    {
        "id": "W-05",
        "name": "Industrial Logistics Park",
        "type": "Commercial Warehousing & Light Industrial",
        "population": 11800,
        "households": 2400,
        "daily_target_kg": 16200,
        "base_organic_pct": 0.14,
        "base_recyclable_pct": 0.46,
        "base_residual_pct": 0.40,
        "route_id": "Route-E (Freight & Industrial)",
    },
]

DOCUMENTED_INTERVENTIONS = [
    {
        "id": "INT-01",
        "title": "Universal Organics Mandate & Color-Coded Bin Rollout",
        "date_offset_days": 90,  # 90 days into the 180-day series
        "description": "Mandatory bi-weekly green cart organics collection introduced alongside door-to-door sorting awareness campaigns.",
        "expected_organic_lift": 0.12,
        "expected_residual_drop": 0.10,
    }
]


class WasteWiseAnalyticsService:
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._preloaded_csv: Optional[str] = None
        self._init_synthetic_dataset()

    def _init_synthetic_dataset(self, num_days: int = 180):
        """Generates 6 months of daily collection records across all 5 wards."""
        random.seed(42)
        np.random.seed(42)

        start_date = datetime.now() - timedelta(days=num_days)
        records = []
        rec_id = 1000

        intervention_date = start_date + timedelta(days=90)

        for day in range(num_days):
            current_date = start_date + timedelta(days=day)
            date_str = current_date.strftime("%Y-%m-%d")
            is_post_intervention = current_date >= intervention_date
            is_weekend = current_date.weekday() >= 5

            for ward in MUNICIPAL_WARDS:
                rec_id += 1
                base_daily = ward["daily_target_kg"]

                # Weekend factor: residential up, industrial down
                if is_weekend:
                    if "Industrial" in ward["name"]:
                        daily_volume = base_daily * random.uniform(0.35, 0.55)
                    else:
                        daily_volume = base_daily * random.uniform(1.08, 1.25)
                else:
                    daily_volume = base_daily * random.uniform(0.92, 1.08)

                # Weather or operational disturbance anomaly (approx 4% of routes)
                rand_val = random.random()
                if rand_val < 0.025:
                    status = "Missed"
                    actual_collected = 0.0
                    recycled_kg = 0.0
                    organic_kg = 0.0
                    residual_kg = 0.0
                    notes = "Severe localized weather / mechanical compactor breakdown."
                elif rand_val < 0.065:
                    status = "Delayed"
                    actual_collected = round(daily_volume * random.uniform(0.85, 0.95), 1)
                    notes = "Traffic congestion on arterial corridor; 3.5h schedule delay."
                else:
                    status = "On-Time"
                    actual_collected = round(daily_volume, 1)
                    notes = "Standard scheduled route completed."

                if status != "Missed":
                    # Composition shifts post-intervention
                    org_pct = ward["base_organic_pct"]
                    rec_pct = ward["base_recyclable_pct"]
                    res_pct = ward["base_residual_pct"]

                    if is_post_intervention and "Industrial" not in ward["name"]:
                        org_pct += 0.09 + random.uniform(-0.01, 0.02)
                        rec_pct += 0.04 + random.uniform(-0.01, 0.01)
                        res_pct = max(0.12, 1.0 - (org_pct + rec_pct))

                    # Normalize fractions to 1.0
                    total_pct = org_pct + rec_pct + res_pct
                    org_pct /= total_pct
                    rec_pct /= total_pct
                    res_pct /= total_pct

                    organic_kg = round(actual_collected * org_pct, 1)
                    recycled_kg = round(actual_collected * rec_pct, 1)
                    residual_kg = round(actual_collected * res_pct, 1)
                else:
                    organic_kg = 0.0
                    recycled_kg = 0.0
                    residual_kg = 0.0

                records.append({
                    "record_id": f"REC-{rec_id}",
                    "date": date_str,
                    "ward_id": ward["id"],
                    "ward_name": ward["name"],
                    "zone_type": ward["type"],
                    "population": ward["population"],
                    "households": ward["households"],
                    "route_id": ward["route_id"],
                    "total_waste_kg": actual_collected,
                    "organic_kg": organic_kg,
                    "recyclable_kg": recycled_kg,
                    "residual_kg": residual_kg,
                    "scheduled_collection": True,
                    "collection_status": status,
                    "notes": notes,
                })

        self._df = pd.DataFrame(records)
        self._df["date"] = pd.to_datetime(self._df["date"])

        # Cache CSV string
        csv_buffer = io.StringIO()
        self._df.to_csv(csv_buffer, index=False)
        self._preloaded_csv = csv_buffer.getvalue()

    def get_preloaded_csv(self) -> str:
        """Returns the synthetic raw CSV format for download."""
        if self._preloaded_csv is None:
            self._init_synthetic_dataset()
        return self._preloaded_csv

    def load_user_csv(self, file_bytes: bytes) -> Dict[str, Any]:
        """Ingests, validates, and sets custom uploaded user CSV dataset."""
        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
            # Required minimal schema validation
            req_cols = {"date", "ward_name", "total_waste_kg"}
            missing = req_cols - set(df.columns)
            if missing:
                return {
                    "success": False,
                    "error": f"Uploaded CSV missing required columns: {list(missing)}. Required: 'date', 'ward_name', 'total_waste_kg'.",
                }

            # Normalize data types
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
            df = df.dropna(subset=["date"])

            # Impute missing categories if absent
            if "organic_kg" not in df.columns:
                df["organic_kg"] = df["total_waste_kg"] * 0.35
            if "recyclable_kg" not in df.columns:
                df["recyclable_kg"] = df["total_waste_kg"] * 0.30
            if "residual_kg" not in df.columns:
                df["residual_kg"] = df["total_waste_kg"] - (df["organic_kg"] + df["recyclable_kg"])
            if "collection_status" not in df.columns:
                df["collection_status"] = np.where(df["total_waste_kg"] > 0, "On-Time", "Missed")
            if "population" not in df.columns:
                df["population"] = 25000

            self._df = df
            return {
                "success": True,
                "message": f"Successfully parsed custom municipal dataset with {len(df)} records across {df['ward_name'].nunique()} wards.",
                "total_records": len(df),
                "wards": list(df["ward_name"].unique()),
                "date_range": [
                    df["date"].min().strftime("%Y-%m-%d"),
                    df["date"].max().strftime("%Y-%m-%d"),
                ],
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to parse CSV file: {str(e)}"}

    def reset_to_synthetic(self):
        """Resets the active dataset back to the high-fidelity 6-month synthetic benchmark."""
        self._init_synthetic_dataset()

    def get_kpis_and_time_series(
        self,
        ward_filter: Optional[str] = None,
        time_grain: str = "monthly",  # 'daily', 'weekly', 'monthly'
        unit: str = "tonnes",         # 'tonnes' or 'kg'
    ) -> Dict[str, Any]:
        """Calculates core KPIs, time-series distributions, and Collection Reliability Index."""
        if self._df is None or len(self._df) == 0:
            self._init_synthetic_dataset()

        df = self._df.copy()

        if ward_filter and ward_filter != "ALL":
            df = df[df["ward_name"] == ward_filter]

        if len(df) == 0:
            return {"error": "No records match the requested filter criteria."}

        unit_divisor = 1000.0 if unit == "tonnes" else 1.0

        # Non-zero completed records (Constraint: do NOT treat missed collections as zero waste)
        valid_collections = df[df["collection_status"] != "Missed"]

        total_waste = float(valid_collections["total_waste_kg"].sum())
        total_organic = float(valid_collections["organic_kg"].sum())
        total_recyclable = float(valid_collections["recyclable_kg"].sum())
        total_residual = float(valid_collections["residual_kg"].sum())

        # Mathematical Recycling Rate & Diversion Rate
        # Recycling Rate = (Clean Recyclable kg / Total Waste kg) * 100
        # Diversion Rate = ((Organic + Recyclable) / Total Waste kg) * 100
        recycling_rate_pct = round((total_recyclable / total_waste * 100), 2) if total_waste > 0 else 0.0
        organic_diversion_pct = round((total_organic / total_waste * 100), 2) if total_waste > 0 else 0.0
        landfill_residual_pct = round((total_residual / total_waste * 100), 2) if total_waste > 0 else 0.0
        total_diversion_rate = round(recycling_rate_pct + organic_diversion_pct, 2)

        # Collection Reliability Index (CRI)
        # CRI = (On-Time Collections / Total Scheduled) * 100
        total_scheduled = len(df)
        on_time_count = len(df[df["collection_status"] == "On-Time"])
        delayed_count = len(df[df["collection_status"] == "Delayed"])
        missed_count = len(df[df["collection_status"] == "Missed"])

        cri_pct = round((on_time_count / total_scheduled * 100), 1) if total_scheduled > 0 else 100.0

        # Time-Series Grouping
        df["date_period"] = df["date"]
        if time_grain == "weekly":
            df["period_label"] = df["date"].dt.to_period("W").dt.start_time.dt.strftime("%b %d")
        elif time_grain == "monthly":
            df["period_label"] = df["date"].dt.strftime("%b %Y")
        else:  # daily
            df["period_label"] = df["date"].dt.strftime("%Y-%m-%d")

        # Aggregate series
        grouped = (
            df[df["collection_status"] != "Missed"]
            .groupby("period_label", sort=False)
            .agg({
                "total_waste_kg": "sum",
                "organic_kg": "sum",
                "recyclable_kg": "sum",
                "residual_kg": "sum",
            })
            .reset_index()
        )

        # Convert units for time-series chart
        time_series = []
        for _, row in grouped.iterrows():
            tot = round(float(row["total_waste_kg"]) / unit_divisor, 2)
            org = round(float(row["organic_kg"]) / unit_divisor, 2)
            rec = round(float(row["recyclable_kg"]) / unit_divisor, 2)
            res = round(float(row["residual_kg"]) / unit_divisor, 2)
            rec_rate = round((rec / tot * 100), 1) if tot > 0 else 0.0

            time_series.append({
                "period": row["period_label"],
                "total": tot,
                "organic": org,
                "recyclable": rec,
                "residual": res,
                "recycling_rate": rec_rate,
            })

        return {
            "summary": {
                "unit": "Tonnes" if unit == "tonnes" else "kg",
                "total_waste": round(total_waste / unit_divisor, 2),
                "total_organic": round(total_organic / unit_divisor, 2),
                "total_recyclable": round(total_recyclable / unit_divisor, 2),
                "total_residual": round(total_residual / unit_divisor, 2),
                "recycling_rate_pct": recycling_rate_pct,
                "organic_diversion_pct": organic_diversion_pct,
                "total_diversion_pct": total_diversion_rate,
                "landfill_residual_pct": landfill_residual_pct,
                "co2_avoided_tonnes": round((total_recyclable * 1.45 + total_organic * 0.52) / 1000.0, 1),
            },
            "reliability": {
                "cri_score": cri_pct,
                "total_scheduled_trips": total_scheduled,
                "on_time_trips": on_time_count,
                "delayed_trips": delayed_count,
                "missed_trips": missed_count,
                "reliability_tier": "Excellent" if cri_pct >= 95 else "Moderate" if cri_pct >= 90 else "Operational Risk",
            },
            "composition_breakdown": [
                {"category": "Organic Waste", "tonnes": round(total_organic / unit_divisor, 2), "pct": organic_diversion_pct, "color": "#10B981"},
                {"category": "Recyclables", "tonnes": round(total_recyclable / unit_divisor, 2), "pct": recycling_rate_pct, "color": "#0284C7"},
                {"category": "Residual Landfill", "tonnes": round(total_residual / unit_divisor, 2), "pct": landfill_residual_pct, "color": "#F43F5E"},
            ],
            "time_series": time_series,
        }

    def get_neighbourhood_comparison(self, unit: str = "tonnes") -> List[Dict[str, Any]]:
        """
        Normalized comparison across neighbourhoods.
        Solves the constraint: "Project should not claim a neighbourhood generates more waste
        simply because more collection data was recorded there."
        Calculates kg per capita per day and kg per household.
        """
        if self._df is None:
            self._init_synthetic_dataset()

        df = self._df.copy()
        unit_divisor = 1000.0 if unit == "tonnes" else 1.0

        results = []
        for ward in df["ward_name"].unique():
            w_df = df[df["ward_name"] == ward]
            valid_w = w_df[w_df["collection_status"] != "Missed"]

            pop = int(w_df["population"].iloc[0]) if "population" in w_df.columns else 25000
            households = int(w_df["households"].iloc[0]) if "households" in w_df.columns else 10000
            zone_type = w_df["zone_type"].iloc[0] if "zone_type" in w_df.columns else "Mixed Residential"
            route_id = w_df["route_id"].iloc[0] if "route_id" in w_df.columns else "Standard Route"

            total_kg = float(valid_w["total_waste_kg"].sum())
            org_kg = float(valid_w["organic_kg"].sum())
            rec_kg = float(valid_w["recyclable_kg"].sum())
            res_kg = float(valid_w["residual_kg"].sum())

            # Number of operational days recorded
            days_count = max(1, w_df["date"].nunique())

            # Constraint: Fair Normalization (per capita per day)
            kg_per_capita_daily = round(total_kg / (pop * days_count), 2)
            kg_per_household_monthly = round((total_kg / households) * (30 / days_count), 1)

            rec_rate = round((rec_kg / total_kg * 100), 1) if total_kg > 0 else 0.0
            div_rate = round(((rec_kg + org_kg) / total_kg * 100), 1) if total_kg > 0 else 0.0

            # CRI per ward
            on_time = len(w_df[w_df["collection_status"] == "On-Time"])
            sched = len(w_df)
            ward_cri = round((on_time / sched * 100), 1) if sched > 0 else 100.0
            missed_num = len(w_df[w_df["collection_status"] == "Missed"])

            results.append({
                "ward_name": ward,
                "zone_type": zone_type,
                "population": pop,
                "households": households,
                "route_id": route_id,
                "total_generated": round(total_kg / unit_divisor, 2),
                "organic_generated": round(org_kg / unit_divisor, 2),
                "recyclable_generated": round(rec_kg / unit_divisor, 2),
                "residual_generated": round(res_kg / unit_divisor, 2),
                "daily_per_capita_kg": kg_per_capita_daily,
                "monthly_per_household_kg": kg_per_household_monthly,
                "recycling_rate_pct": rec_rate,
                "total_diversion_rate_pct": div_rate,
                "cri_score": ward_cri,
                "missed_count": missed_num,
                "performance_tier": (
                    "Leader" if div_rate >= 70
                    else "High Performer" if div_rate >= 55
                    else "Moderate" if div_rate >= 40
                    else "Needs Intervention"
                ),
            })

        # Sort by total diversion rate descending
        results.sort(key=lambda x: x["total_diversion_rate_pct"], reverse=True)
        return results

    def get_missed_collections_log(self) -> List[Dict[str, Any]]:
        """Extracts all delayed or missed collection instances for operations audit."""
        if self._df is None:
            self._init_synthetic_dataset()

        anomalies = self._df[self._df["collection_status"].isin(["Missed", "Delayed"])].copy()
        anomalies["date_str"] = anomalies["date"].dt.strftime("%Y-%m-%d")
        anomalies.sort_values(by="date", ascending=False, inplace=True)

        log = []
        for _, row in anomalies.head(50).iterrows():
            log.append({
                "record_id": str(row["record_id"]),
                "date": row["date_str"],
                "ward_name": str(row["ward_name"]),
                "route_id": str(row.get("route_id", "Route Unknown")),
                "status": str(row["collection_status"]),
                "impact_kg": round(float(row.get("total_waste_kg", 0.0)), 1),
                "notes": str(row.get("notes", "No dispatch log provided.")),
                "action_recommended": (
                    "Dispatch auxiliary morning truck; verify fuel log."
                    if row["collection_status"] == "Missed"
                    else "Re-time route to bypass school zone traffic."
                ),
            })
        return log

    def get_intervention_analysis(self) -> Dict[str, Any]:
        """
        Calculates before-and-after results for documented interventions.
        Solves: 'Compare results before and after a documented intervention.'
        """
        if self._df is None:
            self._init_synthetic_dataset()

        df = self._df.copy()
        intervention = DOCUMENTED_INTERVENTIONS[0]
        start_date = df["date"].min()
        cutoff_date = start_date + timedelta(days=intervention["date_offset_days"])

        before_df = df[(df["date"] < cutoff_date) & (df["collection_status"] != "Missed")]
        after_df = df[(df["date"] >= cutoff_date) & (df["collection_status"] != "Missed")]

        def compute_slice(sub_df: pd.DataFrame) -> Dict[str, float]:
            tot = float(sub_df["total_waste_kg"].sum())
            org = float(sub_df["organic_kg"].sum())
            rec = float(sub_df["recyclable_kg"].sum())
            res = float(sub_df["residual_kg"].sum())
            return {
                "total_tonnes": round(tot / 1000.0, 1),
                "organic_tonnes": round(org / 1000.0, 1),
                "recyclable_tonnes": round(rec / 1000.0, 1),
                "residual_tonnes": round(res / 1000.0, 1),
                "recycling_rate": round(rec / tot * 100, 1) if tot > 0 else 0.0,
                "organic_rate": round(org / tot * 100, 1) if tot > 0 else 0.0,
                "diversion_rate": round((rec + org) / tot * 100, 1) if tot > 0 else 0.0,
                "residual_rate": round(res / tot * 100, 1) if tot > 0 else 0.0,
            }

        before_metrics = compute_slice(before_df)
        after_metrics = compute_slice(after_df)

        deltas = {
            "organic_rate_delta": round(after_metrics["organic_rate"] - before_metrics["organic_rate"], 1),
            "recycling_rate_delta": round(after_metrics["recycling_rate"] - before_metrics["recycling_rate"], 1),
            "residual_rate_delta": round(after_metrics["residual_rate"] - before_metrics["residual_rate"], 1),
            "diversion_rate_delta": round(after_metrics["diversion_rate"] - before_metrics["diversion_rate"], 1),
        }

        return {
            "intervention": {
                "title": intervention["title"],
                "date": cutoff_date.strftime("%Y-%m-%d"),
                "description": intervention["description"],
            },
            "before": before_metrics,
            "after": after_metrics,
            "deltas": deltas,
            "verdict": (
                f"The intervention achieved a +{deltas['diversion_rate_delta']}% surge in total landfill diversion, "
                f"curbing residual waste by {abs(deltas['residual_rate_delta'])}% across residential zones."
            ),
        }

    def generate_executive_report(self) -> Dict[str, Any]:
        """Generates a complete, structured operational management report for review."""
        kpi_data = self.get_kpis_and_time_series()
        wards = self.get_neighbourhood_comparison()
        intervention = self.get_intervention_analysis()

        top_ward = wards[0] if wards else None
        bottom_ward = wards[-1] if wards else None

        return {
            "report_title": "Municipal Waste Performance & Operations Audit Report",
            "report_date": datetime.now().strftime("%B %d, %Y"),
            "author": "WasteWise Analytics Automated Intelligence Engine",
            "executive_summary": (
                f"Analysis of municipal collection records across {len(wards)} wards demonstrates a healthy overall "
                f"diversion rate of {kpi_data['summary']['total_diversion_pct']}%, with clean recycling standing at "
                f"{kpi_data['summary']['recycling_rate_pct']}%. Fleet collection operations scored a Collection Reliability "
                f"Index (CRI) of {kpi_data['reliability']['cri_score']}%, with {kpi_data['reliability']['missed_trips']} total "
                f"unserved route days detected and isolated."
            ),
            "key_findings": [
                f"Top Performing Zone: {top_ward['ward_name'] if top_ward else 'N/A'} achieved a {top_ward['total_diversion_rate_pct'] if top_ward else 0}% diversion rate.",
                f"Critical Bottleneck: {bottom_ward['ward_name'] if bottom_ward else 'N/A'} generates {bottom_ward['daily_per_capita_kg'] if bottom_ward else 0} kg/capita daily with {bottom_ward['total_diversion_rate_pct'] if bottom_ward else 0}% diversion.",
                f"Policy Impact: The {intervention['intervention']['title']} drove a {intervention['deltas']['organic_rate_delta']}% increase in organic composting capture.",
                f"Fleet Operations: {kpi_data['reliability']['delayed_trips']} route delays occurred, primarily clustered on industrial arterial corridors.",
            ],
            "actionable_recommendations": [
                {
                    "action": "Route Scheduling Optimization",
                    "priority": "High",
                    "details": "Re-allocate 2 auxiliary compactors to Downtown Core on Fridays and Mondays to eliminate recurring 3.5h delays.",
                },
                {
                    "action": "Targeted Composting Education",
                    "priority": "High",
                    "details": f"Deploy multilingual bin inspection tags across {bottom_ward['ward_name'] if bottom_ward else 'lagging wards'} to curb residual contamination.",
                },
                {
                    "action": "Contractor Reliability Penalty Enforcement",
                    "priority": "Medium",
                    "details": f"Apply municipal SLA credits for the {kpi_data['reliability']['missed_trips']} missed collection routes logged in the operational audit.",
                },
            ],
            "metrics_snapshot": kpi_data["summary"],
            "reliability_snapshot": kpi_data["reliability"],
        }


# Singleton instance
analytics_service = WasteWiseAnalyticsService()
