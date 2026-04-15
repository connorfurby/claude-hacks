import { Client } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    console.error("Get it from: Supabase dashboard → Settings → Database → Connection string → URI");
    console.error("Then add it to .env.local as DATABASE_URL=postgresql://...");
    process.exit(1);
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase Postgres");

  const sql = readFileSync(join(process.cwd(), "supabase/schema.sql"), "utf8");
  await client.query(sql);
  console.log("Schema applied successfully");

  await client.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
