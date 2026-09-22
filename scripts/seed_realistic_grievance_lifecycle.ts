import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// 1. CONFIGURATION & CLIENT
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        process.env[key.trim()] = valParts.join("=").trim();
      }
    }
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const secretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const adminClient = createClient(supabaseUrl, secretKey);

interface FedGrievanceTarget {
  id: string;
  name: string;
  prefix: string;
  openCount: number;
  waitingCount: number;
  resolvedCount: number;
  avgHoursTarget: number; // e.g. 26.5
}

const FED_TARGETS: FedGrievanceTarget[] = [
  {
    id: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
    name: "Ahmedabad Skilled Workers Federation",
    prefix: "AMD",
    openCount: 10,
    waitingCount: 4,
    resolvedCount: 24,
    avgHoursTarget: 28.0,
  },
  {
    id: "3adedc5e-bfa1-4eca-b78c-e43ba957fe21",
    name: "Surat Technicians Guild",
    prefix: "SUR",
    openCount: 4,
    waitingCount: 3,
    resolvedCount: 18,
    avgHoursTarget: 27.5,
  },
  {
    id: "42ae3cf4-507f-41af-a419-ceee67482ebf",
    name: "Vadodara Artisan Cooperative",
    prefix: "VAD",
    openCount: 3,
    waitingCount: 2,
    resolvedCount: 6,
    avgHoursTarget: 25.5,
  },
  {
    id: "df5e2a43-c749-4cca-bd26-fe5826b1d1c3",
    name: "Gujarat Household Services Federation",
    prefix: "GND",
    openCount: 2,
    waitingCount: 2,
    resolvedCount: 5,
    avgHoursTarget: 24.0,
  },
  {
    id: "c160832d-8d70-4fb1-afac-2bf253424d52",
    name: "Saurashtra Skilled Workers Guild",
    prefix: "RJK",
    openCount: 2,
    waitingCount: 1,
    resolvedCount: 4,
    avgHoursTarget: 26.0,
  },
  {
    id: "ef237822-5b94-4f26-8efc-68ed71727ceb",
    name: "Pune Industrial & Home Technicians Guild",
    prefix: "PUN",
    openCount: 2,
    waitingCount: 1,
    resolvedCount: 4,
    avgHoursTarget: 29.0,
  },
  {
    id: "eeab7bee-fa82-4bc0-aae9-37e769d2ae0f",
    name: "Mumbai Metropolis Labor & Artisan Guild",
    prefix: "MUM",
    openCount: 2,
    waitingCount: 1,
    resolvedCount: 5,
    avgHoursTarget: 28.5,
  },
  {
    id: "6c2b0dcf-9397-42d3-b233-5f945a61b20d",
    name: "Delhi NCR Capital Services Cooperative",
    prefix: "DEL",
    openCount: 2,
    waitingCount: 1,
    resolvedCount: 4,
    avgHoursTarget: 30.0,
  },
  {
    id: "4b2f029d-ea67-4a83-aaa7-d07066e45952",
    name: "Bengaluru Urban Artisans Cooperative",
    prefix: "BLR",
    openCount: 2,
    waitingCount: 1,
    resolvedCount: 4,
    avgHoursTarget: 27.0,
  },
];

const COMPLAINT_TOPICS = [
  { cat: "Service Quality", sub: "Improper Installation", desc: "Technician finished pipe assembly but slight seepage occurred after water pressure restored." },
  { cat: "Pricing & Billing", sub: "Overcharge Dispute", desc: "Customer disputed replacement circuit breaker material cost exceeding standard cooperative rates." },
  { cat: "Punctuality", sub: "Delayed Arrival", desc: "Worker arrived 45 minutes past scheduled appointment window without prior dispatch notice." },
  { cat: "Professionalism", sub: "Cleanup Issue", desc: "Workplace debris and old damaged tiles were not cleared after bathroom plumbing maintenance." },
  { cat: "Safety & Equipment", sub: "Missing PPE", desc: "Technician did not utilize insulated gloves while inspecting live main distribution board." },
];

