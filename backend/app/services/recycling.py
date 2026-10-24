"""
ReMatter AI - Recycling Intelligence & Material Knowledge Layer
==============================================================
Provides independent material classification, explicit recyclability states,
structured upcycling/reuse projects, and jurisdiction-extensible local guidance.

CRITICAL DESIGN PRINCIPLES:
1. Object recognition alone DOES NOT prove material composition or recyclability.
2. Form factors (e.g. bottles, cups) are never assumed unconditionally recyclable.
3. Structured reuse projects include safety warnings against hazardous contamination.
4. If regional municipal acceptance is unverified, it is explicitly flagged.
"""

from typing import Dict, Any, List, Optional
from ..models.schemas import (
    MaterialClassification,
    RecyclingIntelligence,
    ReuseIdea,
    ReuseSuitability,
    LocalGuidance,
    SupportedCategory,
    RecyclabilityState,
)

# 8 Canonical waste streams defined in ReMatter AI Architecture
SUPPORTED_CATEGORIES: Dict[str, SupportedCategory] = {
    "Plastic": SupportedCategory(
        name="Plastic",
        description="Rigid or flexible synthetic polymers. Recyclability strictly depends on resin code, additives, and local sorting.",
        icon_name="Package",
        known_coco_examples=["bottle", "cup", "fork", "knife", "spoon"],
        disposal_overview="Check resin code (#1 PET and #2 HDPE are widely accepted). Clean thoroughly. Keep films and black plastic separate."
    ),
    "Paper and cardboard": SupportedCategory(
        name="Paper and cardboard",
        description="Cellulose fibers, packaging boxes, and publications. Highly recyclable if clean and dry.",
        icon_name="FileText",
        known_coco_examples=["book", "cardboard", "box", "cup (paper)"],
        disposal_overview="Flatten boxes. Ensure dry and grease-free. Plastic tape and heavy glues must be removed."
    ),
    "Metal": SupportedCategory(
        name="Metal",
        description="Ferrous and non-ferrous metals such as aluminum and tin-plated steel. Infinitely recyclable with high energy savings.",
        icon_name="Shield",
        known_coco_examples=["can", "fork (metal)", "knife (metal)", "spoon (metal)"],
        disposal_overview="Empty all contents. Rinse residue. Do not flatten completely if MRF uses optical ballistic separators."
    ),
    "Glass": SupportedCategory(
        name="Glass",
        description="Container and bottle glass. Distinct from heat-treated, leaded, or pyrex glass which ruins molten batches.",
        icon_name="Wine",
        known_coco_examples=["bottle (glass)", "wine glass"],
        disposal_overview="Container glass (bottles/jars) only. Remove metal lids. Never mix with drinking glasses, ceramics, or mirrors."
    ),
    "Organic waste": SupportedCategory(
        name="Organic waste",
        description="Biodegradable plant-based and food waste. Divert from landfills to prevent anaerobic methane emission.",
        icon_name="Leaf",
        known_coco_examples=["banana", "apple", "sandwich", "orange", "broccoli", "carrot", "pizza", "donut", "cake"],
        disposal_overview="Municipal green composting bin or backyard aerobic pile. Remove stickers, bands, and plastic wrappers."
    ),
    "Electronic waste": SupportedCategory(
        name="Electronic waste",
        description="Discarded electronics and appliances containing hazardous materials, heavy metals, and lithium batteries.",
        icon_name="Cpu",
        known_coco_examples=["cell phone", "laptop", "mouse", "keyboard", "remote", "tv"],
        disposal_overview="STRICT HAZARD: Never place in curbside bins. Fire danger from lithium batteries. Deliver to certified e-waste recyclers."
    ),
    "Textiles": SupportedCategory(
        name="Textiles",
        description="Natural and synthetic woven fabrics, garments, and bags.",
        icon_name="Shirt",
        known_coco_examples=["backpack", "handbag", "suitcase", "tie"],
        disposal_overview="Donate intact items. Bring worn textiles to dedicated textile collection points or retail take-back programs."
    ),
    "Mixed or unknown waste": SupportedCategory(
        name="Mixed or unknown waste",
        description="Multi-material composites, unclassified items, or objects requiring municipal directory inquiry.",
        icon_name="HelpCircle",
        known_coco_examples=["bowl (ceramic)", "scissors", "toothbrush", "misc"],
        disposal_overview="Inspect material stamps. Separate composite layers if possible. Treat as residual waste if unsorted."
    )
}

