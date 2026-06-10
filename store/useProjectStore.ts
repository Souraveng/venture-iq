"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  financialIntel?: Record<string, any>;
  finalReport?: Record<string, any>;
  researchPlan?: string[];
  isAnalyzing?: boolean;
  analysis?: any;
}

interface ProjectStore {
  projects: Project[];
  activeId: string;
  setActive: (id: string) => void;
  addProject: (name: string, description: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

const defaultProjects: Project[] = [
  {
    id: "proj-1",
    name: "EV Startup Platform",
    description: "Electric vehicle charging infrastructure + fleet management SaaS for India market",
    createdAt: "Jun 8, 2026",
    progress: 68,
    agentsDone: 3,
    totalAgents: 5,
    status: "active",
    intakeComplete: true,
  },
  {
    id: "proj-2",
    name: "D2C Health Brand",
    description: "Direct-to-consumer Ayurvedic supplement brand targeting urban millennials",
    createdAt: "Jun 5, 2026",
    progress: 20,
    agentsDone: 1,
    totalAgents: 5,
    status: "draft",
    intakeComplete: true,
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
          totalAgents: 5,
          status: "intake",
          intakeComplete: false,
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
    }),
    {
      name: "startupos-projects",       // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
