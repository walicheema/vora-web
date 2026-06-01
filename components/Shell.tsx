import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen sm:px-4 sm:py-7">
      <div className="mx-auto flex min-h-screen w-full max-w-[500px] flex-col overflow-hidden bg-vora-paper sm:min-h-[calc(100vh-3.5rem)] sm:rounded-[34px] sm:border sm:border-vora-line/80 sm:shadow-card">
        <header className="flex items-center justify-between border-b border-vora-line/70 px-5 py-4">
          <Link href="/" className="text-[22px] font-black tracking-[-0.04em] text-vora-ink">
            Vora
          </Link>
          <Link href="/profile" className="rounded-full border border-vora-line bg-vora-paper2 px-3 py-1.5 text-sm font-semibold text-vora-muted transition hover:border-vora-olive hover:text-vora-oliveDark">
            You
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </main>
  );
}

export function PageSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`px-5 py-5 ${className}`}>{children}</section>;
}

export function PageHeader({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.2em] text-vora-olive">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-black leading-[1.02] tracking-[-0.06em] text-vora-ink">{title}</h1>
        {body ? <p className="mt-2 text-sm leading-6 text-vora-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}
