"use client";

interface AgentBadgeProps {
  name: string;
  status?: "active" | "idle" | "offline";
  model?: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

const colors: Record<string, { bg: string; text: string }> = {
  Atlas:   { bg: "#6366f120", text: "#818cf8" },
  Vega:    { bg: "#10b98120", text: "#34d399" },
  Orion:   { bg: "#f59e0b20", text: "#fbbf24" },
  Lyra:    { bg: "#ec489920", text: "#f472b6" },
  Helios:  { bg: "#8b5cf620", text: "#a78bfa" },
  Echo:    { bg: "#14b8a620", text: "#2dd4bf" },
  Default: { bg: "#6366f120", text: "#818cf8" },
};

export default function AgentBadge({ name, status = "idle", model, size = "md", showStatus = true }: AgentBadgeProps) {
  const c = colors[name] ?? colors.Default;
  const sizeMap = { sm: "text-xs px-2 py-0.5", md: "text-xs px-2.5 py-1", lg: "text-sm px-3 py-1.5" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeMap[size]}`}
      style={{ background: c.bg, color: c.text }}
    >
      {showStatus && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === "active" ? "bg-emerald-400 shadow-[0_0_4px_#34d399]" :
          status === "idle"   ? "bg-amber-400" : "bg-gray-500"
        }`} />
      )}
      {name}
      {model && <span className="opacity-60 text-[10px]">· {model}</span>}
    </span>
  );
}
