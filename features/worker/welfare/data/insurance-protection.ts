import type { InsuranceProgramItem } from "../types";

export const INSURANCE_PROGRAMS_DATA: InsuranceProgramItem[] = [
  {
    id: "ins-1",
    title: "Cooperative Group Personal Accident Cover",
    coverageAmount: "₹5,00,000",
    status: "Active",
    description: "24/7 accidental death and permanent total disability insurance provided through cooperative federation membership.",
    benefits: [
      "₹5 Lakhs total permanent disability coverage",
      "₹2.5 Lakhs partial disability benefit",
      "Weekly income replacement (up to ₹3,000/week for 26 weeks during hospital stay)",
    ],
  },
  {
    id: "ins-2",
    title: "Worker Health & Hospital Cash Support",
    coverageAmount: "₹1,000 / day",
    status: "Active",
    description: "Daily hospital cash benefit during accidental injury or acute illness hospitalization.",
    benefits: [
      "Up to 30 days hospital stay per year",
      "No deductible; cashless settlement at empanelled cooperative hospitals",
      "Family coverage add-on available via voluntary subscription",
    ],
  },
];
