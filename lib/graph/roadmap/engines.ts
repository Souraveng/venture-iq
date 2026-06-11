// lib/graph/roadmap/engines.ts
import { Milestone } from "./types";

export class MilestoneDependencyEngine {
  /**
   * Programmatically detects and breaks cyclic dependencies among milestones,
   * then sorts the milestones topologically.
   */
  public static sortAndClean(milestones: Milestone[]): Milestone[] {
    const adj: Record<string, string[]> = {};
    const milestoneMap: Record<string, Milestone> = {};
    
    // Initialize map and adj list
    for (const ms of milestones) {
      milestoneMap[ms.id] = ms;
      adj[ms.id] = [...ms.dependencies];
    }

    const visited: Record<string, number> = {}; // 0 = unvisited, 1 = visiting, 2 = visited
    const order: string[] = [];
    const hasCycle = { value: false };

    function dfs(u: string) {
      visited[u] = 1;
      const neighbors = adj[u] || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const v = neighbors[i];
        if (!milestoneMap[v]) {
          // Dependency doesn't exist, remove it
          neighbors.splice(i, 1);
          continue;
        }
        if (visited[v] === 1) {
          // Cycle detected! Remove this back-edge to break the cycle.
          console.warn(`[DependencyEngine] Cycle detected between ${u} and ${v}. Pruning dependency.`);
          neighbors.splice(i, 1);
          hasCycle.value = true;
        } else if (!visited[v]) {
          dfs(v);
        }
      }
      visited[u] = 2;
      order.push(u);
    }

    for (const ms of milestones) {
      if (!visited[ms.id]) {
        dfs(ms.id);
      }
    }

    // If cycle was broken, update the dependency lists on the actual objects
    if (hasCycle.value) {
      for (const ms of milestones) {
        ms.dependencies = adj[ms.id] || [];
      }
    }

    // Topological sort order from DFS has dependency roots pushed first
    return order.map(id => milestoneMap[id]).filter(Boolean);
  }
}

export class TimelineAlignmentEngine {
  private static TIMELINE_STRINGS = [
    "Phase 1: Validation (Months 1–3)",
    "Phase 2: MVP (Months 4–9)",
    "Phase 3: Growth (Months 10–18)",
    "Phase 4: Fundraising (Months 16–20)",
    "Phase 5: Scale (Month 21+)"
  ];

  public static getTimelineIndex(timeline: string): number {
    const lower = timeline.toLowerCase();
    if (lower.includes("phase 1") || lower.includes("validation") || lower.includes("30") || lower.includes("month 1-3") || lower.includes("months 1-3")) return 0;
    if (lower.includes("phase 2") || lower.includes("mvp") || lower.includes("90") || lower.includes("month 4-9") || lower.includes("months 4-9")) return 1;
    if (lower.includes("phase 3") || lower.includes("growth") || lower.includes("1-year") || lower.includes("months 10-18") || lower.includes("month 10-18")) return 2;
    if (lower.includes("phase 4") || lower.includes("fundraising") || lower.includes("months 16-20") || lower.includes("month 16-20")) return 3;
    if (lower.includes("phase 5") || lower.includes("scale") || lower.includes("month 21") || lower.includes("months 21")) return 4;
    return 0; // Default
  }

  /**
   * Programmatically aligns milestone timelines to ensure a milestone is never scheduled
   * for a phase prior to its dependencies.
   */
  public static align(milestones: Milestone[]): Milestone[] {
    const milestoneMap: Record<string, Milestone> = {};
    for (const ms of milestones) {
      milestoneMap[ms.id] = ms;
    }

    // Iterate in topological order (assumes milestones are already sorted)
    for (const ms of milestones) {
      let maxDepIndex = -1;
      let hasDependencies = false;

      for (const depId of ms.dependencies) {
        const dep = milestoneMap[depId];
        if (dep) {
          hasDependencies = true;
          const depIndex = this.getTimelineIndex(dep.timeline);
          if (depIndex > maxDepIndex) {
            maxDepIndex = depIndex;
          }
        }
      }

      if (hasDependencies && maxDepIndex !== -1) {
        const currentIndex = this.getTimelineIndex(ms.timeline);
        if (currentIndex < maxDepIndex) {
          console.warn(`[TimelineEngine] Milestone ${ms.id} (${ms.goal}) timeline was ${ms.timeline} but depended on milestones in Phase ${maxDepIndex + 1}. Bumping timeline.`);
          ms.timeline = this.TIMELINE_STRINGS[maxDepIndex];
        }
      }
    }

    return milestones;
  }
}
