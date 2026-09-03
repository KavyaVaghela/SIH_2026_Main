"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  HardHat,
  Building2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  UploadCloud,
  Eye,
  EyeOff,
  Briefcase,
  MapPin,
  Clock,
  UserCheck,
  UserPlus,
  CreditCard,
  FileText,
  Search,
  Check,
  ShieldCheck,
  AlertCircle,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { signUpCustomer, signUpWorker, signUpFederationAdmin, verifyExistingWorker } from "@/lib/auth/actions";

import {
  customerRegistrationSchema,
  type CustomerRegistrationFormData,
} from "@/features/auth/schemas/customer-registration-schema";
import {
  newWorkerSchema,
  type NewWorkerFormData,
} from "@/features/auth/schemas/new-worker-schema";
import {
  existingWorkerSchema,
  type ExistingWorkerFormData,
} from "@/features/auth/schemas/existing-worker-schema";
import {
  federationAdminSchema,
  type FederationAdminFormData,
} from "@/features/auth/schemas/federation-admin-schema";

type RegistrationRole = "CUSTOMER" | "WORKER_GATE" | "WORKER_NEW" | "WORKER_EXISTING" | "FEDERATION_ADMIN";

const MOCK_FEDERATIONS = [
  { id: "fed_1", code: "FED-MUM-01", name: "Mumbai Skilled Workers Cooperative Federation", state: "Maharashtra", city: "Mumbai", address: "102 Cooperative Tower, Bandra, Mumbai" },
  { id: "fed_2", code: "FED-PUN-02", name: "Pune District Trades & Artisans Cooperative", state: "Maharashtra", city: "Pune", address: "45 Artisan Complex, FC Road, Pune" },
  { id: "fed_3", code: "FED-GUJ-03", name: "Gujarat Craft & Service Cooperative Society", state: "Gujarat", city: "Ahmedabad", address: "12 Swaraj Bhavan, Ashram Road, Ahmedabad" },
  { id: "fed_4", code: "FED-DEL-04", name: "Delhi National Cooperative Gig Union", state: "Delhi", city: "New Delhi", address: "88 Vikas Marg, Laxmi Nagar, New Delhi" },
];

const SKILL_CATEGORIES = [
  { id: "cat_elec", name: "Electrical & Electronics Services" },
  { id: "cat_plumb", name: "Plumbing & Sanitation" },
  { id: "cat_carp", name: "Carpentry & Furniture Works" },
  { id: "cat_paint", name: "Painting & Interior Finishing" },
  { id: "cat_care", name: "Home Care & Elderly Assistance" },
  { id: "cat_agri", name: "Agricultural & Gardening Services" },
];

