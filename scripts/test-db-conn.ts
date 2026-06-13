import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually to avoid 'dotenv' dependency
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    console.log("Loading environment variables from .env.local...");
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        if (key && !key.startsWith("#")) {
          process.env[key] = value;
        }
      }
    });
  } else {
    console.warn(".env.local not found in process.cwd()");
  }
} catch (e) {
  console.warn("Error reading env file manually:", e);
}

console.log("Database Host:", process.env.PGHOST);
console.log("Database User:", process.env.PGUSER);
console.log("Database Name:", process.env.PGDATABASE);

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function main() {
  try {
    console.log("Connecting to Postgres...");
    const client = await pool.connect();
    console.log("Connection successful!");
    
    console.log("Running query...");
    const res = await client.query("SELECT NOW()");
    console.log("Query response:", res.rows[0]);
    
    client.release();
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await pool.end();
  }
}

main();
