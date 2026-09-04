import { cn } from "@/utils/cn";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div className={cn("glass-panel rounded-xl p-4 md:p-6 transition-all hover:bg-white/5", className)} {...props}>
      {children}
    </div>
  );
}
