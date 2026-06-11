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
  syncFromDatabase: () => Promise<void>;
  addProject: (name: string, description: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addChatMessage: (projectId: string, agentName: string, message: ChatMessage) => void;
  addNotification: (projectId: string, notification: Omit<NotificationItem, "id" | "time" | "read">) => void;
  markNotificationsRead: (projectId: string) => void;
  dismissNotification: (projectId: string, notificationId: number) => void;
  addAuditEntry: (projectId: string, entry: Omit<AuditEntry, "ts" | "ip">) => void;
}

const syncProjectToDb = async (project: Project) => {
  try {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
  } catch (err) {
    console.error("Error syncing project to PostgreSQL:", err);
  }
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeId: "",

      setActive: (id) => set({ activeId: id }),

      syncFromDatabase: async () => {
        try {
          const res = await fetch("/api/projects");
          if (res.ok) {
            const data = await res.json();
            set({ projects: data });
            const currentActiveId = get().activeId;
            if (data.length > 0 && (!currentActiveId || !data.find((p: any) => p.id === currentActiveId))) {
              set({ activeId: data[0].id });
            }
          }
        } catch (error) {
          console.error("Failed to sync from database:", error);
        }
      },

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
        syncProjectToDb(newProject);
      },

      updateProject: (id, patch) => {
        set((s) => {
          const updated = s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
          const targetProj = updated.find((p) => p.id === id);
          if (targetProj) syncProjectToDb(targetProj);
          return { projects: updated };
        });
      },

      removeProject: (id) => {
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== id);
          return {
            projects: remaining,
            activeId: remaining.length > 0 ? remaining[remaining.length - 1].id : "",
          };
        });
        fetch(`/api/projects/${id}`, { method: "DELETE" }).catch((err) =>
          console.error("Failed to delete project:", err)
        );
      },

      addChatMessage: (projectId, agentName, message) => {
        set((s) => {
          const updated = s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const chatMap = p.chatMap || {};
            const history = chatMap[agentName] || [];
            const newProj = {
              ...p,
              chatMap: {
                ...chatMap,
                [agentName]: [...history, message]
              }
            };
            syncProjectToDb(newProj);
            return newProj;
          });
          return { projects: updated };
        });
      },

      addNotification: (projectId, notification) => {
        set((s) => {
          const updated = s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const list = p.notifications || [];
            const newId = list.length > 0 ? Math.max(...list.map(n => n.id)) + 1 : 1;
            const item: NotificationItem = {
              ...notification,
              id: newId,
              time: "Just now",
              read: false
            };
            const newProj = {
              ...p,
              notifications: [item, ...list]
            };
            syncProjectToDb(newProj);
            return newProj;
          });
          return { projects: updated };
        });
      },

      markNotificationsRead: (projectId) => {
        set((s) => {
          const updated = s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const newProj = {
              ...p,
              notifications: (p.notifications || []).map(n => ({ ...n, read: true }))
            };
            syncProjectToDb(newProj);
            return newProj;
          });
          return { projects: updated };
        });
      },

      dismissNotification: (projectId, notificationId) => {
        set((s) => {
          const updated = s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const newProj = {
              ...p,
              notifications: (p.notifications || []).filter(n => n.id !== notificationId)
            };
            syncProjectToDb(newProj);
            return newProj;
          });
          return { projects: updated };
        });
      },

      addAuditEntry: (projectId, entry) => {
        set((s) => {
          const updated = s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const logs = p.auditLogs || [];
            const item: AuditEntry = {
              ...entry,
              ts: new Date().toLocaleString("en-GB"),
              ip: "127.0.0.1"
            };
            const newProj = {
              ...p,
              auditLogs: [item, ...logs]
            };
            syncProjectToDb(newProj);
            return newProj;
          });
          return { projects: updated };
        });
      }
    }),
    {
      name: "startupos-projects-meta", // Persist only the active project ID selected in the browser
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeId: state.activeId }),
    }
  )
);
