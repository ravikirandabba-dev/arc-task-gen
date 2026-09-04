import { cn } from "@/utils/cn";
import React from "react";
import { GlassCard } from "./GlassCard";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon, trend, className, ...props }: MetricCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-4", className)} {...props}>
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-white/60 font-sans">{title}</p>
        {icon && <div className="text-[var(--primary)]">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold font-heading text-white">{value}</h3>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-[var(--accent)]" : "text-red-400"
            )}
          >
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </GlassCard>
  );
}
