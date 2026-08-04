import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur", className)} {...props} />;
}