async function main() {
  console.log("================================================================");
  console.log("🚀 SEEDING REALISTIC GRIEVANCE LIFECYCLE ('WAITING' & CALIBRATION)");
  console.log("================================================================");

  // 1. First, recalibrate any existing Surat complaints that had absurd resolution times (603h)
  console.log("\n1. Recalibrating historical Surat complaints to eliminate 603h anomaly...");
  const { data: existingSuratComplaints } = await adminClient
    .from("complaints")
    .select("id, description, created_at, resolved_at");

  for (const c of existingSuratComplaints || []) {
    let envelope: any = {};
    try {
      envelope = JSON.parse(c.description);
    } catch {
      continue;
    }

    if (envelope.federationName?.includes("Surat") || envelope.federationId === "3adedc5e-bfa1-4eca-b78c-e43ba957fe21") {
      if (c.resolved_at && c.created_at) {
        const createTime = new Date(c.created_at).getTime();
        const realisticResolvedTime = new Date(createTime + (26 + Math.random() * 4) * 3600000).toISOString();
        if (envelope.resolution) {
          envelope.resolution.resolvedAt = realisticResolvedTime;
        }
        await adminClient.from("complaints").update({
          resolved_at: realisticResolvedTime,
          description: JSON.stringify(envelope),
        }).eq("id", c.id);
      }
    }
  }
  console.log("  ✅ Surat historical complaints calibrated to ~28 hrs average.");

  // 2. Fetch baseline lookup data
  const { data: customers } = await adminClient.from("profiles").select("id, full_name, phone").eq("role", "CUSTOMER");
  const { data: allWorkers } = await adminClient.from("workers").select("id, profile_id, federation_id, profiles(full_name, phone)");
  const { data: allBookings } = await adminClient.from("bookings").select("id, federation_id, booking_number, customer_id, worker_id, created_at");

  const customerList = customers || [];
  const workerList = allWorkers || [];
  const bookingList = allBookings || [];

  // 3. Process each federation target
  for (let fIdx = 0; fIdx < FED_TARGETS.length; fIdx++) {
    const fed = FED_TARGETS[fIdx];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[${fIdx + 1}/${FED_TARGETS.length}] Seeding Grievances: ${fed.name}`);
    console.log(`   Targets -> Open: ${fed.openCount} | Waiting: ${fed.waitingCount} | Resolved: ${fed.resolvedCount}`);
    console.log(`----------------------------------------------------------------`);

    const fedBookings = bookingList.filter(b => b.federation_id === fed.id);
    const fedWorkers = workerList.filter(w => w.federation_id === fed.id);

    const totalToSeed = fed.openCount + fed.waitingCount + fed.resolvedCount;
    let seededOpen = 0;
    let seededWaiting = 0;
    let seededResolved = 0;

    for (let i = 0; i < totalToSeed; i++) {
      let status: "OPEN" | "ACTION_REQUIRED" | "RESOLVED";
      if (seededWaiting < fed.waitingCount) {
        status = "ACTION_REQUIRED";
        seededWaiting++;
      } else if (seededOpen < fed.openCount) {
        status = "OPEN";
        seededOpen++;
      } else {
        status = "RESOLVED";
        seededResolved++;
      }

      const booking = fedBookings[i % Math.max(1, fedBookings.length)];
      const worker = fedWorkers[i % Math.max(1, fedWorkers.length)];
      const customer = customerList[i % customerList.length];
      const topic = COMPLAINT_TOPICS[i % COMPLAINT_TOPICS.length];

      const cId = `00000008-${String(fIdx + 1).padStart(4, "0")}-4000-8000-${String(i + 1).padStart(12, "0")}`;
      const complaintNumber = `GRV-${fed.prefix}-${String(i + 101).padStart(5, "0")}`;

      const daysAgo = status === "RESOLVED"
        ? 8 + Math.floor((i * 40) / totalToSeed)
        : 1 + Math.floor((i * 5) / (fed.openCount + fed.waitingCount));

      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const resolvedAt = status === "RESOLVED"
        ? new Date(Date.parse(createdAt) + (fed.avgHoursTarget + (i % 3 - 1) * 2) * 3600000).toISOString()
        : null;

      const workerName = (worker?.profiles as any)?.full_name || "Assigned Technician";
      const workerPhone = (worker?.profiles as any)?.phone || "+91 98000 00000";

      // Build structured envelope
      const envelope = {
        version: 1,
        complaintNumber,
        category: topic.cat,
        subcategory: topic.sub,
        subject: `${topic.sub} - ${topic.cat}`,
        description: topic.desc,
        priority: i % 4 === 0 ? "HIGH" : "MEDIUM",
        status: status, // "ACTION_REQUIRED" is recognized by complaint-service as waiting!
        raisedByRole: "CUSTOMER",
        raisedByName: customer.full_name || "Household Member",
        raisedByPhone: customer.phone || "+91 98765 00000",
        targetRole: "WORKER",
        targetName: workerName,
        targetPhone: workerPhone,
        targetWorkerId: worker?.id,
        targetProfileId: worker?.profile_id,
        federationId: fed.id,
        federationName: fed.name,
        bookingId: booking?.id || null,
        responseRequests: status === "ACTION_REQUIRED" ? {
          workerRequired: true,
          customerRequired: false,
          prompt: "Technician statement requested regarding work verification and itemized materials.",
          requestedAt: new Date(Date.parse(createdAt) + 12 * 3600000).toISOString(),
        } : undefined,
        resolution: status === "RESOLVED" ? {
          resolutionType: "CONCILIATION",
          summary: "Dispute settled via cooperative mediation and follow up inspection.",
          actionTaken: "Federation inspected site, technician completed joint tightening, and customer accepted resolution.",
          resolvedBy: "Federation Dispute Officer",
          resolvedByName: "Federation Dispute Officer",
          resolvedAt: resolvedAt,
        } : undefined,
        timeline: [
          {
            id: `tl-1-${i}`,
            type: "CREATE",
            visibility: "PUBLIC",
            actorId: customer.id,
            actorRole: "CUSTOMER",
            actorName: customer.full_name || "Customer",
            message: "Grievance submitted regarding service performance.",
            timestamp: createdAt,
          },
          ...(status === "ACTION_REQUIRED" ? [{
            id: `tl-2-${i}`,
            type: "STATUS_CHANGE",
            visibility: "PUBLIC",
            actorId: "00000000-0000-0000-0000-000000000001",
            actorRole: "FEDERATION_ADMIN",
            actorName: "Federation Officer",
            message: "Case placed in ACTION_REQUIRED: Statement requested from technician.",
            timestamp: new Date(Date.parse(createdAt) + 12 * 3600000).toISOString(),
          }] : []),
          ...(status === "RESOLVED" ? [{
            id: `tl-3-${i}`,
            type: "RESOLUTION",
            visibility: "PUBLIC",
            actorId: "00000000-0000-0000-0000-000000000001",
            actorRole: "FEDERATION_ADMIN",
            actorName: "Federation Officer",
            message: "Case conciliated and formally resolved.",
            timestamp: resolvedAt,
          }] : []),
        ],
        auditTrail: [
          {
            id: `aud-1-${i}`,
            complaintId: cId,
            actorId: customer.id,
            actorRole: "CUSTOMER",
            actorName: customer.full_name || "Customer",
            action: "CREATE",
            notes: "Case initialized.",
            timestamp: createdAt,
          },
        ],
      };

      // Raw DB status: ACTION_REQUIRED is stored as IN_REVIEW in raw DB enum, but envelope has status: "ACTION_REQUIRED"
      const dbStatus = status === "RESOLVED" ? "RESOLVED" : status === "ACTION_REQUIRED" ? "IN_REVIEW" : "OPEN";

      await (adminClient.from("complaints") as any).upsert({
        id: cId,
        complaint_number: complaintNumber,
        booking_id: booking?.id || null,
        raised_by: customer.id,
        target_profile_id: worker?.profile_id || null,
        category: topic.cat,
        description: JSON.stringify(envelope),
        status: dbStatus,
        resolution_notes: status === "RESOLVED" ? envelope.resolution?.actionTaken : null,
        resolved_at: resolvedAt,
        created_at: createdAt,
        updated_at: resolvedAt || createdAt,
      });
    }

    console.log(`  ✅ Seeded ${totalToSeed} grievances for ${fed.name} (Waiting: ${fed.waitingCount}, Open: ${fed.openCount}, Resolved: ${fed.resolvedCount}).`);
  }

  console.log("\n================================================================");
  console.log("🎉 ALL GRIEVANCE LIFECYCLES APPLIED SUCCESSFULLY!");
  console.log("================================================================");
}

main().catch((err) => {
  console.error("Grievance seeding failed:", err);
  process.exit(1);
});
