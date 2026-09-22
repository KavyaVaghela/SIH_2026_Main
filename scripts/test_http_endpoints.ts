async function checkEndpoint(roleName: string, path: string) {
  try {
    const res = await fetch(`http://localhost:3001${path}`);
    const html = await res.text();
    const hasSelector = html.includes("global-language-selector") || html.includes("Select language");
    console.log(`[${roleName}] Path: ${path} | Status: ${res.status} | Has Selector: ${hasSelector}`);
    return res.status === 200 && hasSelector;
  } catch (err) {
    console.error(`[${roleName}] Error fetching ${path}:`, err);
    return false;
  }
}

async function run() {
  console.log("Checking live dashboard endpoints on http://localhost:3001...\n");
  const c = await checkEndpoint("CUSTOMER", "/customer");
  const w = await checkEndpoint("WORKER", "/worker");
  const f = await checkEndpoint("FEDERATION", "/federation-admin");
  const s = await checkEndpoint("SUPER_ADMIN", "/super-admin");

  if (c && w && f && s) {
    console.log("\n✓ All four dashboards successfully returned HTTP 200 with Language Selector embedded!");
    process.exit(0);
  } else {
    console.log("\nSome checks did not return expected response.");
    process.exit(1);
  }
}

run();
