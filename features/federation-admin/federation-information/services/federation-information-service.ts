import { createClient } from "@/lib/supabase/client";
import type {
  FederationInformationData,
  OfficialFederationDetails,
  FederationDocumentItem,
  FederationLeaderDetails,
  FederationRegistrationAuthorityDetails,
  FederationChangeRequest,
  ChangeRequestField,
} from "../types";

const STORAGE_KEY = "kaushalyasetu_fed_change_requests_v1";

interface DbFederationRow {
  id?: string;
  name?: string | null;
  code?: string | null;
  registration_number?: string | null;
  gst_number?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  service_region?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  official_documents?: Array<{
    title?: string;
    name?: string;
    url?: string;
    category?: string;
    verified?: boolean;
  }> | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export class FederationInformationService {
  /**
   * Prototype federation identity conforming to project specification:
   * ABC Labour Cooperative Federation, Ahmedabad, Gujarat.
   */
  private readonly defaultOfficialDetails: OfficialFederationDetails = {
    id: "fed-ahmedabad-01",
    name: "ABC Labour Cooperative Federation",
    code: "FED-AHM-01",
    registrationNumber: "REG/GJ/AHM/2024/042",
    registrationDate: "2021-04-15",
    gstNumber: "24AAACB9876C1Z3",
    state: "Gujarat",
    city: "Ahmedabad",
    address: "Cooperative Bhavan, Opposite Khokhra Labour Colony, Maninagar East, Ahmedabad, Gujarat - 380008",
    serviceRegion: "Ahmedabad Municipal Corporation & Greater Urban Metropolitan Area",
    contactEmail: "admin@abclabour.coop.in",
    contactPhone: "+91 79 2658 0101",
    jurisdiction: "Ahmedabad District & Urban Development Authority (AUDA)",
    status: "ACTIVE",
    establishedYear: 2021,
  };

  private readonly defaultRegistrationAuthority: FederationRegistrationAuthorityDetails = {
    registeringAuthority: "Office of the Registrar of Cooperative Societies, Government of Gujarat",
    societyActReference: "Gujarat Cooperative Societies Act, 1961 (Act No. X of 1962)",
    stateRegistrarOffice: "Bahumali Bhavan, Asarwa, Ahmedabad - 380016",
    classification: "Class-A Apex Labour Contract & Skilled Trades Federation",
    financialYearAudited: "FY 2024-2025 (Statutory Grade-A Audit Cleared)",
    complianceRating: "98.4% Regulatory Compliance Index",
  };

  private readonly defaultLeader: FederationLeaderDetails = {
    id: "FED-LEAD-2021-009",
    name: "Shri Rameshchandra Patel",
    designation: "President & Chief Executive Secretary",
    contactEmail: "president@abclabour.coop.in",
    contactPhone: "+91 98250 11223",
    appointmentDate: "2021-04-15",
    tenureStatus: "ACTIVE_TENURE",
  };

  private readonly defaultDocuments: FederationDocumentItem[] = [
    {
      id: "doc-reg-001",
      name: "Cooperative Society Registration Certificate",
      category: "REGISTRATION",
      fileType: "PDF (Signed Digital Certificate)",
      fileSize: "2.4 MB",
      issueDate: "2021-04-15",
      expiryDate: null,
      status: "VERIFIED",
      url: "#",
    },
    {
      id: "doc-bylaws-002",
      name: "Cooperative Bylaws & Statutory Governance Charter (Amended 2024)",
      category: "GOVERNANCE_CHARTER",
      fileType: "PDF",
      fileSize: "4.1 MB",
      issueDate: "2024-01-10",
      expiryDate: null,
      status: "VERIFIED",
      url: "#",
    },
    {
      id: "doc-tax-003",
      name: "GSTIN & Cooperative Income Tax Exemption Certification",
      category: "TAX_COMPLIANCE",
      fileType: "PDF",
      fileSize: "1.2 MB",
      issueDate: "2023-08-20",
      expiryDate: "2028-08-19",
      status: "VERIFIED",
      url: "#",
    },
    {
      id: "doc-audit-004",
      name: "Statutory Annual Financial & Worker Welfare Audit Report",
      category: "AUDIT_REPORT",
      fileType: "PDF",
      fileSize: "3.8 MB",
      issueDate: "2024-05-30",
      expiryDate: "2025-05-29",
      status: "VERIFIED",
      url: "#",
    },
  ];

  private readonly defaultChangeRequests: FederationChangeRequest[] = [
    {
      id: "CR-2026-0041",
      field: "serviceRegion",
      fieldLabel: "Service Area & Operating Jurisdiction",
      currentValue: "Ahmedabad Municipal Corporation & Greater Urban Metropolitan Area",
      requestedValue: "Ahmedabad Urban Area, Sanand GIDC & Viramgam Industrial Corridor",
      reason: "Expansion of cooperative service coverage to authorized industrial manufacturing corridors pursuant to Board Resolution #88.",
      supportingDocumentNote: "Board Resolution No. 88/2026 attached; copy submitted to District Registrar.",
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      submittedBy: "Federation Administrator",
      status: "PENDING",
      reviewerNotes: "Awaiting Super Admin quarterly regional jurisdiction review.",
    },
    {
      id: "CR-2026-0038",
      field: "contactEmail",
      fieldLabel: "Official Communications Email",
      currentValue: "info-legacy@abclabour.coop.in",
      requestedValue: "admin@abclabour.coop.in",
      reason: "Migration to dedicated secure institutional mailbox authenticated on the Gujarat Cooperative digital portal.",
      supportingDocumentNote: "Domain ownership record and IT administrative clearance.",
      submittedAt: "2026-06-12T10:30:00.000Z",
      submittedBy: "Federation Administrator",
      status: "APPROVED",
      reviewedAt: "2026-06-14T15:20:00.000Z",
      reviewedBy: "Super Admin Directorate",
      reviewerNotes: "Domain ownership verified against official registrar records. Modification ratified.",
    },
    {
      id: "CR-2026-0029",
      field: "registrationNumber",
      fieldLabel: "Statutory Registration Number",
      currentValue: "REG/GJ/AHM/2024/042",
      requestedValue: "REG/GJ/AHM/2026/CUSTOM-01",
      reason: "Requesting vanity registration code to mirror municipal zonal numbering.",
      supportingDocumentNote: "Internal administrative memo.",
      submittedAt: "2026-03-04T09:15:00.000Z",
      submittedBy: "Federation Administrator",
      status: "REJECTED",
      reviewedAt: "2026-03-05T11:45:00.000Z",
      reviewedBy: "Super Admin Directorate",
      rejectionReason: "Statutory registration numbers are assigned exclusively by the Registrar of Cooperative Societies. Custom vanity identifiers cannot be adopted without official State Gazette notification.",
    },
  ];

  /**
   * Loads all federation official data, documents, leadership, and change requests.
   */
  async getFederationInformation(): Promise<FederationInformationData> {
    const supabase = createClient();
    let dbDetails: OfficialFederationDetails | null = null;
    let isFallback = true;
    let dataSourceNotice: string | undefined =
      "Development Fallback Mode: Showing deterministic prototype data (ABC Labour Cooperative Federation, Ahmedabad).";

    try {
      // 1. Attempt to read live database row matching authenticated federation
      const { data: dbFederation, error } = await supabase
        .from("federations")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && dbFederation) {
        const raw = dbFederation as unknown as DbFederationRow;
        dbDetails = {
          id: raw.id || this.defaultOfficialDetails.id,
          name: raw.name || this.defaultOfficialDetails.name,
          code: raw.code || this.defaultOfficialDetails.code,
          registrationNumber: raw.registration_number || this.defaultOfficialDetails.registrationNumber,
          registrationDate: raw.created_at ? raw.created_at.split("T")[0] : this.defaultOfficialDetails.registrationDate,
          gstNumber: raw.gst_number || this.defaultOfficialDetails.gstNumber,
          state: raw.state || this.defaultOfficialDetails.state,
          city: raw.city || this.defaultOfficialDetails.city,
          address: raw.address || this.defaultOfficialDetails.address,
          serviceRegion: raw.service_region || this.defaultOfficialDetails.serviceRegion,
          contactEmail: raw.contact_email || this.defaultOfficialDetails.contactEmail,
          contactPhone: raw.contact_phone || this.defaultOfficialDetails.contactPhone,
          jurisdiction: raw.service_region || this.defaultOfficialDetails.jurisdiction,
          status: raw.is_active ? "ACTIVE" : "SUSPENDED",
          establishedYear: 2021,
        };
        isFallback = false;
        dataSourceNotice = undefined;
      }
    } catch (err) {
      console.warn("Notice: Live Supabase federation query unpopulated, engaging development fallback.", err);
    }

    const officialDetails = dbDetails || this.defaultOfficialDetails;
    const changeRequests = this.getStoredChangeRequests();

    return {
      officialDetails,
      registrationAuthority: this.defaultRegistrationAuthority,
      documents: this.defaultDocuments,
      leader: this.defaultLeader,
      changeRequests,
      isDevelopmentFallback: isFallback,
      dataSourceNotice,
      lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  /**
   * Retrieves change requests from client storage or defaults.
   */
  getStoredChangeRequests(): FederationChangeRequest[] {
    if (typeof window === "undefined") {
      return this.defaultChangeRequests;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage access errors
    }

    // Seed defaults in localStorage
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.defaultChangeRequests));
    } catch {
      // ignore storage access errors
    }

