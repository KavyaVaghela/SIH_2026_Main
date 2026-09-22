/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";

// Persistence file location in project root
const PERSISTENCE_FILE_PATH = path.join(process.cwd(), ".emergency_persistence.json");

export interface EmergencyDataStore {
  incidents: Map<string, any>;
  teams: Map<string, any>;
  teamMembers: Map<string, any[]>;
  tasks: Map<string, any>;
  additionalRequests: Map<string, any>;
  verifications: Map<string, any>;
  checkIns: Map<string, any>;
  dispatchPool: Map<string, any>;
  auditLogs: Map<string, any[]>;
  supportRequests: Map<string, any>;
  escalationStages: Map<string, any>;
  timeRules: Map<string, any>;
}

declare global {
  // eslint-disable-next-line no-var
  var __EMERGENCY_GLOBAL_STORE__: EmergencyDataStore | undefined;
}

function initStore(): EmergencyDataStore {
  if (globalThis.__EMERGENCY_GLOBAL_STORE__) {
    return globalThis.__EMERGENCY_GLOBAL_STORE__;
  }

  const store: EmergencyDataStore = {
    incidents: new Map(),
    teams: new Map(),
    teamMembers: new Map(),
    tasks: new Map(),
    additionalRequests: new Map(),
    verifications: new Map(),
    checkIns: new Map(),
    dispatchPool: new Map(),
    auditLogs: new Map(),
    supportRequests: new Map(),
    escalationStages: new Map(),
    timeRules: new Map(),
  };

  // Load from disk if file exists
  try {
    if (fs.existsSync(PERSISTENCE_FILE_PATH)) {
      const raw = fs.readFileSync(PERSISTENCE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);

      if (parsed.incidents) {
        for (const [k, v] of Object.entries(parsed.incidents)) {
          store.incidents.set(k, v);
        }
      }
      if (parsed.teams) {
        for (const [k, v] of Object.entries(parsed.teams)) {
          const t = v as any;
          if (t && Array.isArray(t.members)) {
            const seen = new Set<string>();
            t.members = t.members.filter((m: any) => {
              if (!m.worker_id || seen.has(m.worker_id)) return false;
              seen.add(m.worker_id);
              return true;
            });
            t.accepted_worker_count = t.members.filter((m: any) => m.status !== "RELEASED" && m.status !== "NO_SHOW").length;
          }
          store.teams.set(k, t);
        }
      }
      if (parsed.teamMembers) {
        for (const [k, v] of Object.entries(parsed.teamMembers)) {
          const raw = v as any[];
          const seen = new Set<string>();
          const deduped = raw.filter((m: any) => {
            if (!m.worker_id || seen.has(m.worker_id)) return false;
            seen.add(m.worker_id);
            return true;
          });
          store.teamMembers.set(k, deduped);
        }
      }
      if (parsed.tasks) {
        for (const [k, v] of Object.entries(parsed.tasks)) {
          store.tasks.set(k, v);
        }
      }
      if (parsed.additionalRequests) {
        for (const [k, v] of Object.entries(parsed.additionalRequests)) {
          store.additionalRequests.set(k, v);
        }
      }
      if (parsed.verifications) {
        for (const [k, v] of Object.entries(parsed.verifications)) {
          store.verifications.set(k, v);
        }
      }
      if (parsed.checkIns) {
        for (const [k, v] of Object.entries(parsed.checkIns)) {
          store.checkIns.set(k, v);
        }
      }
      if (parsed.dispatchPool) {
        for (const [k, v] of Object.entries(parsed.dispatchPool)) {
          store.dispatchPool.set(k, v);
        }
      }
      if (parsed.auditLogs) {
        for (const [k, v] of Object.entries(parsed.auditLogs)) {
          store.auditLogs.set(k, v as any[]);
        }
      }
      if (parsed.supportRequests) {
        for (const [k, v] of Object.entries(parsed.supportRequests)) {
          store.supportRequests.set(k, v);
        }
      }
      if (parsed.escalationStages) {
        for (const [k, v] of Object.entries(parsed.escalationStages)) {
          store.escalationStages.set(k, v);
        }
      }
      if (parsed.timeRules) {
        for (const [k, v] of Object.entries(parsed.timeRules)) {
          store.timeRules.set(k, v);
        }
      }
    }
  } catch (err) {
    console.warn("Emergency persistence file hydration notice:", err);
  }

  globalThis.__EMERGENCY_GLOBAL_STORE__ = store;
  return store;
}

let saveDebounceTimer: NodeJS.Timeout | null = null;

