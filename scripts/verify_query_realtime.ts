import { createCustomerQuery, getDailyMonitoringData, respondToCustomerQuery } from "../lib/projects/daily-monitoring-store";

async function verifyCustomerQuerySystem() {
  console.log("=================================================");
  console.log("PROBLEM 1 VERIFICATION — CUSTOMER QUERY SYSTEM");
  console.log("=================================================");

  const testProjectId = "test-monitoring-proj-" + Date.now();
  const testCustomerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
  const queryMessage = "Why is the material cost ₹12,500 on Day 3?";

  console.log(`1. Submitting query from Customer for Project ${testProjectId}...`);
  const createdQuery = await createCustomerQuery({
    projectId: testProjectId,
    customerId: testCustomerId,
    message: queryMessage,
  });

  console.log("   Created Query:", createdQuery);
  if (createdQuery.id && createdQuery.message === queryMessage && createdQuery.status === "OPEN") {
    console.log("   ✓ Customer Query created successfully.");
  } else {
    throw new Error("Failed to create customer query");
  }

  console.log("\n2. Federation queries daily monitoring for project...");
  const monitoringData = await getDailyMonitoringData(testProjectId);
  const foundQuery = monitoringData.customerQueries.find((q: any) => q.id === createdQuery.id);
  if (foundQuery) {
    console.log("   ✓ Federation retrieved customer query successfully:", foundQuery.message);
  } else {
    throw new Error("Federation could not find customer query in store");
  }

  console.log("\n3. Federation responds to query...");
  const replyMessage = "This covers the cement bags and structural steel reinforcement.";
  const respondedQuery = await respondToCustomerQuery({
    queryId: createdQuery.id,
    response: replyMessage,
    respondedBy: "df5e2a43-c749-4cca-bd26-fe5826b1d1c3",
    status: "RESOLVED",
  });

  console.log("   Responded Query:", respondedQuery);
  if (respondedQuery && respondedQuery.status === "RESOLVED" && respondedQuery.response === replyMessage) {
    console.log("   ✓ Federation reply recorded and status set to RESOLVED.");
  } else {
    throw new Error("Failed to respond to query");
  }

  console.log("\n4. Confirming persistent state in monitoring ledger...");
  const updatedMonitoringData = await getDailyMonitoringData(testProjectId);
  const updatedQuery = updatedMonitoringData.customerQueries.find((q: any) => q.id === createdQuery.id);
  if (updatedQuery && updatedQuery.status === "RESOLVED" && updatedQuery.response === replyMessage) {
    console.log("   ✓ Final query state verified in persistent monitoring ledger!");
  } else {
    throw new Error("Persistent monitoring ledger verification failed");
  }

  console.log("\n=================================================");
  console.log("ALL TARGETED FIXES VERIFIED SUCCESSFULLY!");
  console.log("=================================================");
}

verifyCustomerQuerySystem().catch(console.error);
