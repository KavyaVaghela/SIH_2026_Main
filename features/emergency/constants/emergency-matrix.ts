import type { EmergencyIncidentSeverity } from "@/supabase/types/database.types";
import {
  SEED_EMERGENCY_RESPONSE_MATRIX,
  type EmergencyResponseMatrixRecord,
} from "@/lib/emergency/response-matrix-store";

export interface PredefinedEmergencyType {
  id: string;
  category: string;
  name: string;
  description: string;
  defaultSeverity: EmergencyIncidentSeverity;
  iconName: "droplets" | "zap" | "flame" | "key" | "alert-triangle" | "shield-alert" | "biohazard";
}

export interface PredefinedEmergencyCategory {
  name: string;
  description: string;
  types: PredefinedEmergencyType[];
}

export const PREDEFINED_EMERGENCY_CATEGORIES: PredefinedEmergencyCategory[] = [
  {
    name: "Water Infrastructure",
    description: "Critical water supply ruptures, structural tank bursts, and high-volume leakages.",
    types: [
      {
        id: "wat-tank-burst",
        category: "Water Infrastructure",
        name: "Society Water Tank Burst",
        description: "Overhead or underground community water tank structural rupture flooding premises.",
        defaultSeverity: "CRITICAL",
        iconName: "droplets",
      },
      {
        id: "wat-pipe-rupture",
        category: "Water Infrastructure",
        name: "Main Water Supply Line Rupture",
        description: "High-pressure municipal or building riser pipe burst causing uncontrolled flooding.",
        defaultSeverity: "HIGH",
        iconName: "droplets",
      },
      {
        id: "wat-drain-backup",
        category: "Water Infrastructure",
        name: "Severe Drainage / Sewage Backup",
        description: "Critical sewer line blockage causing wastewater overflow into residential areas.",
        defaultSeverity: "HIGH",
        iconName: "droplets",
      },
    ],
  },
  {
    name: "Electrical Systems",
    description: "High-voltage failures, active sparking, and critical distribution hazards.",
    types: [
      {
        id: "elec-short-spark",
        category: "Electrical Systems",
        name: "Electrical Short Circuit & Sparking",
        description: "Active electrical arcing, burning wire smell, or failure of breaker to trip.",
        defaultSeverity: "CRITICAL",
        iconName: "zap",
      },
      {
        id: "elec-substation-fail",
        category: "Electrical Systems",
        name: "Substation / Main Panel Failure",
        description: "Central distribution panel burnout, busbar failure, or phase drop.",
        defaultSeverity: "HIGH",
        iconName: "zap",
      },
      {
        id: "elec-blackout",
        category: "Electrical Systems",
        name: "Total Building Power Blackout",
        description: "Sudden complete loss of electricity affecting essential infrastructure (pumps, lifts).",
        defaultSeverity: "HIGH",
        iconName: "zap",
      },
    ],
  },
  {
    name: "Gas & Fire Hazard",
    description: "Combustible gas leaks, regulator hazards, and early fire warning states.",
    types: [
      {
        id: "gas-piped-leak",
        category: "Gas & Fire Hazard",
        name: "Piped Gas Leakage",
        description: "Strong domestic or riser piped natural gas (PNG) odor requiring emergency isolation.",
        defaultSeverity: "CRITICAL",
        iconName: "flame",
      },
      {
        id: "gas-regulator-fail",
        category: "Gas & Fire Hazard",
        name: "Cylinder Regulator Hazard",
        description: "LPG cylinder valve leak or defective high-pressure regulator refusing shutoff.",
        defaultSeverity: "CRITICAL",
        iconName: "flame",
      },
      {
        id: "gas-electrical-smoke",
        category: "Gas & Fire Hazard",
        name: "Smoke / Electrical Fire Alarm",
        description: "Dense electrical smoke emerging from service shafts or ceiling conduit.",
        defaultSeverity: "CRITICAL",
        iconName: "flame",
      },
    ],
  },
  {
    name: "Structural & Security",
    description: "Urgent physical safety hazards, door lockouts, and elevator entrapment.",
    types: [
      {
        id: "sec-door-lockout",
        category: "Structural & Security",
        name: "Emergency Door Lockout",
        description: "Main safety door jammed or broken key with vulnerable occupants or children inside.",
        defaultSeverity: "HIGH",
        iconName: "key",
      },
      {
        id: "sec-slab-damage",
        category: "Structural & Security",
        name: "Structural Collapse / Slab Damage",
        description: "Spalling concrete, cracked support lintel, or ceiling plaster collapse threatening injury.",
        defaultSeverity: "CRITICAL",
        iconName: "shield-alert",
      },
      {
        id: "sec-elevator-trap",
        category: "Structural & Security",
        name: "Elevator Failure / Entrapment",
        description: "Building lift stalled between floors with trapped occupants requiring certified extrication.",
        defaultSeverity: "CRITICAL",
        iconName: "alert-triangle",
      },
    ],
  },
  {
    name: "Sanitation & Biohazard",
    description: "Toxic chemical spills, dangerous sewer gases, and water contamination.",
    types: [
      {
        id: "san-chemical-spill",
        category: "Sanitation & Biohazard",
        name: "Severe Chemical / Hazardous Waste Spillage",
        description: "Industrial acid, chlorine, or caustic cleaning agent spill generating toxic fumes.",
        defaultSeverity: "HIGH",
        iconName: "biohazard",
      },
      {
        id: "san-water-contam",
        category: "Sanitation & Biohazard",
        name: "Contaminated Community Water Supply",
        description: "Sewage cross-contamination or chemical ingress into domestic drinking water line.",
        defaultSeverity: "CRITICAL",
        iconName: "biohazard",
      },
    ],
  },
];

// Flat lookup map of all supported emergency types
export const ALL_PREDEFINED_EMERGENCY_TYPES: PredefinedEmergencyType[] =
  PREDEFINED_EMERGENCY_CATEGORIES.flatMap((c) => c.types);

/**
 * Validates if an emergency type string is in the predefined deterministic list
 */
export function isValidEmergencyType(emergencyType: string): boolean {
  if (!emergencyType || typeof emergencyType !== "string") return false;
  const normalized = emergencyType.trim().toLowerCase();
  return ALL_PREDEFINED_EMERGENCY_TYPES.some(
    (t) => t.name.toLowerCase() === normalized || t.id.toLowerCase() === normalized
  );
}

/**
 * Resolves full predefined type definition
 */
export function getEmergencyTypeDetails(emergencyType: string): PredefinedEmergencyType | null {
  if (!emergencyType) return null;
  const normalized = emergencyType.trim().toLowerCase();
  return (
    ALL_PREDEFINED_EMERGENCY_TYPES.find(
      (t) => t.name.toLowerCase() === normalized || t.id.toLowerCase() === normalized
    ) || null
  );
}

/**
 * Resolves the deterministic Response Matrix entry for an emergency type or ID
 */
export function getResponseMatrixForType(emergencyTypeOrId: string): EmergencyResponseMatrixRecord | null {
  if (!emergencyTypeOrId) return null;
  const normalized = emergencyTypeOrId.trim().toLowerCase();
  return (
    SEED_EMERGENCY_RESPONSE_MATRIX.find(
      (m) =>
        m.matrix_code.toLowerCase() === normalized ||
        m.emergency_type.toLowerCase() === normalized
    ) || null
  );
}
