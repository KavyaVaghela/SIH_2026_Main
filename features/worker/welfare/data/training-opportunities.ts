import type { TrainingOpportunity } from "../types";

export const TRAINING_OPPORTUNITIES_DATA: TrainingOpportunity[] = [
  {
    id: "train-1",
    title: "Advanced Workplace Safety",
    category: "Safety",
    duration: "4 weeks",
    mode: "Online",
    description: "Master essential site safety protocols, high-voltage electrical precautions, personal protective equipment (PPE) compliance, and emergency hazard mitigation.",
    provider: "Cooperative Safety Council & NSDC",
    skillsAcquired: [
      "Hazard Analysis & Prevention",
      "First-Aid & Burn Treatment",
      "Insulated Tool Safety",
      "Emergency Exit & Protocol",
    ],
    enrolledStatus: false,
  },
  {
    id: "train-2",
    title: "Advanced Plumbing Maintenance",
    category: "Plumbing",
    duration: "6 weeks",
    mode: "Hybrid",
    description: "Learn modern PEX pipe crimping, high-pressure booster pump diagnostics, solar water heater integration, and leak detection using acoustic sensors.",
    provider: "National Plumbing Guild & KaushalyaSetu Academy",
    skillsAcquired: [
      "PEX & CPVC Fusion",
      "Solar Water Heater Systems",
      "Acoustic Leak Detection",
      "Pressure Regulator Setup",
    ],
    enrolledStatus: true,
  },
  {
    id: "train-3",
    title: "Digital Payments & Escrow Literacy",
    category: "Digital Skills",
    duration: "2 weeks",
    mode: "Online",
    description: "Understand digital invoicing, instant escrow withdrawals, UPI QR management, GST compliance basics, and fraud prevention for craftspeople.",
    provider: "Cooperative Banking Federation",
    skillsAcquired: [
      "Escrow Settlement Verification",
      "UPI & Soundbox Setup",
      "Digital Receipt Generation",
      "Financial Fraud Awareness",
    ],
    enrolledStatus: false,
  },
];
