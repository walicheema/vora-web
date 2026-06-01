"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { getCurrentUserProfile, getMyTables, getTasteProfile } from "@/lib/api";
import { getDisplayName, setDisplayName } from "@/lib/session";
import { getSupabaseClient } from "@/lib/supabase";
import type { OnboardingTasteProfile, UserProfile } from "@/lib/types";
import { AppShell, PageSection } from "@/components/Shell";
import { Button, Card, ErrorNotice, Input, Label, Skeleton } from "@/components/UI";
import { TasteSetupDrawer } from "@/components/TasteSetup";

export default function ProfilePage() {
  const { data: profile, mutate: mutateProfile } = useSWR<OnboardingTasteProfile>("taste-profile", getTasteProfile, { shouldRetryOnError: false });
  const { data: tables } = useSWR("my-tables", getMyTables, { shouldRetryOnError: false });
  const { data: user, error: userError, mutate: mutateUser } = useSWR<UserProfile | null>("current-user", async () => {
    try {
      return await getCurrentUserProfile();
    } catch {
      return null;
    }
  }, { shouldRetryOnError: false });
  const [name, setNameState] = useState("Guest");
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [tasteOpen, setTasteOpen] = useState(false);

  useEffect(() => {
    setNameState(user?.name || getDisplayName());
  }, [user?.name]);

  const topCuisines = useMemo(() => topKeys(profile?.liked_cuisines || {}, 5), [profile]);
  const topFlavors = useMemo(() => topKeys(profile?.liked_descriptors || {}, 7), [profile]);
  const avoidances = [...new Set([...(profile?.food_avoidances || []), ...(profile?.explicit_avoidances || [])])];

  async function saveLocalName() {
    setDisplayName(name);
    setAuthMessage("Saved your display name on this browser.");
  }

  async function signIn() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError("Supabase env vars are missing. Add them in .env.local or Vercel.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/profile` : undefined }
      });
      if (error) throw error;
      setAuthMessage("Check your email for the sign-in link.");
    } catch (signInError) {
      setAuthError(signInError instanceof Error ? signInError.message : "Could not send sign-in email.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    await mutateUser(null, { revalidate: false });
  }

  return (
    <AppShell>
      <PageSection className="space-y-5">
        <Link href="/" className="text-sm font-bold text-vora-muted">← Home</Link>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-vora-olive">You</p>
          <h1 className="mt-2 text-4xl font-black leading-none tracking-[-0.07em] text-vora-ink">Your taste, kept simple.</h1>
          <p className="mt-3 text-sm leading-6 text-vora-muted">Your profile helps Vora rank Tables. Sign-in stays optional.</p>
        </Card>

        <Card className="space-y-4">
          <div>
            <Label>Display name</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(event) => setNameState(event.target.value)} />
              <Button variant="secondary" onClick={saveLocalName}>Save</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Tables" value={tables?.tables.length ?? 0} />
            <Stat label="Cuisines" value={topCuisines.length} />
            <Stat label="Avoidances" value={avoidances.length} />
          </div>

          {!profile ? <Skeleton className="h-24" /> : (
            <div className="space-y-3">
              <TasteSummary title="Top cuisines" values={topCuisines} empty="No cuisines yet" />
              <TasteSummary title="Favorite flavors" values={topFlavors} empty="No flavors yet" />
              <TasteSummary title="Avoidances" values={avoidances} empty="No avoidances saved" />
            </div>
          )}
        </Card>

        <Button className="w-full" variant="secondary" onClick={() => setTasteOpen(true)}>Edit taste setup</Button>

        <Card className="space-y-4">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.05em] text-vora-ink">Save across devices</h2>
            <p className="mt-1 text-sm leading-6 text-vora-muted">Optional. Anonymous tables work in this browser; sign in to keep your profile and tables later.</p>
          </div>
          {user ? (
            <div className="space-y-3">
              <p className="rounded-2xl bg-vora-paper px-4 py-3 text-sm font-semibold text-vora-muted">Signed in as {user.email}</p>
              <Button variant="secondary" onClick={signOut}>Sign out</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              <Button loading={authLoading} onClick={signIn}>Send sign-in link</Button>
            </div>
          )}
          <ErrorNotice message={authError || (userError instanceof Error ? userError.message : null)} />
          {authMessage ? <p className="text-sm font-semibold text-vora-oliveDark">{authMessage}</p> : null}
        </Card>
      </PageSection>
      <TasteSetupDrawer open={tasteOpen} onClose={() => setTasteOpen(false)} onSaved={() => void mutateProfile()} />
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-vora-paper p-3 text-center">
      <p className="text-2xl font-black tracking-[-0.05em] text-vora-ink">{value}</p>
      <p className="text-xs font-black uppercase tracking-[0.15em] text-vora-subtle">{label}</p>
    </div>
  );
}

function TasteSummary({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-vora-subtle">{title}</p>
      {values.length === 0 ? <p className="text-sm text-vora-muted">{empty}</p> : (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={value} className="rounded-full bg-vora-paper px-3 py-1.5 text-xs font-black text-vora-muted">{value}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function topKeys(values: Record<string, number>, limit: number): string[] {
  return Object.entries(values)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)
    .slice(0, limit);
}
