import { createAdminClient } from "../lib/supabase/admin";

async function testFulfillment() {
  const admin = createAdminClient();
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";

  // 1. Fetch requirements
  const { data: reqs } = await (admin.from("project_requirements") as any)
    .select("*")
    .eq("project_request_id", projectId);

  console.log("Requirements:", reqs);

  // 2. Fetch project_requests
  const { data: proj } = await (admin.from("project_requests") as any)
    .select("*")
    .eq("id", projectId)
    .single();

  let requiredWorkers = 5;
  if (reqs && reqs.length > 0) {
    requiredWorkers = Number(reqs[0].required_workers_count) || 5;
  } else if (proj?.description) {
    const workersMatch = proj.description.match(/\[Workers\]:\s*(\d+)/);
    if (workersMatch) requiredWorkers = Number(workersMatch[1]);
  }

  // 3. Fetch allocations
  const reqIds = (reqs || []).map((r: any) => r.id);
  const { data: allocs } = await (admin.from("project_allocations") as any)
    .select("*")
    .or(`project_request_id.eq.${projectId}${reqIds.length > 0 ? `,requirement_id.in.(${reqIds.join(",")})` : ""}`);

  console.log("All Allocations for project:", allocs);

  const validAllocations = (allocs || []).filter(
    (a: any) => a.status === "assigned" || a.status === "ACCEPTED" || a.response_status === "ACCEPTED"
  );

  const fulfilledWorkers = validAllocations.length;
  const remainingWorkers = Math.max(0, requiredWorkers - fulfilledWorkers);
  const isFull = fulfilledWorkers >= requiredWorkers;

  console.log("Fulfillment Calculation:", {
    projectId,
    requiredWorkers,
    fulfilledWorkers,
    remainingWorkers,
    isFull,
    statusText: isFull ? "FULL / CLOSED / READY" : `NEEDS ${remainingWorkers}`,
  });
}

testFulfillment().catch(console.error);
