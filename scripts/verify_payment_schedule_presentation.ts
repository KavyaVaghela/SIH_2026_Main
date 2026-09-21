import {
  cleanProjectDescription,
  formatLocalizedDate,
  mapPaymentStatus,
  resolvePaymentPlanTitle,
  parseProjectPaymentDetails,
} from "../lib/financials/project-description-parser";

console.log("==================================================");
console.log("PAYMENT SCHEDULE & UI PRESENTATION VERIFICATION");
console.log("==================================================");

let failed = false;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ""}`);
    failed = true;
  }
}

// -------------------------------------------------------------
// TEST 1: cleanProjectDescription strips all internal tags & raw JSON
// -------------------------------------------------------------
console.log("\n--- TEST 1: cleanProjectDescription Strips Raw Tags & JSON ---");
const rawDescSample = `Detailed house renovation and electrical wiring work.

[Category]: Construction & Carpentry
[Location]: Navrangpura, Ahmedabad
[Preferred Duration]: 3 weeks
[Original Estimate]: 100000
[Current Estimate]: 100000
[Material Cost]: 59500
[Workers]: 3
[Daily Rate]: 900
[Start Date]: 2026-09-25
[Completion Date]: 2026-10-15
[Payment Plan]: INSTALLMENTS_4
[Payment Schedule]: [{"installmentNumber":1,"amount":25000,"label":"Installment 1 of 4","dueDateDaysOffset":7,"dueAtIso":"2026-09-27T05:44:44.132Z","paymentStatus":"PAID","daysRemaining":7,"isOverdue":false,"overdueDays":0,"dueDateText":"Due 27 Sept 2026","paidAtIso":"2026-09-20T05:44:51.874Z"},{"installmentNumber":2,"amount":25000,"label":"Installment 2 of 4","dueDateDaysOffset":30,"dueAtIso":"2026-10-20T05:44:44.132Z","paymentStatus":"UPCOMING","daysRemaining":30,"isOverdue":false,"overdueDays":0,"dueDateText":"Due 20 Oct 2026"},{"installmentNumber":3,"amount":25000,"label":"Installment 3 of 4","dueDateDaysOffset":60,"dueAtIso":"2026-11-19T05:44:44.132Z","paymentStatus":"UPCOMING","daysRemaining":60,"isOverdue":false,"overdueDays":0,"dueDateText":"Due 19 Nov 2026"},{"installmentNumber":4,"amount":25000,"label":"Installment 4 of 4","dueDateDaysOffset":90,"dueAtIso":"2026-12-19T05:44:44.132Z","paymentStatus":"UPCOMING","daysRemaining":90,"isOverdue":false,"overdueDays":0,"dueDateText":"Due 19 Dec 2026"}]
[Confirmed At]: 2026-09-20T05:44:44.132Z
[Payments Received]: 25000`;

const cleaned = cleanProjectDescription(rawDescSample);

assert(!cleaned.includes("[Payment Plan]:"), "Removes [Payment Plan]: tag");
assert(!cleaned.includes("[Payment Schedule]:"), "Removes [Payment Schedule]: tag");
assert(!cleaned.includes("installmentNumber"), "Removes raw JSON keys (installmentNumber)");
assert(!cleaned.includes("dueDateDaysOffset"), "Removes raw JSON keys (dueDateDaysOffset)");
assert(!cleaned.includes("[Confirmed At]:"), "Removes [Confirmed At]: tag");
assert(!cleaned.includes("[Payments Received]:"), "Removes [Payments Received]: tag");
assert(!cleaned.includes("[Category]:"), "Removes [Category]: tag");
assert(!cleaned.includes("[Location]:"), "Removes [Location]: tag");
assert(cleaned.includes("Detailed house renovation and electrical wiring work."), "Preserves customer's genuine scope description");

// -------------------------------------------------------------
// TEST 2: Localized Date Formatting (No ISO strings)
// -------------------------------------------------------------
console.log("\n--- TEST 2: Localized Date Formatting ---");
const formattedDate = formatLocalizedDate("2026-09-20T05:44:44.132Z");
assert(
  formattedDate.includes("2026") && (formattedDate.includes("Sept") || formattedDate.includes("Sep")),
  `Formats ISO date to human readable date (got: '${formattedDate}')`
);
assert(!formattedDate.includes("T"), "Omits ISO 'T' separator");
assert(!formattedDate.includes("Z"), "Omits ISO 'Z' marker");
assert(!formattedDate.includes(":"), "Omits time of day from date presentation");

// -------------------------------------------------------------
// TEST 3: Human-Readable Status Mapping
// -------------------------------------------------------------
console.log("\n--- TEST 3: Human-Readable Status Mapping ---");
assert(mapPaymentStatus("PAID").label === "Paid", "PAID maps to 'Paid'");
assert(mapPaymentStatus("UPCOMING").label === "Upcoming", "UPCOMING maps to 'Upcoming'");
assert(mapPaymentStatus("PENDING").label === "Pending", "PENDING maps to 'Pending'");
assert(mapPaymentStatus("OVERDUE").label === "Overdue", "OVERDUE maps to 'Overdue'");
assert(mapPaymentStatus("FAILED").label === "Payment Failed", "FAILED maps to 'Payment Failed'");
assert(mapPaymentStatus("DUE").label === "Due", "DUE maps to 'Due'");

// -------------------------------------------------------------
// TEST 4: Plan Title Resolution
// -------------------------------------------------------------
console.log("\n--- TEST 4: Plan Title Resolution ---");
assert(resolvePaymentPlanTitle("INSTALLMENTS_4") === "4 Installments", "INSTALLMENTS_4 -> '4 Installments'");
assert(resolvePaymentPlanTitle("INSTALLMENTS_3") === "3 Installments", "INSTALLMENTS_3 -> '3 Installments'");
assert(resolvePaymentPlanTitle("INSTALLMENTS_2") === "2 Installments", "INSTALLMENTS_2 -> '2 Installments'");
assert(resolvePaymentPlanTitle("FULL_PAYMENT") === "Full Payment", "FULL_PAYMENT -> 'Full Payment'");
assert(resolvePaymentPlanTitle("FULL") === "Full Payment", "FULL -> 'Full Payment'");

// -------------------------------------------------------------
// TEST 5: Full 4-Installment Plan Parsing & Calculations
// -------------------------------------------------------------
console.log("\n--- TEST 5: 4-Installment Plan Parsing & Calculations ---");
const parsed4 = parseProjectPaymentDetails(rawDescSample, null, 100000, 25000);
assert(parsed4.hasPaymentPlan === true, "Recognizes active payment plan");
assert(parsed4.planTitle === "4 Installments", "Parses plan title as '4 Installments'");
assert(parsed4.installmentsCount === 4, "Extracts exactly 4 installments");
assert(parsed4.totalAmount === 100000, `Total amount equals 100,000 (got: ${parsed4.totalAmount})`);
assert(parsed4.paidAmount === 25000, `Paid amount equals 25,000 (got: ${parsed4.paidAmount})`);
assert(parsed4.remainingAmount === 75000, `Remaining amount equals 75,000 (got: ${parsed4.remainingAmount})`);
assert(parsed4.confirmedAtFormatted !== null, `Confirmed date formatted properly (got: ${parsed4.confirmedAtFormatted})`);

// Check first installment (PAID)
const inst1 = parsed4.installments[0];
assert(inst1.status === "PAID", "Inst 1 status is 'PAID'");
assert(inst1.statusLabel === "Paid", "Inst 1 statusLabel is 'Paid'");
assert(inst1.amount === 25000, "Inst 1 amount is 25000");
assert(inst1.paidAtFormatted !== null, `Inst 1 has human-readable paid date (got: ${inst1.paidAtFormatted})`);

// Check upcoming installments
const inst2 = parsed4.installments[1];
assert(inst2.statusLabel === "Upcoming" || inst2.statusLabel === "Pending", `Inst 2 has readable status (got: ${inst2.statusLabel})`);
assert(!inst2.dueDateFormatted.includes("T"), "Inst 2 due date is clean localized text");

// -------------------------------------------------------------
// TEST 6: 2-Installment Plan Parsing
// -------------------------------------------------------------
console.log("\n--- TEST 6: 2-Installment Plan Parsing ---");
const desc2 = `Commercial lighting.
[Payment Plan]: INSTALLMENTS_2
[Payment Schedule]: [{"installmentNumber":1,"amount":50000,"label":"Advance (50%)","paymentStatus":"PAID","dueDateText":"Due 25 Sept 2026"},{"installmentNumber":2,"amount":50000,"label":"Final Completion (50%)","paymentStatus":"UPCOMING","dueDateText":"Due 10 Oct 2026"}]
[Confirmed At]: 2026-09-20T05:00:00.000Z
[Payments Received]: 50000`;

const parsed2 = parseProjectPaymentDetails(desc2, null, 100000, 50000);
assert(parsed2.planTitle === "2 Installments", "Parses plan title as '2 Installments'");
assert(parsed2.installmentsCount === 2, "Has 2 installments");
assert(parsed2.totalAmount === 100000, "Total is 100,000");
assert(parsed2.paidAmount === 50000, "Paid is 50,000");
assert(parsed2.remainingAmount === 50000, "Remaining is 50,000");

// -------------------------------------------------------------
// TEST 7: 3-Installment Plan Parsing
// -------------------------------------------------------------
console.log("\n--- TEST 7: 3-Installment Plan Parsing ---");
const desc3 = `Commercial lighting.
[Payment Plan]: INSTALLMENTS_3
[Payment Schedule]: [{"installmentNumber":1,"amount":34000,"label":"Advance 34%","paymentStatus":"PAID","dueDateText":"Due 25 Sept 2026"},{"installmentNumber":2,"amount":33000,"label":"Midway 33%","paymentStatus":"UPCOMING","dueDateText":"Due 10 Oct 2026"},{"installmentNumber":3,"amount":33000,"label":"Final 33%","paymentStatus":"UPCOMING","dueDateText":"Due 25 Oct 2026"}]
[Confirmed At]: 2026-09-20T05:00:00.000Z
[Payments Received]: 34000`;

const parsed3 = parseProjectPaymentDetails(desc3, null, 100000, 34000);
assert(parsed3.planTitle === "3 Installments", "Parses plan title as '3 Installments'");
assert(parsed3.installmentsCount === 3, "Has 3 installments");
assert(parsed3.totalAmount === 100000, "Total is 100,000");
assert(parsed3.paidAmount === 34000, "Paid is 34,000");
assert(parsed3.remainingAmount === 66000, "Remaining is 66,000");

// -------------------------------------------------------------
// TEST 8: Full Payment Plan Parsing
// -------------------------------------------------------------
console.log("\n--- TEST 8: Full Payment Plan Parsing ---");
const descFull = `Quick wall painting.
[Payment Plan]: FULL_PAYMENT
[Payment Schedule]: [{"installmentNumber":1,"amount":30000,"label":"Single Full Payment","paymentStatus":"PAID","dueDateText":"Due Upon Completion"}]
[Confirmed At]: 2026-09-18T10:00:00.000Z
[Payments Received]: 30000`;

const parsedFull = parseProjectPaymentDetails(descFull, null, 30000, 30000);
assert(parsedFull.planTitle === "Full Payment", "Parses plan title as 'Full Payment'");
assert(parsedFull.installmentsCount === 1, "Has 1 installment");
assert(parsedFull.remainingAmount === 0, "Remaining is 0");

// -------------------------------------------------------------
// TEST 9: Overdue Installment Handling
// -------------------------------------------------------------
console.log("\n--- TEST 9: Overdue Installment Handling ---");
const descOverdue = `Roofing repair.
[Payment Plan]: INSTALLMENTS_2
[Payment Schedule]: [{"installmentNumber":1,"amount":20000,"label":"Installment 1 of 2","dueAtIso":"2026-09-01T00:00:00.000Z","paymentStatus":"OVERDUE","isOverdue":true,"overdueDays":20},{"installmentNumber":2,"amount":20000,"label":"Installment 2 of 2","dueAtIso":"2026-10-01T00:00:00.000Z","paymentStatus":"UPCOMING"}]
[Confirmed At]: 2026-08-20T00:00:00.000Z`;

const parsedOverdue = parseProjectPaymentDetails(descOverdue, null, 40000, 0);
assert(parsedOverdue.installments[0].status === "OVERDUE", "Installment status is 'OVERDUE'");
assert(parsedOverdue.installments[0].statusLabel === "Overdue", "Installment label is 'Overdue'");
assert(parsedOverdue.installments[0].isOverdue === true, "Flags isOverdue = true");

// -------------------------------------------------------------
// TEST 10: Plan With No Schedule (Simple/Unconfirmed Fallback)
// -------------------------------------------------------------
console.log("\n--- TEST 10: Plan With No Schedule Fallback ---");
const descEmpty = "Standard residential wiring project requirement without payment plan configured.";
const parsedEmpty = parseProjectPaymentDetails(descEmpty, null, 50000, 0);
assert(parsedEmpty.installmentsCount === 0, "Installments count is 0");
assert(parsedEmpty.totalAmount === 50000, "Preserves total amount from budget");
assert(parsedEmpty.remainingAmount === 50000, "Calculates correct remaining amount");

// -------------------------------------------------------------
// TEST 11: Confirmation of Zero Raw JSON in UI components
// -------------------------------------------------------------
console.log("\n--- TEST 11: Confirm Zero Raw JSON Renders ---");
const testCleanOutput = cleanProjectDescription(rawDescSample);
assert(!testCleanOutput.includes("{"), "Clean output contains no JSON '{'");
assert(!testCleanOutput.includes("}"), "Clean output contains no JSON '}'");
assert(!testCleanOutput.includes("[{"), "Clean output contains no JSON '[{'");

console.log("==================================================");
if (failed) {
  console.error("VERIFICATION FAILED with errors.");
  process.exit(1);
} else {
  console.log("ALL PAYMENT SCHEDULE PRESENTATION TESTS PASSED!");
}
