import { cn } from "@/utils/cn";
import React from "react";

interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
}

export function SectionHeading({ title, subtitle, align = "left", className, ...props }: SectionHeadingProps) {
  return (
    <div className={cn("mb-8 sm:mb-12 flex flex-col gap-3", {
      "text-left": align === "left",
      "text-center items-center": align === "center",
      "text-right items-end": align === "right",
    }, className)} {...props}>
      <h2 className="text-3xl md:text-4xl font-bold font-heading text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-white/60 max-w-2xl font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
}