function persistToDisk() {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(() => {
    try {
      const store = getStore();
      const serialized = {
        incidents: Object.fromEntries(store.incidents.entries()),
        teams: Object.fromEntries(store.teams.entries()),
        teamMembers: Object.fromEntries(store.teamMembers.entries()),
        tasks: Object.fromEntries(store.tasks.entries()),
        additionalRequests: Object.fromEntries(store.additionalRequests.entries()),
        verifications: Object.fromEntries(store.verifications.entries()),
        checkIns: Object.fromEntries(store.checkIns.entries()),
        dispatchPool: Object.fromEntries(store.dispatchPool.entries()),
        auditLogs: Object.fromEntries(store.auditLogs.entries()),
        supportRequests: Object.fromEntries(store.supportRequests.entries()),
        escalationStages: Object.fromEntries(store.escalationStages.entries()),
        timeRules: Object.fromEntries(store.timeRules.entries()),
      };

      fs.writeFileSync(PERSISTENCE_FILE_PATH, JSON.stringify(serialized, null, 2), "utf-8");
    } catch (err) {
      console.warn("Emergency persistence file write notice:", err);
    }
  }, 50);
}

export function getStore(): EmergencyDataStore {
  return initStore();
}

/**
 * Incident Store Helpers
 */
export function getStoredIncident(idOrEmergencyId: string): any | null {
  if (!idOrEmergencyId || typeof idOrEmergencyId !== "string") return null;
  const store = getStore();
  let found = store.incidents.get(idOrEmergencyId);
  if (found) return found;

  const needle = idOrEmergencyId.trim().toLowerCase();
  for (const inc of store.incidents.values()) {
    if (
      (inc.id && inc.id.toLowerCase() === needle) ||
      (inc.emergency_id && inc.emergency_id.toLowerCase() === needle)
    ) {
      return inc;
    }
  }

  // Fallback check: re-read disk if not found in memory
  try {
    if (fs.existsSync(PERSISTENCE_FILE_PATH)) {
      const raw = fs.readFileSync(PERSISTENCE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.incidents) {
        for (const [k, v] of Object.entries(parsed.incidents)) {
          store.incidents.set(k, v);
          const item = v as any;
          if (
            k === idOrEmergencyId ||
            (item.id && item.id.toLowerCase() === needle) ||
            (item.emergency_id && item.emergency_id.toLowerCase() === needle)
          ) {
            found = item;
          }
        }
      }
    }
  } catch {
    // Ignore disk re-read errors
  }

  return found || null;
}

export function setStoredIncident(record: any): void {
  const store = getStore();
  if (record.id) store.incidents.set(record.id, record);
  if (record.emergency_id) store.incidents.set(record.emergency_id, record);
  persistToDisk();
}

export function listStoredIncidents(): any[] {
  const store = getStore();
  const seen = new Set<string>();
  const list: any[] = [];
  for (const inc of store.incidents.values()) {
    if (inc.id && !seen.has(inc.id)) {
      seen.add(inc.id);
      list.push(inc);
    }
  }
  return list;
}

/**
 * Team Store Helpers
 */
export function getStoredTeam(teamIdOrIncidentId: string): any | null {
  if (!teamIdOrIncidentId || typeof teamIdOrIncidentId !== "string") return null;
  const store = getStore();
  const team = store.teams.get(teamIdOrIncidentId);
  if (team) return team;

  const needle = teamIdOrIncidentId.trim().toLowerCase();
  for (const t of store.teams.values()) {
    if (
      (t.id && t.id.toLowerCase() === needle) ||
      (t.incident_id && t.incident_id.toLowerCase() === needle)
    ) {
      return t;
    }
  }
  return null;
}

export function setStoredTeam(team: any): void {
  const store = getStore();
  if (team.id) store.teams.set(team.id, team);
  if (team.incident_id) store.teams.set(team.incident_id, team);
  persistToDisk();
}

export function getStoredTeamMembers(teamId: string): any[] {
  const store = getStore();
  return store.teamMembers.get(teamId) || [];
}

export function setStoredTeamMembers(teamId: string, members: any[]): void {
  const store = getStore();
  store.teamMembers.set(teamId, members);
  persistToDisk();
}

/**
 * Verification Store Helpers
 */
export function getStoredVerification(idOrTokenOrCodeOrIncidentId: string): any | null {
  if (!idOrTokenOrCodeOrIncidentId || typeof idOrTokenOrCodeOrIncidentId !== "string") return null;
  const store = getStore();
  const v = store.verifications.get(idOrTokenOrCodeOrIncidentId);
  if (v) return v;

  const needle = idOrTokenOrCodeOrIncidentId.trim().toLowerCase();
  for (const item of store.verifications.values()) {
    if (
      (item.id && item.id.toLowerCase() === needle) ||
      (item.incident_id && item.incident_id.toLowerCase() === needle) ||
      (item.verification_code && item.verification_code.toLowerCase() === needle) ||
      (item.verification_token && item.verification_token.toLowerCase() === needle)
    ) {
      return item;
    }
  }
  return null;
}

