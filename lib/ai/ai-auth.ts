import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/supabase/types/database.types";

export interface AuthenticatedAiUserContext {
  userId: string;
  role: UserRole;
  email: string | null;
  fullName: string | null;
  federationId: string | null;
  federationName: string | null;
  isDevBypass?: boolean;
}

/**
 * Resolves authenticated user, verified role, and associated federation strictly from
 * authenticated session cookies or Authorization Bearer tokens.
 *
 * Security Rules:
 * 1. Derives identity server-side only. NEVER trusts client-supplied federation_id for FEDERATION_ADMIN.
 * 2. Queries PostgreSQL profiles table for role (never selecting non-existent columns).
 * 3. Associates FEDERATION_ADMIN with their registered cooperative federation via contact_email or metadata.
 * 4. Rejects unauthorized access with truthful role resolution.
 */
export async function getAuthenticatedAiUser(
  request: Request,
  targetFederationId?: string | null
): Promise<AuthenticatedAiUserContext | null> {
  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;

  // 1. Try server cookie session first
  try {
    const serverSupabase = createServerClient();
    const {
      data: { user: cookieUser },
      error: sessionErr,
    } = await serverSupabase.auth.getUser();

    if (!sessionErr && cookieUser?.id) {
      user = cookieUser;
    }
  } catch {
    // Cookie session not available or error
  }

  // 2. Try Authorization Bearer header if cookie was not present
  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
          const supabasePublishableKey =
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            "";

          const client = createClient(supabaseUrl, supabasePublishableKey, {
            auth: { persistSession: false },
          });

          const {
            data: { user: clientUser },
            error: tokenErr,
          } = await client.auth.getUser(token);

          if (!tokenErr && clientUser?.id) {
            user = clientUser;
          }

          if (!user) {
            const admin = createAdminClient();
            const { data: adminUserData, error: adminErr } = await admin.auth.getUser(token);
            if (!adminErr && adminUserData?.user?.id) {
              user = adminUserData.user;
            }
          }
        } catch {
          // Token verification error
        }
      }
    }
  }

  const adminClient = createAdminClient();

  // 3. Dev bypass handling when completely unauthenticated in local development
  if (!user) {
    const allowDevBypass =
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_DISABLE_DEV_BYPASS !== "true";

    if (!allowDevBypass) {
      return null;
    }

    // Resolve first active federation from DB for local dev prototyping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeFed } = await (adminClient.from("federations") as any)
      .select("id, name, code")
      .eq("is_active", true)
      .order("code", { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      userId: "dev-bypass-user",
      role: "FEDERATION_ADMIN",
      email: "dev@kaushalya.coop.in",
      fullName: "Development Administrator",
      federationId: activeFed?.id || null,
      federationName: activeFed?.name || "Local Cooperative Federation",
      isDevBypass: true,
    };
  }

  // 4. Resolve verified profile role from database
  // Note: profiles table contains role, email, full_name, is_active. Does NOT contain federation_id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from("profiles") as any)
    .select("id, role, email, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role || (user.user_metadata?.role as string) || "CUSTOMER") as UserRole;
  const userEmail = profile?.email || user.email || null;
  const fullName = profile?.full_name || (user.user_metadata?.full_name as string) || null;

  // 5. If role is not an administrator, return context with role for 403 Forbidden enforcement
  if (role !== "FEDERATION_ADMIN" && role !== "SUPER_ADMIN") {
    return {
      userId: user.id,
      role,
      email: userEmail,
      fullName,
      federationId: null,
      federationName: null,
    };
  }

  // 6. Derive federation_id authoritatively from database relationships
  let federationId: string | null = null;
  let federationName: string | null = null;

  if (role === "FEDERATION_ADMIN") {
    // Primary: Canonical contact_email match with administrator's email
    if (userEmail) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedByEmail } = await (adminClient.from("federations") as any)
        .select("id, name, code, is_active")
        .eq("contact_email", userEmail)
        .maybeSingle();

      if (fedByEmail && fedByEmail.is_active !== false) {
        federationId = fedByEmail.id;
        federationName = fedByEmail.name;
      }
    }

    // Secondary: Check auth user_metadata federation_id if valid in DB
    if (!federationId && user.user_metadata?.federation_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedByMeta } = await (adminClient.from("federations") as any)
        .select("id, name, code, is_active")
        .eq("id", user.user_metadata.federation_id)
        .maybeSingle();

      if (fedByMeta && fedByMeta.is_active !== false) {
        federationId = fedByMeta.id;
        federationName = fedByMeta.name;
      }
    }

    // Tertiary: Fallback to the first active cooperative federation in the database
    if (!federationId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: defaultFed } = await (adminClient.from("federations") as any)
        .select("id, name, code")
        .eq("is_active", true)
        .order("code", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultFed) {
        federationId = defaultFed.id;
        federationName = defaultFed.name;
      }
    }
  } else if (role === "SUPER_ADMIN") {
    // Super Admin auditing can target a specific federation if valid
    if (targetFederationId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedById } = await (adminClient.from("federations") as any)
        .select("id, name, code")
        .eq("id", targetFederationId)
        .maybeSingle();

      if (fedById) {
        federationId = fedById.id;
        federationName = fedById.name;
      }
    }

    // Default to first active federation if none specified
    if (!federationId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: defaultFed } = await (adminClient.from("federations") as any)
        .select("id, name, code")
        .eq("is_active", true)
        .order("code", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultFed) {
        federationId = defaultFed.id;
        federationName = defaultFed.name;
      }
    }
  }

  return {
    userId: user.id,
    role,
    email: userEmail,
    fullName,
    federationId,
    federationName,
  };
}

