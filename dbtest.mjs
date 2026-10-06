import { neon } from "@neondatabase/serverless";
import { Pool } from "@neondatabase/serverless";
const url = process.env.DATABASE_URL;
const sql = neon(url);
for (let i=0;i<3;i++){ const t=Date.now(); await sql`select id from job_posts limit 20`; console.log("http", Date.now()-t, "ms"); }
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
for (let i=0;i<3;i++){ const t=Date.now(); await client.query("select id from job_posts limit 20"); console.log("ws-pool", Date.now()-t, "ms"); }
process.exit(0);