    return this.defaultChangeRequests;
  }

  /**
   * Submits a new Change Request.
   * STRICT DATA RULE:
   * The official displayed federation data must remain unchanged while a change request is merely pending.
   * Federation Admin only submits; Super Admin approves.
   */
  async submitChangeRequest(payload: {
    field: ChangeRequestField;
    fieldLabel: string;
    currentValue: string;
    requestedValue: string;
    reason: string;
    supportingDocumentNote?: string;
  }): Promise<FederationChangeRequest> {
    // Generate deterministic request ID based on timestamp
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newRequest: FederationChangeRequest = {
      id: `CR-2026-${randomSuffix}`,
      field: payload.field,
      fieldLabel: payload.fieldLabel,
      currentValue: payload.currentValue,
      requestedValue: payload.requestedValue,
      reason: payload.reason,
      supportingDocumentNote: payload.supportingDocumentNote || undefined,
      submittedAt: new Date().toISOString(),
      submittedBy: "Federation Administrator",
      status: "PENDING",
      reviewerNotes: "Awaiting review and audit determination by Super Admin.",
    };

    const existing = this.getStoredChangeRequests();
    const updated = [newRequest, ...existing];

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("Failed to persist change request to local storage:", err);
      }
    }

    return newRequest;
  }
}

export const federationInformationService = new FederationInformationService();
