async function test() {
  const base = "http://localhost:3000";
  console.log("Testing API on", base);

  // 1. Get projects
  const pRes = await fetch(`${base}/api/projects`);
  console.log("/api/projects status:", pRes.status);
  const pData = await pRes.json();
  console.log("Projects count:", pData.projects?.length);
  if (pData.projects?.length > 0) {
    const p = pData.projects[0];
    console.log("Sample project actual cost:", p.actual_cost_to_date, p.actualCostToDate);
    
    // 2. Test financials endpoint
    const fRes = await fetch(`${base}/api/projects/financials?projectId=${p.id}`);
    console.log("/api/projects/financials status:", fRes.status);
    const fData = await fRes.json();
    console.log("Financials actual cost:", fData.actualCost, "Payment plans:", fData.supportedPaymentPlans?.length);
    if (fData.supportedPaymentPlans?.length > 0) {
      console.log("Plan 1 (4 inst):", fData.supportedPaymentPlans.find((pl: any) => pl.planType === 'INSTALLMENTS_4')?.installments?.map((i: any) => ({
        label: i.label,
        dueAtIso: i.dueAtIso,
        dueDateText: i.dueDateText,
        dueDateDaysOffset: i.dueDateDaysOffset
      })));
    }

    // 3. Test daily-updates endpoint
    const dRes = await fetch(`${base}/api/projects/daily-updates?projectId=${p.id}`);
    console.log("/api/projects/daily-updates status:", dRes.status);
    const dData = await dRes.json();
    console.log("Daily updates summary:", dData.summary);
  }
}

test().catch(console.error);
