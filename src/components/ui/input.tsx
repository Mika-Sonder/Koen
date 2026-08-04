import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn("focus-ring flex h-11 w-full rounded-xl border bg-background/60 px-3.5 text-sm shadow-sm transition placeholder:text-muted-foreground disabled:opacity-50", className)} ref={ref} {...props} />
));
Input.displayName = "Input";
