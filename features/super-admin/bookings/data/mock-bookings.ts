import type {
  BookingDetails,
  BookingStatus,
  BookingLifecycleStage,
  BookingTimelineItem,
} from "../types";

export function mapStatusToLifecycleStage(status: BookingStatus): BookingLifecycleStage {
  switch (status) {
    case "REQUEST_SENT":
    case "WORKER_REVIEWING":
    case "WORKER_INTERESTED":
    case "CUSTOMER_CONFIRMATION_PENDING":
    case "BOOKING_CONFIRMED":
      return "PENDING";
    case "WORKER_ACCEPTED":
      return "ACCEPTED";
    case "ON_THE_WAY":
    case "ARRIVED":
    case "OTP_VERIFIED":
    case "SERVICE_STARTED":
      return "IN_PROGRESS";
    case "SERVICE_COMPLETED":
    case "BILL_GENERATED":
    case "PAYMENT_PENDING":
    case "PAYMENT_RECEIVED":
    case "BOOKING_COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

/**
 * Isolated deterministic mock bookings dataset.
 * Used during local development or when backend Supabase tables are unseeded.
 */
export const MOCK_BOOKINGS: BookingDetails[] = [
  {
    id: "bk-701",
    bookingNumber: "BKG-2026-701",
    customerId: "prf-cust-1",
    customerName: "Kavya Vaghela",
    customerPhone: "+91 98200 11223",
    customerEmail: "kavya.v@example.com",
    workerId: "wrk-101",
    workerName: "Aarav Mehta",
    workerProfession: "Master Electrician",
    workerPhone: "+91 98111 22334",
    societyId: "fed-001",
    societyName: "Mumbai Central Worker Cooperative",
    serviceId: "srv-001",
    serviceTitle: "Electrical Panel Repair & Diagnostic",
    serviceCategory: "Electrical",
    location: "Bandra West, Mumbai",
    addressDetails: "Flat 402, Sea Green Apartments, Bandra West, Mumbai, MH - 400050",
    scheduledStartAt: "2026-09-03 10:00 AM",
    scheduledEndAt: "2026-09-03 12:00 PM",
    bookingDate: "2026-09-03",
    totalAmount: 850,
    platformFee: 128,
    workerEarnings: 722,
    status: "SERVICE_STARTED",
    lifecycleStage: "IN_PROGRESS",
    paymentStatus: "PENDING",
    problemDescription: "Main distribution breaker tripping intermittently under AC load. Smelling slight burning odor from fuse box.",
    otpCode: "849201",
    actualStartAt: "2026-09-03 10:15 AM",
    paymentDetails: {
      paymentNumber: "PAY-2026-901",
      gatewayProvider: "Razorpay Escrow",
      invoiceNumber: "INV-2026-081",
    },
  },
  {
    id: "bk-702",
    bookingNumber: "BKG-2026-702",
    customerId: "prf-cust-2",
    customerName: "Anil Kapoor",
    customerPhone: "+91 98201 44556",
    customerEmail: "anil.k@example.com",
    workerId: "wrk-102",
    workerName: "Rohan Verma",
    workerProfession: "Sanitation Specialist",
    workerPhone: "+91 98222 33445",
    societyId: "fed-001",
    societyName: "Mumbai Central Worker Cooperative",
    serviceId: "srv-002",
    serviceTitle: "Emergency Drainage Clearing & Sanitization",
    serviceCategory: "Plumbing & Sanitation",
    location: "Dadar East, Mumbai",
    addressDetails: "Bldg 3, Shanti Nagar, Dadar East, Mumbai, MH - 400014",
    scheduledStartAt: "2026-09-03 11:30 AM",
    scheduledEndAt: "2026-09-03 01:00 PM",
    bookingDate: "2026-09-03",
    totalAmount: 600,
    platformFee: 90,
    workerEarnings: 510,
    status: "ON_THE_WAY",
    lifecycleStage: "IN_PROGRESS",
    paymentStatus: "PENDING",
    problemDescription: "Kitchen pipeline overflow due to main grease line blockage. Requires high-pressure snake auger.",
    otpCode: "392011",
    paymentDetails: {
      gatewayProvider: "Razorpay Escrow",
      invoiceNumber: "INV-2026-082",
    },
  },
  {
    id: "bk-703",
    bookingNumber: "BKG-2026-703",
    customerId: "prf-cust-3",
    customerName: "Sunita Deshmukh",
    customerPhone: "+91 98202 77889",
    customerEmail: "sunita.d@example.com",
    workerId: "wrk-103",
    workerName: "Priya Nair",
    workerProfession: "Solar Technician",
    workerPhone: "+91 98333 44556",
    societyId: "fed-002",
    societyName: "Navi Mumbai Skilled Trades Federation",
    serviceId: "srv-003",
    serviceTitle: "Rooftop Solar Inverter Maintenance",
    serviceCategory: "Solar & Clean Energy",
    location: "Vashi, Navi Mumbai",
    addressDetails: "Sector 17, Plot 42, Vashi, Navi Mumbai, MH - 400703",
    scheduledStartAt: "2026-09-02 02:00 PM",
    scheduledEndAt: "2026-09-02 04:30 PM",
    bookingDate: "2026-09-02",
    totalAmount: 1450,
    platformFee: 218,
    workerEarnings: 1232,
    status: "BOOKING_COMPLETED",
    lifecycleStage: "COMPLETED",
    paymentStatus: "PAID",
    problemDescription: "Annual rooftop inverter efficiency calibration and DC isolator switch tightening.",
    otpCode: "551203",
    actualStartAt: "2026-09-02 02:05 PM",
    actualEndAt: "2026-09-02 04:20 PM",
    paymentDetails: {
      paymentNumber: "PAY-2026-880",
      gatewayProvider: "Razorpay UPI",
      gatewayPaymentId: "pay_Rzp99281203",
      paidAt: "2026-09-02 04:25 PM",
      invoiceNumber: "INV-2026-079",
    },
  },
  {
    id: "bk-704",
    bookingNumber: "BKG-2026-704",
    customerId: "prf-cust-4",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 98203 99001",
    customerEmail: "vikram.m@example.com",
    workerId: null,
    workerName: null,
    workerProfession: null,
    workerPhone: null,
    societyId: "fed-003",
    societyName: "Thane District Artisans Cooperative",
    serviceId: "srv-004",
    serviceTitle: "Bespoke Teak Wardrobe Fitting",
    serviceCategory: "Carpentry",
    location: "Ghodbunder Road, Thane",
    addressDetails: "Tower B, Hiranandani Estate, Ghodbunder Rd, Thane West, MH - 400607",
    scheduledStartAt: "2026-09-04 09:30 AM",
    scheduledEndAt: "2026-09-04 01:30 PM",
    bookingDate: "2026-09-03",
    totalAmount: 1800,
    platformFee: 270,
    workerEarnings: 1530,
    status: "REQUEST_SENT",
    lifecycleStage: "PENDING",
    paymentStatus: "PENDING",
    problemDescription: "New bedroom wardrobe door hinge realignment, magnetic catch installation, and soft-close adjustment.",
    paymentDetails: {
      gatewayProvider: "Razorpay Escrow",
    },
  },
  {
    id: "bk-705",
    bookingNumber: "BKG-2026-705",
    customerId: "prf-cust-5",
    customerName: "Meera Sen",
    customerPhone: "+91 98204 22334",
    customerEmail: "meera.sen@example.com",
    workerId: "wrk-105",
    workerName: "Farhan Ali",
    workerProfession: "HVAC Technician",
    workerPhone: "+91 98555 66778",
    societyId: "fed-004",
    societyName: "Pune Urban Services Federation",
    serviceId: "srv-005",
    serviceTitle: "Split AC Compressor Gas Refill & Servicing",
    serviceCategory: "HVAC & Cooling",
    location: "Kothrud, Pune",
    addressDetails: "B-12, Mayur Colony, Kothrud, Pune, MH - 411038",
    scheduledStartAt: "2026-09-03 03:00 PM",
    scheduledEndAt: "2026-09-03 05:00 PM",
    bookingDate: "2026-09-03",
    totalAmount: 1200,
    platformFee: 180,
    workerEarnings: 1020,
    status: "WORKER_ACCEPTED",
    lifecycleStage: "ACCEPTED",
    paymentStatus: "PENDING",
    problemDescription: "Living room AC blowing ambient air instead of chilled air. Low cooling pressure suspected.",
    paymentDetails: {
      gatewayProvider: "Razorpay Escrow",
    },
  },
  {
    id: "bk-706",
    bookingNumber: "BKG-2026-706",
    customerId: "prf-cust-6",
    customerName: "Rajesh Joshi",
    customerPhone: "+91 98205 66778",
    customerEmail: "rajesh.j@example.com",
    workerId: "wrk-106",
    workerName: "Suresh Patil",
    workerProfession: "Plumber",
    workerPhone: "+91 98666 77889",
    societyId: "fed-001",
    societyName: "Mumbai Central Worker Cooperative",
    serviceId: "srv-006",
    serviceTitle: "Concealed Bathroom Pipe Leakage Detection",
    serviceCategory: "Plumbing & Sanitation",
    location: "Andheri East, Mumbai",
    addressDetails: "701 Sai Sadan, Marol Naka, Andheri East, Mumbai, MH - 400059",
    scheduledStartAt: "2026-09-01 11:00 AM",
    scheduledEndAt: "2026-09-01 01:00 PM",
    bookingDate: "2026-09-01",
    totalAmount: 750,
    platformFee: 112,
    workerEarnings: 638,
    status: "CANCELLED",
    lifecycleStage: "CANCELLED",
    paymentStatus: "REFUNDED",
    problemDescription: "Customer had to travel urgently for a family medical emergency before worker arrival.",
    actualStartAt: null,
    actualEndAt: null,
    paymentDetails: {
      paymentNumber: "PAY-2026-805",
      gatewayProvider: "Razorpay Netbanking",
      gatewayPaymentId: "pay_RzpRef77123",
      paidAt: "2026-09-01 10:45 AM",
      invoiceNumber: "INV-2026-070",
    },
  },
  {
    id: "bk-707",
    bookingNumber: "BKG-2026-707",
    customerId: "prf-cust-7",
    customerName: "Deepak Sharma",
    customerPhone: "+91 98206 88990",
    customerEmail: "deepak.s@example.com",
    workerId: "wrk-101",
    workerName: "Aarav Mehta",
    workerProfession: "Master Electrician",
    workerPhone: "+91 98111 22334",
    societyId: "fed-001",
    societyName: "Mumbai Central Worker Cooperative",
    serviceId: "srv-001",
    serviceTitle: "Residential LED Chandelier Wiring",
    serviceCategory: "Electrical",
    location: "Juhu, Mumbai",
    addressDetails: "Villa 5, JVPD Scheme, Juhu, Mumbai, MH - 400049",
    scheduledStartAt: "2026-08-30 04:00 PM",
    scheduledEndAt: "2026-08-30 06:30 PM",
    bookingDate: "2026-08-30",
    totalAmount: 1100,
    platformFee: 165,
    workerEarnings: 935,
    status: "BOOKING_COMPLETED",
    lifecycleStage: "COMPLETED",
    paymentStatus: "PAID",
    problemDescription: "Ceiling mounting and smart dimmer dimmer switch integration for heavy dining room chandelier.",
    otpCode: "712904",
    actualStartAt: "2026-08-30 04:10 PM",
    actualEndAt: "2026-08-30 06:20 PM",
    paymentDetails: {
      paymentNumber: "PAY-2026-772",
      gatewayProvider: "Razorpay Card",
      gatewayPaymentId: "pay_RzpCard4410",
      paidAt: "2026-08-30 06:25 PM",
      invoiceNumber: "INV-2026-065",
    },
  },
  {
    id: "bk-708",
    bookingNumber: "BKG-2026-708",
    customerId: "prf-cust-8",
    customerName: "Pooja Hegde",
    customerPhone: "+91 98207 11335",
    customerEmail: "pooja.h@example.com",
    workerId: "wrk-102",
    workerName: "Rohan Verma",
    workerProfession: "Sanitation Specialist",
    workerPhone: "+91 98222 33445",
    societyId: "fed-001",
    societyName: "Mumbai Central Worker Cooperative",
    serviceId: "srv-002",
    serviceTitle: "Overhead Water Tank Sanitization",
    serviceCategory: "Plumbing & Sanitation",
    location: "Worli, Mumbai",
    addressDetails: "Flat 1204, Sea Breeze Tower, Worli Sea Face, Mumbai, MH - 400018",
    scheduledStartAt: "2026-09-04 10:00 AM",
    scheduledEndAt: "2026-09-04 12:30 PM",
    bookingDate: "2026-09-03",
    totalAmount: 950,
    platformFee: 142,
    workerEarnings: 808,
    status: "CUSTOMER_CONFIRMATION_PENDING",
    lifecycleStage: "PENDING",
    paymentStatus: "PENDING",
    problemDescription: "6-month routine chemical-free UV and anti-bacterial scrubbing for 1000L rooftop plastic water tank.",
    paymentDetails: {
      gatewayProvider: "Razorpay Escrow",
    },
  },
];

/**
 * Generates deterministic chronological status transition history
 * for an individual booking, consistent with its current status.
 */
export function generateDeterministicTimeline(booking: BookingDetails): BookingTimelineItem[] {
  const items: BookingTimelineItem[] = [];
  const baseDate = booking.bookingDate;

  // Milestone 1: Request Created
  items.push({
    id: `tl-${booking.id}-1`,
    bookingId: booking.id,
    previousStatus: null,
    newStatus: "REQUEST_SENT",
    stage: "PENDING",
    title: "Service Request Dispatched",
    description: `Customer ${booking.customerName} initiated request for ${booking.serviceTitle}.`,
    changedBy: booking.customerName,
    createdAt: `${baseDate} 08:30 AM`,
  });

  if (booking.status === "REQUEST_SENT") return items;

  // Milestone 2: Worker Confirmed / Accepted
  if (booking.workerName) {
    items.push({
      id: `tl-${booking.id}-2`,
      bookingId: booking.id,
      previousStatus: "REQUEST_SENT",
      newStatus: "WORKER_ACCEPTED",
      stage: "ACCEPTED",
      title: "Worker Accepted & Assigned",
      description: `${booking.workerName} (${booking.workerProfession}) accepted dispatch from ${booking.societyName}.`,
      changedBy: booking.workerName,
      createdAt: `${baseDate} 09:05 AM`,
    });
  }

  if (booking.status === "WORKER_ACCEPTED" || booking.status === "CUSTOMER_CONFIRMATION_PENDING") {
    return items;
  }

  // Milestone: Cancelled
  if (booking.status === "CANCELLED") {
    items.push({
      id: `tl-${booking.id}-cancel`,
      bookingId: booking.id,
      previousStatus: "WORKER_ACCEPTED",
      newStatus: "CANCELLED",
      stage: "CANCELLED",
      title: "Service Cancelled",
      description: booking.problemDescription || "Order cancelled by customer before on-site inspection.",
      changedBy: booking.customerName,
      createdAt: `${baseDate} 10:15 AM`,
    });
    return items;
  }

  // Milestone 3: On The Way
  items.push({
    id: `tl-${booking.id}-3`,
    bookingId: booking.id,
    previousStatus: "WORKER_ACCEPTED",
    newStatus: "ON_THE_WAY",
    stage: "IN_PROGRESS",
    title: "Worker En Route",
    description: `${booking.workerName} departed for customer location at ${booking.location}.`,
    changedBy: booking.workerName,
    createdAt: `${baseDate} 09:35 AM`,
  });

  if (booking.status === "ON_THE_WAY") return items;

  // Milestone 4: Arrived & OTP Verified
  items.push({
    id: `tl-${booking.id}-4`,
    bookingId: booking.id,
    previousStatus: "ON_THE_WAY",
    newStatus: "OTP_VERIFIED",
    stage: "IN_PROGRESS",
    title: "OTP Handshake Verified",
    description: `6-digit security OTP validated. Service execution unlocked on-site.`,
    changedBy: "System Authenticator",
    createdAt: `${baseDate} 09:55 AM`,
  });

  // Milestone 5: Service Started
  items.push({
    id: `tl-${booking.id}-5`,
    bookingId: booking.id,
    previousStatus: "OTP_VERIFIED",
    newStatus: "SERVICE_STARTED",
    stage: "IN_PROGRESS",
    title: "Service Underway",
    description: `Worker started diagnostics and execution on ${booking.serviceTitle}.`,
    changedBy: booking.workerName,
    createdAt: `${baseDate} 10:00 AM`,
  });

  if (booking.status === "SERVICE_STARTED") return items;

  // Milestone 6: Service Completed
  items.push({
    id: `tl-${booking.id}-6`,
    bookingId: booking.id,
    previousStatus: "SERVICE_STARTED",
    newStatus: "SERVICE_COMPLETED",
    stage: "COMPLETED",
    title: "Work Accomplished",
    description: `Task fulfillment signed off. Bill generated for ₹${booking.totalAmount}.`,
    changedBy: booking.workerName,
    createdAt: `${baseDate} 11:45 AM`,
  });

  if (booking.status === "SERVICE_COMPLETED" || booking.status === "BILL_GENERATED" || booking.status === "PAYMENT_PENDING") {
    return items;
  }

  // Milestone 7: Payment Received & Booking Closed
  items.push({
    id: `tl-${booking.id}-7`,
    bookingId: booking.id,
    previousStatus: "SERVICE_COMPLETED",
    newStatus: "BOOKING_COMPLETED",
    stage: "COMPLETED",
    title: "Payment Settled & Booking Closed",
    description: `Customer payment of ₹${booking.totalAmount} settled via ${booking.paymentDetails?.gatewayProvider || "Payment Gateway"}. Cooperative escrow credited.`,
    changedBy: "Escrow Payment Gateway",
    createdAt: `${baseDate} 11:55 AM`,
  });

  return items;
}
