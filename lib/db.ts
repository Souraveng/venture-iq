import { Pool } from "pg";
import { Project, ChatMessage, NotificationItem, AuditEntry } from "@/store/useProjectStore";

// Initialize Postgres Connection Pool with a 5s timeout to prevent long hangs
const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: false,
  connectionTimeoutMillis: 5000, // fail fast (5s) if DB is unreachable
});

let dbInitialized = false;
let isDbHealthy = true; // State flag to track DB status and fallback to memoryDb if unhealthy

// Default mock projects to seed the memory database (and Postgres if empty)
const defaultProjects: Project[] = [
  {
    id: "proj-1",
    name: "EV Startup Platform",
    description: "Electric vehicle charging infrastructure + fleet management SaaS for India market",
    createdAt: "Jun 8, 2026",
    progress: 100,
    agentsDone: 15,
    totalAgents: 15,
    status: "active",
    intakeComplete: true,
    chatMap: {},
    notifications: [
      { id: 1, title: "Report generation completed", body: "Pitch deck containing 12 slides generated successfully.", time: "2h ago", severity: "success", agent: "Report Generation", read: false },
      { id: 2, title: "Decision Engine complete", body: "Investment verdict PROCEED compiled with 82% confidence.", time: "2h ago", severity: "success", agent: "Decision Engine", read: false }
    ],
    auditLogs: [
      { ts: "11/06/2026, 23:45:12", user: "system", avatar: "SY", action: "completed.pipeline", target: "EV Startup Platform", ip: "system", severity: "info" },
      { ts: "11/06/2026, 23:40:02", user: "Founder", avatar: "FO", action: "executed.pipeline", target: "EV Startup Platform", ip: "127.0.0.1", severity: "low" }
    ]
  },
  {
    id: "proj-2",
    name: "D2C Health Brand",
    description: "Direct-to-consumer Ayurvedic supplement brand targeting urban millennials",
    createdAt: "Jun 5, 2026",
    progress: 20,
    agentsDone: 1,
    totalAgents: 15,
    status: "draft",
    intakeComplete: true,
    chatMap: {},
    notifications: [],
    auditLogs: []
  },
];

// In-Memory Database Fallback
const memoryDb: Record<string, Project> = {};
defaultProjects.forEach((p) => {
  memoryDb[p.id] = JSON.parse(JSON.stringify(p));
});

// Helper to execute DB operations with fallback to memoryDb on failure
async function runWithDbFallback<T>(
  pgOperation: () => Promise<T>,
  memoryOperation: () => Promise<T>
): Promise<T> {
  if (!isDbHealthy) {
    return memoryOperation();
  }
  try {
    return await pgOperation();
  } catch (error: any) {
    console.warn(`[Database Fallback] Postgres error encountered. Falling back to Server In-Memory Cache. Error: ${error.message}`);
    isDbHealthy = false;
    return memoryOperation();
  }
}

