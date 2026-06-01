import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean }) {
  const base = "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "bg-vora-olive text-white hover:bg-vora-oliveDark",
    secondary: "border border-vora-line bg-vora-paper2 text-vora-ink hover:border-vora-olive",
    ghost: "text-vora-muted hover:bg-vora-paper2 hover:text-vora-ink",
    danger: "bg-vora-danger text-white"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? "Working..." : children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[26px] border border-vora-line bg-vora-paper2 p-4 shadow-sm ${className}`}>{children}</div>;
}

export function StepCard({ number, title, body, children, active = true }: { number: number; title: string; body?: string; children: ReactNode; active?: boolean }) {
  return (
    <div className={`rounded-[22px] border p-4 transition ${active ? "border-vora-line bg-vora-paper" : "border-vora-line/70 bg-vora-paper/45"}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${active ? "bg-vora-olive text-white" : "bg-vora-line text-vora-muted"}`}>{number}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black tracking-[-0.03em] text-vora-ink">{title}</h3>
          {body ? <p className="mt-1 text-sm leading-5 text-vora-muted">{body}</p> : null}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-2xl border border-vora-line bg-vora-paper px-4 py-3 text-[16px] text-vora-ink outline-none placeholder:text-vora-subtle focus:border-vora-olive ${className}`}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-vora-subtle">{children}</label>;
}

export function Chip({
  children,
  selected,
  onClick,
  className = ""
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-bold transition ${
        selected
          ? "border-vora-olive bg-vora-olive text-white"
          : "border-vora-line bg-vora-paper text-vora-muted hover:border-vora-olive hover:text-vora-oliveDark"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-vora-line/60 ${className}`} />;
}

export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="rounded-2xl border border-vora-danger/25 bg-vora-danger/10 px-4 py-3 text-sm font-semibold text-vora-danger">{message}</div>;
}

export function ErrorState({ title = "Something went wrong", body, onRetry }: { title?: string; body: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[24px] border border-vora-danger/25 bg-vora-danger/10 px-4 py-5">
      <h3 className="font-black tracking-[-0.02em] text-vora-danger">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-vora-muted">{body}</p>
      {onRetry ? <Button variant="secondary" className="mt-3" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-vora-line bg-vora-paper/50 px-4 py-7 text-center">
      <h3 className="text-lg font-black tracking-[-0.03em] text-vora-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-vora-muted">{body}</p>
    </div>
  );
}

export function BottomActionBar({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-20 -mx-5 border-t border-vora-line/80 bg-vora-paper/95 px-5 py-3 backdrop-blur">{children}</div>;
}
