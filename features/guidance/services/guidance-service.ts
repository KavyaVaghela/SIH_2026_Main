import type { PlatformRole } from "@/config/navigation";
import {
  GUIDANCE_ARTICLES,
  STATUS_EXPLAINERS,
  VISUAL_JOURNEY_MAPS,
  TROUBLESHOOTING_STEPS,
  ONBOARDING_TASKS,
  TOOLTIPS,
} from "../data/guidance-content";
import type {
  GuidanceArticle,
  StatusExplainerItem,
  VisualJourneyMapData,
  TroubleshootingStep,
  OnboardingTask,
  SearchGuidanceResult,
  WhatHappensNextContext,
  WhatHappensNextResolution,
  GuidanceCategory,
} from "../types";

export class GuidanceService {
  /**
   * Role-Aware Search Engine across all guidance content
   */
  public searchGuidance(role: PlatformRole, query: string): SearchGuidanceResult {
    const q = (query || "").trim().toLowerCase();

    // 1. Filter articles by role
    const roleArticles = GUIDANCE_ARTICLES.filter((art) =>
      art.targetRoles.includes(role)
    );

    // If empty query, return top articles for role
    if (!q) {
      return {
        query: "",
        role,
        totalMatches: roleArticles.length,
        howTo: roleArticles.filter((a) => a.type === "HOW_TO"),
        statusExplanations: STATUS_EXPLAINERS.filter((s) => s.applicableRoles.includes(role)),
        commonQuestions: roleArticles.filter((a) => a.type === "COMMON_QUESTION"),
        troubleshooting: TROUBLESHOOTING_STEPS.filter((t) => t.applicableRoles.includes(role)),
      };
    }

    // 2. Search Articles (How-To & Common Questions)
    const matchingArticles = roleArticles.filter((art) => {
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchSummary = art.summary.toLowerCase().includes(q);
      const matchContent = art.content.toLowerCase().includes(q);
      const matchKeywords = art.keywords.some((kw) => {
        const k = kw.toLowerCase();
        return k.includes(q) || q.includes(k);
      });
      const matchSteps = art.steps?.some(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
      return matchTitle || matchSummary || matchContent || matchKeywords || matchSteps;
    });

    const howTo = matchingArticles.filter((a) => a.type === "HOW_TO");
    const commonQuestions = matchingArticles.filter((a) => a.type === "COMMON_QUESTION");

    // 3. Search Status Explainers (Role-Aware)
    const statusExplanations = STATUS_EXPLAINERS.filter((s) => {
      if (!s.applicableRoles.includes(role)) return false;
      return (
        s.statusCode.toLowerCase().includes(q) ||
        s.displayTitle.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.whoActsNext.toLowerCase().includes(q) ||
        s.whatHappensAfter.toLowerCase().includes(q)
      );
    });

    // 4. Search Troubleshooting (Role-Aware)
    const troubleshooting = TROUBLESHOOTING_STEPS.filter((t) => {
      if (!t.applicableRoles.includes(role)) return false;
      return (
        t.title.toLowerCase().includes(q) ||
        t.issueSymptoms.toLowerCase().includes(q) ||
        t.probableCauses.some((c) => c.toLowerCase().includes(q)) ||
        t.resolutionSteps.some((r) => r.toLowerCase().includes(q))
      );
    });

    const totalMatches =
      howTo.length + commonQuestions.length + statusExplanations.length + troubleshooting.length;

    return {
      query,
      role,
      totalMatches,
      howTo,
      statusExplanations,
      commonQuestions,
      troubleshooting,
    };
  }

  /**
   * Get single status explanation strictly scoped by role
   */
  public getStatusExplanation(
    statusCode: string,
    role: PlatformRole
  ): StatusExplainerItem | null {
    const item = STATUS_EXPLAINERS.find(
      (s) => s.statusCode.toUpperCase() === statusCode.toUpperCase()
    );
    if (!item) return null;
    if (!item.applicableRoles.includes(role)) return null;
    return item;
  }

  /**
   * Dynamic "What Happens Next?" Contextual Resolver
   * Inspects authentic database state and provides real-time guidance
   */
  public resolveWhatHappensNext(context: WhatHappensNextContext): WhatHappensNextResolution {
    const { role, entityType, currentStatus, counterPartyName } = context;
    const status = (currentStatus || "").toUpperCase();

    // 1. Grievance Lifecycle Resolvers (Phase 5)
    if (entityType === "GRIEVANCE") {
      switch (status) {
        case "OPEN":
          return {
            currentStageLabel: "Grievance Lodged",
            whoActsNext: "Federation Conciliation Officer",
            nextStepTitle: "Automated Triage & Officer Assignment",
            nextStepExplanation:
              "Your dispute has been assigned a trackable case reference. The cooperative federation conciliation officer is reviewing initial booking logs and evaluating severity.",
            actionPrompt: "No immediate action required.",
            timelineEstimate: "Initial review within 24 hours",
          };
        case "UNDER_REVIEW":
          return {
            currentStageLabel: "Under Review",
            whoActsNext: "Federation Admin",
            nextStepTitle: "Conciliation Investigation",
            nextStepExplanation:
              "The federation officer is reviewing service timelines, estimates, and customer records to determine fair conciliation terms.",
            actionPrompt: "Wait for federation decision or statement request.",
            timelineEstimate: "Review in progress (24-48 hours)",
          };
        case "ACTION_REQUIRED":
          return {
            currentStageLabel: "Statement Requested",
            whoActsNext: role === "CUSTOMER" ? "Customer" : "Worker",
            nextStepTitle: "Submit Your Formal Statement",
            nextStepExplanation:
              "The federation conciliation officer has formally requested clarification or testimony regarding this dispute.",
            actionPrompt: "Submit your written statement to continue conciliation.",
            actionLink: {
              label: "Submit Statement",
              href: role === "CUSTOMER" ? "/customer/complaints" : "/worker/grievances",
              variant: "primary",
            },
            timelineEstimate: "Response required within 48 hours",
          };
        case "RESOLVED":
          return {
            currentStageLabel: "Grievance Resolved",
            whoActsNext: "All Parties",
            nextStepTitle: "Acknowledge Remedy & Settlement",
            nextStepExplanation:
              "A binding resolution has been issued by the cooperative federation with specified remedies (service rework, voucher, or mutual settlement).",
            actionPrompt: "Review resolution details.",
            actionLink: {
              label: "View Resolution",
              href: role === "CUSTOMER" ? "/customer/complaints" : "/worker/grievances",
            },
          };
        case "CLOSED":
          return {
            currentStageLabel: "Case Closed",
            whoActsNext: "None",
            nextStepTitle: "Case Concluded & Archived",
            nextStepExplanation:
              "All conciliation actions have been finalized. The historical case record is permanently archived in the cooperative audit log.",
          };
        case "ESCALATED":
          return {
            currentStageLabel: "Escalated to Super Admin",
            whoActsNext: "Super Administrator",
            nextStepTitle: "Platform-Level Review",
            nextStepExplanation:
              "This case has been transferred to the platform Super Administrator for cross-federation adjudication.",
            actionPrompt: "Wait for Super Admin ruling.",
            timelineEstimate: "SLA: 72 hours",
          };
        default:
          return {
            currentStageLabel: status,
            whoActsNext: "Federation Conciliation Team",
            nextStepTitle: "Awaiting Next Stage",
            nextStepExplanation: "The grievance is being processed through standard conciliation.",
          };
      }
    }

    // 2. Customer Booking Resolvers
    if (role === "CUSTOMER") {
      switch (status) {
        case "REQUEST_SENT":
        case "PENDING":
          return {
            currentStageLabel: "Service Request Broadcast",
            whoActsNext: "Selected Cooperative Workers",
            nextStepTitle: "Wait for Competing Estimates",
            nextStepExplanation:
              "Your service request has been dispatched to selected verified cooperative workers. They will inspect the requirements and submit itemized quotes.",
            actionPrompt: "Workers typically respond within 15–30 minutes.",
            timelineEstimate: "15-30 minutes",
          };
        case "WORKER_REVIEWING":
        case "WORKER_INTERESTED":
          return {
            currentStageLabel: "Workers Reviewing",
            whoActsNext: "Cooperative Craftsperson",
            nextStepTitle: "Estimates In Preparation",
            nextStepExplanation:
              "One or more workers are currently calculating labor and material requirements for your job.",
            actionPrompt: "Quotes will appear automatically as soon as submitted.",
          };
        case "ESTIMATE_SUBMITTED":
        case "CUSTOMER_CONFIRMATION_PENDING":
          return {
            currentStageLabel: "Estimates Received",
            whoActsNext: "Customer (You)",
            nextStepTitle: "Compare Quotes & Select Worker",
            nextStepExplanation:
              "You have received itemized estimate(s). Review labor costs, estimated hours, and worker ratings to pick your craftsperson.",
            actionPrompt: "Accept your preferred estimate to confirm your booking.",
            actionLink: {
              label: "Compare Estimates",
              href: "/customer/bookings",
              variant: "primary",
            },
          };
        case "BOOKING_CONFIRMED":
        case "WORKER_ACCEPTED":
          return {
            currentStageLabel: "Booking Confirmed",
            whoActsNext: counterPartyName || "Assigned Worker",
            nextStepTitle: "Wait for Worker to Arrive",
            nextStepExplanation: `${counterPartyName || "The worker"} has confirmed the appointment and will travel to your address at the scheduled slot.`,
            actionPrompt: "Keep your 4-digit start OTP ready for when the worker arrives.",
            actionLink: {
              label: "View Booking Details",
              href: "/customer/bookings",
            },
          };
        case "ON_THE_WAY":
          return {
            currentStageLabel: "Worker On The Way",
            whoActsNext: counterPartyName || "Worker",
            nextStepTitle: "Worker En Route to Your Address",
            nextStepExplanation: `${counterPartyName || "The worker"} is traveling to your home. Check live tracking on your booking screen.`,
            actionPrompt: "Be available to welcome the worker upon arrival.",
            actionLink: {
              label: "Track Worker",
              href: "/customer/bookings",
              variant: "primary",
            },
            timelineEstimate: "Arriving shortly",
          };
        case "ARRIVED":
          return {
            currentStageLabel: "Worker Arrived",
            whoActsNext: "Customer (You)",
            nextStepTitle: "Share Start OTP to Begin Service",
            nextStepExplanation:
              "The worker has arrived at your address. Share your 4-digit start OTP to verify their identity and authorize job commencement.",
            actionPrompt: "Share the start OTP shown on your booking details.",
            actionLink: {
              label: "View Start OTP",
              href: "/customer/bookings",
              variant: "primary",
            },
          };
        case "OTP_VERIFIED":
        case "SERVICE_STARTED":
          return {
            currentStageLabel: "Service In Progress",
            whoActsNext: counterPartyName || "Worker",
            nextStepTitle: "Work Being Performed",
            nextStepExplanation: `${counterPartyName || "The worker"} is currently executing the requested service. Any material changes will be recorded transparently.`,
            actionPrompt: "Inspect the completed work before the worker wraps up.",
          };
        case "SERVICE_COMPLETED":
          return {
            currentStageLabel: "Service Completed",
            whoActsNext: counterPartyName || "Worker",
            nextStepTitle: "Worker Generating Final Bill",
            nextStepExplanation:
              "The physical service is complete. The worker is submitting the verified final bill for actual labor and parts.",
            actionPrompt: "Final invoice will appear on your screen shortly.",
            timelineEstimate: "5-10 minutes",
          };
        case "BILL_GENERATED":
        case "PAYMENT_PENDING":
          return {
            currentStageLabel: "Payment Pending",
            whoActsNext: "Customer (You)",
            nextStepTitle: "Complete Payment to Finalize Booking",
            nextStepExplanation:
              "The final bill is ready. Settle payment securely through cooperative escrow to credit the worker's wallet.",
            actionPrompt: "Pay via UPI, Debit/Credit Card, or Net Banking.",
            actionLink: {
              label: "Pay Final Bill",
              href: "/customer/payments",
              variant: "primary",
            },
          };
        case "PAYMENT_RECEIVED":
        case "BOOKING_COMPLETED":
          return {
            currentStageLabel: "Booking Completed",
            whoActsNext: "Customer (You)",
            nextStepTitle: "Rate Your Worker & Download Receipt",
            nextStepExplanation:
              "Service and payment are complete. Your feedback helps verified cooperative workers earn badges and new bookings.",
            actionPrompt: "Leave a star rating and download your cooperative invoice.",
            actionLink: {
              label: "View Invoices",
              href: "/customer/payments",
            },
          };
        default:
          return {
            currentStageLabel: status,
            whoActsNext: "Customer / Worker",
            nextStepTitle: "Booking In Progress",
            nextStepExplanation: "Check booking details for active status updates.",
          };
      }
    }

    // 3. Worker Job Resolvers
    if (role === "WORKER") {
      switch (status) {
        case "REQUEST_SENT":
        case "PENDING":
        case "WORKER_REVIEWING":
          return {
            currentStageLabel: "New Request Received",
            whoActsNext: "Worker (You)",
            nextStepTitle: "Prepare & Submit Your Itemized Estimate",
            nextStepExplanation:
              "Review customer problem description, location, and requested slot. Submit your competitive quote covering labor, materials, and travel.",
            actionPrompt: "Submit quote promptly to increase chance of customer selection.",
            actionLink: {
              label: "Prepare Estimate",
              href: "/worker/schedule",
              variant: "primary",
            },
          };
        case "ESTIMATE_SUBMITTED":
        case "CUSTOMER_CONFIRMATION_PENDING":
          return {
            currentStageLabel: "Estimate Submitted",
            whoActsNext: "Customer",
            nextStepTitle: "Wait for Customer to Select a Worker",
            nextStepExplanation:
              "Your quote has been submitted. The customer is comparing competing estimates from selected cooperative workers.",
            actionPrompt: "You will receive an alert if the customer confirms your booking.",
            actionLink: {
              label: "View Job Requests",
              href: "/worker/schedule",
            },
          };
        case "BOOKING_CONFIRMED":
        case "WORKER_ACCEPTED":
          return {
            currentStageLabel: "Booking Confirmed",
            whoActsNext: "Worker (You)",
            nextStepTitle: "Travel to Customer Location",
            nextStepExplanation:
              "Customer selected your estimate! When ready to depart for the job, tap 'On The Way' to notify the customer.",
            actionPrompt: "Tap 'On The Way' when you depart.",
            actionLink: {
              label: "Open Job Details",
              href: "/worker/schedule",
              variant: "primary",
            },
          };
        case "ON_THE_WAY":
          return {
            currentStageLabel: "En Route to Site",
            whoActsNext: "Worker (You)",
            nextStepTitle: "Arrive at Household Address",
            nextStepExplanation:
              "You are marked en route. Navigate to the customer address and tap 'Mark Arrived' upon arrival.",
            actionPrompt: "Tap 'Mark Arrived' once on-site.",
            actionLink: {
              label: "Job Controls",
              href: "/worker/schedule",
              variant: "primary",
            },
          };
        case "ARRIVED":
          return {
            currentStageLabel: "Arrived at Premises",
            whoActsNext: "Customer & Worker (You)",
            nextStepTitle: "Collect Customer Start OTP",
            nextStepExplanation:
              "Ask the customer for the 4-digit start OTP displayed on their app. Enter it to unlock service commencement.",
            actionPrompt: "Enter the customer's 4-digit start OTP.",
            actionLink: {
              label: "Enter OTP",
              href: "/worker/schedule",
              variant: "primary",
            },
          };
        case "OTP_VERIFIED":
        case "SERVICE_STARTED":
          return {
            currentStageLabel: "Service In Progress",
            whoActsNext: "Worker (You)",
            nextStepTitle: "Execute Service & Test Functionality",
            nextStepExplanation:
              "Perform craftsmanship following safety standards. When repairs are verified, tap 'Mark Service Completed'.",
            actionPrompt: "Tap 'Service Completed' when work is finished.",
            actionLink: {
              label: "Complete Service",
              href: "/worker/schedule",
              variant: "primary",
            },
          };
        case "SERVICE_COMPLETED":
          return {
            currentStageLabel: "Service Completed",
            whoActsNext: "Worker (You)",
            nextStepTitle: "Submit Final Itemized Bill",
            nextStepExplanation:
              "Input actual labor and verified material costs used during the job to generate the customer invoice.",
            actionPrompt: "Generate bill to initiate customer payment.",
            actionLink: {
              label: "Generate Bill",
              href: "/worker/schedule",
              variant: "primary",
            },
          };
        case "BILL_GENERATED":
        case "PAYMENT_PENDING":
          return {
            currentStageLabel: "Bill Submitted",
            whoActsNext: "Customer",
            nextStepTitle: "Wait for Customer Payment Settlement",
            nextStepExplanation:
              "Invoice sent to customer. Once customer completes digital payment, your 95% earnings will credit immediately to your wallet.",
            actionPrompt: "Payment confirmation updates in real-time.",
            actionLink: {
              label: "Check Earnings",
              href: "/worker/earnings",
            },
          };
        case "PAYMENT_RECEIVED":
        case "BOOKING_COMPLETED":
          return {
            currentStageLabel: "Job Concluded",
            whoActsNext: "None",
            nextStepTitle: "Earnings Deposited to Wallet",
            nextStepExplanation:
              "Payment verified! 95% of the booking amount has been credited to your cooperative balance.",
            actionPrompt: "View earnings statement.",
            actionLink: {
              label: "View Wallet",
              href: "/worker/earnings",
            },
          };
        default:
          return {
            currentStageLabel: status,
            whoActsNext: "Worker",
            nextStepTitle: "Active Job Lifecycle",
            nextStepExplanation: "Check schedule for status and instructions.",
          };
      }
    }

    // 4. Federation Admin Resolvers
    if (role === "FEDERATION_ADMIN") {
      switch (status) {
        case "OPEN":
          return {
            currentStageLabel: "New Dispute Logged",
            whoActsNext: "Federation Conciliation Officer",
            nextStepTitle: "Review Case & Request Statements",
            nextStepExplanation:
              "Evaluate triage score, inspect booking history, and decide whether to request statements from customer or worker.",
            actionPrompt: "Open Conciliation Workspace.",
            actionLink: {
              label: "Open Workspace",
              href: "/federation-admin/complaint-management",
              variant: "primary",
            },
          };
        case "ACTION_REQUIRED":
          return {
            currentStageLabel: "Statement Awaited",
            whoActsNext: "Disputed Parties",
            nextStepTitle: "Monitor Statement Submission",
            nextStepExplanation:
              "Formal statement request has been sent. Monitor responses from parties before scheduling resolution.",
            actionPrompt: "Review received evidence.",
            actionLink: {
              label: "View Case Dossier",
              href: "/federation-admin/complaint-management",
            },
          };
        default:
          return {
            currentStageLabel: status,
            whoActsNext: "Federation Admin",
            nextStepTitle: "Federation Oversight",
            nextStepExplanation: "Maintain cooperative service delivery and fair dispute mediation.",
          };
      }
    }

    // Default Fallback
    return {
      currentStageLabel: status,
      whoActsNext: "Platform Member",
      nextStepTitle: "Operational Status",
      nextStepExplanation: "Follow on-screen instructions to proceed.",
    };
  }

  /**
   * Get Journey Map by key and role
   */
  public getJourneyMap(journeyKey: string, role: PlatformRole): VisualJourneyMapData | null {
    const map = VISUAL_JOURNEY_MAPS[journeyKey];
    if (!map) return null;
    // Customer can view customer booking journey
    // Worker can view worker journey
    // Federation & Super Admin can view all journeys
    if (role === "CUSTOMER" && map.targetRole !== "CUSTOMER") return null;
    if (role === "WORKER" && map.targetRole !== "WORKER") return null;
    return map;
  }

  /**
   * Get Onboarding Tasks for specific role
   */
  public getOnboardingTasks(role: PlatformRole): OnboardingTask[] {
    return ONBOARDING_TASKS.filter((t) => t.role === role);
  }

  /**
   * Get Short Tooltips
   */
  public getTooltips(): Record<string, string> {
    return TOOLTIPS;
  }

  /**
   * Get Articles for Role
   */
  public getArticlesForRole(
    role: PlatformRole,
    category?: GuidanceCategory
  ): GuidanceArticle[] {
    return GUIDANCE_ARTICLES.filter((a) => {
      if (!a.targetRoles.includes(role)) return false;
      if (category && a.category !== category) return false;
      return true;
    });
  }
}

export const guidanceService = new GuidanceService();
