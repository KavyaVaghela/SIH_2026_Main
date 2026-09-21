import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const userHome = os.homedir();
console.log("Checking for Supabase CLI credentials in user home:", userHome);

const potentialPaths = [
  path.join(userHome, ".supabase", "access-token"),
  path.join(userHome, ".supabase", "config.json"),
  path.join(userHome, "AppData", "Roaming", "supabase"),
  path.join(userHome, "AppData", "Local", "supabase"),
  path.join(process.cwd(), ".supabase")
];

potentialPaths.forEach(p => {
  if (fs.existsSync(p)) {
    console.log(`FOUND PATH: ${p}`);
    try {
      const stat = fs.statSync(p);
      if (stat.isFile()) {
        console.log(`  File size: ${stat.size} bytes`);
      } else if (stat.isDirectory()) {
        console.log(`  Directory contents:`, fs.readdirSync(p));
      }
    } catch (e: any) {
      console.log(`  Error inspecting:`, e.message);
    }
  } else {
    console.log(`Path does not exist: ${p}`);
  }
});
