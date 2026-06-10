"use client";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: number;
  icon?: string;
}

export default function StatCard({ label, value, sub, color = "#6366f1", trend, icon }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--muted-fg)" }}>{label}</span>
        {icon && (
          <span className="text-lg w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: `${color}20`, color }}>
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</div>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className="text-xs font-medium" style={{ color: trend >= 0 ? "var(--success)" : "var(--danger)" }}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs" style={{ color: "var(--muted-fg)" }}>{sub}</span>}
        </div>
      )}
    </motion.div>
  );
}
