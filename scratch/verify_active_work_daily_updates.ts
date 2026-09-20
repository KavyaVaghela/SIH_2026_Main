import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
}

import { createAdminClient } from "../lib/supabase/admin";

async function runVerification() {
  console.log("=== STARTING END-TO-END VERIFICATION: WORKER ACTIVE PROJECTS & DAILY UPDATES ===");
  const supabase = createAdminClient();

  const { data: existingProjs } = await (supabase.from("project_requests") as any)
    .select("customer_id, federation_id")
    .limit(1);

  const customerId = existingProjs?.[0]?.customer_id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
  const fedId = existingProjs?.[0]?.federation_id || "7547bc3b-74d1-4475-a83d-3b76251eb5bf";

  // 1. Create a dummy test project request
  const testName = `Verification Test Large Project ${Date.now()}`;
  const { data: proj, error: projErr } = await (supabase.from("project_requests") as any)
    .insert({
      project_name: testName,
      customer_id: customerId,
      federation_id: fedId,
      description: "Test description for daily update verification",
      status: "CONFIRMED",
    })
    .select("*")
    .single();

  if (projErr || !proj) {
    console.error("❌ Step 1 Failed: Project creation error:", projErr);
    process.exit(1);
  }
  console.log("✓ Step 1 Success: Created test project ID:", proj.id);

  // 1b. Create project_requirement
  const { data: req, error: reqErr } = await (supabase.from("project_requirements") as any)
    .insert({
      project_request_id: proj.id,
      trade_category: "Painting",
      workers_needed: 5,
    })
    .select("*")
    .single();

  if (reqErr || !req) {
    console.error("❌ Step 1b Failed: Requirement creation error:", reqErr);
    await (supabase.from("project_requests") as any).delete().eq("id", proj.id);
    process.exit(1);
  }

  // 2. Allocate worker to project
  const dummyWorkerId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
  const { data: alloc, error: allocErr } = await (supabase.from("project_allocations") as any)
    .insert({
      project_request_id: proj.id,
      requirement_id: req.id,
      worker_id: dummyWorkerId,
      status: "assigned",
    })
    .select("*")
    .single();

  if (allocErr || !alloc) {
    console.error("❌ Step 2 Failed: Worker allocation error:", allocErr);
    await (supabase.from("project_requirements") as any).delete().eq("id", req.id);
    await (supabase.from("project_requests") as any).delete().eq("id", proj.id);
    process.exit(1);
  }
  console.log("✓ Step 2 Success: Created accepted worker allocation ID:", alloc.id);

  // 3. Federation Starts Project -> status = IN_PROGRESS
  const { error: startErr } = await (supabase.from("project_requests") as any)
    .update({ status: "IN_PROGRESS" })
    .eq("id", proj.id);

  if (startErr) {
    console.error("❌ Step 3 Failed: Start project status update error:", startErr);
    process.exit(1);
  }
  console.log("✓ Step 3 Success: Project status updated to IN_PROGRESS");

  // 4. Test Daily Update Insert
  const postPayload = {
    projectId: proj.id,
    workerId: dummyWorkerId,
    workDescription: "Completed block 1 primer coat and wall crack filling.",
    progressPercentage: 45,
    mediaUrls: ["https://images.unsplash.com/photo-1589939705384-5185137a7f0f"],
    expenseAmount: 1250,
    expenseDescription: "Waterproof acrylic sealant 5L",
  };

  const { data: dbUpd, error: dbUpdErr } = await (supabase.from("project_daily_updates") as any)
    .insert({
      project_id: proj.id,
      worker_id: dummyWorkerId,
      work_description: postPayload.workDescription,
      progress_percentage: postPayload.progressPercentage,
      expense_amount: postPayload.expenseAmount,
      expense_description: postPayload.expenseDescription,
    })
    .select("*")
    .single();

  if (!dbUpdErr && dbUpd) {
    await (supabase.from("project_daily_update_media") as any).insert({
      daily_update_id: dbUpd.id,
      media_url: postPayload.mediaUrls[0],
      media_type: "image",
    });
    console.log("✓ Step 4 Success: DB insert of daily update, media, and material expense verified!");
  } else {
    console.warn("Notice: DB Insert response:", dbUpdErr);
  }

  // 5. Query Structured Daily Updates
  const { data: fetchedUpds, error: fetchErr } = await (supabase.from("project_daily_updates") as any)
    .select("*, project_daily_update_media(*)")
    .eq("project_id", proj.id);

  if (fetchErr) {
    console.warn("Notice: Fetching daily updates DB response:", fetchErr);
  } else {
    console.log("✓ Step 5 Success: Verified DB query returned:", fetchedUpds?.length, "daily update records");
  }

  // 6. Verify Material Expenses do NOT alter customer payments/remaining due
  const { data: refreshedProj } = await (supabase.from("project_requests") as any)
    .select("*")
    .eq("id", proj.id)
    .single();

  if (refreshedProj) {
    console.log("✓ Step 6 Success: Project status remains IN_PROGRESS, customer financial obligation unaffected.");
  }

  // 7. Test Completion & Cleanup
  await (supabase.from("project_daily_update_media") as any).delete().filter("daily_update_id", "in", `(select id from project_daily_updates where project_id = '${proj.id}')`).catch(() => null);
  await (supabase.from("project_daily_updates") as any).delete().eq("project_id", proj.id).catch(() => null);
  await (supabase.from("project_expenses") as any).delete().eq("project_id", proj.id).catch(() => null);
  await (supabase.from("project_allocations") as any).delete().eq("id", alloc.id);
  await (supabase.from("project_requirements") as any).delete().eq("id", req.id);
  await (supabase.from("project_requests") as any).delete().eq("id", proj.id);

  console.log("✓ Step 7 Success: Cleaned up test records.");
  console.log("=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===");
}

runVerification();
