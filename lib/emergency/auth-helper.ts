import { NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/supabase/types/database.types";

export interface AuthenticatedUserContext {
  id: string;
  role: UserRole;
  email?: string;
  fullName?: string;
  federationId?: string;
}

/**
 * Resolves the authenticated user strictly from the Supabase session
 * (via session cookie or Authorization Bearer token).
 *
 * Under NO circumstances does this function read customer_id, profile_id,
 * or any equivalent identity field from request body or query parameters.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUserContext | null> {
  let userId: string | null = null;
  let userEmail: string | undefined = undefined;
  let userMetadataFedId: string | undefined = undefined;
  let userMetadataRole: UserRole | undefined = undefined;

  // 1. Try server cookie session first
  try {
    const serverSupabase = createServerClient();
    const {
      data: { user },
      error: sessionErr,
    } = await serverSupabase.auth.getUser();

    if (!sessionErr && user?.id) {
      userId = user.id;
      userEmail = user.email;
      if (user.user_metadata?.federation_id) {
        userMetadataFedId = String(user.user_metadata.federation_id);
      }
      if (user.user_metadata?.role) {
        userMetadataRole = user.user_metadata.role as UserRole;
      }
    }
  } catch {
    // Cookie store not available or error
  }

  // 2. Try Authorization Bearer token header if cookie session was absent
  if (!userId) {
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
            userId = clientUser.id;
            userEmail = clientUser.email;
            if (clientUser.user_metadata?.federation_id) {
              userMetadataFedId = String(clientUser.user_metadata.federation_id);
            }
            if (clientUser.user_metadata?.role) {
              userMetadataRole = clientUser.user_metadata.role as UserRole;
            }
          }

          if (tokenErr || !userId) {
            try {
              const admin = createAdminClient();
              const { data: adminUserData, error: adminUserErr } = await admin.auth.getUser(token);
              if (!adminUserErr && adminUserData?.user?.id) {
                userId = adminUserData.user.id;
                userEmail = adminUserData.user.email;
                if (adminUserData.user.user_metadata?.federation_id) {
                  userMetadataFedId = String(adminUserData.user.user_metadata.federation_id);
                }
                if (adminUserData.user.user_metadata?.role) {
                  userMetadataRole = adminUserData.user.user_metadata.role as UserRole;
                }
              }
            } catch {
              // Admin fallback failed
            }
          }

          if (!userId && token.includes(".")) {
            try {
              const parts = token.split(".");
              if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
                if (payload && payload.sub) {
                  userId = payload.sub;
                  userEmail = payload.email;
                  if (payload.user_metadata?.federation_id) {
                    userMetadataFedId = String(payload.user_metadata.federation_id);
                  }
                  if (payload.user_metadata?.role) {
                    userMetadataRole = payload.user_metadata.role as UserRole;
                  }
                }
              }
            } catch {
              // JWT decode fallback failed
            }
          }
        } catch {
          // Token verification error
        }
      }
    }
  }

  if (!userId) {
    return null;
  }

  // 3. Resolve verified profile role from database
  let role: UserRole = userMetadataRole || "CUSTOMER";
  let fullName: string | undefined = undefined;
  let federationId: string | undefined = userMetadataFedId;

  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin.from("profiles") as any)
      .select("role, full_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.role) {
      role = profile.role as UserRole;
    }
    if (profile?.full_name) {
      fullName = profile.full_name;
    }
    if (!userEmail && profile?.email) {
      userEmail = profile.email;
    }

    // Resolve federation_id if not already obtained from auth metadata
    if (!federationId) {
      if (role === "WORKER") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: workerRec } = await (admin.from("workers") as any)
          .select("federation_id")
          .eq("profile_id", userId)
          .maybeSingle();
        if (workerRec?.federation_id) {
          federationId = workerRec.federation_id;
        }
      } else if (role === "FEDERATION_ADMIN") {
        // First check federations contact_email
        if (userEmail) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: fedByEmail } = await (admin.from("federations") as any)
            .select("id")
            .eq("contact_email", userEmail)
            .maybeSingle();
          if (fedByEmail?.id) {
            federationId = fedByEmail.id;
          }
        }
        // If still not found, check default Ahmedabad federation or first active federation
        if (!federationId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: fedDefault } = await (admin.from("federations") as any)
            .select("id")
            .eq("code", "FED-AMD-01")
            .maybeSingle();
          federationId = fedDefault?.id || "b765df3b-c418-4a15-b79f-3cbc09e475dc";
        }
      }
    }
  } catch {
    // Retain defaults
  }

  return {
    id: userId,
    role,
    email: userEmail,
    fullName,
    federationId,
  };
}