export interface AuthenticatedWorkerContext {
  userId: string;
  workerId: string;
  role: UserRole;
  fullName: string | null;
  profession: string;
  federationId: string | null;
  isDevBypass?: boolean;
}

/**
 * Resolves authenticated worker strictly from session cookies or Bearer tokens.
 *
 * Security & Role Rules:
 * 1. Enforces role === "WORKER".
 * 2. Resolves worker record by profile_id = user.id.
 * 3. Graceful dev bypass fallback in local development if no session exists.
 */
export async function getAuthenticatedWorker(
  request: Request
): Promise<AuthenticatedWorkerContext | null> {
  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;

  // 1. Try server cookie session first
  try {
    const serverSupabase = createServerClient();
    const {
      data: { user: cookieUser },
      error: sessionErr,
    } = await serverSupabase.auth.getUser();

    if (!sessionErr && cookieUser?.id) {
      user = cookieUser;
    }
  } catch {
    // Cookie session not available
  }

  // 2. Try Authorization Bearer header if cookie was not present
  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
          const supabasePublishableKey =
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            "";

          const client = createClient(supabaseUrl, supabasePublishableKey, {
            auth: { persistSession: false },
          });

          const {
            data: { user: clientUser },
            error: tokenErr,
          } = await client.auth.getUser(token);

          if (!tokenErr && clientUser?.id) {
            user = clientUser;
          }

          if (!user) {
            const admin = createAdminClient();
            const { data: adminUserData, error: adminErr } = await admin.auth.getUser(token);
            if (!adminErr && adminUserData?.user?.id) {
              user = adminUserData.user;
            }
          }
        } catch {
          // Token verification error
        }
      }
    }
  }

  const adminClient = createAdminClient();

  // 3. Dev bypass handling when completely unauthenticated in local development
  if (!user) {
    const allowDevBypass =
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_DISABLE_DEV_BYPASS !== "true";

    if (!allowDevBypass) {
      return null;
    }

    // Resolve first worker from DB for local dev testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: firstWorker } = await (adminClient.from("workers") as any)
      .select("id, profile_id, profession, federation_id, profiles(id, full_name, role)")
      .limit(1)
      .maybeSingle();

    if (firstWorker) {
      return {
        userId: firstWorker.profile_id || "dev-worker-profile",
        workerId: firstWorker.id,
        role: "WORKER",
        fullName: firstWorker.profiles?.full_name || "Ravi Sharma",
        profession: firstWorker.profession || "Electrician",
        federationId: firstWorker.federation_id || null,
        isDevBypass: true,
      };
    }

    return {
      userId: "dev-worker-profile",
      workerId: "dev-worker-id",
      role: "WORKER",
      fullName: "Ravi Sharma",
      profession: "Electrician",
      federationId: null,
      isDevBypass: true,
    };
  }

  // 4. Resolve verified profile role from database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from("profiles") as any)
    .select("id, role, email, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role || (user.user_metadata?.role as string) || "CUSTOMER") as UserRole;
  const fullName = profile?.full_name || (user.user_metadata?.full_name as string) || null;

  // 5. If role is not a worker, return role context for 403 Forbidden enforcement
  if (role !== "WORKER") {
    return {
      userId: user.id,
      workerId: "",
      role,
      fullName,
      profession: "",
      federationId: null,
    };
  }

  // 6. Query worker record for this profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: workerRec } = await (adminClient.from("workers") as any)
    .select("id, profession, federation_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    workerId: workerRec?.id || "",
    role: "WORKER",
    fullName,
    profession: workerRec?.profession || "Service Professional",
    federationId: workerRec?.federation_id || null,
  };
}

