import { cn } from "@/lib/utils";
import React from "react";
import { highlight } from "sugar-high";

interface CodeProps {
  children: string;
  className?: string;
}

export function Code({ children, className, ...props }: CodeProps) {
  const codeHTML = highlight(children);
  return (
    <code
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      className={cn("text-sm", className)}
      {...props}
    />
  );
}
