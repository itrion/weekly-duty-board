import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for bootstrap");
}

function runMigrations() {
  execSync("npm run db:migrate", { stdio: "inherit" });
}

async function main() {
  console.log("[bootstrap] running migrations...");
  runMigrations();
  console.log("[bootstrap] done");
}

main().catch((error) => {
  console.error("[bootstrap] failed", error);
  process.exit(1);
});
