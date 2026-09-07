export type ChangeRequestField =
  | "name"
  | "registrationNumber"
  | "address"
  | "serviceRegion"
  | "contactEmail"
  | "contactPhone"
  | "officialDocuments";

export type ChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface FederationDocumentItem {
  id: string;
  name: string;
  category: "REGISTRATION" | "TAX_COMPLIANCE" | "GOVERNANCE_CHARTER" | "AUDIT_REPORT" | "OTHER";
  fileType: string;
  fileSize?: string;
  issueDate?: string;
  expiryDate?: string | null;
  status: "VERIFIED" | "PENDING_AUDIT" | "EXPIRED";
  url: string;
}

export interface OfficialFederationDetails {
  id: string;
  name: string;
  code: string;
  registrationNumber: string;
  registrationDate: string;
  gstNumber?: string | null;
  state: string;
  city: string;
  address: string;
  serviceRegion: string;
  contactEmail: string;
  contactPhone: string;
  jurisdiction: string;
  status: "ACTIVE" | "PENDING_AUDIT" | "SUSPENDED";
  establishedYear: number;
}

export interface FederationRegistrationAuthorityDetails {
  registeringAuthority: string;
  societyActReference: string;
  stateRegistrarOffice: string;
  classification: string;
  financialYearAudited: string;
  complianceRating: string;
}

export interface FederationLeaderDetails {
  id: string;
  name: string;
  designation: string;
  contactEmail: string;
  contactPhone: string;
  appointmentDate: string;
  tenureStatus: "ACTIVE_TENURE" | "TRANSITIONING";
}

export interface FederationChangeRequest {
  id: string;
  field: ChangeRequestField;
  fieldLabel: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  supportingDocumentNote?: string;
  submittedAt: string;
  submittedBy: string;
  status: ChangeRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  rejectionReason?: string;
}

export interface FederationInformationData {
  officialDetails: OfficialFederationDetails;
  registrationAuthority: FederationRegistrationAuthorityDetails;
  documents: FederationDocumentItem[];
  leader: FederationLeaderDetails;
  changeRequests: FederationChangeRequest[];
  isDevelopmentFallback: boolean;
  dataSourceNotice?: string;
  lastUpdated: string;
}
