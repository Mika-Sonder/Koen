import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/inicio" className={cn("focus-ring inline-flex items-center gap-3 rounded-lg", className)} aria-label="Koen, ir a inicio">
      <span className="relative size-9 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-muted shadow-lg shadow-violet-500/20">
        <Image src="/koen-brand.jpg" alt="" fill priority sizes="36px" className="object-cover object-center" />
      </span>
      {!compact && <span className="text-xl font-black tracking-[-0.04em]">KOEN</span>}
    </Link>
  );
}
