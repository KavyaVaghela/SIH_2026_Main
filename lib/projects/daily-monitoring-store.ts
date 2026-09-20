/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoredDailyUpdate {
  id: string;
  project_request_id: string;
  worker_id: string;
  worker_name?: string;
  work_date: string;
  work_description: string;
  progress_percentage: number;
  labor_charge: number;
  created_at: string;
  updated_at: string;
  media?: Array<{
    id: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    file_size?: number;
  }>;
  expenses?: Array<{
    id: string;
    description: string;
    amount: number;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    verified_amount?: number;
    verified_by?: string | null;
    verified_at?: string | null;
    notes?: string | null;
  }>;
}

export interface StoredWorkerCharge {
  id: string;
  project_request_id: string;
  daily_update_id: string;
  worker_id: string;
  charge_date: string;
  daily_rate: number;
  charge_amount: number;
  created_at: string;
}

export interface StoredCustomerQuery {
  id: string;
  project_request_id: string;
  customer_id: string;
  daily_update_id?: string | null;
  expense_id?: string | null;
  message: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  response?: string | null;
  responded_by?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredEstimateRevision {
  id: string;
  project_request_id: string;
  version: number;
  previous_amount: number;
  current_amount: number;
  difference_amount: number;
  revision_reason: string | null;
  status: "PENDING_CUSTOMER_CONFIRMATION" | "APPROVED" | "DECLINED";
  customer_response: "PENDING" | "APPROVED" | "DECLINED";
  customer_responded_at?: string | null;
  notes?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface LocalStoreState {
  updates: Record<string, StoredDailyUpdate[]>;
  charges: Record<string, StoredWorkerCharge[]>;
  expenses: Record<string, any[]>;
  queries: Record<string, StoredCustomerQuery[]>;
  revisions: Record<string, StoredEstimateRevision[]>;
}

const STORE_PATH = path.join(process.cwd(), "scratch", "daily_monitoring_store.json");

function ensureStoreDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
}

function readLocalStore(): LocalStoreState {
  ensureStoreDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      return {
        updates: parsed.updates || {},
        charges: parsed.charges || {},
        expenses: parsed.expenses || {},
        queries: parsed.queries || {},
        revisions: parsed.revisions || {},
      };
    }
  } catch (e) {
    console.warn("Could not read local monitoring store:", e);
  }
  return { updates: {}, charges: {}, expenses: {}, queries: {}, revisions: {} };
}

function writeLocalStore(store: LocalStoreState) {
  ensureStoreDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write local monitoring store:", e);
  }
}

