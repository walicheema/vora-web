"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { createTable, getMyTables, joinTable, lookupInvite, submitTableSignals, updateTable } from "@/lib/api";
import { getDisplayName, getSessionId, setDisplayName } from "@/lib/session";
import { BUDGET_SIGNAL_KEYS, selectedOptionsFromKeys, signalKey, type SignalOption } from "@/lib/signals";
import type { LocationPayload, TableSummary } from "@/lib/types";
import { AppShell, PageHeader, PageSection } from "@/components/Shell";
import { BottomActionBar, Button, Card, EmptyState, ErrorNotice, Input, Label, Skeleton, StepCard } from "@/components/UI";
import { TasteSetupDrawer } from "@/components/TasteSetup";
import { TableFilters } from "@/components/TableFilters";

const DEFAULT_LOCATION: LocationPayload = { location_lat: null, location_lng: null, location_city: "Washington", location_state: "DC", location_neighborhood: null };

export default function HomePage() {
  const router = useRouter();
  const { data: mine, isLoading, mutate } = useSWR("my-tables", getMyTables, { shouldRetryOnError: false });
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Dinner Tonight");
  const [displayName, setDisplayNameState] = useState("Guest");
  const [joinValue, setJoinValue] = useState("");
  const [plannedFor, setPlannedFor] = useState("");
  const [manualLocation, setManualLocation] = useState("Washington, DC");
  const [location, setLocation] = useState<LocationPayload>(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState("Using Washington, DC");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tasteOpen, setTasteOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getSessionId(); setDisplayNameState(getDisplayName()); }, []);
  const selectedOptions = useMemo(() => selectedOptionsFromKeys(selectedKeys), [selectedKeys]);

  function toggleSignal(option: SignalOption) {
    const key = signalKey(option);
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function selectBudget(option: SignalOption) {
    const key = signalKey(option);
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => !BUDGET_SIGNAL_KEYS.has(item)) : [...current.filter((item) => !BUDGET_SIGNAL_KEYS.has(item)), key]);
  }

  function parseLocation(value: string): LocationPayload {
    const [city, state] = value.split(",").map((part) => part.trim());
    return { location_lat: null, location_lng: null, location_city: city || "Washington", location_state: state || null, location_neighborhood: null };
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) return setLocationStatus("Browser location unavailable. Using manual location.");
    setLocationStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({ location_lat: position.coords.latitude, location_lng: position.coords.longitude, location_city: null, location_state: null, location_neighborhood: null });
      setLocationStatus("Using your browser location");
    }, () => setLocationStatus("Location off. Using manual location."), { enableHighAccuracy: true, timeout: 8000 });
  }

  async function handleCreate() {
    setCreating(true); setError(null);
    try {
      setDisplayName(displayName);
      const table = await createTable({ name: name.trim() || "Dinner Tonight", ...(location.location_lat ? location : parseLocation(manualLocation)) });
      if (plannedFor) await updateTable(table.id, { planned_for_at: new Date(plannedFor).toISOString() });
      if (selectedOptions.length) await submitTableSignals(table.id, selectedOptions);
      await mutate();
      router.push(`/table/${table.id}`);
    } catch (createError) { setError(createError instanceof Error ? createError.message : "Could not create table."); }
    finally { setCreating(false); }
  }

  async function handleJoin() {
    if (!joinValue.trim()) return;
    setJoining(true); setError(null);
    try {
      setDisplayName(displayName);
      const tableId = await resolveTableId(joinValue.trim());
      await joinTable(tableId, displayName);
      await mutate();
      router.push(`/table/${tableId}`);
    } catch (joinError) { setError(joinError instanceof Error ? joinError.message : "That invite does not look valid."); }
    finally { setJoining(false); }
  }

  return (
    <AppShell>
      <PageSection className="space-y-6">
        <PageHeader title="Plan dinner around everyone's taste." body="Create a table, invite friends, and let Vora find the strongest fit for the group." />
        <ErrorNotice message={error} />

        <Card className="space-y-3">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-vora-olive">Start here</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-vora-ink">Create a Table</h2></div>
          {step === 1 ? <StepCard number={1} title="Table basics" body="Set the plan. You can keep it casual.">
            <div className="space-y-3">
              <div><Label>Your name</Label><Input value={displayName} onChange={(event) => setDisplayNameState(event.target.value)} /></div>
              <div><Label>Table name</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div>
              <div><Label>Location</Label><div className="flex gap-2"><Input value={manualLocation} onChange={(event) => { setManualLocation(event.target.value); setLocation(parseLocation(event.target.value)); setLocationStatus(`Using ${event.target.value || "manual location"}`); }} /><Button variant="secondary" onClick={useBrowserLocation}>Locate</Button></div><p className="mt-2 text-xs font-semibold text-vora-subtle">{locationStatus}</p></div>
              <div><Label>Date/time optional</Label><Input type="datetime-local" value={plannedFor} onChange={(event) => setPlannedFor(event.target.value)} /></div>
              <Button className="w-full" onClick={() => setStep(2)}>Continue to taste context</Button>
            </div>
          </StepCard> : <StepCard number={1} title="Table basics" body={`${name || "Dinner Tonight"} · ${manualLocation}`}><Button variant="ghost" className="px-0" onClick={() => setStep(1)}>Edit basics</Button></StepCard>}
          {step === 2 ? <StepCard number={2} title="Taste context" body="A few chips are enough to shape the first shortlist.">
            <TableFilters selectedKeys={selectedKeys} pending={false} loading={false} onToggle={toggleSignal} onBudget={selectBudget} onUpdate={() => undefined} />
            <Button className="mt-4 w-full" onClick={() => setStep(3)}>Review and create</Button>
          </StepCard> : <StepCard number={2} title="Taste context" body={selectedKeys.length ? `${selectedKeys.length} preference${selectedKeys.length === 1 ? "" : "s"} selected` : "Optional"} active={step > 1}><Button variant="ghost" className="px-0" onClick={() => setStep(2)}>{step > 2 ? "Edit context" : "Add context"}</Button></StepCard>}
          {step >= 3 ? <StepCard number={3} title="Ready to gather the table" body="You'll get a public invite link on the next screen."><Button variant="ghost" className="px-0" onClick={() => setTasteOpen(true)}>Add my personal taste first</Button></StepCard> : null}
          {step >= 3 ? <BottomActionBar><Button className="w-full" loading={creating} onClick={handleCreate}>Create Table</Button></BottomActionBar> : null}
        </Card>

        <Card className="space-y-3">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-vora-subtle">Have an invite?</p><h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-vora-ink">Join a Table</h2></div>
          <Input value={joinValue} onChange={(event) => setJoinValue(event.target.value)} placeholder="Paste invite link or code" />
          <Button className="w-full" variant="secondary" loading={joining} onClick={handleJoin}>Join Table</Button>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black tracking-[-0.03em] text-vora-ink">Your active tables</h2><Link href="/profile" className="text-sm font-bold text-vora-oliveDark">Save profile</Link></div>
          {isLoading ? <><Skeleton className="mb-3 h-20" /><Skeleton className="h-20" /></> : <TableList tables={mine?.tables || []} />}
        </div>
      </PageSection>
      <TasteSetupDrawer open={tasteOpen} onClose={() => setTasteOpen(false)} />
    </AppShell>
  );
}

async function resolveTableId(value: string): Promise<string> {
  const match = value.match(/\/table\/([0-9a-fA-F-]{20,})/);
  if (match?.[1]) return match[1];
  if (/^[0-9a-fA-F-]{30,}$/.test(value)) return value;
  return (await lookupInvite(value)).table_id;
}

function TableList({ tables }: { tables: TableSummary[] }) {
  if (!tables.length) return <EmptyState title="No tables yet" body="Your recent dinner plans will show up here." />;
  return <div className="space-y-3">{tables.map((table) => <Link key={table.id} href={`/table/${table.id}`} className="block rounded-[22px] border border-vora-line bg-vora-paper2 p-4 transition hover:border-vora-olive"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black tracking-[-0.03em] text-vora-ink">{table.name}</h3><p className="mt-1 text-sm text-vora-muted">{[table.location_neighborhood, table.location_city, table.location_state].filter(Boolean).join(", ") || "Location flexible"}</p></div><span className="rounded-full bg-vora-paper px-3 py-1 text-xs font-black text-vora-olive">{table.member_count} joined</span></div></Link>)}</div>;
}
