import { Pool } from "pg";
import { Project, ChatMessage, NotificationItem, AuditEntry } from "@/store/useProjectStore";

// Initialize Postgres Connection Pool
const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: false, // GCP Cloud SQL allows unencrypted for authorized IPs, but we can enable SSL if needed.
});

let dbInitialized = false;

// Ensure database tables exist
export async function initDb() {
  if (dbInitialized) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Projects Table
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
        analysis JSONB DEFAULT '{}'::jsonb
      )
    `);

    // 2. Notifications Table
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

    // 3. Audit Logs Table
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

    // 4. Chat Messages Table
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
    console.error("Failed to initialize PostgreSQL schema:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Save or update a project and its nested relations
export async function saveProject(project: Project) {
  await initDb();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Upsert project metadata and JSONB payloads
    await client.query(
      `INSERT INTO projects (
        id, name, description, created_at, progress, agents_done, total_agents, status, intake_complete, is_analyzing, active_agent_node,
        market_intel, competitor_intel, swot_intel, risk_intel, financial_intel, final_report, roadmap_intel, decision_report, report_intel,
        research_plan, venture_context, evidence, facts, entities, relationships, validated_facts, conflicts, reliability, retrieved_knowledge, analysis
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
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
        analysis = EXCLUDED.analysis`,
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
      ]
    );

    // Sync Notifications: Clear existing and re-insert
    await client.query("DELETE FROM notifications WHERE project_id = $1", [project.id]);
    const notifications = project.notifications || [];
    for (const notif of notifications) {
      await client.query(
        `INSERT INTO notifications (project_id, title, body, time, severity, agent, read, action) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [project.id, notif.title, notif.body, notif.time, notif.severity, notif.agent, notif.read, notif.action]
      );
    }

    // Sync Audit Logs: Clear existing and re-insert
    await client.query("DELETE FROM audit_logs WHERE project_id = $1", [project.id]);
    const auditLogs = project.auditLogs || [];
    for (const log of auditLogs) {
      await client.query(
        `INSERT INTO audit_logs (project_id, ts, username, avatar, action, target, ip, severity) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [project.id, log.ts, log.user, log.avatar, log.action, log.target, log.ip, log.severity]
      );
    }

    // Sync Chats: Clear existing and re-insert
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
    console.error(`Error saving project ${project.id} to PostgreSQL:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Retrieve a single project with all relations populated
export async function getProject(id: string): Promise<Project | null> {
  await initDb();
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
      notifications: notifsResult.rows.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        time: n.time,
        severity: n.severity as any,
        agent: n.agent,
        read: n.read,
        action: n.action,
      })),
      auditLogs: auditsResult.rows.map((a) => ({
        ts: a.ts,
        user: a.username,
        avatar: a.avatar,
        action: a.action,
        target: a.target,
        ip: a.ip,
        severity: a.severity as any,
      })),
    };
  } catch (error) {
    console.error(`Error loading project ${id} from PostgreSQL:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// List all projects in the database
export async function listProjects(): Promise<Project[]> {
  await initDb();
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT id FROM projects ORDER BY created_at DESC");
    const projects: Project[] = [];
    for (const row of result.rows) {
      const proj = await getProject(row.id);
      if (proj) projects.push(proj);
    }
    return projects;
  } catch (error) {
    console.error("Error listing projects from PostgreSQL:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Delete a project and cascade-delete all child rows
export async function deleteProject(id: string) {
  await initDb();
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM projects WHERE id = $1", [id]);
  } catch (error) {
    console.error(`Error deleting project ${id} from PostgreSQL:`, error);
    throw error;
  } finally {
    client.release();
  }
}