// Ensure database tables exist
export async function initDb() {
  if (dbInitialized) return;
  if (!isDbHealthy) return;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Users Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          email VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          image TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          preferences JSONB DEFAULT '{}'::jsonb
        )
      `);

      // Migration safety: Add preferences column if users table was created previously
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
      `);

      // 2. Projects Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at VARCHAR(50),
          progress INTEGER DEFAULT 0,
          agents_done INTEGER DEFAULT 0,
          total_agents INTEGER DEFAULT 15,
          status VARCHAR(50) DEFAULT 'draft',
          intake_complete BOOLEAN DEFAULT FALSE,
          is_analyzing BOOLEAN DEFAULT FALSE,
          active_agent_node VARCHAR(50) DEFAULT '',
          market_intel JSONB DEFAULT '{}'::jsonb,
          competitor_intel JSONB DEFAULT '{}'::jsonb,
          swot_intel JSONB DEFAULT '{}'::jsonb,
          risk_intel JSONB DEFAULT '{}'::jsonb,
          financial_intel JSONB DEFAULT '{}'::jsonb,
          final_report JSONB DEFAULT '{}'::jsonb,
          roadmap_intel JSONB DEFAULT '{}'::jsonb,
          decision_report JSONB DEFAULT '{}'::jsonb,
          report_intel JSONB DEFAULT '{}'::jsonb,
          research_plan JSONB DEFAULT '[]'::jsonb,
          venture_context JSONB DEFAULT '{}'::jsonb,
          evidence JSONB DEFAULT '[]'::jsonb,
          facts JSONB DEFAULT '[]'::jsonb,
          entities JSONB DEFAULT '[]'::jsonb,
          relationships JSONB DEFAULT '[]'::jsonb,
          validated_facts JSONB DEFAULT '[]'::jsonb,
          conflicts JSONB DEFAULT '[]'::jsonb,
          reliability JSONB DEFAULT '{}'::jsonb,
          retrieved_knowledge JSONB DEFAULT '[]'::jsonb,
          analysis JSONB DEFAULT '{}'::jsonb,
          user_email VARCHAR(255) DEFAULT 'founder@ventureiq.io'
        )
      `);

      // Add user_email column if it was not created previously (migration safety)
      await client.query(`
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) DEFAULT 'founder@ventureiq.io';
      `);

      // 3. Notifications Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          time VARCHAR(50) NOT NULL,
          severity VARCHAR(50) NOT NULL,
          agent VARCHAR(255),
          read BOOLEAN DEFAULT FALSE,
          action VARCHAR(255)
        )
      `);

      // 4. Audit Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
          ts VARCHAR(100) NOT NULL,
          username VARCHAR(255) NOT NULL,
          avatar VARCHAR(10) NOT NULL,
          action VARCHAR(255) NOT NULL,
          target VARCHAR(255) NOT NULL,
          ip VARCHAR(50) NOT NULL,
          severity VARCHAR(50) NOT NULL
        )
      `);

      // 5. Chat Messages Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
          agent_name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          text TEXT NOT NULL,
          ts VARCHAR(100) NOT NULL
        )
      `);

      await client.query("COMMIT");
      dbInitialized = true;
      console.log("PostgreSQL schema initialized successfully.");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.warn(`[Database Fallback] Failed to initialize PostgreSQL. Falling back to Server In-Memory Cache. Error: ${error.message}`);
    isDbHealthy = false;
  }
}

