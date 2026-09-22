import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// 1. ENVIRONMENT & CLIENT INITIALIZATION
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

if (!supabaseUrl || !secretKey) {
  console.error("Missing SUPABASE credentials in .env.local!");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, secretKey);

// Protected entities — strictly preserved
const PROTECTED_RAVI_PATEL_ID = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
const PROTECTED_PRINCE_PRAJAPATI_ID = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
const AHMEDABAD_FED_ID = "b765df3b-c418-4a15-b79f-3cbc09e475dc";

// ---------------------------------------------------------------------------
// 2. NATIONAL FEDERATION CONFIGURATIONS
// ---------------------------------------------------------------------------
interface NationalFedConfig {
  id: string;
  name: string;
  city: string;
  state: string;
  prefix: string;
  numWorkers: number;
  busyWorkers: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  targetRating: number; // e.g. 4.10
  workerNames: string[];
}

const NATIONAL_FED_CONFIGS: NationalFedConfig[] = [
  {
    id: "ef237822-5b94-4f26-8efc-68ed71727ceb",
    name: "Pune Industrial & Home Technicians Guild",
    city: "Pune",
    state: "Maharashtra",
    prefix: "PUN",
    numWorkers: 8,
    busyWorkers: 2, // 25.0% util -> ~72.0 pts
    totalBookings: 42,
    completedBookings: 35, // 83.3%
    cancelledBookings: 5,  // 11.9%
    targetRating: 4.10,
    workerNames: [
      "Nitin Kulkarni", "Sachin Deshmukh", "Anil Shinde", "Pooja Jadhav",
      "Ganesh Chavan", "Rohit Gaikwad", "Sunil More", "Deepak Thorat"
    ],
  },
  {
    id: "4b2f029d-ea67-4a83-aaa7-d07066e45952",
    name: "Bengaluru Urban Artisans Cooperative",
    city: "Bengaluru",
    state: "Karnataka",
    prefix: "BLR",
    numWorkers: 8,
    busyWorkers: 2, // 25.0% util -> ~71.1 pts
    totalBookings: 32,
    completedBookings: 26, // 81.2%
    cancelledBookings: 4,  // 12.5%
    targetRating: 4.10,
    workerNames: [
      "Ramesh Gowda", "Vijay Kumar", "Manjunath Swamy", "Suresh Babu",
      "Kavitha Reddy", "Pradeep Hegde", "Raghavendra Rao", "Anand Murthy"
    ],
  },
  {
    id: "eeab7bee-fa82-4bc0-aae9-37e769d2ae0f",
    name: "Mumbai Metropolis Labor & Artisan Guild",
    city: "Mumbai",
    state: "Maharashtra",
    prefix: "MUM",
    numWorkers: 10,
    busyWorkers: 2, // 20.0% util -> ~70.9 pts
    totalBookings: 40,
    completedBookings: 33, // 82.5%
    cancelledBookings: 5,  // 12.5%
    targetRating: 4.15,
    workerNames: [
      "Mahesh Sawant", "Sanjay Patil", "Pravin Kadam", "Dinesh Kamble",
      "Vikram Salvi", "Sunita Shinde", "Santosh Parab", "Ajay Solanki",
      "Manoj Ghag", "Kiran Rane"
    ],
  },
  {
    id: "6c2b0dcf-9397-42d3-b233-5f945a61b20d",
    name: "Delhi NCR Capital Services Cooperative",
    city: "Delhi",
    state: "Delhi NCR",
    prefix: "DEL",
    numWorkers: 10,
    busyWorkers: 2, // 20.0% util -> ~69.1 pts
    totalBookings: 35,
    completedBookings: 28, // 80.0%
    cancelledBookings: 5,  // 14.3%
    targetRating: 4.05,
    workerNames: [
      "Rajesh Verma", "Amit Sharma", "Devendra Yadav", "Harish Bisht",
      "Mukesh Chand", "Sunil Tomar", "Rakesh Negi", "Naresh Rawat",
      "Pawan Mishra", "Sohan Singh"
    ],
  },
  {
    id: "f805b2dc-e20a-4be0-afb1-d36e962f6bb3",
    name: "Hyderabad Deccan Skilled Labor Cooperative",
    city: "Hyderabad",
    state: "Telangana",
    prefix: "HYD",
    numWorkers: 7,
    busyWorkers: 1, // 14.3% util -> ~67.2 pts
    totalBookings: 29,
    completedBookings: 23, // 79.3%
    cancelledBookings: 4,  // 13.8%
    targetRating: 3.95,
    workerNames: [
      "Srinivas Goud", "Venkat Rao", "Krishna Murthy", "Shekhar Reddy",
      "Naresh Chary", "Mallesh Yadav", "Sridhar Varma"
    ],
  },
  {
    id: "5806030d-9d0c-4989-9eaf-0f7d23e301e7",
    name: "Greater Kolkata Service Workers Cooperative",
    city: "Kolkata",
    state: "West Bengal",
    prefix: "CCU",
    numWorkers: 6,
    busyWorkers: 1, // 16.7% util -> ~67.1 pts
    totalBookings: 28,
    completedBookings: 22, // 78.6%
    cancelledBookings: 4,  // 14.3%
    targetRating: 3.90,
    workerNames: [
      "Subhash Roy", "Tapas Banerjee", "Debashis Sen", "Prabir Das",
      "Biplab Ghosh", "Anupam Mukherjee"
    ],
  },
  {
    id: "f69fd248-67c1-43c6-aa01-488d09c97555",
    name: "Rajasthan Heritage Crafts & Services Federation",
    city: "Jaipur",
    state: "Rajasthan",
    prefix: "JAI",
    numWorkers: 6,
    busyWorkers: 1, // 16.7% util -> ~66.0 pts
    totalBookings: 26,
    completedBookings: 20, // 76.9%
    cancelledBookings: 4,  // 15.4%
    targetRating: 3.85,
    workerNames: [
      "Gopal Meena", "Bhanwar Singh", "Kailash Sharma", "Ramavtar Gurjar",
      "Madan Lal Saini", "Surendra Jat"
    ],
  },
  {
    id: "47278d9c-c949-4c6c-ba3b-c1ffaa8f667e",
    name: "Central India Skilled Workers Federation",
    city: "Indore",
    state: "Madhya Pradesh",
    prefix: "IND",
    numWorkers: 6,
    busyWorkers: 1, // 16.7% util -> ~65.3 pts
    totalBookings: 25,
    completedBookings: 19, // 76.0%
    cancelledBookings: 4,  // 16.0%
    targetRating: 3.80,
    workerNames: [
      "Govind Chouhan", "Kamlesh Solanki", "Dharmendra Patidar", "Jitendra Malviya",
      "Santosh Kushwaha", "Om Prakash Rathore"
    ],
  },
  {
    id: "194045b5-83f8-4926-997a-fb5e323090d7",
    name: "Awadh Technicians & Artisans Cooperative",
    city: "Lucknow",
    state: "Uttar Pradesh",
    prefix: "LKO",
    numWorkers: 6,
    busyWorkers: 1, // 16.7% util -> ~64.6 pts
    totalBookings: 24,
    completedBookings: 18, // 75.0%
    cancelledBookings: 4,  // 16.7%
    targetRating: 3.75,
    workerNames: [
      "Rameshwar Tiwari", "Akhilesh Yadav", "Manoj Shukla", "Dinesh Awasthi",
      "Vinod Pandey", "Pradeep Rawat"
    ],
  },
];

