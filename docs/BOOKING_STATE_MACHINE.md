# Booking Lifecycle State Machine Documentation

## 1. Overview
The booking lifecycle is governed by a strict 16-state canonical state machine defined in `@/constants/booking-status.ts` and `@/types/bookings`. No developer may introduce alternate state names or skip state transitions.

---

## 2. All 16 Canonical Booking States

1. `REQUEST_SENT`: Customer submits a service booking request.
2. `WORKER_REVIEWING`: Matching algorithm dispatches request to eligible worker candidates.
3. `WORKER_INTERESTED`: Worker expresses interest in accepting the job.
4. `CUSTOMER_CONFIRMATION_PENDING`: Awaiting customer final confirmation.
5. `BOOKING_CONFIRMED`: Customer confirms booking assignment.
6. `WORKER_ACCEPTED`: Worker accepts confirmed booking schedule.
7. `ON_THE_WAY`: Worker starts transit to customer location.
8. `ARRIVED`: Worker arrives at customer location.
9. `OTP_VERIFIED`: Worker verifies customer OTP code to start service.
10. `SERVICE_STARTED`: Service execution in progress.
11. `SERVICE_COMPLETED`: Worker marks service work completed.
12. `BILL_GENERATED`: Final invoice generated with parts & labor.
13. `PAYMENT_PENDING`: Awaiting customer payment via Razorpay.
14. `PAYMENT_RECEIVED`: Payment successfully verified by gateway.
15. `BOOKING_COMPLETED`: Job closed and archived.
16. `CANCELLED`: Booking cancelled by customer, worker, or admin.

---

## 3. Transition Matrix & Authorizations

| Current State | Next Allowed State | Authorized Role | Trigger Action |
|---|---|---|---|
| `REQUEST_SENT` | `WORKER_REVIEWING`, `CANCELLED` | System / Customer | `createRequest()`, `cancelBooking()` |
| `WORKER_REVIEWING` | `WORKER_INTERESTED`, `CANCELLED` | Worker / Customer | `expressInterest()`, `cancelBooking()` |
| `WORKER_INTERESTED` | `CUSTOMER_CONFIRMATION_PENDING` | System | Auto-rank candidate |
| `CUSTOMER_CONFIRMATION_PENDING` | `BOOKING_CONFIRMED`, `CANCELLED` | Customer | `confirmBooking()`, `cancelBooking()` |
| `BOOKING_CONFIRMED` | `WORKER_ACCEPTED`, `CANCELLED` | Worker | `acceptJob()` |
| `WORKER_ACCEPTED` | `ON_THE_WAY`, `CANCELLED` | Worker | `startTransit()` |
| `ON_THE_WAY` | `ARRIVED` | Worker | `markArrived()` |
| `ARRIVED` | `OTP_VERIFIED` | Worker + Customer | `verifyOTP()` |
| `OTP_VERIFIED` | `SERVICE_STARTED` | Worker | `startService()` |
| `SERVICE_STARTED` | `SERVICE_COMPLETED` | Worker | `completeService()` |
| `SERVICE_COMPLETED` | `BILL_GENERATED` | Pricing Engine | `generateFinalBill()` |
| `BILL_GENERATED` | `PAYMENT_PENDING` | Customer | `initiatePayment()` |
| `PAYMENT_PENDING` | `PAYMENT_RECEIVED`, `CANCELLED` | Payment Gateway | `confirmPayment()` |
| `PAYMENT_RECEIVED` | `BOOKING_COMPLETED` | System | Auto-close booking |
