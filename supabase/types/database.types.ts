export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "SUPER_ADMIN" | "FEDERATION_ADMIN" | "WORKER" | "CUSTOMER";
export type WorkerAccountStatus = "ACTIVE" | "DEACTIVATED";
export type WorkerAvailabilityStatus = "AVAILABLE" | "BUSY" | "UNAVAILABLE";
export type WorkerAvailability = WorkerAvailabilityStatus;
export type WorkerVerificationStatus = "pending_verification" | "verified" | "suspended";

export type BookingStatus =
  | "REQUEST_SENT"
  | "WORKER_REVIEWING"
  | "WORKER_INTERESTED"
  | "CUSTOMER_CONFIRMATION_PENDING"
  | "BOOKING_CONFIRMED"
  | "WORKER_ACCEPTED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "OTP_VERIFIED"
  | "SERVICE_STARTED"
  | "SERVICE_COMPLETED"
  | "BILL_GENERATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_RECEIVED"
  | "BOOKING_COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled" | "overdue";
export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type CertificationStatus = "VERIFIED" | "EXPIRING_SOON" | "EXPIRED";
export type EmergencyPriority = "LOW" | "MODERATE" | "HIGH";

export type EmergencyIncidentStatus =
  | "AWAITING_RESPONSE"
  | "DISPATCHING"
  | "TEAM_FORMING"
  | "ACTIVE"
  | "STAFFING_SHORTAGE"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type EmergencyIncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Database {
  public: {
    Tables: {
      emergency_incidents: {
        Row: {
          id: string;
          emergency_id: string;
          customer_id: string;
          federation_id: string | null;
          category_name: string;
          emergency_type: string;
          severity: EmergencyIncidentSeverity;
          status: EmergencyIncidentStatus;
          location: string;
          address_details: Json;
          description: string;
          evidence_photos: string[];
          approx_people_affected: number;
          immediate_danger: boolean;
          danger_details: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["emergency_incidents"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["emergency_incidents"]["Insert"]>;
      };
      federations: {
        Row: {
          id: string;
          name: string;
          code: string;
          gst_number: string | null;
          registration_number: string;
          state: string;
          city: string;
          address: string;
          contact_email: string;
          contact_phone: string;
          service_region: string | null;
          official_documents: Json | null;
          is_active: boolean;
          status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["federations"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["federations"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["addresses"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
      workers: {
        Row: {
          id: string;
          profile_id: string;
          federation_id: string;
          account_status: WorkerAccountStatus;
          availability_status: WorkerAvailabilityStatus;
          verification_status: WorkerVerificationStatus;
          profession: string | null;
          hourly_rate: number;
          experience_years: number;
          service_radius_km: number;
          joining_date: string;
          current_latitude: number | null;
          current_longitude: number | null;
          last_active_at: string | null;
          member_id: string | null;
          date_of_birth: string | null;
          gender: string | null;
          registration_type: string | null;
          previous_work_details: string | null;
          govt_id_type: string | null;
          govt_id_number: string | null;
          govt_id_document_url: string | null;
          bank_name: string | null;
          bank_account_holder: string | null;
          bank_account_number: string | null;
          bank_ifsc_code: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["workers"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workers"]["Insert"]>;
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon_name: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["service_categories"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_categories"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          title: string;
          description: string | null;
          base_price: number;
          minimum_visit_charge: number;
          price_unit: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["services"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      skills: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["skills"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["skills"]["Insert"]>;
      };
      worker_skills: {
        Row: {
          id: string;
          worker_id: string;
          skill_id: string;
          proficiency_level: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["worker_skills"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_skills"]["Insert"]>;
      };
      certifications: {
        Row: {
          id: string;
          title: string;
          issuing_body: string;
          validity_months: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["certifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["certifications"]["Insert"]>;
      };
      worker_certifications: {
        Row: {
          id: string;
          worker_id: string;
          certification_id: string;
          certificate_number: string | null;
          issue_date: string;
          expiry_date: string | null;
          status: CertificationStatus;
          is_verified: boolean;
          verification_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["worker_certifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_certifications"]["Insert"]>;
      };
      worker_availability: {
        Row: {
          id: string;
          worker_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["worker_availability"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_availability"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          customer_id: string;
          worker_id: string | null;
          service_id: string;
          federation_id: string;
          address_id: string;
          status: BookingStatus;
          problem_description: string | null;
          problem_photo_url: string | null;
          otp_code: string | null;
          scheduled_start_at: string;
          scheduled_end_at: string;
          actual_start_at: string | null;
          actual_end_at: string | null;
          total_amount: number;
          platform_fee: number;
          worker_earnings: number;
          priority?: EmergencyPriority | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      booking_status_history: {
        Row: {
          id: string;
          booking_id: string;
          previous_status: BookingStatus | null;
          new_status: BookingStatus;
          changed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["booking_status_history"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["booking_status_history"]["Insert"]>;
      };
      job_requests: {
        Row: {
          id: string;
          customer_id: string;
          service_id: string;
          description: string;
          preferred_schedule: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["job_requests"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_requests"]["Insert"]>;
      };
      worker_estimates: {
        Row: {
          id: string;
          job_request_id: string;
          worker_id: string;
          estimated_amount: number;
          estimated_hours: number | null;
          notes: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["worker_estimates"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_estimates"]["Insert"]>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          booking_id: string;
          customer_id: string;
          federation_id: string;
          subtotal: number;
          platform_fee: number;
          tax_amount: number;
          total_amount: number;
          status: InvoiceStatus;
          issue_date: string;
          due_date: string;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invoice_items"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          payment_number: string;
          invoice_id: string;
          booking_id: string;
          customer_id: string;
          amount: number;
          gateway_provider: string;
          gateway_order_id: string | null;
          gateway_payment_id: string | null;
          status: PaymentStatus;
          paid_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          worker_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      complaints: {
        Row: {
          id: string;
          complaint_number: string;
          booking_id: string | null;
          raised_by: string;
          target_profile_id: string | null;
          category: string;
          description: string;
          status: ComplaintStatus;
          resolution_notes: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["complaints"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["complaints"]["Insert"]>;
      };
      welfare_records: {
        Row: {
          id: string;
          worker_id: string;
          federation_id: string;
          fund_type: string;
          contribution_amount: number;
          subsidy_amount: number;
          transaction_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["welfare_records"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["welfare_records"]["Insert"]>;
      };
      insurance_records: {
        Row: {
          id: string;
          worker_id: string;
          policy_number: string;
          provider_name: string;
          coverage_amount: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["insurance_records"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["insurance_records"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      project_requests: {
        Row: {
          id: string;
          customer_id: string;
          federation_id: string;
          address_id: string | null;
          category_id: string | null;
          project_name: string;
          description: string;
          total_budget: number | null;
          desired_start_date: string | null;
          desired_end_date: string | null;
          site_photos: Json | null;
          rejection_reason: string | null;
          original_estimate_amount?: number;
          current_estimated_total?: number;
          actual_cost_to_date?: number;
          payments_received?: number;
          settled_amount?: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_requests"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_requests"]["Insert"]>;
      };
      project_requirements: {
        Row: {
          id: string;
          project_request_id: string;
          skill_id: string;
          title: string | null;
          required_workers_count: number;
          daily_rate: number | null;
          estimated_duration_days: number | null;
          estimated_days: number | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_requirements"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_requirements"]["Insert"]>;
      };
      project_allocations: {
        Row: {
          id: string;
          project_request_id: string;
          requirement_id: string;
          worker_id: string;
          daily_rate: number | null;
          start_date: string | null;
          end_date: string | null;
          response_status: string;
          allocated_at: string;
          responded_at: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_allocations"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_allocations"]["Insert"]>;
      };
      project_expenses: {
        Row: {
          id: string;
          project_request_id: string;
          submitted_by: string;
          title: string;
          description: string | null;
          amount: number;
          verified_amount: number | null;
          receipt_url: string | null;
          expense_date: string;
          status: string;
          approved_by: string | null;
          customer_query_text: string | null;
          customer_query_status: string | null;
          query_reply: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_expenses"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_expenses"]["Insert"]>;
      };
      project_milestones: {
        Row: {
          id: string;
          project_request_id: string;
          title: string;
          description: string | null;
          amount: number;
          due_date: string | null;
          status: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_milestones"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_milestones"]["Insert"]>;
      };
      project_estimate_revisions: {
        Row: {
          id: string;
          project_request_id: string;
          version: number;
          previous_amount: number;
          current_amount: number;
          difference_amount: number;
          revision_reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_estimate_revisions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_estimate_revisions"]["Insert"]>;
      };
      project_payment_plans: {
        Row: {
          id: string;
          project_request_id: string;
          version: number;
          plan_type: string;
          total_amount: number;
          status: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_payment_plans"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_payment_plans"]["Insert"]>;
      };
      project_payment_installments: {
        Row: {
          id: string;
          payment_plan_id: string;
          project_request_id: string;
          installment_number: number;
          amount: number;
          due_date: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_payment_installments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_payment_installments"]["Insert"]>;
      };
      project_payments: {
        Row: {
          id: string;
          project_request_id: string;
          installment_id: string | null;
          customer_id: string;
          amount: number;
          payment_method: string;
          transaction_reference: string | null;
          status: string;
          payment_date: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_payments"]["Row"], "id" | "created_at" | "payment_date"> & {
          id?: string;
          created_at?: string;
          payment_date?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_payments"]["Insert"]>;
      };
    };
  };
}