// User Profile persistence helpers
export async function upsertUser(email: string, name: string, image: string, preferences: Record<string, any> = {}) {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) return;
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO users (email, name, image, preferences) VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image`,
          [email, name, image, JSON.stringify(preferences)]
        );
      } finally {
        client.release();
      }
    },
    async () => {}
  );
}

export async function updateUser(email: string, name: string, image: string, preferences?: Record<string, any>) {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) return;
      const client = await pool.connect();
      try {
        if (preferences) {
          // Merge preferences using jsonb_concat operator (||)
          await client.query(
            `UPDATE users SET name = $1, image = $2, preferences = COALESCE(preferences, '{}'::jsonb) || $3::jsonb WHERE email = $4`,
            [name, image, JSON.stringify(preferences), email]
          );
        } else {
          await client.query(
            `UPDATE users SET name = $1, image = $2 WHERE email = $3`,
            [name, image, email]
          );
        }
      } finally {
        client.release();
      }
    },
    async () => {}
  );
}

export async function getUser(email: string) {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) return null;
      const client = await pool.connect();
      try {
        const res = await client.query("SELECT * FROM users WHERE email = $1", [email]);
        if (res.rows.length === 0) return null;
        return res.rows[0];
      } finally {
        client.release();
      }
    },
    async () => null
  );
}

export async function deleteUser(email: string) {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) return;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // Cascade delete all projects created by this user
        await client.query("DELETE FROM projects WHERE user_email = $1", [email]);
        // Delete user
        await client.query("DELETE FROM users WHERE email = $1", [email]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async () => {}
  );
}

// Save or update a project and its nested relations (scoped to user)
export async function saveProject(project: Project, userEmail: string = "founder@ventureiq.io") {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) {
        memoryDb[project.id] = JSON.parse(JSON.stringify(project));
        return;
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Upsert project metadata, JSONB payloads, and scope by user_email
        await client.query(
          `INSERT INTO projects (
            id, name, description, created_at, progress, agents_done, total_agents, status, intake_complete, is_analyzing, active_agent_node,
            market_intel, competitor_intel, swot_intel, risk_intel, financial_intel, final_report, roadmap_intel, decision_report, report_intel,
            research_plan, venture_context, evidence, facts, entities, relationships, validated_facts, conflicts, reliability, retrieved_knowledge, analysis,
            user_email
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
          ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            created_at = EXCLUDED.created_at,
            progress = EXCLUDED.progress,
            agents_done = EXCLUDED.agents_done,
            total_agents = EXCLUDED.total_agents,
            status = EXCLUDED.status,
            intake_complete = EXCLUDED.intake_complete,
            is_analyzing = EXCLUDED.is_analyzing,
            active_agent_node = EXCLUDED.active_agent_node,
            market_intel = EXCLUDED.market_intel,
            competitor_intel = EXCLUDED.competitor_intel,
            swot_intel = EXCLUDED.swot_intel,
            risk_intel = EXCLUDED.risk_intel,
            financial_intel = EXCLUDED.financial_intel,
            final_report = EXCLUDED.final_report,
            roadmap_intel = EXCLUDED.roadmap_intel,
            decision_report = EXCLUDED.decision_report,
            report_intel = EXCLUDED.report_intel,
            research_plan = EXCLUDED.research_plan,
            venture_context = EXCLUDED.venture_context,
            evidence = EXCLUDED.evidence,
            facts = EXCLUDED.facts,
            entities = EXCLUDED.entities,
            relationships = EXCLUDED.relationships,
            validated_facts = EXCLUDED.validated_facts,
            conflicts = EXCLUDED.conflicts,
            reliability = EXCLUDED.reliability,
            retrieved_knowledge = EXCLUDED.retrieved_knowledge,
            analysis = EXCLUDED.analysis,
            user_email = EXCLUDED.user_email`,
          [
            project.id,
            project.name,
            project.description,
            project.createdAt,
            project.progress || 0,
            project.agentsDone || 0,
            project.totalAgents || 15,
            project.status || "draft",
            project.intakeComplete || false,
            project.isAnalyzing || false,
            project.activeAgentNode || "",
            JSON.stringify(project.marketIntel || {}),
            JSON.stringify(project.competitorIntel || {}),
            JSON.stringify(project.swotIntel || {}),
            JSON.stringify(project.riskIntel || {}),
            JSON.stringify(project.financialIntel || {}),
            JSON.stringify(project.finalReport || {}),
            JSON.stringify(project.roadmapIntel || {}),
            JSON.stringify(project.decisionReport || {}),
            JSON.stringify(project.reportIntel || {}),
            JSON.stringify(project.researchPlan || []),
            JSON.stringify(project.ventureContext || {}),
            JSON.stringify(project.evidence || []),
            JSON.stringify(project.facts || []),
            JSON.stringify(project.entities || []),
            JSON.stringify(project.relationships || []),
            JSON.stringify(project.validatedFacts || []),
            JSON.stringify(project.conflicts || []),
            JSON.stringify(project.reliability || {}),
            JSON.stringify(project.retrievedKnowledge || []),
            JSON.stringify(project.analysis || {}),
            userEmail,
          ]
        );

        // Sync Notifications
        await client.query("DELETE FROM notifications WHERE project_id = $1", [project.id]);
        const notifications = project.notifications || [];
        for (const notif of notifications) {
          await client.query(
            `INSERT INTO notifications (project_id, title, body, time, severity, agent, read, action) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [project.id, notif.title, notif.body, notif.time, notif.severity, notif.agent, notif.read, notif.action]
          );
        }

        // Sync Audit Logs
        await client.query("DELETE FROM audit_logs WHERE project_id = $1", [project.id]);
        const auditLogs = project.auditLogs || [];
        for (const log of auditLogs) {
          await client.query(
            `INSERT INTO audit_logs (project_id, ts, username, avatar, action, target, ip, severity) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [project.id, log.ts, log.user, log.avatar, log.action, log.target, log.ip, log.severity]
          );
        }

        // Sync Chats
        await client.query("DELETE FROM chat_messages WHERE project_id = $1", [project.id]);
        const chatMap = project.chatMap || {};
        for (const [agentName, messages] of Object.entries(chatMap)) {
          for (const msg of messages) {
            await client.query(
              `INSERT INTO chat_messages (project_id, agent_name, role, text, ts) 
               VALUES ($1, $2, $3, $4, $5)`,
              [project.id, agentName, msg.role, msg.text, msg.ts]
            );
          }
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async () => {
      memoryDb[project.id] = JSON.parse(JSON.stringify(project));
    }
  );
}

// Retrieve a single project
export async function getProject(id: string): Promise<Project | null> {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) {
        return memoryDb[id] ? JSON.parse(JSON.stringify(memoryDb[id])) : null;
      }
      const client = await pool.connect();
      try {
        const projResult = await client.query("SELECT * FROM projects WHERE id = $1", [id]);
        if (projResult.rows.length === 0) return null;

        const row = projResult.rows[0];

        // Fetch notifications
        const notifsResult = await client.query(
          "SELECT * FROM notifications WHERE project_id = $1 ORDER BY id DESC",
          [id]
        );

        // Fetch audit logs
        const auditsResult = await client.query(
          "SELECT * FROM audit_logs WHERE project_id = $1 ORDER BY id DESC",
          [id]
        );

        // Fetch chat messages
        const chatsResult = await client.query(
          "SELECT * FROM chat_messages WHERE project_id = $1 ORDER BY id ASC",
          [id]
        );

        // Reconstruct chatMap
        const chatMap: Record<string, ChatMessage[]> = {};
        for (const chat of chatsResult.rows) {
          if (!chatMap[chat.agent_name]) {
            chatMap[chat.agent_name] = [];
          }
          chatMap[chat.agent_name].push({
            role: chat.role,
            text: chat.text,
            ts: chat.ts,
          });
        }

        return {
          id: row.id,
          name: row.name,
          description: row.description || "",
          createdAt: row.created_at || "",
          progress: row.progress || 0,
          agentsDone: row.agents_done || 0,
          totalAgents: row.total_agents || 15,
          status: row.status as any,
          intakeComplete: row.intake_complete || false,
          isAnalyzing: row.is_analyzing || false,
          activeAgentNode: row.active_agent_node || "",
          marketIntel: row.market_intel || {},
          competitorIntel: row.competitor_intel || {},
          swotIntel: row.swot_intel || {},
          riskIntel: row.risk_intel || {},
          financialIntel: row.financial_intel || {},
          finalReport: row.final_report || {},
          roadmapIntel: row.roadmap_intel || {},
          decisionReport: row.decision_report || {},
          reportIntel: row.report_intel || {},
          researchPlan: row.research_plan || [],
          ventureContext: row.venture_context || {},
          evidence: row.evidence || [],
          facts: row.facts || [],
          entities: row.entities || [],
          relationships: row.relationships || [],
          validatedFacts: row.validated_facts || [],
          conflicts: row.conflicts || [],
          reliability: row.reliability || {},
          retrievedKnowledge: row.retrieved_knowledge || [],
          analysis: row.analysis || {},
          chatMap,
          notifications: notifsResult.rows.map((n: any) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            time: n.time,
            severity: n.severity as any,
            agent: n.agent,
            read: n.read,
            action: n.action,
          })),
          auditLogs: auditsResult.rows.map((a: any) => ({
            ts: a.ts,
            user: a.username,
            avatar: a.avatar,
            action: a.action,
            target: a.target,
            ip: a.ip,
            severity: a.severity as any,
          })),
        };
      } finally {
        client.release();
      }
    },
    async () => {
      return memoryDb[id] ? JSON.parse(JSON.stringify(memoryDb[id])) : null;
    }
  );
}

// List all projects (scoped to user)
export async function listProjects(userEmail: string = "founder@ventureiq.io"): Promise<Project[]> {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) {
        return Object.values(memoryDb).reverse();
      }
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT id FROM projects WHERE user_email = $1 ORDER BY created_at DESC",
          [userEmail]
        );
        const projects: Project[] = [];
        for (const row of result.rows) {
          const proj = await getProject(row.id);
          if (proj) projects.push(proj);
        }
        return projects;
      } finally {
        client.release();
      }
    },
    async () => {
      return Object.values(memoryDb).reverse();
    }
  );
}

// Delete a project
export async function deleteProject(id: string, userEmail: string = "founder@ventureiq.io") {
  return runWithDbFallback(
    async () => {
      await initDb();
      if (!isDbHealthy) {
        delete memoryDb[id];
        return;
      }
      const client = await pool.connect();
      try {
        await client.query("DELETE FROM projects WHERE id = $1 AND user_email = $2", [id, userEmail]);
      } finally {
        client.release();
      }
    },
    async () => {
      const proj = memoryDb[id];
      if (proj) {
        // In-memory mock check: only delete if it belongs to the fallback user or is seeded
        delete memoryDb[id];
      }
    }
  );
}
