import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function PremiumBadge({ size = "md", className = "" }: PremiumBadgeProps) {
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";
  const text = size === "sm" ? "text-[10px]" : "text-xs";
  const iconSize = size === "sm" ? 10 : 12;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 font-semibold text-white shadow-sm ${padding} ${text} ${className}`}
      title="Acceso premium"
    >
      <Crown size={iconSize} className="fill-white" />
      Premium
    </span>
  );
}