export function setStoredVerification(v: any): void {
  const store = getStore();
  if (v.id) store.verifications.set(v.id, v);
  if (v.incident_id) store.verifications.set(v.incident_id, v);
  if (v.verification_code) store.verifications.set(v.verification_code, v);
  if (v.verification_token) store.verifications.set(v.verification_token, v);
  persistToDisk();
}

export function getStoredCheckIn(key: string): any | null {
  const store = getStore();
  return store.checkIns.get(key) || null;
}

export function setStoredCheckIn(key: string, checkIn: any): void {
  const store = getStore();
  store.checkIns.set(key, checkIn);
  if (checkIn.id) store.checkIns.set(checkIn.id, checkIn);
  persistToDisk();
}

export function listStoredCheckIns(): any[] {
  const store = getStore();
  const seen = new Set<string>();
  const list: any[] = [];
  for (const c of store.checkIns.values()) {
    if (c.id && !seen.has(c.id)) {
      seen.add(c.id);
      list.push(c);
    }
  }
  return list;
}

/**
 * Task Store Helpers
 */
export function getStoredTask(taskId: string): any | null {
  const store = getStore();
  return store.tasks.get(taskId) || null;
}

export function setStoredTask(task: any): void {
  const store = getStore();
  if (task.id) store.tasks.set(task.id, task);
  persistToDisk();
}

export function listStoredTasks(): any[] {
  const store = getStore();
  const seen = new Set<string>();
  const list: any[] = [];
  for (const t of store.tasks.values()) {
    if (t.id && !seen.has(t.id)) {
      seen.add(t.id);
      list.push(t);
    }
  }
  return list;
}

export function getStoredAdditionalRequest(requestId: string): any | null {
  const store = getStore();
  return store.additionalRequests.get(requestId) || null;
}

export function setStoredAdditionalRequest(req: any): void {
  const store = getStore();
  if (req.id) store.additionalRequests.set(req.id, req);
  persistToDisk();
}

export function listStoredAdditionalRequests(): any[] {
  const store = getStore();
  const seen = new Set<string>();
  const list: any[] = [];
  for (const r of store.additionalRequests.values()) {
    if (r.id && !seen.has(r.id)) {
      seen.add(r.id);
      list.push(r);
    }
  }
  return list;
}

/**
 * Audit Log Helpers
 */
export function getStoredAuditLogs(incidentId: string): any[] {
  const store = getStore();
  return store.auditLogs.get(incidentId) || [];
}

export function addStoredAuditLog(incidentId: string, log: any): void {
  const store = getStore();
  const existing = store.auditLogs.get(incidentId) || [];
  existing.unshift(log);
  store.auditLogs.set(incidentId, existing);
  persistToDisk();
}

/**
 * Support Requests Helpers
 */
export function getStoredSupportRequest(requestId: string): any | null {
  const store = getStore();
  return store.supportRequests.get(requestId) || null;
}

export function setStoredSupportRequest(req: any): void {
  const store = getStore();
  if (req.id) store.supportRequests.set(req.id, req);
  persistToDisk();
}

export function listStoredSupportRequests(): any[] {
  const store = getStore();
  const seen = new Set<string>();
  const list: any[] = [];
  for (const s of store.supportRequests.values()) {
    if (s.id && !seen.has(s.id)) {
      seen.add(s.id);
      list.push(s);
    }
  }
  return list;
}

/**
 * Scaling & Time Rules Helpers
 */
export function getStoredEscalationStage(incidentId: string): any | null {
  const store = getStore();
  return store.escalationStages.get(incidentId) || null;
}

export function setStoredEscalationStage(incidentId: string, stage: any): void {
  const store = getStore();
  store.escalationStages.set(incidentId, stage);
  persistToDisk();
}

export function getStoredTimeRules(federationId: string): any | null {
  const store = getStore();
  return store.timeRules.get(federationId) || null;
}

export function setStoredTimeRules(federationId: string, rules: any): void {
  const store = getStore();
  store.timeRules.set(federationId, rules);
  persistToDisk();
}

/**
 * Dispatch Pool Helpers
 */
export function getStoredDispatch(dispatchId: string): any | null {
  const store = getStore();
  return store.dispatchPool.get(dispatchId) || null;
}

export function setStoredDispatch(dispatch: any): void {
  const store = getStore();
  if (dispatch.id) store.dispatchPool.set(dispatch.id, dispatch);
  persistToDisk();
}

export function listStoredDispatches(): any[] {
  const store = getStore();
  const seen = new Set<string>();
  const list: any[] = [];
  for (const d of store.dispatchPool.values()) {
    if (d.id && !seen.has(d.id)) {
      seen.add(d.id);
      list.push(d);
    }
  }
  return list;
}
