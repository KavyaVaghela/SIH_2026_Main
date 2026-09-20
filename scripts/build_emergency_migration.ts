import * as fs from "fs";
import * as path from "path";

const migrationFiles = [
  "20260919000000_emergency_priority.sql",
  "20260919010000_emergency_incidents_foundation.sql",
  "20260919020000_emergency_response_matrix.sql",
  "20260919030000_emergency_dispatch_pool.sql",
  "20260919040000_emergency_response_teams.sql",
  "20260919050000_emergency_tasks.sql",
  "20260919060000_emergency_control_center.sql",
  "20260919070000_emergency_scaling_and_failure.sql",
  "20260920000000_emergency_time_rules_config.sql",
  "20260920010000_emergency_live_handoff_realtime_rls.sql",
  "20260920020000_emergency_verification_and_resolution.sql"
];

const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
const outputFile = path.resolve(migrationsDir, "emergency_services_complete_migration.sql");

let combinedSql = `-- ====================================================================
-- KAUSHALYASETU EMERGENCY SERVICES: COMPLETE MIGRATION SCRIPT (TASKS 1-8)
-- Generated for Remote Supabase Execution
-- Database Target: dxvnwbmxeubpbunwlmnd
-- ====================================================================

`;

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Migration file missing: ${file}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  combinedSql += `\n-- --------------------------------------------------------------------\n`;
  combinedSql += `-- START OF ${file}\n`;
  combinedSql += `-- --------------------------------------------------------------------\n\n`;
  combinedSql += content;
  combinedSql += `\n\n-- --------------------------------------------------------------------\n`;
  combinedSql += `-- END OF ${file}\n`;
  combinedSql += `-- --------------------------------------------------------------------\n\n`;
}

fs.writeFileSync(outputFile, combinedSql, "utf-8");
console.log(`Successfully generated: ${outputFile} (${combinedSql.length} bytes)`);
