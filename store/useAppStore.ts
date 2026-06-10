"use client";
import { create } from "zustand";

interface AppState {
  credits: number;
  maxCredits: number;
  activeAgents: number;
  runningTasks: number;
  completedTasks: number;
  successRate: number;
  notifications: number;
}

export const useAppStore = create<AppState>(() => ({
  credits: 8420,
  maxCredits: 10000,
  activeAgents: 7,
  runningTasks: 24,
  completedTasks: 1847,
  successRate: 98.2,
  notifications: 4,
}));
