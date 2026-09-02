# API Contract & Domain Service Specifications

## 1. Supabase Client Integration

- **Browser Client**: Import `createClient` from `@/lib/supabase/client`. Use inside Client Components (`"use client"`).
- **Server Client**: Import `createClient` from `@/lib/supabase/server`. Use inside Server Components, Server Actions, and API Routes.
- **Admin Client**: Import `createAdminClient` from `@/lib/supabase/admin`. Restricted exclusively to server-side routines requiring `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. 15 Shared Domain Services API Specification

All domain services are exported as singleton instances from `@/features/[feature]/services/`:

1. **`authService`** (`features/auth/services/auth-service.ts`)
   - `getUser()`, `getProfile()`, `getRole()`, `login()`, `registerCustomer()`, `registerWorker()`, `registerFederationAdmin()`, `logout()`.
2. **`serviceCatalogService`** (`features/services/services/service-catalog-service.ts`)
   - `getCategories()`, `getServicesByCategory(catId)`, `getServiceById(id)`, `getSkills()`, `getCertifications()`.
3. **`workerService`** (`features/workforce/services/worker-service.ts`)
   - `getWorkerById(id)`, `searchEligibleWorkers(filter)`, `updateAvailability(id, status)`, `verifyWorker(id)`.
4. **`federationService`** (`features/workforce/services/federation-service.ts`)
   - `getFederationById(id)`, `listFederations()`, `verifyMemberWorker(fedId, workerId)`.
5. **`bookingService`** (`features/bookings/services/booking-service.ts`)
   - `createRequest(payload)`, `getBooking(id)`, `getCustomerBookings(custId)`, `getWorkerBookings(workerId)`, `transitionStatus(id, status, actorId, notes)`, `cancelBooking(id, actorId, reason)`, `getStatusHistory(id)`.
6. **`matchingService`** (`features/matching/services/matching-service.ts`)
   - `findAndRankEligibleWorkers(criteria)` (Returns ranked candidate workers based on 6-tier algorithm).
7. **`pricingService`** (`features/pricing/services/pricing-service.ts`)
   - `calculatePlatformEstimate(basePrice)`, `calculateWorkerEstimate(payload)`, `calculateFinalBill(params)`, `applyMinimumVisitCharge(amount)`.
8. **`paymentService`** (`features/payments/services/payment-service.ts`)
   - `initiatePayment(params)`, `confirmPayment(params)` (Uses `PaymentGateway` abstraction supporting `MockPaymentGateway` and `RazorpayPaymentGateway`).
9. **`invoiceService`** (`features/invoices/services/invoice-service.ts`)
   - `generateInvoice(bookingId)`, `getInvoiceByBooking(bookingId)`, `markInvoicePaid(invId, payId)`.
10. **`reviewService`** (`features/reviews/services/review-service.ts`)
    - `submitReview(bkId, custId, workerId, rating, comment)`, `getWorkerReviews(workerId)`.
11. **`complaintService`** (`features/complaints/services/complaint-service.ts`)
    - `submitComplaint(raisedBy, category, desc, bkId, targetId)`, `getComplaints()`, `resolveComplaint(id, notes)`.
12. **`notificationService`** (`features/notifications/services/notification-service.ts`)
    - `sendNotification(profileId, title, msg, type)`, `getUserNotifications(profileId)`, `markAsRead(id)`.
13. **`welfareService`** (`features/welfare/services/welfare-service.ts`)
    - `recordContribution(workerId, fedId, amount, type)`, `getWorkerWelfareSummary(workerId)`, `getInsuranceRecords(workerId)`.
14. **`demandService`** (`features/demand/services/demand-service.ts`)
    - `submitJobRequest(custId, srvId, desc)`, `getOpenJobRequests()`, `submitWorkerEstimate(jobId, workerId, amount)`.
15. **`projectWorkforceService`** (`features/projects/services/project-workforce-service.ts`)
    - `createProjectRequest(custId, fedId, name, desc)`, `allocateWorkerToProject(projId, reqId, workerId)`, `getProjectDetails(id)`.
