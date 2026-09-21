import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

console.log("Environment Keys Present:");
Object.keys(process.env).forEach(k => {
  if (k.includes("SUPABASE") || k.includes("POSTGRES") || k.includes("DATABASE") || k.includes("DB") || k.includes("RAZORPAY")) {
    console.log(`- ${k}`);
  }
});