// Helper Component for Step Progress Bar
function WizardProgressBar({ currentStep, totalSteps, stepTitle }: { currentStep: number; totalSteps: number; stepTitle: string }) {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  return (
    <div className="space-y-1.5 mb-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">
          Step {currentStep} of {totalSteps}: {stepTitle}
        </span>
        <span className="font-medium text-muted-foreground">{percentage}% Complete</span>
      </div>
      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Utility for masking sensitive values
function maskSensitiveValue(value?: string, visibleChars = 4): string {
  if (!value) return "••••";
  const str = value.trim();
  if (str.length <= visibleChars) return str;
  return "••••••••" + str.slice(-visibleChars);
}

export function RegisterView() {
  const [activeRole, setActiveRole] = React.useState<RegistrationRole | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(1);
  const [showPassword, setShowPassword] = React.useState(false);

  // Federation Search State
  const [federationSearchQuery, setFederationSearchQuery] = React.useState("");
  const [selectedStateFilter, setSelectedStateFilter] = React.useState("All");

  // Selected File UI State (Frontend UI only)
  const [selectedGovtIdFile, setSelectedGovtIdFile] = React.useState<string | null>(null);

  // Bank Confirmation state for validation check
  const [confirmBankAccountNumber, setConfirmBankAccountNumber] = React.useState("");
  const [bankConfirmError, setBankConfirmError] = React.useState<string | null>(null);

  // Registration Result State
  const [mockOutcome, setMockOutcome] = React.useState<{
    name: string;
    roleLabel: string;
    emailOrPhone?: string;
    federationName?: string;
    status: "APPROVED" | "PENDING_FEDERATION_APPROVAL" | "PENDING_SUPER_ADMIN_APPROVAL";
    message: string;
  } | null>(null);

  // Submission error display state
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Customer Form Hook
  const customerForm = useForm<CustomerRegistrationFormData>({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      house_building: "",
      street_area: "",
      city: "",
      district: "",
      state: "Maharashtra",
      pincode: "",
      preferred_language: "English",
    },
    mode: "onTouched",
  });

  // Existing Worker Form Hook
  const existingWorkerForm = useForm<ExistingWorkerFormData & {
    first_name?: string;
    last_name?: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
    govt_id_type?: string;
    govt_id_number?: string;
    bank_account_holder?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
  }>({
    resolver: zodResolver(existingWorkerSchema),
    defaultValues: {
      federation_code: "FED-MUM-01",
      existing_worker_id: "",
      phone: "",
      first_name: "",
      last_name: "",
      email: "",
      date_of_birth: "1995-01-01",
      gender: "male",
      govt_id_type: "aadhar",
      govt_id_number: "123456789012",
      bank_account_holder: "",
      bank_name: "State Bank of India",
      bank_account_number: "",
      bank_ifsc_code: "SBIN0001234",
    },
    mode: "onTouched",
  });

  // New Worker Form Hook
  const newWorkerForm = useForm<NewWorkerFormData>({
    resolver: zodResolver(newWorkerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: "1995-01-01",
      gender: "male",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      house_building: "",
      street_area: "",
      city: "",
      district: "",
      state: "Maharashtra",
      pincode: "",
      federation_id: "fed_1",
      primary_skill_category_id: "cat_elec",
      skills: ["Domestic Wiring"],
      experience_years: 3,
      previous_work_details: "",
      govt_id_type: "aadhar",
      govt_id_number: "123456789012",
      govt_id_document: "mock_aadhaar_file.pdf",
      bank_account_holder: "",
      bank_name: "State Bank of India",
      bank_account_number: "",
      bank_ifsc_code: "SBIN0001234",
    },
    mode: "onTouched",
  });

  // Federation Admin Form Hook
  const federationAdminForm = useForm<FederationAdminFormData>({
    resolver: zodResolver(federationAdminSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      federation_name: "",
      registration_number: "",
      address: "",
      city: "",
      district: "",
      state: "Maharashtra",
      pincode: "",
      official_email: "",
      official_phone: "",
      registration_certificate: "mock_registration_cert.pdf",
    },
    mode: "onTouched",
  });

  // Section Validation before advancing steps
  const validateCurrentStep = async (fieldsToValidate: string[], triggerFn: (fields?: any) => Promise<boolean>) => {
    setSubmitError(null);
    const isValid = await triggerFn(fieldsToValidate);
    if (isValid) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // Customer Submit Handler
  const handleCustomerSubmit = async (data: CustomerRegistrationFormData) => {
    setSubmitError(null);
    const res = await signUpCustomer(
      data.email,
      data.password,
      `${data.first_name} ${data.last_name}`,
      data.phone,
      {
        house_building: data.house_building,
        street_area: data.street_area,
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
      }
    );
    if (res.success) {
      setMockOutcome({
        name: `${data.first_name} ${data.last_name}`,
        roleLabel: "Household Customer",
        emailOrPhone: data.email,
        status: "APPROVED",
        message: res.message || "Customer account created successfully! Proceed to mobile OTP verification.",
      });
      setCurrentStepIndex(5);
    } else {
      setSubmitError(res.error || "Customer registration failed. Please try again.");
    }
  };

  // New Worker Submit Handler
  const handleNewWorkerSubmit = async (data: NewWorkerFormData) => {
    setSubmitError(null);
    const fullName = `${data.first_name} ${data.last_name}`;
    const selectedFed = MOCK_FEDERATIONS.find((f) => f.id === data.federation_id)?.name || "Mumbai Skilled Workers Cooperative Federation";

    const res = await signUpWorker(
      data.email,
      data.password,
      fullName,
      data.phone,
      data.federation_id,
      {
        house_building: data.house_building,
        street_area: data.street_area,
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
        experience_years: data.experience_years,
        skills: data.skills,
      }
    );

    if (res.success) {
      setMockOutcome({
        name: fullName,
        roleLabel: "New Worker Application",
        emailOrPhone: data.email,
        federationName: selectedFed,
        status: "PENDING_FEDERATION_APPROVAL",
        message: res.message || "Your application has been submitted to the selected Federation Admin for verification.",
      });
      setCurrentStepIndex(9); // Step 9: Success Outcome Screen
    } else {
      setSubmitError(res.error || "Worker registration failed. Please try again.");
    }
  };

  // Existing Worker Submit Handler
  const handleExistingWorkerSubmit = async (data: ExistingWorkerFormData) => {
    setSubmitError(null);
    const res = await verifyExistingWorker(
      data.phone,
      data.federation_code,
      data.existing_worker_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any).email || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any).password || undefined
    );

    setMockOutcome({
      name: `Member ${data.existing_worker_id}`,
      roleLabel: "Existing Worker Verification",
      emailOrPhone: data.phone,
      federationName: res.federationName || data.federation_code,
      status: "PENDING_FEDERATION_APPROVAL",
      message: res.message || "Your verification request has been submitted to your Federation Administrator for approval.",
    });
    setCurrentStepIndex(6); // Step 6: Existing Worker Approval Outcome Screen
  };

  // Federation Admin Submit Handler
  const handleFederationAdminSubmit = async (data: FederationAdminFormData) => {
    setSubmitError(null);
    const fullName = `${data.first_name} ${data.last_name}`;
    const res = await signUpFederationAdmin(
      data.email,
      data.password,
      fullName,
      data.registration_number,
      {
        federation_name: data.federation_name,
        address: data.address,
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
        official_email: data.official_email,
        official_phone: data.official_phone,
      }
    );
    if (res.success) {
      setMockOutcome({
        name: `${fullName} (${data.federation_name})`,
        roleLabel: "Federation Admin Application",
        emailOrPhone: data.email,
        federationName: data.federation_name,
        status: "PENDING_SUPER_ADMIN_APPROVAL",
        message: res.message || "Your Federation Admin registration has been submitted and is pending Super Admin approval.",
      });
      setCurrentStepIndex(5); // Step 5: Federation Admin Outcome Screen
    } else {
      setSubmitError(res.error || "Federation Admin registration failed. Please try again.");
    }
  };

  // MAIN ROLE SELECTION STEP
  if (!activeRole) {
    return (
      <Card className="w-full max-w-xl shadow-lg border-emerald-900/10 dark:border-emerald-500/20">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Cooperative Registration</CardTitle>
          <CardDescription>
            Choose your membership role to begin multi-step registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Customer Option */}
            <button
              type="button"
              onClick={() => {
                setActiveRole("CUSTOMER");
                setCurrentStepIndex(1);
              }}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-primary mb-3">
                <User className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Customer</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Book verified local tradespeople & household service workers.
              </p>
            </button>

            {/* Worker Option */}
            <button
              type="button"
              onClick={() => {
                setActiveRole("WORKER_GATE");
                setCurrentStepIndex(1);
              }}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-primary mb-3">
                <HardHat className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Worker</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Join a worker cooperative federation for digital jobs & benefits.
              </p>
            </button>

            {/* Federation Admin Option */}
            <button
              type="button"
              onClick={() => {
                setActiveRole("FEDERATION_ADMIN");
                setCurrentStepIndex(1);
              }}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-primary mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Federation Admin</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Register a worker cooperative federation for board administration.
              </p>
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center pt-2">
            Super Admin accounts are created internally through platform governance and are excluded from public registration.
          </p>
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted-foreground border-t pt-4">
          Already registered?{" "}
          <Link href="/login" className="ml-1 font-semibold text-primary hover:underline">
            Sign In Here
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // WORKER SUB-SELECTION GATE (If Worker chosen, prompt Existing vs New Worker)
  if (activeRole === "WORKER_GATE") {
    return (
      <Card className="w-full max-w-lg shadow-lg border-emerald-900/10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setActiveRole(null)}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Change Role
            </Button>
            <Badge variant="outline">Worker Registration</Badge>
          </div>
          <CardTitle className="text-xl font-bold">Select Worker Registration Type</CardTitle>
          <CardDescription>Are you a new applicant or an existing cooperative member?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setActiveRole("WORKER_NEW");
              setCurrentStepIndex(1);
            }}
            className="w-full p-4 rounded-xl border-2 border-primary bg-emerald-50/50 dark:bg-emerald-950/30 text-left flex items-start space-x-3 hover:bg-emerald-50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-primary text-primary-foreground mt-0.5">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">New Worker Application (8 Steps)</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Apply to join a local worker cooperative for the first time.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole("WORKER_EXISTING");
              setCurrentStepIndex(1);
            }}
            className="w-full p-4 rounded-xl border-2 border-border hover:border-primary text-left flex items-start space-x-3 hover:bg-emerald-50/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-primary mt-0.5">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Existing Worker Verification (5 Steps)</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Already an offline member? Register for digital platform access.</p>
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  // ----------------------------------------------------
  // FLOW 1: CUSTOMER MULTI-STEP REGISTRATION (5 STEPS)
  // ----------------------------------------------------
  if (activeRole === "CUSTOMER") {
    const { register, handleSubmit, trigger, getValues, formState: { errors, isSubmitting } } = customerForm;

    const customerStepTitles = [
      "Personal & Account Details",
      "Address Details",
      "Optional Preferences",
      "Review & Summary",
      "Submission Outcome",
    ];

    return (
      <Card className="w-full max-w-xl shadow-lg border-emerald-900/10">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => {
              if (currentStepIndex > 1) setCurrentStepIndex((p) => p - 1);
              else setActiveRole(null);
            }}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> {currentStepIndex === 1 ? "Change Role" : "Previous"}
            </Button>
            <Badge variant="outline">Customer Registration</Badge>
          </div>
          <CardTitle className="text-xl font-bold">Household Customer Signup</CardTitle>
          <CardDescription>Step-by-step registration for household gig service requesters</CardDescription>
        </CardHeader>
        <CardContent>
          <WizardProgressBar currentStep={currentStepIndex} totalSteps={5} stepTitle={customerStepTitles[currentStepIndex - 1]} />

          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
              <AlertDescription className="text-xs">{submitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(handleCustomerSubmit)} className="space-y-4" noValidate>
            {/* Step 1: Personal & Account */}
            {currentStepIndex === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">First Name *</label>
                    <Input placeholder="John" {...register("first_name")} aria-invalid={!!errors.first_name} />
                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Last Name *</label>
                    <Input placeholder="Doe" {...register("last_name")} aria-invalid={!!errors.last_name} />
                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email Address *</label>
                    <Input type="email" placeholder="john@example.com" {...register("email")} aria-invalid={!!errors.email} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Mobile Phone (10 digits) *</label>
                    <Input placeholder="9876543210" {...register("phone")} aria-invalid={!!errors.phone} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Password *</label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} aria-invalid={!!errors.password} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Confirm Password *</label>
                    <Input type="password" placeholder="••••••••" {...register("confirm_password")} aria-invalid={!!errors.confirm_password} />
                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["first_name", "last_name", "email", "phone", "password", "confirm_password"], trigger)}
                >
                  Continue to Address <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Address */}
            {currentStepIndex === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">House / Building *</label>
                    <Input placeholder="Flat 4B, Emerald Heights" {...register("house_building")} aria-invalid={!!errors.house_building} />
                    {errors.house_building && <p className="text-xs text-destructive">{errors.house_building.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Street / Area *</label>
                    <Input placeholder="Station Road, Bandra West" {...register("street_area")} aria-invalid={!!errors.street_area} />
                    {errors.street_area && <p className="text-xs text-destructive">{errors.street_area.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">City *</label>
                    <Input placeholder="Mumbai" {...register("city")} aria-invalid={!!errors.city} />
                    {errors.city && <p className="text-[10px] text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">District *</label>
                    <Input placeholder="Suburban" {...register("district")} aria-invalid={!!errors.district} />
                    {errors.district && <p className="text-[10px] text-destructive">{errors.district.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">State *</label>
                    <Input placeholder="Maharashtra" {...register("state")} aria-invalid={!!errors.state} />
                    {errors.state && <p className="text-[10px] text-destructive">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">Pincode *</label>
                    <Input placeholder="400050" {...register("pincode")} aria-invalid={!!errors.pincode} />
                    {errors.pincode && <p className="text-[10px] text-destructive">{errors.pincode.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["house_building", "street_area", "city", "district", "state", "pincode"], trigger)}
                >
                  Continue to Preferences <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 3: Optional Profile */}
            {currentStepIndex === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Preferred Communication Language</label>
                  <Select {...register("preferred_language")}>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  </Select>
                </div>
                <Button type="button" className="w-full font-semibold" onClick={() => setCurrentStepIndex(4)}>
                  Review Registration Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 4: Summary Review */}
            {currentStepIndex === 4 && (
              <div className="space-y-4">
                <Alert variant="info" className="py-2.5 text-left">
                  <AlertTitle className="text-xs font-semibold">Review Your Registration Details</AlertTitle>
                  <AlertDescription className="text-xs">
                    Please double-check your information before final submission.
                  </AlertDescription>
                </Alert>
                <div className="bg-muted/40 p-4 rounded-xl space-y-3 text-xs border">
                  <div>
                    <span className="font-semibold text-muted-foreground">Full Name:</span>{" "}
                    <span className="font-medium text-foreground">{getValues("first_name")} {getValues("last_name")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Email / Phone:</span>{" "}
                    <span className="font-medium text-foreground">{getValues("email")} | {getValues("phone")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Address:</span>{" "}
                    <span className="font-medium text-foreground">
                      {getValues("house_building")}, {getValues("street_area")}, {getValues("city")}, {getValues("state")} - {getValues("pincode")}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Language:</span>{" "}
                    <span className="font-medium text-foreground">{getValues("preferred_language")}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Customer Account...</> : "Confirm & Submit Registration"}
                </Button>
              </div>
            )}

            {/* Step 5: Success Outcome */}
            {currentStepIndex === 5 && mockOutcome && (
              <div className="text-center space-y-4 py-2">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Registration Submitted</h3>
                  <p className="text-xs text-muted-foreground">{mockOutcome.message}</p>
                </div>
                <Link href="/verify" className="block w-full">
                  <Button className="w-full font-semibold">Proceed to Mobile OTP Verification</Button>
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  // ----------------------------------------------------
  // FLOW 2: NEW WORKER MULTI-STEP REGISTRATION (8 STEPS)
  // ----------------------------------------------------
  if (activeRole === "WORKER_NEW") {
    const { register, handleSubmit, trigger, getValues, setValue, formState: { errors, isSubmitting } } = newWorkerForm;

    const newWorkerStepTitles = [
      "Personal & Account",
      "Personal Profile",
      "Address",
      "Professional Information",
      "Identity Details",
      "Bank Details",
      "Choose Your Federation",
      "Review & Submit",
    ];

    const filteredFederations = MOCK_FEDERATIONS.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(federationSearchQuery.toLowerCase()) ||
                            f.code.toLowerCase().includes(federationSearchQuery.toLowerCase()) ||
                            f.city.toLowerCase().includes(federationSearchQuery.toLowerCase());
      const matchesState = selectedStateFilter === "All" || f.state === selectedStateFilter;
      return matchesSearch && matchesState;
    });

    const selectedFedObj = MOCK_FEDERATIONS.find((f) => f.id === getValues("federation_id"));

    return (
      <Card className="w-full max-w-2xl shadow-lg border-emerald-900/10">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => {
              if (currentStepIndex > 1) setCurrentStepIndex((p) => p - 1);
              else setActiveRole("WORKER_GATE");
            }}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> {currentStepIndex === 1 ? "Change Sub-Role" : "Previous"}
            </Button>
            <Badge variant="outline">New Worker Application</Badge>
          </div>
          <CardTitle className="text-xl font-bold">New Worker Registration</CardTitle>
          <CardDescription>Section-by-section multi-step registration wizard</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStepIndex <= 8 && (
            <WizardProgressBar currentStep={currentStepIndex} totalSteps={8} stepTitle={newWorkerStepTitles[currentStepIndex - 1]} />
          )}

          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="text-xs font-semibold">Registration Error</AlertTitle>
              <AlertDescription className="text-xs">{submitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(handleNewWorkerSubmit)} className="space-y-4" noValidate>
            {/* STEP 1: PERSONAL & ACCOUNT */}
            {currentStepIndex === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">First Name *</label>
                    <Input placeholder="Ramesh" {...register("first_name")} aria-invalid={!!errors.first_name} />
                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Last Name *</label>
                    <Input placeholder="Kumar" {...register("last_name")} aria-invalid={!!errors.last_name} />
                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email Address *</label>
                    <Input type="email" placeholder="ramesh@example.com" {...register("email")} aria-invalid={!!errors.email} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Mobile Phone (10 digits) *</label>
                    <Input placeholder="9876543210" {...register("phone")} aria-invalid={!!errors.phone} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Password *</label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} aria-invalid={!!errors.password} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Confirm Password *</label>
                    <Input type="password" placeholder="••••••••" {...register("confirm_password")} aria-invalid={!!errors.confirm_password} />
                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["first_name", "last_name", "email", "phone", "password", "confirm_password"], trigger)}
                >
                  Next: Personal Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: PERSONAL PROFILE */}
            {currentStepIndex === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date of Birth (Must be $\ge 18$) *</label>
                    <Input type="date" {...register("date_of_birth")} aria-invalid={!!errors.date_of_birth} />
                    {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Gender *</label>
                    <Select {...register("gender")}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-xs font-medium">Profile Photo (Frontend UI Only)</label>
                  <div className="p-3 border-2 border-dashed rounded-lg text-center bg-muted/20 space-y-1">
                    <UploadCloud className="h-5 w-5 text-muted-foreground mx-auto" />
                    <p className="text-xs font-medium">Upload Worker Profile Picture</p>
                    <p className="text-[10px] text-muted-foreground">Frontend simulation - file is not uploaded or stored in browser storage</p>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full font-semibold"
                  onClick={() => validateCurrentStep(["date_of_birth", "gender"], trigger)}
                >
                  Next: Address <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 3: ADDRESS */}
            {currentStepIndex === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">House / Building *</label>
                    <Input placeholder="House details" {...register("house_building")} aria-invalid={!!errors.house_building} />
                    {errors.house_building && <p className="text-xs text-destructive">{errors.house_building.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Street / Area *</label>
                    <Input placeholder="Street details" {...register("street_area")} aria-invalid={!!errors.street_area} />
                    {errors.street_area && <p className="text-xs text-destructive">{errors.street_area.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">City *</label>
                    <Input placeholder="City" {...register("city")} aria-invalid={!!errors.city} />
                    {errors.city && <p className="text-[10px] text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">District *</label>
                    <Input placeholder="District" {...register("district")} aria-invalid={!!errors.district} />
                    {errors.district && <p className="text-[10px] text-destructive">{errors.district.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">State *</label>
                    <Input placeholder="State" {...register("state")} aria-invalid={!!errors.state} />
                    {errors.state && <p className="text-[10px] text-destructive">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">Pincode *</label>
                    <Input placeholder="400001" {...register("pincode")} aria-invalid={!!errors.pincode} />
                    {errors.pincode && <p className="text-[10px] text-destructive">{errors.pincode.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full font-semibold"
                  onClick={() => validateCurrentStep(["house_building", "street_area", "city", "district", "state", "pincode"], trigger)}
                >
                  Next: Professional Information <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 4: PROFESSIONAL INFORMATION */}
            {currentStepIndex === 4 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Primary Skill Category *</label>
                    <Select {...register("primary_skill_category_id")}>
                      {SKILL_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Years of Experience *</label>
                    <Input type="number" min={0} max={60} {...register("experience_years", { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Previous Work Details / Trade Background</label>
                  <Textarea placeholder="Describe your experience and past work..." rows={3} {...register("previous_work_details")} />
                </div>
                <Button
                  type="button"
                  className="w-full font-semibold"
                  onClick={() => validateCurrentStep(["primary_skill_category_id", "experience_years"], trigger)}
                >
                  Next: Identity Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 5: IDENTITY DETAILS */}
            {currentStepIndex === 5 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Government ID Type *</label>
                    <Select {...register("govt_id_type")}>
                      <option value="aadhar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="voter_id">Voter ID</option>
                      <option value="ration_card">Ration Card</option>
                      <option value="driving_license">Driving License</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Government ID Number *</label>
                    <Input placeholder="e.g. 1234 5678 9012" {...register("govt_id_number")} aria-invalid={!!errors.govt_id_number} />
                    {errors.govt_id_number && <p className="text-xs text-destructive">{errors.govt_id_number.message}</p>}
                  </div>
                </div>

                {/* Mock Document Selection UI */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold">Government ID Document Upload (Frontend UI Only)</label>
                  <div className="p-3 border-2 border-dashed rounded-lg text-center bg-muted/20 space-y-1.5">
                    <UploadCloud className="h-6 w-6 text-primary mx-auto" />
                    <div className="flex items-center justify-center space-x-2">
                      <input
                        type="file"
                        id="govt-file-input"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedGovtIdFile(e.target.files[0].name);
                          }
                        }}
                      />
                      <label htmlFor="govt-file-input" className="cursor-pointer text-xs font-semibold text-primary hover:underline">
                        Choose Document File
                      </label>
                    </div>
                    {selectedGovtIdFile ? (
                      <p className="text-xs font-semibold text-emerald-600 flex items-center justify-center space-x-1">
                        <Check className="h-3.5 w-3.5" /> <span>Selected: {selectedGovtIdFile}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">PDF, JPG, or PNG up to 5MB (Frontend state only)</p>
                    )}
                  </div>
                  <Alert variant="info" className="py-2 text-[11px]">
                    <AlertDescription className="flex items-center space-x-1">
                      <Lock className="h-3.5 w-3.5 text-primary shrink-0 mr-1" />
                      <span><strong>Privacy Note:</strong> Sensitive identity data is kept strictly in React form state and is not stored in browser storage.</span>
                    </AlertDescription>
                  </Alert>
                </div>

                <Button
                  type="button"
                  className="w-full font-semibold"
                  onClick={() => validateCurrentStep(["govt_id_type", "govt_id_number"], trigger)}
                >
                  Next: Bank Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 6: BANK DETAILS */}
            {currentStepIndex === 6 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Account Holder Name *</label>
                    <Input placeholder="As per bank passbook" {...register("bank_account_holder")} aria-invalid={!!errors.bank_account_holder} />
                    {errors.bank_account_holder && <p className="text-xs text-destructive">{errors.bank_account_holder.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Bank Name *</label>
                    <Input placeholder="State Bank of India" {...register("bank_name")} aria-invalid={!!errors.bank_name} />
                    {errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Bank Account Number (9–18 digits) *</label>
                    <Input placeholder="9-18 digit account number" {...register("bank_account_number")} aria-invalid={!!errors.bank_account_number} />
                    {errors.bank_account_number && <p className="text-xs text-destructive">{errors.bank_account_number.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Confirm Bank Account Number *</label>
                    <Input
                      placeholder="Re-enter account number"
                      value={confirmBankAccountNumber}
                      onChange={(e) => {
                        setConfirmBankAccountNumber(e.target.value);
                        if (bankConfirmError) setBankConfirmError(null);
                      }}
                    />
                    {bankConfirmError && <p className="text-xs text-destructive">{bankConfirmError}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">IFSC Code (11 characters) *</label>
                  <Input placeholder="SBIN0001234" {...register("bank_ifsc_code")} aria-invalid={!!errors.bank_ifsc_code} />
                  {errors.bank_ifsc_code && <p className="text-xs text-destructive">{errors.bank_ifsc_code.message}</p>}
                </div>

                <Alert variant="info" className="py-2 text-[11px]">
                  <AlertDescription>
                    Bank details remain strictly in React form state and are not stored in localStorage or sent to unauthorized backends.
                  </AlertDescription>
                </Alert>

                <Button
                  type="button"
                  className="w-full font-semibold"
                  onClick={async () => {
                    if (getValues("bank_account_number") !== confirmBankAccountNumber) {
                      setBankConfirmError("Account numbers do not match");
                      return;
                    }
                    validateCurrentStep(["bank_account_holder", "bank_name", "bank_account_number", "bank_ifsc_code"], trigger);
                  }}
                >
                  Next: Choose Your Federation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 7: CHOOSE YOUR FEDERATION (FINAL SELECTION SECTION BEFORE REVIEW) */}
            {currentStepIndex === 7 && (
              <div className="space-y-3">
                <Alert variant="info" className="py-2 text-xs">
                  <AlertDescription className="font-medium">
                    📍 <strong>Federation directory is currently using demonstration data for frontend testing.</strong>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search federation by name, city, or code..."
                      value={federationSearchQuery}
                      onChange={(e) => setFederationSearchQuery(e.target.value)}
                      className="pr-8"
                    />
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <Select value={selectedStateFilter} onChange={(e) => setSelectedStateFilter(e.target.value)} className="w-36">
                    <option value="All">All States</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Delhi">Delhi</option>
                  </Select>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto p-1 border rounded-lg">
                  {filteredFederations.map((fed) => (
                    <button
                      key={fed.id}
                      type="button"
                      onClick={() => setValue("federation_id", fed.id)}
                      className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-colors ${
                        getValues("federation_id") === fed.id ? "border-primary bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-primary/30" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-foreground">{fed.name}</div>
                        <div className="text-[11px] text-muted-foreground">{fed.code} • {fed.city}, {fed.state}</div>
                        <div className="text-[10px] text-muted-foreground italic mt-0.5">{fed.address}</div>
                      </div>
                      {getValues("federation_id") === fed.id && <Badge className="bg-primary text-[10px]">Selected</Badge>}
                    </button>
                  ))}
                </div>

                {selectedFedObj && (
                  <Alert variant="success" className="py-2 text-xs">
                    <AlertDescription className="font-medium">
                      Selected Federation: <strong>{selectedFedObj.name}</strong> ({selectedFedObj.code})
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="button"
                  className="w-full font-semibold"
                  disabled={!getValues("federation_id")}
                  onClick={() => setCurrentStepIndex(8)}
                >
                  Continue to Review & Submit <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 8: REVIEW & SUBMIT */}
            {currentStepIndex === 8 && (
              <div className="space-y-4">
                <Alert variant="info" className="py-2.5 text-left">
                  <AlertTitle className="text-xs font-semibold">Application Summary Review</AlertTitle>
                  <AlertDescription className="text-xs">
                    Please review your worker profile before creating your account. Sensitive fields are masked for security.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/40 p-4 rounded-xl space-y-3 text-xs border">
                  <div>
                    <span className="font-semibold text-muted-foreground">Basic Information:</span>{" "}
                    <span className="font-medium text-foreground">{getValues("first_name")} {getValues("last_name")} | {getValues("email")} | {getValues("phone")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Address:</span>{" "}
                    <span className="font-medium text-foreground">
                      {getValues("house_building")}, {getValues("street_area")}, {getValues("city")}, {getValues("state")} - {getValues("pincode")}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Professional Profile:</span>{" "}
                    <span className="font-medium text-foreground">{SKILL_CATEGORIES.find(c => c.id === getValues("primary_skill_category_id"))?.name} ({getValues("experience_years")} Years Exp)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Identity Proof (Masked):</span>{" "}
                    <span className="font-medium text-foreground">{getValues("govt_id_type").toUpperCase()} ({maskSensitiveValue(getValues("govt_id_number"))})</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Banking Information (Masked):</span>{" "}
                    <span className="font-medium text-foreground">{getValues("bank_name")} ({maskSensitiveValue(getValues("bank_account_number"))}) - IFSC: {getValues("bank_ifsc_code")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Selected Federation:</span>{" "}
                    <span className="font-semibold text-primary">{selectedFedObj?.name} ({selectedFedObj?.code})</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="button" variant="outline" className="w-1/3" onClick={() => setCurrentStepIndex(1)}>
                    Edit Sections
                  </Button>
                  <Button type="submit" className="w-2/3 font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : "Create Worker Account"}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 9: SUCCESS OUTCOME SCREEN */}
            {currentStepIndex === 9 && mockOutcome && (
              <div className="text-center space-y-4 py-2">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
                    <Clock className="h-7 w-7" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-foreground">Application Submitted Successfully</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {mockOutcome.message}
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs py-1 px-3">
                    Status: PENDING_FEDERATION_APPROVAL
                  </Badge>
                  {mockOutcome.federationName && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs py-1 px-3">
                      Selected Federation: {mockOutcome.federationName}
                    </Badge>
                  )}
                </div>

                <Alert variant="warning" className="text-left py-3 max-w-md mx-auto">
                  <AlertTitle className="text-xs font-semibold">Important Notice</AlertTitle>
                  <AlertDescription className="text-xs mt-1 font-medium text-amber-900 dark:text-amber-200">
                    You will receive your credentials if you are eligible.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col space-y-2 pt-2 max-w-md mx-auto">
                  <Link href="/pending" className="w-full">
                    <Button className="w-full font-semibold">Check Application Status</Button>
                  </Link>
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full font-semibold">Back to Sign In</Button>
                  </Link>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  // ----------------------------------------------------
  // FLOW 3: EXISTING WORKER REGISTRATION (5 STEPS)
  // ----------------------------------------------------
  if (activeRole === "WORKER_EXISTING") {
    const { register, handleSubmit, trigger, getValues, formState: { errors, isSubmitting } } = existingWorkerForm;

    const existingStepTitles = [
      "Personal Information",
      "Federation & Worker Information",
      "Identity Details",
      "Bank Details",
      "Review & Verification",
      "Submission Result",
    ];

    return (
      <Card className="w-full max-w-xl shadow-lg border-emerald-900/10">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => {
              if (currentStepIndex > 1) setCurrentStepIndex((p) => p - 1);
              else setActiveRole("WORKER_GATE");
            }}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> {currentStepIndex === 1 ? "Change Sub-Role" : "Previous"}
            </Button>
            <Badge variant="outline">Existing Worker Verification</Badge>
          </div>
          <CardTitle className="text-xl font-bold">Existing Worker Digital Access</CardTitle>
          <CardDescription>Register your pre-existing cooperative membership for digital platform access</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStepIndex <= 5 && (
            <WizardProgressBar currentStep={currentStepIndex} totalSteps={5} stepTitle={existingStepTitles[currentStepIndex - 1]} />
          )}

          <form onSubmit={handleSubmit(handleExistingWorkerSubmit)} className="space-y-4" noValidate>
            {/* Step 1: Personal Information */}
            {currentStepIndex === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">First Name</label>
                    <Input placeholder="First name" {...register("first_name")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Last Name</label>
                    <Input placeholder="Last name" {...register("last_name")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Registered Phone Number *</label>
                  <Input placeholder="9876543210" {...register("phone")} aria-invalid={!!errors.phone} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Email Address (Optional)</label>
                  <Input type="email" placeholder="worker@example.com" {...register("email")} />
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["phone"], trigger)}
                >
                  Next: Federation & Worker Info <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Federation & Worker Information */}
            {currentStepIndex === 2 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Federation Code *</label>
                  <Select {...register("federation_code")}>
                    {MOCK_FEDERATIONS.map((f) => (
                      <option key={f.id} value={f.code}>{f.code} - {f.name}</option>
                    ))}
                  </Select>
                  {errors.federation_code && <p className="text-xs text-destructive">{errors.federation_code.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Worker UUID *</label>
                  <Input placeholder="WRK-2024-8841" {...register("existing_worker_id")} aria-invalid={!!errors.existing_worker_id} />
                  {errors.existing_worker_id && <p className="text-xs text-destructive">{errors.existing_worker_id.message}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Enter the UUID provided by your cooperative federation. This is not a membership or registration number.
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["federation_code", "existing_worker_id"], trigger)}
                >
                  Next: Identity Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 3: Identity Details */}
            {currentStepIndex === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Government ID Type *</label>
                    <Select {...register("govt_id_type")}>
                      <option value="aadhar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="voter_id">Voter ID</option>
                      <option value="ration_card">Ration Card</option>
                      <option value="driving_license">Driving License</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Government ID Number *</label>
                    <Input placeholder="e.g. 1234 5678 9012" {...register("govt_id_number")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date of Birth</label>
                    <Input type="date" {...register("date_of_birth")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Gender</label>
                    <Select {...register("gender")}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full font-semibold"
                  onClick={() => setCurrentStepIndex(4)}
                >
                  Next: Bank Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 4: Bank Details */}
            {currentStepIndex === 4 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Account Holder Name</label>
                    <Input placeholder="As per bank record" {...register("bank_account_holder")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Bank Name</label>
                    <Input placeholder="State Bank of India" {...register("bank_name")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Account Number</label>
                    <Input placeholder="9-18 digit account number" {...register("bank_account_number")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">IFSC Code</label>
                    <Input placeholder="SBIN0001234" {...register("bank_ifsc_code")} />
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full font-semibold"
                  onClick={() => setCurrentStepIndex(5)}
                >
                  Next: Review & Verification <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 5: Review & Verification */}
            {currentStepIndex === 5 && (
              <div className="space-y-4">
                <div className="bg-muted/40 p-4 rounded-xl space-y-2 text-xs border">
                  <div><span className="font-semibold">Registered Phone:</span> {getValues("phone")}</div>
                  <div><span className="font-semibold">Federation Code:</span> {getValues("federation_code")}</div>
                  <div><span className="font-semibold">Worker UUID:</span> {getValues("existing_worker_id")}</div>
                  <div><span className="font-semibold">Govt ID (Masked):</span> {getValues("govt_id_type")?.toUpperCase()} ({maskSensitiveValue(getValues("govt_id_number"))})</div>
                  <div><span className="font-semibold">Bank Account (Masked):</span> {getValues("bank_name")} ({maskSensitiveValue(getValues("bank_account_number"))})</div>
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...</> : "Submit Verification Request"}
                </Button>
              </div>
            )}

            {/* Step 6: Submission Outcome */}
            {currentStepIndex === 6 && mockOutcome && (
              <div className="text-center space-y-4 py-2">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
                    <Clock className="h-7 w-7" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-foreground">Verification Request Submitted</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {mockOutcome.message}
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs py-1 px-3">
                    Status: PENDING_FEDERATION_APPROVAL
                  </Badge>
                  {mockOutcome.federationName && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs py-1 px-3">
                      Selected Federation: {mockOutcome.federationName}
                    </Badge>
                  )}
                </div>

                <Alert variant="warning" className="text-left py-3 max-w-md mx-auto">
                  <AlertTitle className="text-xs font-semibold">Approval & Credential Notice</AlertTitle>
                  <AlertDescription className="text-xs mt-1 font-medium text-amber-900 dark:text-amber-200">
                    Your existing worker digital access request has been sent to your Federation Administrator. You will receive your active platform access credentials upon eligibility verification and approval.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col space-y-2 pt-2 max-w-md mx-auto">
                  <Link href="/pending" className="w-full">
                    <Button className="w-full font-semibold">Check Verification Status</Button>
                  </Link>
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full font-semibold">Back to Sign In</Button>
                  </Link>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  // ----------------------------------------------------
  // FLOW 4: FEDERATION ADMIN REGISTRATION (5 STEPS)
  // ----------------------------------------------------
  if (activeRole === "FEDERATION_ADMIN") {
    const { register, handleSubmit, trigger, getValues, formState: { errors, isSubmitting } } = federationAdminForm;

    const fedAdminStepTitles = [
      "Admin Account Details",
      "Federation Entity Info",
      "Official Contact Information",
      "Review Summary",
      "Submission Outcome",
    ];

    return (
      <Card className="w-full max-w-xl shadow-lg border-emerald-900/10">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => {
              if (currentStepIndex > 1) setCurrentStepIndex((p) => p - 1);
              else setActiveRole(null);
            }}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> {currentStepIndex === 1 ? "Change Role" : "Previous"}
            </Button>
            <Badge variant="outline">Federation Admin</Badge>
          </div>
          <CardTitle className="text-xl font-bold">Federation Admin Registration</CardTitle>
          <CardDescription>Register a new worker cooperative federation for board administration</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStepIndex <= 4 && (
            <WizardProgressBar currentStep={currentStepIndex} totalSteps={4} stepTitle={fedAdminStepTitles[currentStepIndex - 1]} />
          )}

          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
              <AlertDescription className="text-xs">{submitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(handleFederationAdminSubmit)} className="space-y-4" noValidate>
            {/* Step 1: Admin Account */}
            {currentStepIndex === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Admin First Name *</label>
                    <Input placeholder="First name" {...register("first_name")} aria-invalid={!!errors.first_name} />
                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Admin Last Name *</label>
                    <Input placeholder="Last name" {...register("last_name")} aria-invalid={!!errors.last_name} />
                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Personal Email *</label>
                    <Input type="email" placeholder="admin@example.com" {...register("email")} aria-invalid={!!errors.email} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Personal Mobile Phone *</label>
                    <Input placeholder="9876543210" {...register("phone")} aria-invalid={!!errors.phone} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Password *</label>
                    <Input type="password" placeholder="••••••••" {...register("password")} aria-invalid={!!errors.password} />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Confirm Password *</label>
                    <Input type="password" placeholder="••••••••" {...register("confirm_password")} aria-invalid={!!errors.confirm_password} />
                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["first_name", "last_name", "email", "phone", "password", "confirm_password"], trigger)}
                >
                  Continue to Federation Info <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Federation Entity Info */}
            {currentStepIndex === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Federation Full Name *</label>
                    <Input placeholder="Mumbai Skilled Workers Cooperative" {...register("federation_name")} aria-invalid={!!errors.federation_name} />
                    {errors.federation_name && <p className="text-xs text-destructive">{errors.federation_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Registration Number *</label>
                    <Input placeholder="REG/COP/2026/1092" {...register("registration_number")} aria-invalid={!!errors.registration_number} />
                    {errors.registration_number && <p className="text-xs text-destructive">{errors.registration_number.message}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Registered Address *</label>
                  <Input placeholder="Registered office address" {...register("address")} aria-invalid={!!errors.address} />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">City *</label>
                    <Input placeholder="City" {...register("city")} aria-invalid={!!errors.city} />
                    {errors.city && <p className="text-[10px] text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">District *</label>
                    <Input placeholder="District" {...register("district")} aria-invalid={!!errors.district} />
                    {errors.district && <p className="text-[10px] text-destructive">{errors.district.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">State *</label>
                    <Input placeholder="State" {...register("state")} aria-invalid={!!errors.state} />
                    {errors.state && <p className="text-[10px] text-destructive">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">Pincode *</label>
                    <Input placeholder="400001" {...register("pincode")} aria-invalid={!!errors.pincode} />
                    {errors.pincode && <p className="text-[10px] text-destructive">{errors.pincode.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["federation_name", "registration_number", "address", "city", "district", "state", "pincode"], trigger)}
                >
                  Continue to Official Contact <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 3: Admin / Contact Information */}
            {currentStepIndex === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Official Federation Email *</label>
                    <Input type="email" placeholder="contact@federation.org" {...register("official_email")} aria-invalid={!!errors.official_email} />
                    {errors.official_email && <p className="text-xs text-destructive">{errors.official_email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Official Office Phone *</label>
                    <Input placeholder="022-24987654" {...register("official_phone")} aria-invalid={!!errors.official_phone} />
                    {errors.official_phone && <p className="text-xs text-destructive">{errors.official_phone.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold"
                  onClick={() => validateCurrentStep(["official_email", "official_phone"], trigger)}
                >
                  Review Federation Registration <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 4: Summary Review */}
            {currentStepIndex === 4 && (
              <div className="space-y-4">
                <Alert variant="info" className="py-2.5 text-left">
                  <AlertTitle className="text-xs font-semibold">Federation Summary Review</AlertTitle>
                  <AlertDescription className="text-xs">
                    Please double-check your federation legal info before submitting for Super Admin approval.
                  </AlertDescription>
                </Alert>
                <div className="bg-muted/40 p-4 rounded-xl space-y-2 text-xs border">
                  <div><span className="font-semibold">Federation Name:</span> {getValues("federation_name")}</div>
                  <div><span className="font-semibold">Reg Number:</span> {getValues("registration_number")}</div>
                  <div><span className="font-semibold">Admin Contact:</span> {getValues("first_name")} {getValues("last_name")} ({getValues("email")})</div>
                  <div><span className="font-semibold">Official Contact:</span> {getValues("official_email")} | {getValues("official_phone")}</div>
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Federation Application...</> : "Submit Application for Super Admin Approval"}
                </Button>
              </div>
            )}

            {/* Step 5: Submission Outcome */}
            {currentStepIndex === 5 && mockOutcome && (
              <div className="text-center space-y-4 py-2">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
                    <Clock className="h-7 w-7" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-foreground">Registration Submitted Successfully</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {mockOutcome.message}
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs py-1 px-3">
                    Status: PENDING_SUPER_ADMIN_APPROVAL
                  </Badge>
                  {mockOutcome.federationName && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs py-1 px-3">
                      Federation: {mockOutcome.federationName}
                    </Badge>
                  )}
                </div>

                <Alert variant="warning" className="text-left py-3 max-w-md mx-auto">
                  <AlertTitle className="text-xs font-semibold">Important Notice</AlertTitle>
                  <AlertDescription className="text-xs mt-1 font-medium text-amber-900 dark:text-amber-200">
                    Your application is under review by System Super Admin. Active access will be granted upon approval.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col space-y-2 pt-2 max-w-md mx-auto">
                  <Link href="/pending" className="w-full">
                    <Button className="w-full font-semibold">Check Application Status</Button>
                  </Link>
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full font-semibold">Back to Sign In</Button>
                  </Link>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  return null;
}
