"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { getTable, getTableRecommendations, getTasteProfile, joinTable, submitTableSignals } from "@/lib/api";
import { getDisplayName, getSessionId, setTasteSetupDismissed } from "@/lib/session";
import { BUDGET_SIGNAL_KEYS, optionFromKey, selectedOptionsFromKeys, signalKey, sameKeys, type SignalOption } from "@/lib/signals";
import type { TableRecommendationsResponse, TableResponse } from "@/lib/types";
import { AppShell, PageSection } from "@/components/Shell";
import { Button, Card, EmptyState, ErrorNotice, ErrorState, Skeleton } from "@/components/UI";
import { TableFilters } from "@/components/TableFilters";
import { TasteSetupDrawer } from "@/components/TasteSetup";
import { RestaurantRecommendationCard } from "@/components/RestaurantCard";

export default function TablePage() {
  const tableId = useParams<{ tableId: string }>().tableId;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<TableRecommendationsResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tasteOpen, setTasteOpen] = useState(false);
  const [tasteSkipped, setTasteSkipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestKeysRef = useRef<string[]>([]);
  const inFlightRef = useRef(false);
  const queuedKeysRef = useRef<string[] | null>(null);
  const { data: table, isLoading, mutate: mutateTable } = useSWR<TableResponse>(tableId ? ["table", tableId] : null, () => getTable(tableId), { shouldRetryOnError: false });
  const { data: tasteProfile, mutate: mutateTaste } = useSWR("taste-profile", getTasteProfile, { shouldRetryOnError: false });

  useEffect(() => { setSessionId(getSessionId()); }, []);
  useEffect(() => { void refreshRecommendations(); }, [tableId]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);
  useEffect(() => {
    if (!table || !sessionId || joining || table.members.some((member) => member.session_id === sessionId)) return;
    setJoining(true);
    joinTable(table.id, getDisplayName()).then((joined) => mutateTable(joined, { revalidate: false })).catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Could not join this table.")).finally(() => setJoining(false));
  }, [table?.id, sessionId]);
  useEffect(() => {
    if (!table || !sessionId) return;
    const member = table.members.find((item) => item.session_id === sessionId);
    if (!member) return;
    const keys = table.mood_signals.filter((signal) => signal.member_id === member.id).map((signal) => signalKey({ type: signal.signal_type, value: signal.signal_value, label: signal.signal_value })).filter((key) => Boolean(optionFromKey(key)));
    setSelectedKeys(keys); latestKeysRef.current = keys;
  }, [table?.id, sessionId]);

  async function refreshRecommendations() {
    if (!tableId) return;
    setRecommendationError(null);
    try { setRecommendations(await getTableRecommendations(tableId)); }
    catch (nextError) { setRecommendationError(nextError instanceof Error ? nextError.message : "Could not load recommendations."); }
  }

  function applyKeys(next: string[]) {
    setSelectedKeys(next); latestKeysRef.current = next; setPending(true); setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void performUpdate(latestKeysRef.current), 1600);
  }
  function toggle(option: SignalOption) { const key = signalKey(option); applyKeys(selectedKeys.includes(key) ? selectedKeys.filter((item) => item !== key) : [...selectedKeys, key]); }
  function budget(option: SignalOption) { const key = signalKey(option); applyKeys(selectedKeys.includes(key) ? selectedKeys.filter((item) => !BUDGET_SIGNAL_KEYS.has(item)) : [...selectedKeys.filter((item) => !BUDGET_SIGNAL_KEYS.has(item)), key]); }
  async function performUpdate(keys: string[]) {
    if (!table) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inFlightRef.current) { queuedKeysRef.current = keys; return; }
    inFlightRef.current = true; setUpdating(true); setRecommendationError(null);
    try {
      const nextTable = await submitTableSignals(table.id, selectedOptionsFromKeys(keys));
      const nextRecommendations = await getTableRecommendations(table.id);
      if (sameKeys(keys, latestKeysRef.current)) { await mutateTable(nextTable, { revalidate: false }); setRecommendations(nextRecommendations); setPending(false); }
    } catch (nextError) { setRecommendationError(nextError instanceof Error ? nextError.message : "Could not update recommendations."); }
    finally {
      inFlightRef.current = false; setUpdating(false);
      const queued = queuedKeysRef.current; queuedKeysRef.current = null;
      if (queued && !sameKeys(queued, keys)) void performUpdate(queued);
    }
  }
  async function copyInvite() { await navigator.clipboard.writeText(`${window.location.origin}/table/${tableId}`); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
  async function handleTasteSaved() { await mutateTaste(); await refreshRecommendations(); }

  if (isLoading) return <AppShell><PageSection className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-36" /><Skeleton className="h-48" /></PageSection></AppShell>;
  if (!table) return <AppShell><PageSection><EmptyState title="Table not found" body="This invite link may be expired or copied incorrectly." /></PageSection></AppShell>;

  return (
    <AppShell>
      <PageSection className="space-y-5">
        <div className="flex items-center justify-between"><Link href="/" className="text-sm font-bold text-vora-muted">← Home</Link><Button variant="secondary" onClick={copyInvite}>{copied ? "Copied" : "Invite / share"}</Button></div>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-vora-olive">Table</p>
          <h1 className="mt-2 text-4xl font-black leading-none tracking-[-0.07em] text-vora-ink">{table.name}</h1>
          <p className="mt-3 text-sm font-semibold text-vora-muted">{[table.location_neighborhood, table.location_city, table.location_state].filter(Boolean).join(", ") || "Location flexible"}{table.planned_for_at ? ` · ${formatDate(table.planned_for_at)}` : ""}</p>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-vora-olive">{table.members.length} member{table.members.length === 1 ? "" : "s"}{joining ? " · joining..." : ""}</p>
          {table.members.length === 1 ? <p className="mt-2 text-sm text-vora-muted">Recommendations improve when friends join.</p> : null}
        </Card>
        {!tasteProfile?.onboarding_completed && !tasteSkipped ? <Card className="bg-vora-paper"><p className="text-xs font-black uppercase tracking-[0.2em] text-vora-olive">Taste setup</p><h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-vora-ink">Add your taste so Vora can rank the table better.</h2><div className="mt-4 flex gap-2"><Button onClick={() => setTasteOpen(true)}>Add my taste</Button><Button variant="ghost" onClick={() => { setTasteSkipped(true); setTasteSetupDismissed(true); }}>Skip for now</Button></div></Card> : null}
        <CompatibilityCard recommendations={recommendations} loading={!recommendations && !recommendationError} singleMember={table.members.length === 1} />
        <Card className="space-y-3"><div><h2 className="text-xl font-black tracking-[-0.04em] text-vora-ink">Table filters</h2><p className="mt-1 text-sm text-vora-muted">Tune the shortlist without starting over.</p></div><TableFilters selectedKeys={selectedKeys} pending={pending} loading={updating} onToggle={toggle} onBudget={budget} onUpdate={() => void performUpdate(selectedKeys)} /></Card>
        <ErrorNotice message={error} />
        <div className="space-y-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-vora-subtle">Shortlist</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-vora-ink">Top restaurants for the table</h2></div>
          {recommendationError ? <ErrorState title="Recommendations did not load" body={recommendationError} onRetry={() => void refreshRecommendations()} /> : !recommendations ? <><Skeleton className="h-52" /><Skeleton className="h-52" /></> : !recommendations.recommendations.length ? <div><EmptyState title="No strong matches yet" body="Try a broader context and update the shortlist." /><Button variant="secondary" className="mt-3 w-full" onClick={() => void performUpdate(selectedKeys)}>Update recommendations</Button></div> : recommendations.recommendations.slice(0, 3).map((restaurant, index) => <RestaurantRecommendationCard key={restaurant.id} tableId={table.id} restaurant={restaurant} rank={index + 1} />)}
        </div>
      </PageSection>
      <TasteSetupDrawer open={tasteOpen} onClose={() => setTasteOpen(false)} onSaved={() => void handleTasteSaved()} />
    </AppShell>
  );
}

function CompatibilityCard({ recommendations, loading, singleMember }: { recommendations: TableRecommendationsResponse | null; loading: boolean; singleMember: boolean }) {
  if (loading) return <Skeleton className="h-40" />;
  if (!recommendations) return null;
  const { compatibility } = recommendations;
  return <Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-vora-subtle">Compatibility</p><h2 className="mt-1 text-3xl font-black tracking-[-0.06em] text-vora-ink">{compatibility.compatibility_score}%</h2></div><span className="rounded-full bg-vora-olive px-3 py-1.5 text-xs font-black text-white">{compatibility.overlap_strength}</span></div><p className="mt-3 text-sm leading-6 text-vora-muted">{singleMember ? "One taste profile is guiding this table." : compatibility.summary}</p><div className="mt-4 flex flex-wrap gap-2">{compatibility.shared_preferences.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-vora-paper px-3 py-1.5 text-xs font-black text-vora-muted">{item}</span>)}</div></Card>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
