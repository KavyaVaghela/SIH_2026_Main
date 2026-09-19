import type { SafetyGuidelineItem } from "../types";

export const SAFETY_GUIDELINES_DATA: SafetyGuidelineItem[] = [
  {
    id: "guide-1",
    title: "On-Site Hazard Pre-Inspection Checklist",
    category: "Site Assessment",
    summary: "Mandatory steps before initiating any physical repair or installation at customer premises.",
    keyInstructions: [
      "Inspect main circuit breaker / main water shutoff valve prior to initiating work.",
      "Check for uninsulated exposed wiring, water leakage near sockets, or structural instability.",
      "Ensure adequate ventilation when handling gas lines, adhesives, or chemical solvents.",
      "Confirm start OTP with customer and establish clear workspace boundaries.",
    ],
  },
  {
    id: "guide-2",
    title: "Personal Protective Equipment (PPE) Mandate",
    category: "Equipment Standard",
    summary: "Required protective gear for electrical, plumbing, masonry, and carpentry jobs.",
    keyInstructions: [
      "Wear ISI-certified insulated safety footwear and non-conductive gloves on electrical jobs.",
      "Use protective safety goggles when drilling, cutting metal, or soldering joints.",
      "Keep a clean, calibrated digital multimeter for voltage verification prior to physical touch.",
      "Carry certified first-aid kit containing antiseptic, sterile bandage, and burn ointment.",
    ],
  },
  {
    id: "guide-3",
    title: "Customer Site Conduct & De-Escalation Protocol",
    category: "Customer Safety & Protocol",
    summary: "Maintaining professional boundaries and immediate reporting of unsafe environments.",
    keyInstructions: [
      "Never attempt unauthorized scope alterations without updating the official digital estimate.",
      "If you observe unsafe premises or hostile behavior, pause work immediately and step outside.",
      "Use the 'Report Unsafe Conditions' tool to document hazards with photo evidence.",
      "Contact Cooperative Safety Hotline immediately in case of emergency or threat.",
    ],
  },
];
