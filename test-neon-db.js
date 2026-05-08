import { neon } from "@neondatabase/serverless";
const sql = neon("postgresql://neondb_owner:npg_oZrUuwR1V0BQ@ep-cool-dust-ap5on1wb-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require");
async function run() {
  try {
    const result = await sql`SELECT * FROM participants`;
    console.log("Success! Participants:", result.length);
  } catch (e) {
    console.error("Error connecting to Neon:", e.message);
  }
}
run();
