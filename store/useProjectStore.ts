"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
  ts: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: string;
  severity: "warning" | "success" | "info" | "error";
  agent?: string;
  read: boolean;
  action?: string;
}

export interface AuditEntry {
  ts: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  ip: string;
  severity: "info" | "low" | "medium" | "high";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  progress: number;
  agentsDone: number;
  totalAgents: number;
  status: "intake" | "active" | "draft" | "complete";
  intakeComplete: boolean;
  marketIntel?: Record<string, any>;
  competitorIntel?: Record<string, any>;
  swotIntel?: Record<string, any>;
  riskIntel?: Record<string, any>;
  financialIntel?: Record<string, any>;
  finalReport?: Record<string, any>;
  roadmapIntel?: Record<string, any>;
  decisionReport?: Record<string, any>;
  reportIntel?: Record<string, any>;
  researchPlan?: string[];
  ventureContext?: Record<string, any>;
  evidence?: any[];
  facts?: any[];
  entities?: any[];
  relationships?: any[];
  validatedFacts?: any[];
  conflicts?: any[];
  reliability?: Record<string, any>;
  retrievedKnowledge?: any[];
  isAnalyzing?: boolean;
  activeAgentNode?: string;
  analysis?: any;
  chatMap?: Record<string, ChatMessage[]>;
  notifications?: NotificationItem[];
  auditLogs?: AuditEntry[];
}

interface ProjectStore {
  projects: Project[];
  activeId: string;
  setActive: (id: string) => void;
  addProject: (name: string, description: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addChatMessage: (projectId: string, agentName: string, message: ChatMessage) => void;
  addNotification: (projectId: string, notification: Omit<NotificationItem, "id" | "time" | "read">) => void;
  markNotificationsRead: (projectId: string) => void;
  dismissNotification: (projectId: string, notificationId: number) => void;
  addAuditEntry: (projectId: string, entry: Omit<AuditEntry, "ts" | "ip">) => void;
}

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

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: defaultProjects,
      activeId: "proj-1",

      setActive: (id) => set({ activeId: id }),

      addProject: (name, description) => {
        const newProject: Project = {
          id: `proj-${Date.now()}`,
          name,
          description,
          createdAt: new Date().toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          }),
          progress: 0,
          agentsDone: 0,
          totalAgents: 15,
          status: "intake",
          intakeComplete: false,
          chatMap: {},
          notifications: [],
          auditLogs: [
            {
              ts: new Date().toLocaleString(),
              user: "Founder",
              avatar: "FO",
              action: "created.project",
              target: name,
              ip: "127.0.0.1",
              severity: "info"
            }
          ]
        };
        set((s) => ({ projects: [...s.projects, newProject], activeId: newProject.id }));
      },

      updateProject: (id, patch) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },

      removeProject: (id) => {
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== id);
          return {
            projects: remaining,
            activeId: remaining.length > 0 ? remaining[remaining.length - 1].id : "",
          };
        });
      },

      addChatMessage: (projectId, agentName, message) => {
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const chatMap = p.chatMap || {};
            const history = chatMap[agentName] || [];
            return {
              ...p,
              chatMap: {
                ...chatMap,
                [agentName]: [...history, message]
              }
            };
          })
        }));
      },

      addNotification: (projectId, notification) => {
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const list = p.notifications || [];
            const newId = list.length > 0 ? Math.max(...list.map(n => n.id)) + 1 : 1;
            const item: NotificationItem = {
              ...notification,
              id: newId,
              time: "Just now",
              read: false
            };
            return {
              ...p,
              notifications: [item, ...list]
            };
          })
        }));
      },

      markNotificationsRead: (projectId) => {
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              notifications: (p.notifications || []).map(n => ({ ...n, read: true }))
            };
          })
        }));
      },

      dismissNotification: (projectId, notificationId) => {
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              notifications: (p.notifications || []).filter(n => n.id !== notificationId)
            };
          })
        }));
      },

      addAuditEntry: (projectId, entry) => {
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const logs = p.auditLogs || [];
            const item: AuditEntry = {
              ...entry,
              ts: new Date().toLocaleString("en-GB"),
              ip: "127.0.0.1"
            };
            return {
              ...p,
              auditLogs: [item, ...logs]
            };
          })
        }));
      }
    }),
    {
      name: "startupos-projects",       // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