export async function getDailyMonitoringData(projectId: string) {
  const admin = createAdminClient();
  let dailyUpdates: any[] = [];
  let workerCharges: any[] = [];
  let allExpenses: any[] = [];
  let customerQueries: any[] = [];
  let usedRemote = false;

  // 1. Try querying remote DB tables
  try {
    const { data: updData, error: updErr } = await (admin.from("project_daily_updates") as any)
      .select(`
        *,
        media:project_daily_update_media(*),
        expenses:project_expenses(*),
        worker:workers(id, profession, hourly_rate, profiles(id, full_name, phone, email))
      `)
      .eq("project_request_id", projectId)
      .order("created_at", { ascending: false });

    if (!updErr && updData && updData.length > 0) {
      dailyUpdates = updData;
      usedRemote = true;
    }
  } catch {}

  if (usedRemote) {
    try {
      const { data: charges } = await (admin.from("project_worker_daily_charges") as any)
        .select("*")
        .eq("project_request_id", projectId);
      if (charges) workerCharges = charges;
    } catch {}

    try {
      const { data: exps } = await (admin.from("project_expenses") as any)
        .select("*")
        .eq("project_request_id", projectId);
      if (exps) allExpenses = exps;
    } catch {}

    try {
      const { data: queries } = await (admin.from("project_customer_queries") as any)
        .select("*")
        .eq("project_request_id", projectId);
      if (queries) customerQueries = queries;
    } catch {}
  } else {
    // 2. Read from persistent local fallback store
    const store = readLocalStore();
    dailyUpdates = store.updates[projectId] || [];
    workerCharges = store.charges[projectId] || [];
    allExpenses = store.expenses[projectId] || [];
    customerQueries = store.queries[projectId] || [];
  }

  // Compute Financial Summary
  const totalWorkerLabourCost = workerCharges.reduce((acc, c) => acc + Number(c.charge_amount || 0), 0);

  const verifiedExpenses = allExpenses.filter((e) => e.status === "VERIFIED");
  const pendingExpenses = allExpenses.filter((e) => e.status === "PENDING");
  const rejectedExpenses = allExpenses.filter((e) => e.status === "REJECTED");

  const totalVerifiedMaterialExpense = verifiedExpenses.reduce(
    (acc, e) => acc + Number(e.verified_amount !== null && e.verified_amount !== undefined ? e.verified_amount : e.amount || 0),
    0
  );
  const totalPendingMaterialExpense = pendingExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const totalVerifiedExecutionCost = totalWorkerLabourCost + totalVerifiedMaterialExpense;
  const latestProgress = dailyUpdates.length > 0 ? Math.max(...dailyUpdates.map((u) => Number(u.progress_percentage || 0))) : 0;

  return {
    dailyUpdates,
    workerCharges,
    expenses: allExpenses,
    customerQueries,
    summary: {
      totalWorkerLabourCost,
      totalVerifiedMaterialExpense,
      totalPendingMaterialExpense,
      totalVerifiedExecutionCost,
      verifiedExpensesCount: verifiedExpenses.length,
      pendingExpensesCount: pendingExpenses.length,
      rejectedExpensesCount: rejectedExpenses.length,
      totalUpdatesCount: dailyUpdates.length,
      latestProgress,
    },
  };
}

export async function getProjectActualCost(projectId: string): Promise<number> {
  const data = await getDailyMonitoringData(projectId);
  return data.summary.totalVerifiedExecutionCost;
}

export async function getBatchProjectsActualCost(projectIds: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (!projectIds || projectIds.length === 0) return result;

  await Promise.all(
    projectIds.map(async (pid) => {
      try {
        const data = await getDailyMonitoringData(pid);
        result[pid] = data.summary.totalVerifiedExecutionCost;
      } catch {
        result[pid] = 0;
      }
    })
  );

  return result;
}

