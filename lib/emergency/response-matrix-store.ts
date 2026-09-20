import { createAdminClient } from "@/lib/supabase/admin";
import type { EmergencyIncidentSeverity } from "@/supabase/types/database.types";

export interface WorkerRoleRequirement {
  role: string;
  count: number;
  skill: string;
}

export interface InitialResponseTask {
  order: number;
  title: string;
  instruction: string;
}

export interface EmergencyResponseMatrixRecord {
  id: string;
  matrix_code: string;
  category_name: string;
  emergency_type: string;
  description: string;
  severity: EmergencyIncidentSeverity;
  required_skills: string[];
  recommended_worker_count: number;
  worker_roles: WorkerRoleRequirement[];
  team_lead_required: boolean;
  initial_tasks: InitialResponseTask[];
  federation_involvement_required: boolean;
  safety_requirements: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 14 Deterministic Predefined Seed Definitions matching the approved KaushalyaSetu Emergency Workflow
export const SEED_EMERGENCY_RESPONSE_MATRIX: EmergencyResponseMatrixRecord[] = [
  // 1. Water Infrastructure: Society Water Tank Burst (Concrete reference from workflow)
  {
    id: "e0000001-0000-0000-0000-000000000001",
    matrix_code: "wat-tank-burst",
    category_name: "Water Infrastructure",
    emergency_type: "Society Water Tank Burst",
    description: "Overhead or underground community water tank structural rupture flooding premises.",
    severity: "CRITICAL",
    required_skills: ["Plumbing", "Water infrastructure", "Pump operation", "Electrical safety"],
    recommended_worker_count: 6,
    worker_roles: [
      { role: "Team Lead", count: 1, skill: "Plumbing / Incident Coordination" },
      { role: "Plumber", count: 3, skill: "Plumbing" },
      { role: "Water Technician", count: 1, skill: "Water infrastructure / Pump operation" },
      { role: "Electrician", count: 1, skill: "Electrical safety" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Main Riser Isolation", instruction: "Locate and shut off primary intake and booster riser valves immediately." },
      { order: 2, title: "Pump Substation Power Cutoff", instruction: "De-energize pump room distribution panel to eliminate electrocution hazard." },
      { order: 3, title: "Structural & Drainage Perimeter Check", instruction: "Inspect foundation walls, basement conduits, and clear storm drains." },
      { order: 4, title: "Deploy Dewatering Submersible Pump", instruction: "Deploy heavy-duty submersible dewatering pump to evacuate standing water." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "De-energize electrical sub-panel near flooded area",
      "Wear rubberized safety boots and insulated gloves",
      "Cordon off unstable structural perimeter",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 2. Water Infrastructure: Main Water Supply Line Rupture
  {
    id: "e0000001-0000-0000-0000-000000000002",
    matrix_code: "wat-pipe-rupture",
    category_name: "Water Infrastructure",
    emergency_type: "Main Water Supply Line Rupture",
    description: "High-pressure municipal or building riser pipe burst causing uncontrolled flooding.",
    severity: "HIGH",
    required_skills: ["Plumbing", "Water infrastructure", "Pipe fitting"],
    recommended_worker_count: 3,
    worker_roles: [
      { role: "Team Lead", count: 1, skill: "Plumbing / High-Pressure Lines" },
      { role: "Plumber", count: 2, skill: "Plumbing / Pipe Fitting" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Shut Off Sluice Valve", instruction: "Isolate the municipal inlet sluice valve to stop high-pressure inflow." },
      { order: 2, title: "Pressure Relief", instruction: "Open lowest drain valves to bleed residual line pressure." },
      { order: 3, title: "Pipe Section Clamping", instruction: "Apply mechanical compression repair clamp or replacement pipe spool." },
    ],
    federation_involvement_required: false,
    safety_requirements: [
      "Maintain safe distance from high-velocity water jet",
      "Isolate nearby ground junction boxes",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 3. Water Infrastructure: Severe Drainage / Sewage Backup
  {
    id: "e0000001-0000-0000-0000-000000000003",
    matrix_code: "wat-drain-backup",
    category_name: "Water Infrastructure",
    emergency_type: "Severe Drainage / Sewage Backup",
    description: "Critical sewer line blockage causing wastewater overflow into residential areas.",
    severity: "HIGH",
    required_skills: ["Drainage clearing", "Jetting machine operation", "Bio-sanitation"],
    recommended_worker_count: 2,
    worker_roles: [
      { role: "Drainage Technician", count: 2, skill: "Drainage clearing / Jetting machine operation" },
    ],
    team_lead_required: false,
    initial_tasks: [
      { order: 1, title: "Sewer Manhole Inspection", instruction: "Open downstream inspection chamber to locate blockage point." },
      { order: 2, title: "Deploy High-Pressure Jetting Rod", instruction: "Insert jetting head to clear grease, roots, or physical obstruction." },
      { order: 3, title: "Sanitary Disinfection", instruction: "Apply bio-neutralizer spray over affected surface area." },
    ],
    federation_involvement_required: false,
    safety_requirements: [
      "Wear biological hazard suit, gas mask, and nitrile gloves",
      "Ventilate sewer gases (H2S/methane)",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 4. Electrical Systems: Electrical Short Circuit & Sparking
  {
    id: "e0000001-0000-0000-0000-000000000004",
    matrix_code: "elec-short-spark",
    category_name: "Electrical Systems",
    emergency_type: "Electrical Short Circuit & Sparking",
    description: "Active electrical arcing, burning wire smell, or failure of breaker to trip.",
    severity: "CRITICAL",
    required_skills: ["Electrical safety", "Arc fault isolation", "Cable jointing"],
    recommended_worker_count: 2,
    worker_roles: [
      { role: "Team Lead / Senior Electrician", count: 1, skill: "Electrical safety / Diagnostic isolation" },
      { role: "Electrician", count: 1, skill: "Cable jointing / Panel maintenance" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Upstream Breaker Trip", instruction: "Locate and isolate upstream main breaker or fuse switch immediately." },
      { order: 2, title: "Thermal Scan & Arc Source Trace", instruction: "Use non-contact infrared scanner to identify scorched cable section." },
      { order: 3, title: "Dielectric Test & Jointing", instruction: "Strip melted insulation, verify zero voltage, and install heat-shrink splice." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "Never use water on electrical fire",
      "Use Class C / CO2 extinguisher only",
      "Verify zero energy state with calibrated multimeter",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 5. Electrical Systems: Substation / Main Panel Failure
  {
    id: "e0000001-0000-0000-0000-000000000005",
    matrix_code: "elec-substation-fail",
    category_name: "Electrical Systems",
    emergency_type: "Substation / Main Panel Failure",
    description: "Central distribution panel burnout, busbar failure, or phase drop.",
    severity: "HIGH",
    required_skills: ["High-voltage systems", "Busbar maintenance", "Phase load balancing"],
    recommended_worker_count: 3,
    worker_roles: [
      { role: "Team Lead / Electrical Engineer", count: 1, skill: "High-voltage systems / Panel diagnostics" },
      { role: "Certified Electrician", count: 2, skill: "Busbar maintenance / Cable termination" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Lock-Out Tag-Out (LOTO)", instruction: "Engage mechanical padlock and tag on primary transformer circuit breaker." },
      { order: 2, title: "Busbar Chamber Inspection", instruction: "Inspect phase separation insulators and busbar couplers for flashover." },
      { order: 3, title: "Phase Continuity Testing", instruction: "Measure 3-phase resistance across terminal lugs before re-energizing." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "Mandatory 1000V rated insulated gloves and face shield",
      "Observe Lock-Out Tag-Out protocols",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 6. Electrical Systems: Total Building Power Blackout
  {
    id: "e0000001-0000-0000-0000-000000000006",
    matrix_code: "elec-blackout",
    category_name: "Electrical Systems",
    emergency_type: "Total Building Power Blackout",
    description: "Sudden complete loss of electricity affecting essential infrastructure (pumps, lifts).",
    severity: "HIGH",
    required_skills: ["Generator maintenance", "ATS diagnostics", "Power distribution"],
    recommended_worker_count: 2,
    worker_roles: [
      { role: "Electrician", count: 1, skill: "Power distribution" },
      { role: "DG Specialist", count: 1, skill: "Generator maintenance / ATS diagnostics" },
    ],
    team_lead_required: false,
    initial_tasks: [
      { order: 1, title: "Grid vs Internal Fault Determination", instruction: "Check municipal distribution feeder status to isolate grid fault." },
      { order: 2, title: "Emergency Generator Inspection", instruction: "Verify DG set auto-crank battery, fuel line, and ATS contactor position." },
      { order: 3, title: "Manual ATS Transfer", instruction: "Manually throw bypass switch if automatic transfer solenoid stalled." },
    ],
    federation_involvement_required: false,
    safety_requirements: [
      "Ensure emergency lighting is activated",
      "Keep pump and elevator emergency lines prioritized",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 7. Gas & Fire Hazard: Piped Gas Leakage
  {
    id: "e0000001-0000-0000-0000-000000000007",
    matrix_code: "gas-piped-leak",
    category_name: "Gas & Fire Hazard",
    emergency_type: "Piped Gas Leakage",
    description: "Strong domestic or riser piped natural gas (PNG) odor requiring emergency isolation.",
    severity: "CRITICAL",
    required_skills: ["Gas safety", "PNG line isolation", "Combustible gas sniffing"],
    recommended_worker_count: 3,
    worker_roles: [
      { role: "Team Lead", count: 1, skill: "Gas safety / Emergency isolation" },
      { role: "Certified Gas Fitter", count: 2, skill: "PNG line isolation / Leak detection" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Master Gas Valve Shutoff", instruction: "Immediately turn off building riser master yellow-handle emergency valve." },
      { order: 2, title: "Extinguish Open Flames & Ventilation", instruction: "Do not operate electrical switches. Open windows and doors for natural ventilation." },
      { order: 3, title: "Calibrated Gas Sniffer Survey", instruction: "Scan pipeline joints with digital combustible detector to pinpoint breach." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "DO NOT turn ON/OFF any electrical light or fan switches",
      "No mobile phones or spark sources near leakage zone",
      "Evacuate building occupants if gas level > 10% LEL",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 8. Gas & Fire Hazard: Cylinder Regulator Hazard
  {
    id: "e0000001-0000-0000-0000-000000000008",
    matrix_code: "gas-regulator-fail",
    category_name: "Gas & Fire Hazard",
    emergency_type: "Cylinder Regulator Hazard",
    description: "LPG cylinder valve leak or defective high-pressure regulator refusing shutoff.",
    severity: "CRITICAL",
    required_skills: ["LPG handling", "Regulator repair", "Fire safety"],
    recommended_worker_count: 1,
    worker_roles: [
      { role: "Gas Appliance Technician", count: 1, skill: "LPG handling / Regulator repair" },
    ],
    team_lead_required: false,
    initial_tasks: [
      { order: 1, title: "Regulator Release & Safety Cap", instruction: "Pull up collar to detach defective regulator; snap black plastic safety cap on cylinder valve." },
      { order: 2, title: "Move Cylinder to Open Atmosphere", instruction: "Carefully move leaking cylinder to open-air balcony or outdoor compound." },
      { order: 3, title: "Bubble Leak Check", instruction: "Apply soap solution on valve seat to confirm seal integrity." },
    ],
    federation_involvement_required: false,
    safety_requirements: [
      "Keep wet burlap or safety blanket nearby",
      "Ensure zero flame or sparks in vicinity",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 9. Gas & Fire Hazard: Smoke / Electrical Fire Alarm
  {
    id: "e0000001-0000-0000-0000-000000000009",
    matrix_code: "gas-electrical-smoke",
    category_name: "Gas & Fire Hazard",
    emergency_type: "Smoke / Electrical Fire Alarm",
    description: "Dense electrical smoke emerging from service shafts or ceiling conduit.",
    severity: "CRITICAL",
    required_skills: ["Fire safety", "Electrical isolation", "Smoke evacuation"],
    recommended_worker_count: 3,
    worker_roles: [
      { role: "Team Lead", count: 1, skill: "Fire safety / Incident control" },
      { role: "Fire Safety Technician", count: 1, skill: "Fire fighting / Smoke evacuation" },
      { role: "Electrician", count: 1, skill: "Electrical isolation" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Activate Alarm & Evacuate Shaft Zone", instruction: "Trigger manual fire call point and alert floor occupants." },
      { order: 2, title: "Cut Electrical Infeed to Shaft", instruction: "De-energize main electrical infeed serving the smoking riser." },
      { order: 3, title: "CO2 Suppression & Thermal Check", instruction: "Discharge dry chemical / CO2 extinguisher into shaft access hatch." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "Wear smoke-filtering respirator mask",
      "Do not use elevators during smoke warning",
      "Stay low beneath smoke ceiling",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 10. Structural & Security: Emergency Door Lockout
  {
    id: "e0000001-0000-0000-0000-000000000010",
    matrix_code: "sec-door-lockout",
    category_name: "Structural & Security",
    emergency_type: "Emergency Door Lockout",
    description: "Main safety door jammed or broken key with vulnerable occupants or children inside.",
    severity: "HIGH",
    required_skills: ["Lock picking", "Digital lock override", "Door hardware"],
    recommended_worker_count: 1,
    worker_roles: [
      { role: "Certified Locksmith", count: 1, skill: "Lock picking / Non-destructive entry" },
    ],
    team_lead_required: false,
    initial_tasks: [
      { order: 1, title: "Occupant Safety & Welfare Assessment", instruction: "Communicate through door to verify condition of occupants inside." },
      { order: 2, title: "Non-Destructive Bypass Attempt", instruction: "Attempt tension pick or cylinder decoder bypass on primary lock." },
      { order: 3, title: "Controlled Cylinder Extraction", instruction: "If jammed, pull lock core cleanly to unlock deadbolt without door damage." },
    ],
    federation_involvement_required: false,
    safety_requirements: [
      "Verify customer identity and tenancy documentation",
      "Avoid uncoordinated forced entry causing glass shatter",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 11. Structural & Security: Structural Collapse / Slab Damage
  {
    id: "e0000001-0000-0000-0000-000000000011",
    matrix_code: "sec-slab-damage",
    category_name: "Structural & Security",
    emergency_type: "Structural Collapse / Slab Damage",
    description: "Spalling concrete, cracked support lintel, or ceiling plaster collapse threatening injury.",
    severity: "CRITICAL",
    required_skills: ["Structural shoring", "Masonry", "Emergency props"],
    recommended_worker_count: 3,
    worker_roles: [
      { role: "Structural Team Lead", count: 1, skill: "Structural shoring / Load assessment" },
      { role: "Masonry / Propping Specialist", count: 2, skill: "Emergency props / Debris stabilization" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Cordon Danger Footprint", instruction: "Establish 5-meter exclusion boundary tape around falling debris area." },
      { order: 2, title: "Install Heavy-Duty Steel Acrow Props", instruction: "Erect telescopic screw props with baseplates beneath deflecting ceiling slab." },
      { order: 3, title: "Load Transfer & Deflection Monitoring", instruction: "Tighten prop pins to arrest ongoing structural subsidence." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "Wear hard hats and steel-toe boots at all times",
      "Never step directly under cracked cantilever slab",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 12. Structural & Security: Elevator Failure / Entrapment
  {
    id: "e0000001-0000-0000-0000-000000000012",
    matrix_code: "sec-elevator-trap",
    category_name: "Structural & Security",
    emergency_type: "Elevator Failure / Entrapment",
    description: "Building lift stalled between floors with trapped occupants requiring certified extrication.",
    severity: "CRITICAL",
    required_skills: ["Elevator mechanics", "Manual brake release", "Passenger extrication"],
    recommended_worker_count: 2,
    worker_roles: [
      { role: "Certified Lift Technician (Team Lead)", count: 1, skill: "Elevator mechanics / Brake release" },
      { role: "Lift Assistant", count: 1, skill: "Passenger extrication / Door unlocking" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Intercom Contact & Reassurance", instruction: "Establish communication with passengers, instruct them to step back from doors." },
      { order: 2, title: "Machine Room Power Isolation", instruction: "Switch off lift 3-phase supply breaker to prevent sudden motor startup." },
      { order: 3, title: "Manual Brake Release & Leveling", instruction: "Manually lift brake lever and wind flywheel until car aligns with floor landing sill." },
      { order: 4, title: "Drop-Key Landing Door Unlock", instruction: "Insert emergency drop key into header hatch to open doors and assist passengers out." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "Never attempt door pry until drive power is isolated",
      "Verify cabin floor is level with landing sill before passenger exit",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 13. Sanitation & Biohazard: Severe Chemical / Hazardous Waste Spillage
  {
    id: "e0000001-0000-0000-0000-000000000013",
    matrix_code: "san-chemical-spill",
    category_name: "Sanitation & Biohazard",
    emergency_type: "Severe Chemical / Hazardous Waste Spillage",
    description: "Industrial acid, chlorine, or caustic cleaning agent spill generating toxic fumes.",
    severity: "HIGH",
    required_skills: ["Hazardous material handling", "Chemical neutralization", "Respiratory PPE"],
    recommended_worker_count: 2,
    worker_roles: [
      { role: "Biohazard Specialist", count: 2, skill: "Hazardous material handling / Chemical neutralization" },
    ],
    team_lead_required: false,
    initial_tasks: [
      { order: 1, title: "Establish Vapor Perimeter", instruction: "Evacuate downwind corridor and set up chemical hazard signage." },
      { order: 2, title: "Deploy Neutralizing Absorbent Boom", instruction: "Encircle liquid pool with sodium bicarbonate or absorbent chemical socks." },
      { order: 3, title: "Collect Waste in Sealed Hazmat Drums", instruction: "Scoop spent neutralized slurry into UN-rated yellow waste containers." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "Must wear chemical splash apron, full-face respirator, and heavy butyl gloves",
      "Do not rinse corrosive chemicals down public storm drains",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
  // 14. Sanitation & Biohazard: Contaminated Community Water Supply
  {
    id: "e0000001-0000-0000-0000-000000000014",
    matrix_code: "san-water-contam",
    category_name: "Sanitation & Biohazard",
    emergency_type: "Contaminated Community Water Supply",
    description: "Sewage cross-contamination or chemical ingress into domestic drinking water line.",
    severity: "CRITICAL",
    required_skills: ["Water chlorination", "Tank decontamination", "Plumbing cross-connection"],
    recommended_worker_count: 3,
    worker_roles: [
      { role: "Water Quality Specialist (Team Lead)", count: 1, skill: "Water chlorination / Contamination tracing" },
      { role: "Tank Decontamination Technician", count: 2, skill: "Tank decontamination / High-pressure washing" },
    ],
    team_lead_required: true,
    initial_tasks: [
      { order: 1, title: "Lock Consumer Distribution Outlets", instruction: "Lock society distribution valves and notify residents not to drink or use tap water." },
      { order: 2, title: "Drain Sump & Locate Ingress Point", instruction: "Pump out contaminated water; inspect tank walls for sewage pipe infiltration." },
      { order: 3, title: "Hyper-Chlorination & Shock Treatment", instruction: "Apply 50 ppm calcium hypochlorite wash across all tank surfaces, soak, and flush." },
    ],
    federation_involvement_required: true,
    safety_requirements: [
      "Wear protective gas masks when handling concentrated hypochlorite",
      "Perform water test before re-authorizing potable use",
    ],
    is_active: true,
    created_at: "2026-09-19T00:00:00.000Z",
    updated_at: "2026-09-19T00:00:00.000Z",
  },
];

// In-memory lookup registry with hot fallback
const inMemoryMatrixMap = new Map<string, EmergencyResponseMatrixRecord>();
SEED_EMERGENCY_RESPONSE_MATRIX.forEach((entry) => {
  inMemoryMatrixMap.set(entry.matrix_code.toLowerCase(), entry);
  inMemoryMatrixMap.set(entry.emergency_type.toLowerCase(), entry);
});

export class EmergencyResponseMatrixRepository {
  /**
   * Retrieves all active predefined Emergency Response Matrix entries
   */
  static async listAll(category?: string): Promise<EmergencyResponseMatrixRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from("emergency_response_matrix") as any)
        .select("*")
        .eq("is_active", true)
        .order("category_name", { ascending: true })
        .order("emergency_type", { ascending: true });

      if (category) {
        query = query.eq("category_name", category);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as EmergencyResponseMatrixRecord[];
      }
    } catch {
      // Fall through to memory store
    }

    let records = Array.from(new Set(inMemoryMatrixMap.values())).filter((r) => r.is_active);
    if (category) {
      records = records.filter(
        (r) => r.category_name.toLowerCase() === category.toLowerCase()
      );
    }
    return records;
  }

  /**
   * Deterministic lookup by stable matrix_code (e.g. 'wat-tank-burst')
   */
  static async findByCode(code: string): Promise<EmergencyResponseMatrixRecord | null> {
    if (!code || typeof code !== "string") return null;
    const normalized = code.trim().toLowerCase();

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_response_matrix") as any)
        .select("*")
        .eq("matrix_code", normalized)
        .maybeSingle();

      if (!error && data) {
        return data as EmergencyResponseMatrixRecord;
      }
    } catch {
      // Fall through to memory
    }

    return inMemoryMatrixMap.get(normalized) || null;
  }

  /**
   * Deterministic lookup by emergency type name or stable code
   */
  static async findByEmergencyType(nameOrCode: string): Promise<EmergencyResponseMatrixRecord | null> {
    if (!nameOrCode || typeof nameOrCode !== "string") return null;
    const normalized = nameOrCode.trim().toLowerCase();

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_response_matrix") as any)
        .select("*")
        .or(`matrix_code.eq.${normalized},emergency_type.ilike.${normalized}`)
        .maybeSingle();

      if (!error && data) {
        return data as EmergencyResponseMatrixRecord;
      }
    } catch {
      // Fall through to memory
    }

    return inMemoryMatrixMap.get(normalized) || null;
  }

  /**
   * Checks if an emergency type or code exists in the predefined matrix
   */
  static async isValidType(nameOrCode: string): Promise<boolean> {
    const entry = await this.findByEmergencyType(nameOrCode);
    return entry !== null && entry.is_active;
  }

  /**
   * Updates a matrix entry (strictly restricted to Admin roles; customers cannot modify)
   */
  static async updateMatrixEntry(
    code: string,
    updates: Partial<EmergencyResponseMatrixRecord>,
    updaterRole: string
  ): Promise<{ success: boolean; error?: string; record?: EmergencyResponseMatrixRecord }> {
    if (updaterRole === "CUSTOMER") {
      return {
        success: false,
        error: "Customers are strictly forbidden from modifying the Emergency Response Matrix.",
      };
    }

    if (updaterRole !== "SUPER_ADMIN" && updaterRole !== "SERVICE_ROLE") {
      return {
        success: false,
        error: "Forbidden: Super Admin privileges are required to update emergency response configurations.",
      };
    }

    const existing = await this.findByCode(code);
    if (!existing) {
      return { success: false, error: "Matrix configuration entry not found." };
    }

    const updatedRecord: EmergencyResponseMatrixRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    inMemoryMatrixMap.set(existing.matrix_code.toLowerCase(), updatedRecord);
    inMemoryMatrixMap.set(existing.emergency_type.toLowerCase(), updatedRecord);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_response_matrix") as any)
        .update({
          ...updates,
          updated_at: updatedRecord.updated_at,
        })
        .eq("matrix_code", existing.matrix_code);
    } catch {
      // Quiet fallback
    }

    return { success: true, record: updatedRecord };
  }
}
