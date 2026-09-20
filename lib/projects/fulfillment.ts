/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";

export interface RequirementFulfillment {
  projectId: string;
  requirementId: string | null;
  requiredWorkers: number;
  fulfilledWorkers: number;
  remainingWorkers: number;
  isFull: boolean;
  statusText: string;
}

/**
 * Authoritative Server-Side Worker Requirement Fulfillment Calculation.
 * Reads project_requirements and project_allocations via Admin Client to bypass client-side RLS limits.
 */
export async function getProjectRequirementFulfillment(
  identifier: string
): Promise<RequirementFulfillment> {
  const admin = createAdminClient();

  // 1. Resolve requirement and project IDs
  let projectId = identifier;
  let requirementId: string | null = null;

  // Check if identifier is a requirement_id
  const { data: reqById } = await (admin.from("project_requirements") as any)
    .select("id, project_request_id, required_workers_count")
    .eq("id", identifier)
    .maybeSingle();

  if (reqById) {
    requirementId = reqById.id;
    projectId = reqById.project_request_id;
  }

  // Fetch all requirements for the resolved project
  const { data: reqs } = await (admin.from("project_requirements") as any)
    .select("id, required_workers_count")
    .eq("project_request_id", projectId);

  if (reqs && reqs.length > 0) {
    if (!requirementId) {
      requirementId = reqs[0].id;
    }
  }

  // Fetch project request details for worker count fallback
  const { data: proj } = await (admin.from("project_requests") as any)
    .select("id, description")
    .eq("id", projectId)
    .maybeSingle();

  let requiredWorkers = 5;
  const workersMatch = proj?.description?.match(/\[Workers\]:\s*(\d+)/);
  if (workersMatch) {
    requiredWorkers = Number(workersMatch[1]);
  } else if (reqs && reqs.length > 0) {
    requiredWorkers = Number(reqs[0].required_workers_count) || 5;
  }
  if (!requiredWorkers || requiredWorkers < 1) requiredWorkers = 5;

  // Collect requirement IDs to query allocations
  const reqIds = (reqs || []).map((r: any) => r.id);
  if (requirementId && !reqIds.includes(requirementId)) {
    reqIds.push(requirementId);
  }

  // 2. Fetch allocations from database using admin client
  let queryOr = `project_request_id.eq.${projectId}`;
  if (reqIds.length > 0) {
    queryOr += `,requirement_id.in.(${reqIds.join(",")})`;
  }

  const { data: allocs, error: allocErr } = await (admin.from("project_allocations") as any)
    .select("id, status, worker_id, requirement_id, project_request_id")
    .or(queryOr);

  if (allocErr) {
    console.error("getProjectRequirementFulfillment query error:", allocErr);
  }

  const validAllocations = (allocs || []).filter(
    (a: any) =>
      a.status === "assigned" ||
      a.status === "ACCEPTED"
  );

  const fulfilledWorkers = validAllocations.length;
  const remainingWorkers = Math.max(0, requiredWorkers - fulfilledWorkers);
  const isFull = fulfilledWorkers >= requiredWorkers;

  return {
    projectId,
    requirementId,
    requiredWorkers,
    fulfilledWorkers,
    remainingWorkers,
    isFull,
    statusText: isFull ? "FULL" : remainingWorkers === 1 ? "1 Needed" : `${remainingWorkers} Needed`,
  };
}

/**
 * Returns a map of projectId -> RequirementFulfillment for all given project IDs or all active projects.
 */
export async function getBatchProjectsFulfillment(
  projectIds?: string[]
): Promise<Record<string, RequirementFulfillment>> {
  const admin = createAdminClient();

  // 1. Fetch requirements
  let reqQuery = admin.from("project_requirements").select("id, project_request_id, required_workers_count");
  if (projectIds && projectIds.length > 0) {
    reqQuery = reqQuery.in("project_request_id", projectIds);
  }
  const { data: reqs } = await (reqQuery as any);
  const reqList = reqs || [];
  const allReqIds = reqList.map((r: any) => r.id).filter(Boolean);

  // 2. Fetch all allocations
  let allocQuery = admin.from("project_allocations").select("id, project_request_id, requirement_id, status");
  if (projectIds && projectIds.length > 0) {
    let orCond = `project_request_id.in.(${projectIds.join(",")})`;
    if (allReqIds.length > 0) {
      orCond += `,requirement_id.in.(${allReqIds.join(",")})`;
    }
    allocQuery = allocQuery.or(orCond);
  }
  const { data: allocs, error: allocErr } = await (allocQuery as any);

  if (allocErr) {
    console.error("getBatchProjectsFulfillment query error:", allocErr);
  }

  // 3. Fetch project requests description for workers fallback
  let projQuery = admin.from("project_requests").select("id, description");
  if (projectIds && projectIds.length > 0) {
    projQuery = projQuery.in("id", projectIds);
  }
  const { data: projs } = await (projQuery as any);

  const result: Record<string, RequirementFulfillment> = {};

  const allProjectIds = new Set<string>();
  (projs || []).forEach((p: any) => allProjectIds.add(p.id));
  (reqs || []).forEach((r: any) => allProjectIds.add(r.project_request_id));
  if (projectIds) projectIds.forEach((id) => allProjectIds.add(id));

  for (const pid of allProjectIds) {
    const projReqs = (reqs || []).filter((r: any) => r.project_request_id === pid);
    const firstReq = projReqs[0];
    const reqId = firstReq ? firstReq.id : null;

    const projRecord = (projs || []).find((p: any) => p.id === pid);

    let requiredWorkers = 5;
    const workersMatch = projRecord?.description?.match(/\[Workers\]:\s*(\d+)/);
    if (workersMatch) {
      requiredWorkers = Number(workersMatch[1]);
    } else if (firstReq) {
      requiredWorkers = Number(firstReq.required_workers_count) || 5;
    }
    if (!requiredWorkers || requiredWorkers < 1) requiredWorkers = 5;

    const projReqIds = projReqs.map((r: any) => r.id);

    const projAllocs = (allocs || []).filter(
      (a: any) =>
        (a.project_request_id === pid || (a.requirement_id && projReqIds.includes(a.requirement_id))) &&
        (a.status === "assigned" || a.status === "ACCEPTED")
    );

    const fulfilledWorkers = projAllocs.length;
    const remainingWorkers = Math.max(0, requiredWorkers - fulfilledWorkers);
    const isFull = fulfilledWorkers >= requiredWorkers;

    result[pid] = {
      projectId: pid,
      requirementId: reqId,
      requiredWorkers,
      fulfilledWorkers,
      remainingWorkers,
      isFull,
      statusText: isFull ? "FULL" : remainingWorkers === 1 ? "1 Needed" : `${remainingWorkers} Needed`,
    };
  }

  return result;
}