// Garbage test federations to deactivate
const GARBAGE_FED_IDS = [
  "6effbf67-4977-4979-b22f-a0c41ffc3705", // asdfgh (ertyu)
  "ebce0fd5-dcfb-4578-a8ae-161121f45a68", // VGEC federeation
  "06bf479e-a2d5-45cc-8884-27c9362eba37", // Ahmedabad Household
  "bd692f13-dd13-49d8-999c-cdcca9260438", // Kushal Bhavsar
  "104bf84e-ad03-49c5-a84a-80a64d5a6513", // Amrelli AAP federation
  "a2547d84-3b83-4f80-ae4b-293db53ab657", // Surti Fed
];

const TRADES = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Appliance Repair",
  "Mason",
  "Painter",
  "Cleaner",
];

async function main() {
  console.log("================================================================");
  console.log("🚀 SEEDING REALISTIC MULTI-FEDERATION OPERATIONS & WORKFORCE");
  console.log("================================================================");

  // 1. Deactivate garbage test federations
  console.log("\n1. Deactivating 6 throwaway test federations...");
  for (const gId of GARBAGE_FED_IDS) {
    await adminClient.from("federations").update({ is_active: false }).eq("id", gId);
  }
  console.log("  ✅ Deactivated throwaway test entries.");

  // 2. Fetch baseline customers, services, addresses
  console.log("\n2. Fetching baseline relational lookups...");
  const { data: customers } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "CUSTOMER")
    .neq("id", PROTECTED_PRINCE_PRAJAPATI_ID);

  const { data: services } = await adminClient.from("services").select("id, title");
  const { data: addresses } = await adminClient.from("addresses").select("id, profile_id");
  const fallbackAddressId = addresses?.[0]?.id || "";
  const addressByCustomer = new Map<string, string>();
  addresses?.forEach((a) => {
    if (a.profile_id) addressByCustomer.set(a.profile_id, a.id);
  });

  const customerList = customers || [];
  if (customerList.length === 0) throw new Error("No customer profiles found!");
  const serviceList = services || [];
  if (serviceList.length === 0) throw new Error("No services found!");

  // 3. Process each National Federation
  for (let cIdx = 0; cIdx < NATIONAL_FED_CONFIGS.length; cIdx++) {
    const config = NATIONAL_FED_CONFIGS[cIdx];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[${cIdx + 1}/${NATIONAL_FED_CONFIGS.length}] Configuring: ${config.name} (${config.city})`);
    console.log(`----------------------------------------------------------------`);

    // Ensure federation is marked active
    await adminClient.from("federations").update({ is_active: true }).eq("id", config.id);

    // A. Seed Workers for this federation
    console.log(`  -> Seeding ${config.numWorkers} verified workers (${config.busyWorkers} BUSY, ${config.numWorkers - config.busyWorkers} AVAILABLE)...`);
    const workerIds: string[] = [];

    for (let wIdx = 0; wIdx < config.numWorkers; wIdx++) {
      const wName = config.workerNames[wIdx] || `Worker ${wIdx + 1}`;
      const profession = TRADES[wIdx % TRADES.length];
      const isBusy = wIdx < config.busyWorkers;
      const status = isBusy ? "BUSY" : "AVAILABLE";
      const wEmail = `${wName.toLowerCase().replace(/\s+/g, ".")}.${config.prefix.toLowerCase()}@coop.in`;

      // 1. Create or fetch Auth user
      let authUserId: string;
      const { data: userList } = await adminClient.auth.admin.listUsers();
      const existingUser = userList?.users?.find(u => u.email === wEmail);
      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        const { data: newAuth, error: authErr } = await adminClient.auth.admin.createUser({
          email: wEmail,
          password: "CoopPassword2026!",
          email_confirm: true,
          user_metadata: { role: "WORKER", full_name: wName },
        });
        if (authErr || !newAuth.user) {
          console.error(`Auth creation failed for ${wName}:`, authErr);
          continue;
        }
        authUserId = newAuth.user.id;
      }

      // 2. Upsert profile
      await adminClient.from("profiles").upsert({
        id: authUserId,
        role: "WORKER",
        full_name: wName,
        email: wEmail,
        phone: `+91 98${String(cIdx + 1).padStart(2, "0")}${String(wIdx + 10).padStart(2, "0")}0000`.slice(0, 15),
        is_active: true,
        created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 3. Upsert worker record
      const memberId = `MEM-${config.prefix}-${String(wIdx + 101).padStart(4, "0")}`;
      const { data: existingWorker } = await adminClient.from("workers").select("id").eq("profile_id", authUserId).maybeSingle();
      
      let workerId: string;
      if (existingWorker) {
        workerId = existingWorker.id;
        await adminClient.from("workers").update({
          federation_id: config.id,
          availability_status: status,
          account_status: "ACTIVE",
          verification_status: "verified",
          profession,
        }).eq("id", workerId);
      } else {
        const { data: insertedWorker, error: wInsErr } = await adminClient.from("workers").insert({
          profile_id: authUserId,
          federation_id: config.id,
          member_id: memberId,
          date_of_birth: "1990-05-15",
          gender: wIdx % 4 === 0 ? "FEMALE" : "MALE",
          registration_type: "FEDERATION_TRANSFER",
          account_status: "ACTIVE",
          availability_status: status,
          verification_status: "verified",
          profession,
          hourly_rate: 350 + (wIdx % 3) * 50,
          experience_years: 4 + (wIdx % 8),
          created_at: new Date(Date.now() - 110 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        }).select().single();

        if (wInsErr || !insertedWorker) {
          console.error(`Worker insert failed for ${wName}:`, wInsErr);
          continue;
        }
        workerId = insertedWorker.id;
      }

      workerIds.push(workerId);
    }
    console.log(`  ✅ ${workerIds.length} workers registered and availability initialized.`);

    // B. Seed Bookings, Invoices, Payments, Reviews
    console.log(`  -> Seeding ${config.totalBookings} historical operational bookings...`);
    const inProgressCount = config.totalBookings - config.completedBookings - config.cancelledBookings;

    for (let bIdx = 0; bIdx < config.totalBookings; bIdx++) {
      const bId = `00000007-${String(cIdx + 1).padStart(4, "0")}-6000-8000-${String(bIdx + 1).padStart(12, "0")}`;
      const customer = customerList[bIdx % customerList.length];
      const addressId = addressByCustomer.get(customer.id) || fallbackAddressId;
      const workerId = workerIds[bIdx % workerIds.length];
      const service = serviceList[bIdx % serviceList.length];

      // Determine status
      let bookingStatus = "BOOKING_COMPLETED";
      if (bIdx < config.cancelledBookings) {
        bookingStatus = "CANCELLED";
      } else if (bIdx >= config.totalBookings - inProgressCount) {
        bookingStatus = bIdx % 2 === 0 ? "SERVICE_STARTED" : "ON_THE_WAY";
      }

      const daysAgo = bookingStatus === "SERVICE_STARTED" || bookingStatus === "ON_THE_WAY"
        ? 0.2 + (bIdx * 0.1)
        : 5 + Math.floor((bIdx * 50) / config.totalBookings);

      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const actualEnd = new Date(Date.now() - daysAgo * 86400000 + 75 * 60000).toISOString();
      const amount = 650 + (bIdx % 5) * 150;
      const platformFee = Math.round(amount * 0.1);
      const workerEarnings = amount - platformFee;

      // Upsert booking
      await (adminClient.from("bookings") as any).upsert({
        id: bId,
        booking_number: `BK-${config.prefix}-${String(bIdx + 1001).padStart(5, "0")}`,
        customer_id: customer.id,
        worker_id: bookingStatus === "CANCELLED" && bIdx % 2 === 0 ? null : workerId,
        federation_id: config.id,
        service_id: service.id,
        address_id: addressId,
        status: bookingStatus,
        problem_description: `Cooperative standard maintenance request in ${config.city}`,
        total_amount: amount,
        platform_fee: platformFee,
        worker_earnings: workerEarnings,
        scheduled_start_at: createdAt,
        scheduled_end_at: actualEnd,
        created_at: createdAt,
        updated_at: actualEnd,
      });

      // If completed, upsert matching invoice, payment, review
      if (bookingStatus === "BOOKING_COMPLETED") {
        const invId = `00000007-${String(cIdx + 1).padStart(4, "0")}-7000-8000-${String(bIdx + 1).padStart(12, "0")}`;
        await (adminClient.from("invoices") as any).upsert({
          id: invId,
          invoice_number: `INV-${config.prefix}-${String(bIdx + 2001).padStart(5, "0")}`,
          booking_id: bId,
          customer_id: customer.id,
          federation_id: config.id,
          subtotal: workerEarnings,
          platform_fee: platformFee,
          tax_amount: Math.round(amount * 0.05),
          total_amount: amount + Math.round(amount * 0.05),
          status: "PAID",
          issue_date: createdAt,
          due_date: actualEnd,
          paid_at: actualEnd,
          created_at: createdAt,
          updated_at: actualEnd,
        });

        const payId = `00000007-${String(cIdx + 1).padStart(4, "0")}-8000-8000-${String(bIdx + 1).padStart(12, "0")}`;
        await (adminClient.from("payments") as any).upsert({
          id: payId,
          payment_number: `PAY-${config.prefix}-${String(bIdx + 3001).padStart(5, "0")}`,
          invoice_id: invId,
          booking_id: bId,
          customer_id: customer.id,
          amount: amount + Math.round(amount * 0.05),
          status: "PAID",
          gateway_provider: "razorpay",
          paid_at: actualEnd,
          created_at: actualEnd,
          updated_at: actualEnd,
        });

        // Review to match target rating
        // E.g. for target 4.10: 70% 4-star, 20% 5-star, 10% 3-star
        let revRating = 4;
        if (bIdx % 5 === 0) revRating = 5;
        else if (bIdx % 7 === 0) revRating = 3;
        else if (bIdx % 11 === 0 && config.targetRating < 4.0) revRating = 2;

        const revId = `00000007-${String(cIdx + 1).padStart(4, "0")}-9000-8000-${String(bIdx + 1).padStart(12, "0")}`;
        await (adminClient.from("reviews") as any).upsert({
          id: revId,
          booking_id: bId,
          customer_id: customer.id,
          worker_id: workerId,
          rating: revRating,
          comment: `Reliable professional cooperative service in ${config.city}.`,
          created_at: new Date(Date.parse(actualEnd) + 3600000).toISOString(),
        });
      }
    }
    console.log(`  ✅ Bookings, invoices, payments, and reviews seeded for ${config.name}.`);
  }

  console.log("\n================================================================");
  console.log("🎉 ALL MULTI-FEDERATION OPERATIONS APPLIED SUCCESSFULLY!");
  console.log("================================================================");
}

main().catch((err) => {
  console.error("Fatal seeding error:", err);
  process.exit(1);
});
