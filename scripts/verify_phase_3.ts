import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runPhase3EndToEndVerification() {
  console.log("=================================================");
  console.log("RUNNING PHASE 3 END-TO-END VERIFICATION TEST SUITE");
  console.log("=================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests}: ${name}`);
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${name} ${details ? `(${details})` : ""}`);
    }
  }

  try {
    // 1. Fetch live test project
    console.log("\n--- TEST 1: Retrieve Live Test Project Request ---");
    const { data: testProjects, error: fetchErr } = await (supabase.from("project_requests") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    assertTest("Live project_requests table query succeeds", !fetchErr && !!testProjects && testProjects.length > 0, fetchErr?.message);
    if (!testProjects || testProjects.length === 0) {
      console.error("No project requests available to test.");
      return;
    }

    const testProj = testProjects[0];
    console.log(`Using Test Project ID: ${testProj.id} ("${testProj.project_name}")`);

    // 2. Allocate Worker to project_allocations
    console.log("\n--- TEST 2: Allocate Worker to Project Allocations Table ---");
    const testWorkerId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
    const { data: reqData } = await (supabase.from("project_requirements") as any)
      .select("*")
      .eq("project_request_id", testProj.id);

    const reqId = reqData && reqData.length > 0 ? reqData[0].id : testProj.id;

    const { error: allocErr } = await (supabase.from("project_allocations") as any)
      .insert({
        project_request_id: testProj.id,
        requirement_id: reqId,
        worker_id: testWorkerId,
        status: "assigned",
      })
      .select();

    assertTest("Worker allocation record inserted into database", !allocErr || allocErr.code === "23505", allocErr?.message);

    // 3. Test Progress Checkpoint Update
    console.log("\n--- TEST 3: Project Progress Update (0-100%) ---");
    const progressVal = 65;
    const { data: updatedProj, error: progErr } = await (supabase.from("project_requests") as any)
      .select("*")
      .eq("id", testProj.id)
      .single();

    assertTest("Project request query succeeds", !progErr && !!updatedProj, progErr?.message);

    let updatedDesc = updatedProj?.description || "";
    if (updatedDesc.includes("[Progress]:")) {
      updatedDesc = updatedDesc.replace(/\[Progress\]:\s*\d+%/, `[Progress]: ${progressVal}%`);
    } else {
      updatedDesc += `\n[Progress]: ${progressVal}%`;
    }

    const { data: patchResult, error: patchErr } = await (supabase.from("project_requests") as any)
      .update({ description: updatedDesc, status: "IN_PROGRESS" })
      .eq("id", testProj.id)
      .select()
      .single();

    assertTest("Project progress percentage updated to 65% in database", !patchErr && patchResult?.description?.includes("[Progress]: 65%"), patchErr?.message);

    // 4. Test Demo Payment Persistence (Part B Bridge)
    console.log("\n--- TEST 4: Demo Payment Record Creation ---");
    const demoRef = `DEMO_PAYMENT_${Date.now()}_PH3`;
    let payDesc = patchResult?.description || "";
    payDesc += `\n[Payment]: ${demoRef} (₹25,000 PAID)`;

    const { data: payRecord, error: payErr } = await (supabase.from("project_requests") as any)
      .update({
        description: payDesc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testProj.id)
      .select()
      .single();

    assertTest("Demo payment record persisted cleanly in project ledger", !payErr && payRecord?.description?.includes(demoRef), payErr?.message);

    // 5. Test Project Completion Flow
    console.log("\n--- TEST 5: Project Completion Flow ---");
    let compDesc = payRecord?.description || "";
    if (compDesc.includes("[Progress]:")) {
      compDesc = compDesc.replace(/\[Progress\]:\s*\d+%/, "[Progress]: 100%");
    } else {
      compDesc += "\n[Progress]: 100%";
    }
    compDesc += `\n[Completed At]: ${new Date().toISOString()}`;

    const { data: completedProj, error: compErr } = await (supabase.from("project_requests") as any)
      .update({ status: "COMPLETED", description: compDesc })
      .eq("id", testProj.id)
      .select()
      .single();

    assertTest("Project completion status becomes COMPLETED with 100% progress", !compErr && completedProj?.status === "COMPLETED" && completedProj?.description?.includes("[Progress]: 100%"), compErr?.message);

    console.log("\n=================================================");
    console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED CLEANLY`);
    console.log("=================================================");
  } catch (err) {
    console.error("Verification error:", err);
  }
}

runPhase3EndToEndVerification();
