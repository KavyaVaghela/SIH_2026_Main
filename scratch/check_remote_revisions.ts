import { createAdminClient } from "../lib/supabase/admin";

async function check() {
  const admin = createAdminClient();
  const { data, error } = await (admin.from("project_estimate_revisions") as any)
    .select("*")
    .limit(5);

  console.log("project_estimate_revisions check error:", error ? error.message : "None");
  console.log("project_estimate_revisions row count:", data?.length);
  if (data?.length > 0) {
    console.log("First row:", data[0]);
  }
}

check().catch(console.error);
