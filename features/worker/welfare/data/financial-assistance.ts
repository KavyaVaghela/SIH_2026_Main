import type { FinancialAssistanceProgram } from "../types";

export const FINANCIAL_ASSISTANCE_DATA: FinancialAssistanceProgram[] = [
  {
    id: "fin-1",
    title: "Trade Tool & Safety Gear Micro-Credit",
    maxAmount: "₹25,00,00",
    interestRate: "0% Interest (Cooperative Subsidized)",
    description: "Zero-interest micro-credit for purchasing certified power tools, digital multi-meters, safety boots, and insulated gloves.",
    eligibility: "Minimum 3 months active standing on KaushalyaSetu with 15+ completed bookings.",
  },
  {
    id: "fin-2",
    title: "Emergency Household Relief Advance",
    maxAmount: "₹15,00,00",
    interestRate: "Soft Cooperative Rate (4% p.a.)",
    description: "Immediate emergency liquidity advance for medical urgent care, child education admission, or festival preparation.",
    eligibility: "Subject to escrow history verification and peer worker recommendation.",
  },
];
