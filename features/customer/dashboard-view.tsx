"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { customerService, type CustomerAddress, type MatchedWorker } from "@/features/customer/services/customer-service";
import type { ServiceCategory, Service, Booking, Invoice, Payment } from "@/types";
import {
  Wrench,
  Zap,
  Droplet,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Star,
  ArrowRight,
  ChevronLeft,
  Loader2,
  Search,
  Filter,
  Phone,
  CreditCard,
  FileText,
  AlertCircle,
  Key,
  Calendar,
  Check,
  UserCheck,
  DollarSign,
  Plus
} from "lucide-react";

export function CustomerDashboardView() {
  const [currentTab, setCurrentTab] = useState<"book" | "bookings" | "payments" | "profile">("book");
  const [step, setStep] = useState<"catalog" | "problem" | "estimate" | "matching" | "tracking" | "bill" | "review" | "done">("catalog");
  
  // Data state
  const [userId, setUserId] = useState<string>("cust-guest");
  const [userProfile, setUserProfile] = useState<{ fullName: string; email: string; phone: string }>({
    fullName: "Customer User",
    email: "customer@example.com",
    phone: "+91 98765 43210",
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [problemDescription, setProblemDescription] = useState<string>("");
  
  // Platform Estimate
  const [platformEstimate, setPlatformEstimate] = useState<any>(null);

  // Worker Matching & Selection
  const [workers, setWorkers] = useState<MatchedWorker[]>([]);
  const [sortBy, setSortBy] = useState<"best_match" | "nearest" | "highest_rated" | "most_experienced">("best_match");
  const [selectedWorker, setSelectedWorker] = useState<MatchedWorker | null>(null);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState<boolean>(false);

  // Active Booking Tracking
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [bookingStatusIndex, setBookingStatusIndex] = useState<number>(0);
  const [otpCode] = useState<string>("4829");
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Review & Rating
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Customer History Data
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [myInvoices, setMyInvoices] = useState<Invoice[]>([]);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const supabase = createClient();

  // Load User & Service Data
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingData(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: prof } = await (supabase.from("profiles") as any).select("*").eq("id", user.id).maybeSingle();
          if (prof) {
            setUserProfile({
              fullName: prof.full_name || "Customer User",
              email: prof.email || user.email || "",
              phone: prof.phone || "",
            });
          }
          const addrs = await customerService.getCustomerAddresses(user.id);
          setAddresses(addrs);
          if (addrs.length > 0) setSelectedAddress(addrs[0]);

          const bks = await customerService.getCustomerBookings(user.id);
          setMyBookings(bks);

          const invs = await customerService.getCustomerInvoices(user.id);
          setMyInvoices(invs);

          const pays = await customerService.getCustomerPayments(user.id);
          setMyPayments(pays);
        } else {
          const addrs = await customerService.getCustomerAddresses("cust-guest");
          setAddresses(addrs);
          if (addrs.length > 0) setSelectedAddress(addrs[0]);
        }

        const cats = await customerService.getServiceCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadInitialData();
  }, []);

  // Handle Category Selection
  const handleSelectCategory = async (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    const srvs = await customerService.getServicesByCategory(cat.id);
    setServices(srvs);
    if (srvs.length > 0) setSelectedService(srvs[0]);
  };

  // Handle Service Selection & Estimate Calculation
  const handleProceedToEstimate = () => {
    if (!selectedService) return;
    const est = customerService.calculatePlatformEstimate(selectedService.basePrice || 350);
    setPlatformEstimate(est);
    setStep("estimate");
  };

  // Handle Fetch Matching Workers
  const handleFindWorkers = async () => {
    if (!selectedService) return;
    setIsLoadingWorkers(true);
    setStep("matching");
    try {
      const matched = await customerService.findMatchingWorkers(selectedService.id, sortBy);
      setWorkers(matched);
      if (matched.length > 0) setSelectedWorker(matched[0]);
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  // Handle Request Worker & Create Booking
  const handleRequestWorker = async (worker: MatchedWorker) => {
    setSelectedWorker(worker);
    const bk = await customerService.createBooking(
      userId,
      selectedService?.id || "srv-1",
      worker.id,
      worker.federationId,
      selectedAddress?.id || "addr-1",
      platformEstimate?.estimatedTotal || 350,
      problemDescription
    );
    setActiveBooking(bk);
    setBookingStatusIndex(1); // WORKER_REVIEWING
    setStep("tracking");
  };

  // Handle Verification & OTP
  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === otpCode) {
      setOtpVerified(true);
      setOtpError(null);
      setBookingStatusIndex(5); // SERVICE_STARTED
    } else {
      setOtpError("Invalid OTP. Please enter 4829 to verify.");
    }
  };

  // Handle Submit Review
  const handleSubmitReview = async () => {
    if (!activeBooking || !selectedWorker) return;
    setIsSubmittingReview(true);
    try {
      await customerService.submitReview(
        activeBooking.id,
        userId,
        selectedWorker.id,
        rating,
        reviewComment
      );
      setStep("done");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Icon Resolver
  const renderCategoryIcon = (iconName?: string | null) => {
    switch ((iconName || "").toLowerCase()) {
      case "zap": return <Zap className="h-6 w-6 text-amber-500" />;
      case "droplet": return <Droplet className="h-6 w-6 text-blue-500" />;
      case "sparkles": return <Sparkles className="h-6 w-6 text-emerald-500" />;
      default: return <Wrench className="h-6 w-6 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <PageHeader
        title="Household Services Marketplace"
        description="Book verified cooperative gig professionals for home repairs, cleaning, plumbing, and electrical services."
        breadcrumbs={[{ label: "Customer Portal", href: "/customer" }, { label: currentTab.toUpperCase() }]}
      />

      {/* Primary Navigation Tabs */}
      <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
        <Button
          variant={currentTab === "book" ? "default" : "ghost"}
          size="sm"
          onClick={() => { setCurrentTab("book"); setStep("catalog"); }}
        >
          <Wrench className="mr-2 h-4 w-4" /> Book Service
        </Button>
        <Button
          variant={currentTab === "bookings" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTab("bookings")}
        >
          <Calendar className="mr-2 h-4 w-4" /> My Bookings ({myBookings.length})
        </Button>
        <Button
          variant={currentTab === "payments" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTab("payments")}
        >
          <CreditCard className="mr-2 h-4 w-4" /> Payments & Bills
        </Button>
        <Button
          variant={currentTab === "profile" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTab("profile")}
        >
          <UserCheck className="mr-2 h-4 w-4" /> My Profile
        </Button>
      </div>

      {/* TAB 1: BOOK SERVICE FLOW */}
      {currentTab === "book" && (
        <div className="space-y-6">
          {/* STEP 1: SERVICE CATALOG & SELECTION */}
          {step === "catalog" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Select Service Category</h3>
                <p className="text-xs text-muted-foreground">Choose from our network of verified skilled cooperative professionals.</p>
              </div>

              {isLoadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <Card
                      key={cat.id}
                      className={`cursor-pointer transition-all hover:border-emerald-500 ${selectedCategory?.id === cat.id ? "border-2 border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20" : ""}`}
                      onClick={() => handleSelectCategory(cat)}
                    >
                      <CardHeader className="p-4 space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                            {renderCategoryIcon(cat.iconName)}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{cat.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-1">{cat.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}

              {/* Sub-Services List */}
              {selectedCategory && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm">Select Specific Task / Service</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((srv) => (
                      <Card
                        key={srv.id}
                        className={`cursor-pointer transition-all p-3 ${selectedService?.id === srv.id ? "border-2 border-emerald-600 bg-emerald-50/20" : ""}`}
                        onClick={() => setSelectedService(srv)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-xs text-foreground">{srv.title}</h5>
                            <p className="text-[11px] text-muted-foreground">{srv.description}</p>
                          </div>
                          <Badge variant="outline" className="text-emerald-700 border-emerald-300 font-bold">
                            ₹{srv.basePrice} / hr
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Problem Description & Address */}
                  <div className="space-y-3 pt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Problem Description / Notes</label>
                      <Input
                        placeholder="Describe the issue (e.g. main switch tripping, tap leaking)..."
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Select Service Location / Address</label>
                      {addresses.length > 0 ? (
                        <div className="p-3 border rounded-lg bg-muted/30 text-xs flex justify-between items-center">
                          <div>
                            <div className="font-semibold flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {addresses[0].title}
                            </div>
                            <div className="text-muted-foreground">{addresses[0].address_line1}, {addresses[0].city} ({addresses[0].postal_code})</div>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">Default</Badge>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Default address loaded.</p>
                      )}
                    </div>

                    <Button
                      className="w-full font-semibold mt-4"
                      onClick={handleProceedToEstimate}
                      disabled={!selectedService}
                    >
                      Continue to Estimate <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PLATFORM ESTIMATE */}
          {step === "estimate" && platformEstimate && (
            <Card className="max-w-lg mx-auto border-emerald-900/10 shadow-md">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setStep("catalog")}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs">
                    Initial Estimate
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-center">Initial Platform Cost Estimate</CardTitle>
                <CardDescription className="text-center text-xs">
                  Fair pricing calculated using standard cooperative rates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="warning" className="py-2.5">
                  <AlertTitle className="text-xs font-bold text-amber-900">INITIAL ESTIMATE — NOT THE FINAL BILL</AlertTitle>
                  <AlertDescription className="text-[11px] text-amber-800">
                    The final bill will be generated by the assigned worker after inspection and completion of actual work items.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/40 p-4 rounded-xl space-y-2 text-xs border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Selected:</span>
                    <span className="font-semibold">{selectedService?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Base Charge:</span>
                    <span className="font-semibold">₹{platformEstimate.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cooperative Platform Fee (5%):</span>
                    <span className="font-semibold">₹{platformEstimate.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & GST:</span>
                    <span className="font-semibold">₹{platformEstimate.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm text-emerald-700">
                    <span>Estimated Total:</span>
                    <span>₹{platformEstimate.estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full font-semibold" onClick={handleFindWorkers}>
                  Find & Match Verified Workers <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: WORKER MATCHING & SELECTION */}
          {step === "matching" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Matched Cooperative Professionals</h3>
                  <p className="text-xs text-muted-foreground">Ranked using our 6-tier fair cooperative matching algorithm.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    className="text-xs border rounded-md px-2 py-1 bg-background"
                    value={sortBy}
                    onChange={(e: any) => {
                      setSortBy(e.target.value);
                      handleFindWorkers();
                    }}
                  >
                    <option value="best_match">Best Match</option>
                    <option value="nearest">Nearest</option>
                    <option value="highest_rated">Highest Rated</option>
                    <option value="most_experienced">Most Experienced</option>
                  </select>
                </div>
              </div>

              {isLoadingWorkers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {workers.map((w) => (
                    <Card key={w.id} className="p-4 transition-all hover:border-emerald-500">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-sm text-foreground">{w.fullName}</h4>
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Verified</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{w.federationName}</p>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <Star className="h-3.5 w-3.5 fill-amber-500" /> {w.rating}
                            </span>
                            <span>• {w.experienceYears} Years Exp</span>
                            <span>• {w.distanceKm} km away</span>
                            <span>• {w.completedJobsCount} Jobs</span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                          <div className="text-right">
                            <div className="font-bold text-emerald-700 text-sm">₹{w.hourlyRate} / hr</div>
                            <div className="text-[10px] text-muted-foreground">Standard Rate</div>
                          </div>
                          <Button size="sm" className="font-semibold" onClick={() => handleRequestWorker(w)}>
                            Request Worker
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: TRACKING & OTP VERIFICATION */}
          {step === "tracking" && activeBooking && (
            <Card className="max-w-lg mx-auto border-emerald-900/10 shadow-md">
              <CardHeader className="space-y-1 text-center">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs mx-auto">
                  Booking ID: {activeBooking.bookingNumber}
                </Badge>
                <CardTitle className="text-lg font-bold">Booking Status & Live Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Timeline */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Status Sequence:</span>
                    <span className="text-emerald-700">
                      {bookingStatusIndex === 1 && "WORKER_REVIEWING"}
                      {bookingStatusIndex === 2 && "WORKER_ACCEPTED"}
                      {bookingStatusIndex === 3 && "ON_THE_WAY"}
                      {bookingStatusIndex === 4 && "ARRIVED"}
                      {bookingStatusIndex === 5 && "SERVICE_STARTED"}
                      {bookingStatusIndex === 6 && "SERVICE_COMPLETED"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${(bookingStatusIndex / 6) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Worker Info */}
                {selectedWorker && (
                  <div className="p-3 border rounded-xl bg-muted/30 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-foreground">{selectedWorker.fullName}</div>
                      <div className="text-muted-foreground">{selectedWorker.federationName}</div>
                      <div className="text-emerald-700 font-medium mt-1">📞 {selectedWorker.phone}</div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                      On Site
                    </Badge>
                  </div>
                )}

                {/* OTP Verification Prompt */}
                {bookingStatusIndex < 5 && (
                  <div className="p-4 border rounded-xl bg-amber-50/50 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
                      <Key className="h-4 w-4" /> Share OTP with Worker upon arrival
                    </div>
                    <div className="text-2xl font-mono font-bold tracking-widest text-center py-2 bg-amber-100 rounded-lg text-amber-900">
                      {otpCode}
                    </div>
                    <p className="text-[10px] text-amber-800 text-center">
                      Only give this 4-digit code to your assigned worker after they arrive at your location.
                    </p>

                    {/* Test Trigger to Advance Status */}
                    <div className="pt-2 flex gap-2">
                      <Input
                        placeholder="Enter OTP (4829)"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="text-xs"
                      />
                      <Button size="sm" onClick={handleVerifyOtp}>
                        Verify OTP
                      </Button>
                    </div>
                    {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                  </div>
                )}

                {/* Service Completed & Move to Bill */}
                {bookingStatusIndex >= 5 && (
                  <Alert variant="info" className="py-2">
                    <AlertTitle className="text-xs font-bold">Service In Progress / Complete</AlertTitle>
                    <AlertDescription className="text-xs">
                      Worker has verified OTP and completed service. Proceed to view final bill.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full font-semibold"
                  onClick={() => setStep("bill")}
                >
                  Proceed to Final Bill & Payment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: FINAL INVOICE & PAYMENT */}
          {step === "bill" && (
            <Card className="max-w-lg mx-auto border-emerald-900/10 shadow-md">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-lg font-bold">Final Bill & Payment</CardTitle>
                <CardDescription className="text-xs">Generated by Cooperative Billing Service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/40 p-4 rounded-xl space-y-2 text-xs border">
                  <div className="flex justify-between">
                    <span>Labor / Service Charges:</span>
                    <span className="font-semibold">₹350.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts / Materials:</span>
                    <span className="font-semibold">₹50.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cooperative Platform Fee (5%):</span>
                    <span className="font-semibold">₹20.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span className="font-semibold">₹15.65</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm text-emerald-700">
                    <span>Net Payable Amount:</span>
                    <span>₹435.65</span>
                  </div>
                </div>

                <div className="p-3 border rounded-xl space-y-2">
                  <label className="text-xs font-semibold">Payment Gateway Method</label>
                  <div className="flex items-center justify-between text-xs p-2 border rounded-lg bg-emerald-50/50">
                    <span className="font-semibold">Razorpay Secure Online Payment</span>
                    <Badge variant="outline" className="text-[10px]">Mock Enabled</Badge>
                  </div>
                </div>

                <Button
                  className="w-full font-semibold"
                  onClick={() => setStep("review")}
                >
                  Pay ₹435.65 Now <CreditCard className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP 6: RATING & REVIEW */}
          {step === "review" && (
            <Card className="max-w-lg mx-auto border-emerald-900/10 shadow-md">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-lg font-bold">Rate & Review Service</CardTitle>
                <CardDescription className="text-xs">Your feedback empowers cooperative worker ratings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center space-x-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`h-8 w-8 ${star <= rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Review Comment (Optional)</label>
                  <Input
                    placeholder="Write your experience with the worker..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full font-semibold"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Review"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP 7: COMPLETE OUTCOME */}
          {step === "done" && (
            <Card className="max-w-lg mx-auto border-emerald-900/10 shadow-md text-center">
              <CardContent className="py-8 space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                </div>
                <h3 className="font-bold text-xl text-foreground">Booking & Payment Completed!</h3>
                <p className="text-xs text-muted-foreground">Thank you for supporting cooperative skilled labor.</p>
                <Button className="font-semibold" onClick={() => { setCurrentTab("bookings"); setStep("catalog"); }}>
                  View My Bookings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {currentTab === "bookings" && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground">My Bookings History</h3>
          {myBookings.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-xs">
              No previous bookings found. Start a new booking from the Book Service tab.
            </Card>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <Card key={b.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">Booking #{b.bookingNumber}</div>
                    <div className="text-xs text-muted-foreground">Scheduled: {new Date(b.scheduledStartAt).toLocaleDateString()}</div>
                    <Badge variant="outline" className="mt-1 text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
                      {b.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-700 text-sm">₹{b.totalAmount}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS & BILLS */}
      {currentTab === "payments" && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground">Payments & Invoices</h3>
          {myPayments.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-xs">
              No payment transactions found.
            </Card>
          ) : (
            <div className="space-y-3">
              {myPayments.map((p) => (
                <Card key={p.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">Payment #{p.paymentNumber}</div>
                    <div className="text-xs text-muted-foreground">Gateway: {p.gatewayProvider.toUpperCase()}</div>
                    <Badge className="mt-1 bg-emerald-100 text-emerald-800 text-[10px]">PAID</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-700 text-sm">₹{p.amount}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY PROFILE */}
      {currentTab === "profile" && (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Customer Profile</CardTitle>
            <CardDescription className="text-xs">Your registered account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div><span className="font-semibold">Full Name:</span> {userProfile.fullName}</div>
            <div><span className="font-semibold">Email:</span> {userProfile.email}</div>
            <div><span className="font-semibold">Phone:</span> {userProfile.phone || "Not set"}</div>
            <div><span className="font-semibold">Account Role:</span> CUSTOMER</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