# Structured Knowledge Base per detectable class
CLASS_RECYCLING_CATALOG: Dict[str, Dict[str, Any]] = {
    "bottle": {
        "category": "Plastic",
        "material": {
            "primary_material": "Polyethylene Terephthalate (#1 PET) or High-Density Polyethylene (#2 HDPE)",
            "material_candidates": [
                "PET #1 Plastic (clear water/soda containers)",
                "HDPE #2 Plastic (opaque milk jugs, detergent containers)",
                "Soda-lime glass (beverage or condiment bottles)",
                "Aluminum or Stainless Steel (insulated flasks)"
            ],
            "material_confidence": "Medium",
            "uncertainty_explanation": "Optical contour recognizes the bottle silhouette, but cannot differentiate transparent PET plastic from glass, or identify whether resin is #1, #2, #5, or #7 composite without inspecting the embossed SPI stamp."
        },
        "recyclability": "Conditionally recyclable",
        "recyclability_rationale": "Widely recyclable in municipal single-stream curbside programs ONLY IF confirmed as Resin #1 (PET) or #2 (HDPE) and free of chemical/motor oil contaminants.",
        "verification_checklist": [
            "Inspect container bottom for Resin Identification Code (#1 PET or #2 HDPE are accepted; #3-#7 vary locally).",
            "Completely drain residual liquids and rinse out sugars/oils to prevent baled paper contamination.",
            "Verify local cap policy: screw cap back on tightly if your local MRF specifies caps-on.",
            "Confirm bottle did NOT contain motor oil, pesticides, or toxic solvents (these contaminate reprocessing streams and cannot go in curbside bins)."
        ],
        "recommended_disposal": "If verified code #1 or #2 and cleaned: place in curbside blue recycling bin. If unmarked, multi-layered, or contaminated with automotive fluids: take to household hazardous waste depot or use landfill bin.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "NEVER reuse bottles that originally contained motor oil, antifreeze, pesticides, or harsh cleaning chemicals for food, drink, or plant propagation. Wash thoroughly with warm soapy water before crafting.",
            "ideas": [
                {
                    "title": "Sub-Irrigated Seedling Planter",
                    "difficulty": "Easy",
                    "materials_needed": ["Scissors or utility knife", "Cotton string or strip of fabric", "Potting soil", "Seeds"],
                    "instructions": "Cut bottle in half horizontally. Invert the top neck into the bottom reservoir. Thread a cotton wick through the mouth into the water reservoir, fill top with potting mix, and plant seeds for automatic sub-irrigation.",
                    "safety_precautions": "Smooth or tape sharp cut plastic edges to prevent finger cuts. Puncture drainage holes carefully away from your hands."
                },
                {
                    "title": "Slow-Release Garden Drip Irrigater",
                    "difficulty": "Easy",
                    "materials_needed": ["Safety pin or pushpin", "Clean bottle with cap"],
                    "instructions": "Poke 3-4 small pinholes in the cap and 2 near the bottom. Fill with water, screw on cap, and bury the bottle neck 3 inches into garden soil near plant roots for steady vacation watering.",
                    "safety_precautions": "Keep pushpins pointed away from your fingers while puncturing the rigid cap plastic."
                },
                {
                    "title": "Workshop Hardware & Screw Funnel",
                    "difficulty": "Easy",
                    "materials_needed": ["Scissors or hobby saw"],
                    "instructions": "Cut off the top conical 4 inches of the bottle. Keep as a wide-mouth funnel for transferring screws, birdseed, or potting soil into small containers.",
                    "safety_precautions": "Deburr and sand the cut edge lightly with fine sandpaper to avoid sharp burrs."
                },
                {
                    "title": "Dense Ecological Brick (Eco-Brick)",
                    "difficulty": "Moderate",
                    "materials_needed": ["Wooden dowel", "Clean, dry non-recyclable soft plastic film/wrappers"],
                    "instructions": "Tightly pack clean, dry, non-recyclable soft plastic film into the bottle using a dowel until the bottle reaches a density of at least 0.33g/ml, creating an insulated building block for raised garden beds.",
                    "safety_precautions": "Only pack completely dry plastic to prevent anaerobic mold growth inside the sealed bottle."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Single-stream MRFs generally accept rigid plastic bottles #1 and #2. Some jurisdictions also accept #5 PP tubs, but rarely #3 PVC, #6 PS, or #7 Other.",
            "disclaimer": "Local municipal acceptance is unverified for your specific local authority without postal code confirmation. Check your city's waste authority lookup tool."
        },
        "caveat": "Optical bounding box detects silhouette only. Molecular grade, resin code, and chemical contamination must be physically confirmed."
    },
    "can": {
        "category": "Metal",
        "material": {
            "primary_material": "Aluminum or Tin-plated Steel",
            "material_candidates": [
                "Aluminum (beverage cans)",
                "Tin-plated steel (canned foods, soup, pet food)",
                "Bimetallic composite"
            ],
            "material_confidence": "High",
            "uncertainty_explanation": "Can geometry is strongly correlated with aluminum or tin-plated steel, though optical analysis cannot distinguish ferrous steel from non-ferrous aluminum without a magnet test."
        },
        "recyclability": "Recyclable",
        "recyclability_rationale": "Aluminum and steel cans are infinitely recyclable with minimal material degradation. Secondary aluminum smelting requires 95% less energy than primary bauxite extraction.",
        "verification_checklist": [
            "Ensure the can is empty of residual liquids or food chunks.",
            "Quickly rinse with graywater or leftover dishwater; sterilization is not necessary.",
            "Avoid crushing completely flat if your regional MRF uses optical sorters or air classifiers (flattened cans can be misdirected into the paper line)."
        ],
        "recommended_disposal": "Curbside metal or commingled recycling bin. Accepted in nearly 100% of municipal single-stream and dual-stream systems.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Cut metal edges and pop-tab apertures can cause lacerations. Always file, tape, or crimp sharp rims before reuse.",
            "ideas": [
                {
                    "title": "Desktop Pen & Tool Caddy",
                    "difficulty": "Easy",
                    "materials_needed": ["Can opener or pliers", "Adhesive fabric or masking tape", "Pencil/brushes"],
                    "instructions": "Use a smooth-edge can opener or pliers to roll in the top rim cleanly. Decorate exterior with twine or paint, and use on your desk to organize pens, rulers, or paintbrushes.",
                    "safety_precautions": "Carefully inspect the inner lip for sharp metal burrs. Cover with electrical or cloth tape."
                },
                {
                    "title": "Punched-Tin Luminary Lantern",
                    "difficulty": "Moderate",
                    "materials_needed": ["Hammer", "Nails of various sizes", "Water / Freezer", "Tea light candle"],
                    "instructions": "Fill can with water and freeze solid (the ice prevents the can from denting). Use a hammer and nail to punch decorative dot patterns into the tin. Let ice melt, dry thoroughly, and place a candle or LED inside.",
                    "safety_precautions": "Wear work gloves when handling cold frozen metal and hammer."
                },
                {
                    "title": "Garden Herb Pot with Gravel Bed",
                    "difficulty": "Easy",
                    "materials_needed": ["Nail", "Hammer", "Pebbles", "Potting soil", "Herb seedling"],
                    "instructions": "Punch 3 drainage holes in the bottom with a nail. Add a 1/2-inch layer of pebbles for drainage, fill with soil, and plant basil, mint, or thyme on a sunny windowsill.",
                    "safety_precautions": "Support the can against a wooden block when punching bottom drainage holes."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": True,
            "guidance_notes": "Widely accepted in virtually all municipal recycling programs across North America and Europe.",
            "disclaimer": "Standard metal cans are universally accepted in single-stream recycling, provided food residues are rinsed."
        },
        "caveat": "High recyclability, but unrinsed food cans attract pests at MRFs and degrade sorted bales."
    },
    "cup": {
        "category": "Paper and cardboard",
        "material": {
            "primary_material": "Polyethylene-Coated Paperboard or Polystyrene",
            "material_candidates": [
                "Polyethylene (PE)-lined paperboard (single-use takeout hot cups)",
                "Polylactic acid (PLA)-lined paperboard (compostable commercial cups)",
                "Polystyrene #6 (rigid or foam cups)",
                "Polypropylene #5 (reusable plastic cups)",
                "Glazed ceramic or glass"
            ],
            "material_confidence": "Medium",
            "uncertainty_explanation": "Coffee cups look like paper on the exterior, but virtually all disposable cups feature an internal hydrophobic polyethylene plastic or wax lining that standard paper hydrapulpers cannot dissolve."
        },
        "recyclability": "Generally non-recyclable",
        "recyclability_rationale": "Standard single-use hot beverage cups contain plastic linings fused to the paper fiber. Over 95% of municipal recycling facilities reject them because the plastic coating clogs pulping screens and contaminates paper pulp.",
        "verification_checklist": [
            "Check for BPI Certified Commercial Compostable logo (requires industrial high-heat composting, not home compost).",
            "Separate components: plastic lid (check for #5 resin mark), cardboard heat sleeve (widely recyclable with paper), cup body (trash).",
            "If polystyrene/Styrofoam foam cup: rejected in curbside recycling in almost all jurisdictions."
        ],
        "recommended_disposal": "Place single-use paper cups in general landfill trash unless your municipality explicitly advertises specialized paper-cup hydrapulping capabilities. Recycle the cardboard sleeve separately.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Do not reheat disposable single-use cups in the microwave or reuse with hot acidic liquids as coatings can degrade. Do not reuse soiled cups for food storage.",
            "ideas": [
                {
                    "title": "Biodegradable Seed Starter Pots",
                    "difficulty": "Easy",
                    "materials_needed": ["Pushpin", "Potting soil", "Seeds"],
                    "instructions": "Poke 2 drainage holes in the bottom of a clean paper cup, fill with potting soil, and sow garden seeds. Once seedlings sprout, cut the paper cup down the side to transplant easily without root shock.",
                    "safety_precautions": "Only use clean, unsoiled cups to avoid fungal growth on tender seedlings."
                },
                {
                    "title": "Small Hardware & Screw Sorting Cups",
                    "difficulty": "Easy",
                    "materials_needed": ["Marker"],
                    "instructions": "Label cups with screw sizes, washers, or nails while disassembling furniture or electronics to keep hardware sorted.",
                    "safety_precautions": "None."
                },
                {
                    "title": "Paint Touch-Up & Adhesive Cup",
                    "difficulty": "Easy",
                    "materials_needed": ["Craft brush", "Paint or PVA glue"],
                    "instructions": "Pour small portions of wall paint or glue into the cup for trim touch-ups rather than carrying a heavy gallon can.",
                    "safety_precautions": "Dispose of paint-contaminated cups according to local paint disposal regulations."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Most municipal programs strictly prohibit disposable hot cups in paper recycling bins due to plastic liner contamination.",
            "disclaimer": "Local municipal acceptance is unverified. Unless your city has verified poly-coated cup repulping contracts, dispose in trash."
        },
        "caveat": "Takeout paper cups appear to be paper but are multi-material composites lined with plastic that contaminate paper mills."
    },
    "wine glass": {
        "category": "Glass",
        "material": {
            "primary_material": "Lead Crystal or Borosilicate Glass",
            "material_candidates": [
                "Leaded crystal glass",
                "Borosilicate heat-resistant glass",
                "Soda-lime stemware"
            ],
            "material_confidence": "High",
            "uncertainty_explanation": "Visual detection confirms drinking stemware. Tableware and stemware glass contain lead oxide or boron additives that raise their melting temperature far above packaging bottle glass."
        },
        "recyclability": "Generally non-recyclable",
        "recyclability_rationale": "Drinking glasses, stemware, mirrors, and windowpanes have different melting temperatures and chemical formulations than packaging container glass (bottles/jars). Mixing them into container glass recycling creates thermal stress fractures in new bottles, ruining entire furnace batches.",
        "verification_checklist": [
            "Confirm item is tableware/drinking glass, NOT container packaging glass (like pasta sauce jars or soda bottles).",
            "Check condition: if intact, prioritize reuse or thrift donation over disposal.",
            "NEVER place in blue curbside glass recycling."
        ],
        "recommended_disposal": "If intact: donate to a thrift shop, charity, or neighbor. If broken: wrap securely in heavy newspaper or cardboard, tape tightly, and place into landfill trash.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Broken glass presents severe laceration hazards. Never attempt craft projects on cracked, chipped, or structurally compromised stemware.",
            "ideas": [
                {
                    "title": "Miniature Air-Plant or Succulent Terrarium",
                    "difficulty": "Easy",
                    "materials_needed": ["Small pebbles", "Activated charcoal", "Succulent soil", "Miniature succulent or air plant"],
                    "instructions": "Layer pea gravel at the bottom of the glass for drainage, add a pinch of charcoal, fill with succulent mix, and nestle a miniature plant for an elegant desk display.",
                    "safety_precautions": "Do not overwater since glass stemware lacks bottom drainage holes."
                },
                {
                    "title": "Tabletop Floating Candle Centerpiece",
                    "difficulty": "Easy",
                    "materials_needed": ["Water", "Floating tea light candle", "Botanical sprig (rosemary or flower)"],
                    "instructions": "Submerge a sprig of rosemary or flower blossom in water inside the glass bowl and float a tea light candle on top.",
                    "safety_precautions": "Keep open flames away from flammable drapes and never leave burning candles unattended."
                },
                {
                    "title": "Artist Watercolor Water Cup",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Use the wide, stable bowl of an intact wine glass for dipping watercolor brushes while painting.",
                    "safety_precautions": "Do not keep drinking beverages on the same desk while using a wine glass for paint rinse water."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Curbside glass recycling programs exclusively accept container packaging glass (bottles and jars). Tableware is rejected.",
            "disclaimer": "Municipal programs strictly exclude non-container glass. Placing stemware in curbside glass collection is considered hazardous contamination."
        },
        "caveat": "Tableware stemware contains chemical additives that ruin recycled container glass furnace melts."
    },
    "fork": {
        "category": "Plastic",
        "material": {
            "primary_material": "Polystyrene (#6 PS) or Polypropylene (#5 PP)",
            "material_candidates": [
                "Polystyrene #6 (rigid white/black takeout cutlery)",
                "Polypropylene #5 (reusable takeout cutlery)",
                "CPLA / PLA (compostable plant bioplastic)",
                "Stainless steel"
            ],
            "material_confidence": "Medium",
            "uncertainty_explanation": "Optical classification detects utensil geometry, but cannot detect polymer resin #6 vs #5 vs bio-PLA, and cannot detect metal vs plastic without surface reflectivity inspection."
        },
        "recyclability": "Generally non-recyclable",
        "recyclability_rationale": "Disposable plastic cutlery is too small (under 2-3 inches wide) for MRF sorting disc screens, falling through trommels and jamming machinery. Furthermore, black plastic cutlery absorbs near-infrared optical sorting beams and is diverted to landfill residue.",
        "verification_checklist": [
            "Check if metal (stainless steel): metal cutlery should be washed and donated or recycled as scrap metal.",
            "Check for 'BPI Certified Compostable' stamp if plant-based (requires commercial high-heat facility).",
            "Inspect color: black plastic is invisible to optical MRF sorters."
        ],
        "recommended_disposal": "Standard single-use plastic takeout forks belong in general landfill trash. Clean metal forks should be donated or sent to a scrap metal recycler.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Do not reuse brittle #6 polystyrene cutlery with very hot food, and do not place single-use cutlery in dishwashers as high heat warps plastic and can leach additives.",
            "ideas": [
                {
                    "title": "Garden Plant Label Markers",
                    "difficulty": "Easy",
                    "materials_needed": ["Permanent marker"],
                    "instructions": "Write herb or vegetable names on the wide flat handle of the fork and push the tines into garden beds or seed pots for weatherproof plant labeling.",
                    "safety_precautions": "None."
                },
                {
                    "title": "Seedling Soil Aerator & Weeding Tool",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Use the tines to gently tease apart root-bound seedlings during garden repotting or loosen surface crust around houseplants.",
                    "safety_precautions": "Be gentle with delicate root systems."
                },
                {
                    "title": "Craft Clay Texture & Ceramic Sculpting Tool",
                    "difficulty": "Easy",
                    "materials_needed": ["Modeling clay"],
                    "instructions": "Use fork tines to press crosshatch textures into polymer clay, ceramic pottery, or hobby miniature bases.",
                    "safety_precautions": "None."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Nearly all municipal recycling facilities exclude plastic utensils due to size screening limitations and low polymer recovery value.",
            "disclaimer": "Local MRFs do not accept small disposable cutlery. Place in landfill trash."
        },
        "caveat": "Small plastic utensils slip through MRF disc screens and contaminate glass recycling streams."
    },
    "knife": {
        "category": "Plastic",
        "material": {
            "primary_material": "Polystyrene (#6 PS) or Polypropylene (#5 PP)",
            "material_candidates": ["Polystyrene #6", "Polypropylene #5", "Stainless steel"],
            "material_confidence": "Medium",
            "uncertainty_explanation": "Identifies blade shape; cannot verify resin code or differentiate plastic from metal cutlery without material inspection."
        },
        "recyclability": "Generally non-recyclable",
        "recyclability_rationale": "Single-use plastic cutlery falls through screening machinery. Metal knives loose in curbside bins present critical laceration hazards to human sorting workers.",
        "verification_checklist": [
            "If metal kitchen knife: NEVER put loose in curbside bin (severe worker hazard).",
            "Single-use plastic knives cannot be processed by municipal sorting screens."
        ],
        "recommended_disposal": "Plastic knife: landfill trash. Metal knife: wrap blade securely in heavy cardboard, tape thoroughly, and donate or deliver to scrap metal drop-off.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Blades present cutting risks. Wrap metal blades when storing. Do not use disposable plastic knives on hot cookware.",
            "ideas": [
                {
                    "title": "Garden Seed Furrow & Soil Trench Scorer",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Use a plastic knife to draw clean, straight 1/2-inch seed furrows in garden soil beds before planting.",
                    "safety_precautions": "None."
                },
                {
                    "title": "Workshop Putty & Wood Filler Spreader",
                    "difficulty": "Easy",
                    "materials_needed": ["Wood filler or spackle"],
                    "instructions": "Use the flat blade of a disposable plastic knife as a flexible spatula to press wood filler into small nail holes.",
                    "safety_precautions": "Discard tool after filler cures."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Excluded from municipal blue bins.",
            "disclaimer": "Plastic cutlery is non-recyclable curbside. Metal knives are a sorting facility hazard."
        },
        "caveat": "Loose sharp cutlery in recycling bins poses dangerous laceration risks to waste workers."
    },
    "spoon": {
        "category": "Plastic",
        "material": {
            "primary_material": "Polystyrene (#6 PS) or Polypropylene (#5 PP)",
            "material_candidates": ["Polystyrene #6", "Polypropylene #5", "Compostable PLA", "Stainless steel"],
            "material_confidence": "Medium",
            "uncertainty_explanation": "Detects utensil shape; does not confirm polymer code or distinguish bioplastics from petroleum polymers."
        },
        "recyclability": "Generally non-recyclable",
        "recyclability_rationale": "Disposable cutlery falls through sorting trommel screens and ends up as facility residue.",
        "verification_checklist": ["Check if reusable stainless steel (keep or donate).", "Disposable takeout spoons go to landfill trash."],
        "recommended_disposal": "Landfill trash for plastic disposables.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Do not reuse disposable spoons with boiling liquids or in microwave.",
            "ideas": [
                {
                    "title": "Garden Potting Soil & Fertilizer Scoop",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Keep in potting soil bags or plant food jars for neat, measured dosage around small indoor plants.",
                    "safety_precautions": "Wash hands after handling chemical fertilizers."
                },
                {
                    "title": "Hobby Paint & Epoxy Mixing Spatula",
                    "difficulty": "Easy",
                    "materials_needed": ["Epoxy resin or acrylic paint"],
                    "instructions": "Use to mix two-part epoxies or blend paint pigments without ruining kitchen utensils.",
                    "safety_precautions": "Wear nitrile gloves when mixing epoxy."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Single-use plastic spoons are not accepted in municipal recycling.",
            "disclaimer": "Unverified and generally rejected by municipal single-stream recycling."
        },
        "caveat": "Disposable plastic cutlery is excluded from municipal single-stream sorting."
    },
    "bowl": {
        "category": "Mixed or unknown waste",
        "material": {
            "primary_material": "Ceramic, Melamine, or Polypropylene (#5)",
            "material_candidates": ["Glazed ceramic / stoneware", "Melamine thermoset plastic", "Polypropylene #5", "Stainless steel"],
            "material_confidence": "Low / Uncertain",
            "uncertainty_explanation": "Bowl form factor is manufactured in radically different material classes (ceramic, melamine, rigid plastic, metal) that cannot be verified without physical inspection."
        },
        "recyclability": "Needs verification",
        "recyclability_rationale": "Ceramic and melamine bowls are non-meltable thermosets that destroy recycled glass batches. Polypropylene #5 plastic bowls may be accepted in some rigid plastic programs.",
        "verification_checklist": [
            "If ceramic or stoneware: NEVER place in curbside recycling.",
            "If plastic: inspect bottom for #5 PP resin symbol.",
            "If intact and clean: prioritize donation over disposal."
        ],
        "recommended_disposal": "Donate usable bowls to animal shelters, thrift shops, or community kitchens. Damaged ceramics belong in landfill trash.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Do not reuse chipped ceramic for human food contact (microcracks harbor bacteria). Do not microwave melamine.",
            "ideas": [
                {
                    "title": "Pet Water or Stray Feeding Dish",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Repurpose an unneeded ceramic or plastic bowl as a dedicated pet water dish or backyard bird bath.",
                    "safety_precautions": "Ensure there are no sharp chips on the rim."
                },
                {
                    "title": "Garage Hardware & Fastener Catch-All",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Keep on your workbench to catch nuts, bolts, and drill bits while working on projects.",
                    "safety_precautions": "None."
                },
                {
                    "title": "Indoor Plant Drainage Saucer",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Place beneath a potted plant to catch excess runoff water and protect wooden furniture.",
                    "safety_precautions": "Empty standing runoff to prevent root rot."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Ceramics are never accepted curbside. Rigid plastic containers vary by municipality.",
            "disclaimer": "Local acceptance depends on material. Verify locally before placing in recycling."
        },
        "caveat": "Ceramics and melamine melt at drastically higher temperatures than container glass and ruin recycling batches."
    },
    "banana": {
        "category": "Organic waste",
        "material": {
            "primary_material": "Organic Biodegradable Cellulose Fiber",
            "material_candidates": ["Organic biodegradable fruit matter rich in potassium and cellulose"],
            "material_confidence": "High",
            "uncertainty_explanation": "Visual contours and texture clearly identify organic fruit waste."
        },
        "recyclability": "Compostable",
        "recyclability_rationale": "Readily breaks down in aerobic composting. Diverting organic waste from landfills eliminates anaerobic decomposition that produces methane gas.",
        "verification_checklist": [
            "Remove plastic brand/distributor sticker (these do not decompose and contaminate compost humus).",
            "Keep separate from plastic packaging, wax paper, and films."
        ],
        "recommended_disposal": "Municipal green organics cart or backyard compost bin.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Do not leave exposed banana peels indoors in warm areas as they attract fruit flies.",
            "ideas": [
                {
                    "title": "Potassium-Rich Houseplant Fertilizer Tea",
                    "difficulty": "Easy",
                    "materials_needed": ["Mason jar", "Water", "Spray bottle or watering can"],
                    "instructions": "Steep banana peels in a jar of water for 48 hours. Strain liquid and dilute 1:4 with fresh water to provide natural potassium and phosphorus to flowering houseplants and tomatoes.",
                    "safety_precautions": "Discard soaked peels into compost to avoid mold."
                },
                {
                    "title": "Genuine Leather & Shoe Buffer",
                    "difficulty": "Easy",
                    "materials_needed": ["Soft cloth"],
                    "instructions": "Rub the fleshy interior of a fresh banana peel across scuffed genuine leather shoes or belts, then buff with a soft microfiber cloth. The potassium and natural fruit oils condition leather.",
                    "safety_precautions": "Test on a small inconspicuous area first; do not use on suede or porous raw leather."
                },
                {
                    "title": "Direct Garden Trench Soil Enrichment",
                    "difficulty": "Easy",
                    "materials_needed": ["Trowel"],
                    "instructions": "Chop peel into 1-inch squares and bury 3 inches deep beside rose bushes or tomato plants for slow-release organic nutrition.",
                    "safety_precautions": "Bury deeply enough to deter scavenging neighborhood animals."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Accepted in municipal green organics carts. Strictly prohibited in dry paper/plastic blue bins.",
            "disclaimer": "Municipal organics programs vary by city. If green bin collection is unavailable, home compost or bury in garden."
        },
        "caveat": "Organic waste must never enter dry recycling bins where moisture destroys paper and cardboard bales."
    },
    "apple": {
        "category": "Organic waste",
        "material": {
            "primary_material": "Organic Biodegradable Fruit Matter",
            "material_candidates": ["Cellulose and pectin fruit matter"],
            "material_confidence": "High",
            "uncertainty_explanation": "High visual fidelity for fresh fruit produce."
        },
        "recyclability": "Compostable",
        "recyclability_rationale": "Biodegradable organic fruit scrap suited for aerobic decomposition or vermicomposting.",
        "verification_checklist": [
            "Peel off tiny plastic PLU barcode sticker before composting.",
            "Ensure core is separate from any packaging film or toothpicks."
        ],
        "recommended_disposal": "Municipal green compost bin or backyard vermicompost system.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Do not consume moldy fruit scraps.",
            "ideas": [
                {
                    "title": "Natural Stovetop Simmer Fragrance",
                    "difficulty": "Easy",
                    "materials_needed": ["Small pot", "Water", "Cinnamon stick or cloves"],
                    "instructions": "Simmer clean apple peels and cores on low heat with water and cinnamon on the stove to naturally scent the house.",
                    "safety_precautions": "Do not leave a simmering pot unattended."
                },
                {
                    "title": "Homemade Apple Scrap Vinegar",
                    "difficulty": "Moderate",
                    "materials_needed": ["Clean glass jar", "Sugar water (1 tbsp sugar per cup)", "Cheesecloth & rubber band"],
                    "instructions": "Submerge clean apple scraps in sugar water inside a glass jar covered with cheesecloth. Stir daily for 2 weeks, strain solids, and let ferment for 4 more weeks into mild vinegar for cleaning.",
                    "safety_precautions": "Ensure scraps stay submerged under water to prevent mold from developing on the surface."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Green bin organics stream only.",
            "disclaimer": "Requires green bin or backyard composting."
        },
        "caveat": "Keep moist organic food scraps out of dry recycling bins."
    },
    "cell phone": {
        "category": "Electronic waste",
        "material": {
            "primary_material": "Lithium-Ion Battery, FR4 PCB, and Aluminum/Glass Chassis",
            "material_candidates": [
                "Rechargeable Lithium-Ion Battery (hazardous fire risk)",
                "Printed Circuit Board (gold, silver, copper, palladium, rare earths)",
                "Aluminosilicate display glass with indium tin oxide",
                "Anodized aluminum or stainless steel frame"
            ],
            "material_confidence": "High",
            "uncertainty_explanation": "Geometry confirms smartphone, but visual sensors cannot assess internal battery degradation, swelling, or internal electronic component viability."
        },
        "recyclability": "Special handling required",
        "recyclability_rationale": "CRITICAL HAZARD: Lithium-ion batteries in smartphones explode and ignite severe fires under compactor pressure inside recycling collection trucks and sorting facilities. Never place in curbside bins.",
        "verification_checklist": [
            "Check for battery swelling, bulging casing, or excessive heat (if swollen, place immediately in fireproof sand/battery bucket).",
            "Back up personal data and perform full cryptographic factory reset to prevent identity theft.",
            "Do NOT place in blue, green, or black curbside bins under any circumstances."
        ],
        "recommended_disposal": "Certified e-waste drop-off (Call2Recycle, e-Stewards, R2 certified facility), electronics retailer trade-in (Best Buy, Apple, carrier store), or municipal household hazardous waste collection.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "DO NOT attempt to disassemble, puncture, or crush the internal lithium battery. If battery is swollen or leaking, do not charge; deliver immediately to a battery hazard recycling depot.",
            "ideas": [
                {
                    "title": "Dedicated Wi-Fi Home Security Camera",
                    "difficulty": "Easy",
                    "materials_needed": ["Phone charger", "Free security camera app (e.g. AlfredCamera)", "Phone stand"],
                    "instructions": "Connect phone to home Wi-Fi, install a camera streaming app, position facing an entry door or garage, and keep plugged in to create a dedicated free surveillance camera.",
                    "safety_precautions": "Ensure phone does not overheat when plugged in continuously; keep in well-ventilated location."
                },
                {
                    "title": "Dedicated Smart Home Dashboard or Alarm Clock",
                    "difficulty": "Easy",
                    "materials_needed": ["Desk stand", "Charger"],
                    "instructions": "Clear all personal apps, set to Do Not Disturb, and use as an interactive Home Assistant dashboard, bedside white-noise machine, or Spotify Connect remote.",
                    "safety_precautions": "Use an intact original charger."
                },
                {
                    "title": "Charity Donation for Community Digital Access",
                    "difficulty": "Easy",
                    "materials_needed": ["Charging cable"],
                    "instructions": "Factory reset the device and donate to programs like Cell Phones for Soldiers or domestic violence shelters that distribute working phones for emergency 911 access.",
                    "safety_precautions": "Confirm all accounts (iCloud/Google) are cleanly unlinked before donating."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": True,
            "guidance_notes": "Universally banned from curbside single-stream bins across almost all jurisdictions due to catastrophic truck and facility fire risks.",
            "disclaimer": "Curbside disposal of rechargeable electronic devices is illegal in many states and countries."
        },
        "caveat": "Smartphones contain valuable recoverable precious metals alongside toxic heavy metals and explosive lithium-ion cells."
    },
    "laptop": {
        "category": "Electronic waste",
        "material": {
            "primary_material": "Lithium-Polymer Battery, Multi-layer PCB, and Aluminum/Magnesium Alloy",
            "material_candidates": [
                "Lithium-ion / Lithium polymer battery pack (fire hazard)",
                "Motherboard with CPU/GPU and precious metals",
                "SSD / HDD storage media",
                "Aluminum/magnesium or polycarbonate casing"
            ],
            "material_confidence": "High",
            "uncertainty_explanation": "Form factor confirms laptop; internal battery condition and component functionality require manual assessment."
        },
        "recyclability": "Special handling required",
        "recyclability_rationale": "High-capacity lithium batteries present extreme compaction fire risks. Electronics require specialized dismantlers to safely extract lead, mercury, gold, and rare earth elements.",
        "verification_checklist": [
            "Check for battery bulge (swollen trackpad or warped keyboard indicates dangerous battery degradation).",
            "Remove or securely overwrite hard drive / SSD to protect personal confidential data.",
            "Gather power adapter cord to include with the unit for donation."
        ],
        "recommended_disposal": "Certified e-Stewards / R2 e-waste recycler, manufacturer take-back (Dell Reconnect, Apple Trade In, HP Planet Partners), or retail electronic drop-off.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Never pierce, bend, or incinerate laptop battery cells. Unplug immediately if battery expands or emits sweet chemical odors.",
            "ideas": [
                {
                    "title": "Revitalize with Lightweight Linux OS",
                    "difficulty": "Moderate",
                    "materials_needed": ["USB flash drive (8GB+)", "Lightweight Linux (Ubuntu, Mint, or ChromeOS Flex)"],
                    "instructions": "Install a lightweight Linux distribution or ChromeOS Flex on older hardware to turn a sluggish machine into a fast, secure web browsing laptop for school or family use.",
                    "safety_precautions": "Back up important data before reformatting drives."
                },
                {
                    "title": "Dedicated Low-Power Home Media / Storage Server",
                    "difficulty": "Advanced",
                    "materials_needed": ["External hard drive", "Ethernet cable"],
                    "instructions": "Configure the laptop to run headless with Plex, Nextcloud, or Pi-hole network-wide ad blocking. Laptops make ideal low-power servers because the built-in battery functions as an integrated uninterruptible power supply (UPS).",
                    "safety_precautions": "Ensure laptop fan vents remain clear of dust to prevent overheating."
                },
                {
                    "title": "Salvage Functional RAM & Solid State Drives",
                    "difficulty": "Moderate",
                    "materials_needed": ["Small Phillips / Torx screwdriver", "USB external drive enclosure"],
                    "instructions": "If motherboard is non-functional, unscrew bottom panel to harvest the working SSD/HDD and insert it into a $10 USB drive enclosure for an instant portable external drive.",
                    "safety_precautions": "Disconnect the internal battery connector before touching internal electronic boards."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": True,
            "guidance_notes": "Strictly excluded from curbside bins. Dedicated certified e-waste channel required.",
            "disclaimer": "Illegal to discard in curbside trash in many municipalities. Deliver to certified e-waste facilities."
        },
        "caveat": "High-capacity lithium battery packs cause severe explosions and fires in waste compaction trucks."
    },
    "book": {
        "category": "Paper and cardboard",
        "material": {
            "primary_material": "Cellulose Wood Pulp Paper and Synthetic Adhesive",
            "material_candidates": [
                "Cellulose paper fibers",
                "EVA or polyurethane reactive (PUR) spine binding adhesive",
                "Rigid binder board and cloth (hardcovers)"
            ],
            "material_confidence": "High",
            "uncertainty_explanation": "Geometry confirms book publication, but cannot verify whether binding is paperback (soluble) or hardcover with synthetic cloth and insoluble glue without inspection."
        },
        "recyclability": "Conditionally recyclable",
        "recyclability_rationale": "Paperback books are widely recyclable in paper streams. Hardcover books are NOT recyclable as a whole because the rigid covers, bookcloth, and heavy glue jam paper hydropulpers.",
        "verification_checklist": [
            "If paperback: place directly into curbside paper recycling.",
            "If hardcover: you MUST tear off the front and back rigid covers and the cloth spine; recycle only the inner paper text block.",
            "Ensure pages are dry: wet, moldy, or mildewed books cannot be recycled and must go to trash.",
            "If in readable condition: donate to public library, school, or community book swap."
        ],
        "recommended_disposal": "First priority: donate to library or book drive. If damaged: remove hardcover bindings and place inner paper block in curbside recycling.",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Use caution with hobby blades when hollowing books. Do not use mold-infested books as spores cause respiratory irritation.",
            "ideas": [
                {
                    "title": "Public Library & Little Free Library Donation",
                    "difficulty": "Easy",
                    "materials_needed": ["None"],
                    "instructions": "Place readable books into neighborhood Little Free Libraries or donate to senior centers and literacy drives.",
                    "safety_precautions": "None."
                },
                {
                    "title": "Secret Hollow-Book Keepsake Safe",
                    "difficulty": "Moderate",
                    "materials_needed": ["Discarded hardcover book", "Craft utility knife", "Mod Podge or PVA white glue", "Ruler"],
                    "instructions": "Coat exterior edge of closed pages with diluted glue, let dry under weight, then use a utility knife and metal ruler to hollow out an inner rectangular compartment for storing keepsakes.",
                    "safety_precautions": "Cut slowly with a sharp blade away from fingers; do not force blade through multiple pages at once."
                },
                {
                    "title": "Garden Mulch & Weed Suppression Layer",
                    "difficulty": "Easy",
                    "materials_needed": ["Wood chips or compost"],
                    "instructions": "Lay individual black-and-white inner book pages 4-5 layers thick over garden beds and cover with mulch to naturally block weeds and decompose into organic matter.",
                    "safety_precautions": "Avoid glossy or heavy colored inks in vegetable beds."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": True,
            "guidance_notes": "Paperback books accepted in paper recycling. Hardcover books must have covers stripped.",
            "disclaimer": "Check whether local facility requires books to be separated from corrugated cardboard."
        },
        "caveat": "Hardcover bindings contain insoluble hotmelt adhesives and fabric cloth that cannot be pulped by standard paper mills."
    },
    "backpack": {
        "category": "Textiles",
        "material": {
            "primary_material": "Synthetic Woven Nylon or Polyester Composite",
            "material_candidates": [
                "Woven nylon / Cordura with polyurethane waterproof coating",
                "Polyester canvas",
                "Acetal plastic hardware and metal zippers",
                "Closed-cell polyethylene shoulder strap foam"
            ],
            "material_confidence": "Medium",
            "uncertainty_explanation": "Backpacks are complex multi-material composites blending synthetic fabrics, water-resistant coatings, metal sliders, and foam padding that cannot be separated by standard mechanical textile shredders."
        },
        "recyclability": "Reusable",
        "recyclability_rationale": "Non-recyclable in curbside municipal bins. However, backpacks are highly durable and reusable. Usable backpacks should be repaired or donated; worn backpacks can be submitted to specialized brand reclamation programs.",
        "verification_checklist": [
            "Check zippers, seams, and buckles for repairability (most zipper pull issues can be fixed with pliers or lubricant).",
            "Clean thoroughly with warm water and mild detergent.",
            "DO NOT place in curbside recycling bins (textiles wrap around MRF rotating trommels and shut down sorting plants)."
        ],
        "recommended_disposal": "If functional: donate to school backpack drives, shelters, or thrift shops. If worn out: bring to dedicated textile drop-offs or manufacturer take-back programs (e.g. Patagonia Worn Wear).",
        "reuse": {
            "is_suitable": True,
            "safety_warning": "Clean thoroughly before reuse. Ensure strap hardware is intact if carrying heavy loads.",
            "ideas": [
                {
                    "title": "Emergency Vehicle Go-Bag or Survival Kit",
                    "difficulty": "Easy",
                    "materials_needed": ["First-aid supplies", "Flashlight", "Bottled water", "Blanket"],
                    "instructions": "Pack the backpack with roadside emergency supplies, jumper cables, first-aid kit, and high-visibility vest to store permanently in your car trunk.",
                    "safety_precautions": "Do not store perishable food in hot vehicles."
                },
                {
                    "title": "Heavy-Duty Workshop Tool & Cord Organizer",
                    "difficulty": "Easy",
                    "materials_needed": ["Extension cords", "Hand tools"],
                    "instructions": "Use durable backpack compartments to organize electric drills, extension cords, and socket sets for mobile home repair.",
                    "safety_precautions": "Ensure tools with sharp cutting edges have protective sheaths."
                },
                {
                    "title": "Hardware Salvage for Gear Repair",
                    "difficulty": "Moderate",
                    "materials_needed": ["Seam ripper or heavy scissors"],
                    "instructions": "If fabric is shredded, cut away the heavy-duty nylon webbing straps, quick-release side buckles, and D-rings to save in your repair kit for fixing luggage or camping gear.",
                    "safety_precautions": "Cut away from hands when slicing tough Cordura webbing."
                }
            ]
        },
        "local_guidance": {
            "region_code": "DEFAULT_SINGLE_STREAM",
            "facility_acceptance_verified": False,
            "guidance_notes": "Strictly excluded from curbside blue/green bins everywhere. Textiles act as 'tanglers' that jam sorting facility conveyors.",
            "disclaimer": "Never put textiles in curbside recycling. Deliver to dedicated charity or textile collection boxes."
        },
        "caveat": "Multi-material composites with synthetic coatings and metal hardware cannot be sorted in municipal recycling."
    }
}

# Generic fallback for uncataloged classes
GENERIC_KNOWLEDGE: Dict[str, Any] = {
    "category": "Mixed or unknown waste",
    "material": {
        "primary_material": "Mixed Composite or Unverified Material",
        "material_candidates": ["Mixed composite / Unverified material"],
        "material_confidence": "Low / Uncertain",
        "uncertainty_explanation": "Active detection model identified the visual bounding box and object class, but cannot assess internal polymer composition, coatings, or hazardous contaminants from RGB pixels alone."
    },
    "recyclability": "Needs verification",
    "recyclability_rationale": "Material composition, local facility compatibility, and contamination state must be physically inspected before disposal.",
    "verification_checklist": [
        "Inspect product surface for embossed SPI resin identification triangles, material stamps, or recycling symbols.",
        "Check whether item consists of separable single materials (e.g. metal screws removable from plastic body).",
        "Ensure object is clean, dry, and free of food, chemicals, or battery components."
    ],
    "recommended_disposal": "Cross-reference with your municipal waste authority's digital sorting directory before disposal. When in doubt, avoid contaminating clean recyclable bins.",
    "reuse": {
        "is_suitable": True,
        "safety_warning": "Evaluate whether the item can be safely cleaned, repaired, donated, or repurposed before disposal. Never reuse containers that held unknown chemicals.",
        "ideas": [
            {
                "title": "Assess Repair or Donation Feasibility",
                "difficulty": "Easy",
                "materials_needed": ["Basic household tools"],
                "instructions": "Inspect condition to determine if cleaning, minor hardware repair, or local thrift donation can extend the product lifecycle before treating it as waste.",
                "safety_precautions": "Confirm item is safe and non-hazardous before donating."
            }
        ]
    },
    "local_guidance": {
        "region_code": "DEFAULT_SINGLE_STREAM",
        "facility_acceptance_verified": False,
        "guidance_notes": "Single-stream MRFs require verified single-material items. Unsorted composites are diverted to landfill residue.",
        "disclaimer": "Local municipal rules are unverified for this unclassified entity. Consult local waste portal."
    },
    "caveat": "Visual detection models identify general object form factor. Material grade, composite layers, and chemical safety cannot be verified without physical inspection."
}


class RecyclingKnowledgeService:
    """Service to enrich raw detection labels with actionable recycling intelligence."""

    def __init__(self):
        # In-memory cached registry
        self._catalog = CLASS_RECYCLING_CATALOG
        self._generic = GENERIC_KNOWLEDGE

    def get_intelligence(self, class_name: str, region_override: Optional[str] = None) -> RecyclingIntelligence:
        normalized = class_name.lower().strip()
        data = self._catalog.get(normalized, self._generic)

        mat_info = data["material"]
        material_classification = MaterialClassification(
            primary_material=mat_info["primary_material"],
            material_candidates=list(mat_info["material_candidates"]),
            material_confidence=mat_info["material_confidence"],
            uncertainty_explanation=mat_info["uncertainty_explanation"],
            condition_assessment="Unassessed via camera stream; physical check required for food residue, chemical contamination, or structural degradation"
        )

        reuse_raw = data["reuse"]
        reuse_ideas = [
            ReuseIdea(
                title=item["title"],
                difficulty=item["difficulty"],
                materials_needed=list(item["materials_needed"]),
                instructions=item["instructions"],
                safety_precautions=item["safety_precautions"]
            )
            for item in reuse_raw.get("ideas", [])
        ]

        reuse_suitability = ReuseSuitability(
            is_suitable=reuse_raw["is_suitable"],
            ideas=reuse_ideas,
            safety_warning=reuse_raw.get("safety_warning")
        )

        loc_raw = data["local_guidance"]
        local_guidance = LocalGuidance(
            region_code=region_override or loc_raw["region_code"],
            facility_acceptance_verified=loc_raw["facility_acceptance_verified"],
            guidance_notes=loc_raw["guidance_notes"],
            disclaimer=loc_raw["disclaimer"]
        )

        return RecyclingIntelligence(
            category=data["category"],
            material=material_classification,
            material_candidates=list(mat_info["material_candidates"]),
            recyclability=data["recyclability"],
            recyclability_rationale=data["recyclability_rationale"],
            verification_checklist=list(data["verification_checklist"]),
            recommended_disposal=data["recommended_disposal"],
            reuse_ideas=[idea.title for idea in reuse_ideas],
            reuse=reuse_suitability,
            local_guidance=local_guidance,
            caveat=data["caveat"]
        )

    def get_reuse_guidance(self, class_name: str) -> ReuseSuitability:
        intel = self.get_intelligence(class_name)
        return intel.reuse

    def get_supported_categories(self) -> List[SupportedCategory]:
        return list(SUPPORTED_CATEGORIES.values())


recycling_service = RecyclingKnowledgeService()
