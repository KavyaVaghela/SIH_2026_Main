import type { WelfareRequestItem } from "../types";

export const INITIAL_WELFARE_REQUESTS: WelfareRequestItem[] = [
  {
    id: "req-1",
    referenceId: "KS-WLF-2026-0916",
    requestType: "Safety Equipment Request",
    date: "16 Sep 2026",
    status: "Under Review",
    description: "Requisition for certified insulated electrical gloves and rubber voltage testing kit for high-voltage panel servicing.",
    timelineStep: "Under Review by District Safety Officer",
    nextStep: "Verification of active electrical trade badge & dispatch schedule.",
  },
  {
    id: "req-2",
    referenceId: "KS-WLF-2026-0912",
    requestType: "Medical Assistance Information",
    date: "12 Sep 2026",
    status: "Information Provided",
    description: "Inquiry regarding OPD consultation discounts and cooperative health insurance claim procedures for eye care checkup.",
    timelineStep: "Information Packet Dispatched",
    nextStep: "Visit empanelled district cooperative clinic with KaushalyaSetu Digital ID.",
  },
  {
    id: "req-3",
    referenceId: "KS-WLF-2026-0908",
    requestType: "Training Opportunity",
    date: "08 Sep 2026",
    status: "In Progress",
    description: "Enrollment application for the 4-week Advanced Plumbing & Commercial Solar Water Heater Maintenance hybrid masterclass.",
    timelineStep: "Module 2 of 4 Active",
    nextStep: "Complete practical assessment workshop at Federation Skill Center on 25 Sep 2026.",
  },
  {
    id: "req-4",
    referenceId: "KS-WLF-2026-0828",
    requestType: "Welfare Scheme Guidance",
    date: "28 Aug 2026",
    status: "Completed",
    description: "Guidance request on eligibility guidelines and documentation checklist for Worker Accident Protection Support.",
    timelineStep: "Guidance Session Completed",
    nextStep: "Dossier checklist archived; all information provided successfully.",
  },
];
