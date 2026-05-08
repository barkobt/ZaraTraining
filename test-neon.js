import { neon } from "@neondatabase/serverless";
console.log("Starting...");
try {
  const sql = neon("\"postgresql://invalid:pass@host/db\"");
  console.log("SQL created. Fetching...");
  await sql`SELECT 1`;
  console.log("Done");
} catch (e) {
  console.error("Error:", e);
}
