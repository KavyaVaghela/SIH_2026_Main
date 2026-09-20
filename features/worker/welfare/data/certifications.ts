import type { WelfareCertificationItem } from "../types";

export const WORKER_CERTIFICATIONS_DATA: WelfareCertificationItem[] = [
  {
    id: "cert-1",
    title: "Workplace Safety & First Aid",
    issuingAuthority: "State Cooperative Safety Board",
    status: "Active",
    issueDate: "15 Jan 2025",
    expiryDate: "14 Jan 2027",
  },
  {
    id: "cert-2",
    title: "Electrical Safety Certification",
    issuingAuthority: "Federation Technical Education Wing",
    status: "Renewal Due",
    issueDate: "10 Oct 2024",
    expiryDate: "09 Oct 2026",
    renewalNotice: "Renewal information available — Submit 15-minute online refresher quiz to extend validity for 2 years.",
  },
  {
    id: "cert-3",
    title: "Occupation Skill Certification",
    issuingAuthority: "KaushalyaSetu Federation Assessment Cell",
    status: "Active",
    issueDate: "01 Mar 2025",
    expiryDate: "28 Feb 2028",
  },
];
