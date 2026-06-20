const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
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
  let client;
  try {
    console.log("Attempting to connect to PostgreSQL...");
    client = await pool.connect();
    console.log("✅ Connection to PostgreSQL was successful!");

    console.log("\nRunning Schema Migrations (adding missing columns)...");
    await client.query("BEGIN");
    
    // Add columns if they are missing
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
    `);
    console.log("- Checked users.preferences");

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free';
    `);
    console.log("- Checked users.tier");

    await client.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) DEFAULT 'founder@ventureiq.io';
    `);
    console.log("- Checked projects.user_email");

    await client.query("COMMIT");
    console.log("✅ Schema migrations committed successfully!");

    console.log("\nChecking for user 'himanshu25b@gmail.com' in the database...");
    const userRes = await client.query(
      "SELECT email, name, tier FROM users WHERE LOWER(email) = LOWER($1)",
      ["himanshu25b@gmail.com"]
    );
    
    if (userRes.rows.length > 0) {
      console.log("✅ User found in DB:");
      console.log(userRes.rows[0]);
    } else {
      console.log("❌ User 'himanshu25b@gmail.com' was NOT found in the 'users' table.");
      
      console.log("\nAll registered users in DB:");
      const allUsers = await client.query("SELECT email, name, tier FROM users LIMIT 10");
      console.log(allUsers.rows);
    }
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("❌ Operation failed!");
    console.error(error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

main();