export async function saveDailyUpdate(params: {
  projectId: string;
  workerId: string;
  workDate?: string;
  workDescription: string;
  progressPercentage: number;
  photoUrl?: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  expenseDescription?: string;
  expenseAmount?: number;
}) {
  const {
    projectId,
    workerId,
    workDate,
    workDescription,
    progressPercentage,
    photoUrl,
    storagePath,
    fileName,
    mimeType,
    fileSize,
    expenseDescription,
    expenseAmount,
  } = params;

  const admin = createAdminClient();

  // Fetch project request to verify status and get daily rate
  const { data: proj } = await (admin.from("project_requests") as any)
    .select("id, status, description, total_budget")
    .eq("id", projectId)
    .maybeSingle();

  // Resolve daily rate from project description [Daily Rate]: (\d+) or default 900
  const dailyRateMatch = proj?.description?.match(/\[Daily Rate\]:\s*(\d+)/);
  const agreedDailyRate = dailyRateMatch ? Number(dailyRateMatch[1]) : 900;

  // Resolve worker name
  let workerName = "Ravi Patel";
  try {
    const { data: wRow } = await (admin.from("workers") as any)
      .select("id, profiles(full_name)")
      .eq("id", workerId)
      .maybeSingle();
    if (wRow?.profiles?.full_name) workerName = wRow.profiles.full_name;
  } catch {}

  const targetDate = workDate ? workDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const progressVal = Math.min(100, Math.max(0, Number(progressPercentage || 0)));

  const store = readLocalStore();
  if (!store.updates[projectId]) store.updates[projectId] = [];
  if (!store.charges[projectId]) store.charges[projectId] = [];
  if (!store.expenses[projectId]) store.expenses[projectId] = [];

  // Check if update exists for this date/worker to prevent duplicates
  const existingUpd = store.updates[projectId].find(
    (u) => u.worker_id === workerId && (u.work_date || "").slice(0, 10) === targetDate
  );

  const updateId = existingUpd ? existingUpd.id : `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const mediaList = photoUrl || storagePath
    ? [
        {
          id: `media-${Date.now()}`,
          storage_path: storagePath || photoUrl || "",
          file_name: fileName || "proof_photo.jpg",
          mime_type: mimeType || "image/jpeg",
          file_size: fileSize || 0,
        },
      ]
    : existingUpd?.media || [];

  const parsedExpense = Number(expenseAmount || 0);
  let createdExpenseObj: any = null;

  if (parsedExpense > 0) {
    const expId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    createdExpenseObj = {
      id: expId,
      project_request_id: projectId,
      daily_update_id: updateId,
      worker_id: workerId,
      worker_name: workerName,
      expense_date: targetDate,
      description: expenseDescription || `Material Expense for ${targetDate}`,
      amount: parsedExpense,
      status: "PENDING",
      verified_amount: 0,
      created_at: nowIso,
      updated_at: nowIso,
    };
    store.expenses[projectId].unshift(createdExpenseObj);
  }

  const updateObj: StoredDailyUpdate = {
    id: updateId,
    project_request_id: projectId,
    worker_id: workerId,
    worker_name: workerName,
    work_date: targetDate,
    work_description: workDescription.trim(),
    progress_percentage: progressVal,
    labor_charge: agreedDailyRate,
    media: mediaList,
    expenses: createdExpenseObj ? [createdExpenseObj] : existingUpd?.expenses || [],
    created_at: existingUpd ? existingUpd.created_at : nowIso,
    updated_at: nowIso,
  };

  if (existingUpd) {
    const idx = store.updates[projectId].findIndex((u) => u.id === existingUpd!.id);
    store.updates[projectId][idx] = updateObj;
  } else {
    store.updates[projectId].unshift(updateObj);
  }

  // Check worker charge uniqueness: (project_request_id, worker_id, charge_date)
  const existingCharge = store.charges[projectId].find(
    (c) => c.worker_id === workerId && (c.charge_date || "").slice(0, 10) === targetDate
  );

  if (!existingCharge) {
    const chargeObj: StoredWorkerCharge = {
      id: `chg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_request_id: projectId,
      daily_update_id: updateId,
      worker_id: workerId,
      charge_date: targetDate,
      daily_rate: agreedDailyRate,
      charge_amount: agreedDailyRate,
      created_at: nowIso,
    };
    store.charges[projectId].unshift(chargeObj);
  }

  writeLocalStore(store);

  // Try writing to remote DB tables as well (if created)
  try {
    await (admin.from("project_daily_updates") as any).upsert({
      id: updateId,
      project_request_id: projectId,
      worker_id: workerId,
      work_date: targetDate,
      work_description: workDescription.trim(),
      progress_percentage: progressVal,
      created_at: nowIso,
      updated_at: nowIso,
    });
  } catch {}

  return {
    dailyUpdate: updateObj,
    expense: createdExpenseObj,
  };
}

export async function verifyExpense(params: {
  expenseId: string;
  status: "VERIFIED" | "REJECTED" | "PENDING";
  verifiedAmount?: number;
  verifiedBy?: string;
  notes?: string;
}) {
  const { expenseId, status, verifiedAmount, verifiedBy, notes } = params;
  const store = readLocalStore();
  const nowIso = new Date().toISOString();

  let targetExpense: any = null;
  let targetProjectId = "";

  for (const pid of Object.keys(store.expenses)) {
    const exp = store.expenses[pid].find((e) => e.id === expenseId);
    if (exp) {
      targetExpense = exp;
      targetProjectId = pid;
      break;
    }
  }

  if (targetExpense) {
    const approvedAmt = status === "VERIFIED"
      ? (verifiedAmount !== undefined && verifiedAmount !== null ? Number(verifiedAmount) : Number(targetExpense.amount || 0))
      : 0;

    targetExpense.status = status;
    targetExpense.verified_amount = approvedAmt;
    targetExpense.verified_by = verifiedBy || null;
    targetExpense.verified_at = nowIso;
    targetExpense.notes = notes || null;
    targetExpense.updated_at = nowIso;

    // Update in daily updates expense sub-object as well
    if (store.updates[targetProjectId]) {
      for (const u of store.updates[targetProjectId]) {
        if (u.expenses) {
          const subExp = u.expenses.find((e: any) => e.id === expenseId);
          if (subExp) {
            subExp.status = status;
            subExp.verified_amount = approvedAmt;
            subExp.notes = notes || null;
          }
        }
      }
    }

    writeLocalStore(store);
  }

  const admin = createAdminClient();
  try {
    await (admin.from("project_expenses") as any)
      .update({
        status,
        verified_amount: targetExpense?.verified_amount || 0,
        verified_by: verifiedBy || null,
        verified_at: nowIso,
        notes: notes || null,
        updated_at: nowIso,
      })
      .eq("id", expenseId);
  } catch {}

  const summary = targetProjectId ? (await getDailyMonitoringData(targetProjectId)).summary : null;

  return {
    expense: targetExpense,
    financials: summary,
  };
}

export async function createCustomerQuery(params: {
  projectId: string;
  customerId: string;
  dailyUpdateId?: string;
  expenseId?: string;
  message: string;
}) {
  const { projectId, customerId, dailyUpdateId, expenseId, message } = params;
  const store = readLocalStore();
  if (!store.queries[projectId]) store.queries[projectId] = [];

  const queryId = `qry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const queryObj: StoredCustomerQuery = {
    id: queryId,
    project_request_id: projectId,
    customer_id: customerId,
    daily_update_id: dailyUpdateId,
    expense_id: expenseId,
    message: message.trim(),
    status: "OPEN",
    created_at: nowIso,
    updated_at: nowIso,
  };

  store.queries[projectId].unshift(queryObj);
  writeLocalStore(store);

  const admin = createAdminClient();
  try {
    await (admin.from("project_customer_queries") as any).insert(queryObj);
  } catch {}

  return queryObj;
}

export async function respondToCustomerQuery(params: {
  queryId: string;
  response: string;
  respondedBy?: string;
  status?: "RESOLVED" | "CLOSED";
}) {
  const { queryId, response, respondedBy, status = "RESOLVED" } = params;
  const store = readLocalStore();
  const nowIso = new Date().toISOString();

  let targetQuery: StoredCustomerQuery | null = null;
  for (const pid of Object.keys(store.queries)) {
    const q = store.queries[pid].find((item) => item.id === queryId);
    if (q) {
      q.response = response.trim();
      q.status = status;
      q.responded_by = respondedBy;
      q.responded_at = nowIso;
      q.updated_at = nowIso;
      targetQuery = q;
      break;
    }
  }

  writeLocalStore(store);

  const admin = createAdminClient();
  try {
    await (admin.from("project_customer_queries") as any)
      .update({
        response: response.trim(),
        status,
        responded_by: respondedBy || null,
        responded_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", queryId);
  } catch {}

  return targetQuery;
}

export async function getProjectEstimateRevisions(projectId: string): Promise<StoredEstimateRevision[]> {
  const store = readLocalStore();
  const localRevs = store.revisions[projectId] || [];

  const admin = createAdminClient();
  try {
    const { data: dbRevs } = await (admin.from("project_estimate_revisions") as any)
      .select("*")
      .eq("project_request_id", projectId)
      .order("version", { ascending: false });

    if (dbRevs && dbRevs.length > 0) {
      // Merge db records with local records to ensure complete history
      const mergedMap = new Map<string, StoredEstimateRevision>();
      localRevs.forEach((r) => mergedMap.set(r.id, r));
      dbRevs.forEach((r: any) => {
        mergedMap.set(r.id, {
          id: r.id,
          project_request_id: r.project_request_id,
          version: Number(r.version || 1),
          previous_amount: Number(r.previous_amount || 0),
          current_amount: Number(r.current_amount || 0),
          difference_amount: Number(r.difference_amount || 0),
          revision_reason: r.revision_reason || null,
          status: (r.status || (r.customer_response === "APPROVED" ? "APPROVED" : r.customer_response === "DECLINED" ? "DECLINED" : "PENDING_CUSTOMER_CONFIRMATION")) as any,
          customer_response: (r.customer_response || "PENDING") as any,
          customer_responded_at: r.customer_responded_at || null,
          notes: r.notes || null,
          created_by: r.created_by || null,
          created_at: r.created_at,
          updated_at: r.updated_at || r.created_at,
        });
      });
      return Array.from(mergedMap.values()).sort((a, b) => b.version - a.version);
    }
  } catch {}

  return localRevs.sort((a, b) => b.version - a.version);
}

export async function proposeEstimateRevision(params: {
  projectId: string;
  proposedAmount: number;
  previousAmount: number;
  reason: string;
  createdBy?: string;
}): Promise<StoredEstimateRevision> {
  const { projectId, proposedAmount, previousAmount, reason, createdBy } = params;
  const store = readLocalStore();
  if (!store.revisions[projectId]) store.revisions[projectId] = [];

  const currentVersion = store.revisions[projectId].length > 0
    ? Math.max(...store.revisions[projectId].map((r) => r.version))
    : 1;
  const newVersion = currentVersion + 1;
  const nowIso = new Date().toISOString();
  const revId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const revObj: StoredEstimateRevision = {
    id: revId,
    project_request_id: projectId,
    version: newVersion,
    previous_amount: previousAmount,
    current_amount: proposedAmount,
    difference_amount: proposedAmount - previousAmount,
    revision_reason: reason.trim(),
    status: "PENDING_CUSTOMER_CONFIRMATION",
    customer_response: "PENDING",
    created_by: createdBy || "Federation Admin",
    created_at: nowIso,
    updated_at: nowIso,
  };

  store.revisions[projectId].unshift(revObj);
  writeLocalStore(store);

  const admin = createAdminClient();
  try {
    await (admin.from("project_estimate_revisions") as any).insert({
      id: revId,
      project_request_id: projectId,
      version: newVersion,
      previous_amount: previousAmount,
      current_amount: proposedAmount,
      difference_amount: proposedAmount - previousAmount,
      revision_reason: reason.trim(),
      customer_response: "PENDING",
      created_by: createdBy || "Federation Admin",
      created_at: nowIso,
    });
  } catch {}

  return revObj;
}

export async function confirmEstimateRevision(params: {
  projectId: string;
  revisionId: string;
}): Promise<{ success: boolean; revision: StoredEstimateRevision | null }> {
  const { projectId, revisionId } = params;
  const store = readLocalStore();
  const nowIso = new Date().toISOString();

  let targetRev: StoredEstimateRevision | null = null;
  if (store.revisions[projectId]) {
    const r = store.revisions[projectId].find((item) => item.id === revisionId);
    if (r) {
      r.status = "APPROVED";
      r.customer_response = "APPROVED";
      r.customer_responded_at = nowIso;
      r.updated_at = nowIso;
      targetRev = r;
    }
  }

  writeLocalStore(store);

  const admin = createAdminClient();
  try {
    await (admin.from("project_estimate_revisions") as any)
      .update({
        customer_response: "APPROVED",
        customer_responded_at: nowIso,
      })
      .eq("id", revisionId);
  } catch {}

  return { success: !!targetRev, revision: targetRev };
}

export async function declineEstimateRevision(params: {
  projectId: string;
  revisionId: string;
  reason?: string;
}): Promise<{ success: boolean; revision: StoredEstimateRevision | null }> {
  const { projectId, revisionId, reason } = params;
  const store = readLocalStore();
  const nowIso = new Date().toISOString();

  let targetRev: StoredEstimateRevision | null = null;
  if (store.revisions[projectId]) {
    const r = store.revisions[projectId].find((item) => item.id === revisionId);
    if (r) {
      r.status = "DECLINED";
      r.customer_response = "DECLINED";
      r.customer_responded_at = nowIso;
      r.notes = reason || null;
      r.updated_at = nowIso;
      targetRev = r;
    }
  }

  writeLocalStore(store);

  const admin = createAdminClient();
  try {
    await (admin.from("project_estimate_revisions") as any)
      .update({
        customer_response: "DECLINED",
        customer_responded_at: nowIso,
        notes: reason || null,
      })
      .eq("id", revisionId);
  } catch {}

  return { success: !!targetRev, revision: targetRev };
}

