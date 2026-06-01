"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { finalizeTasteProfile, getOnboardingCards, getTasteProfile, recordOnboardingSwipes, updateTastePreferences } from "@/lib/api";
import { setTasteSetupDismissed } from "@/lib/session";
import type { OnboardingDishCard, OnboardingTasteProfile, SwipeAction } from "@/lib/types";
import { Modal } from "./Modal";
import { Button, Chip, ErrorNotice, Input, Label, Skeleton } from "./UI";

type SwipeMap = Record<string, SwipeAction>;

const CUISINES = ["Japanese", "Italian", "Indian", "Korean", "Thai", "Mexican", "Lebanese", "Ethiopian", "Chinese", "American"];
const FLAVORS = ["spicy", "garlicky", "creamy", "smoky", "bright", "umami", "tangy", "crisp", "rich", "herbaceous"];
const DIETARY = ["vegetarian", "vegan", "pescatarian", "halal", "kosher", "gluten free", "dairy free"];

export function TasteSetupDrawer({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { data: profile, mutate: mutateProfile } = useSWR<OnboardingTasteProfile>("taste-profile", getTasteProfile, { shouldRetryOnError: false });
  const { data: cards, error: cardsError, isLoading: cardsLoading } = useSWR<OnboardingDishCard[]>("onboarding-cards", getOnboardingCards, { shouldRetryOnError: false });
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);
  const [favoriteFlavors, setFavoriteFlavors] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [avoidanceInput, setAvoidanceInput] = useState("");
  const [avoidances, setAvoidances] = useState<string[]>([]);
  const [swipes, setSwipes] = useState<SwipeMap>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setAvoidances([...new Set([...(profile.food_avoidances || []), ...(profile.explicit_avoidances || [])])]);
    setDietary(profile.dietary_preferences || []);
    setFavoriteCuisines(Object.keys(profile.liked_cuisines || {}).slice(0, 8));
    setFavoriteFlavors(Object.keys(profile.liked_descriptors || {}).slice(0, 8));
  }, [profile]);

  const essentials = useMemo(() => (cards || []).slice(0, 8), [cards]);

  function toggle(values: string[], value: string, setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function addAvoidance() {
    const next = avoidanceInput.trim().toLowerCase();
    if (!next) return;
    if (!avoidances.includes(next)) setAvoidances([...avoidances, next]);
    setAvoidanceInput("");
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const swipePayload = Object.entries(swipes).map(([card_id, action]) => ({ card_id, action }));
      if (swipePayload.length) await recordOnboardingSwipes(swipePayload, avoidances);
      await updateTastePreferences({ dietary_preferences: dietary, food_avoidances: avoidances, favorite_cuisines: favoriteCuisines, favorite_flavors: favoriteFlavors });
      const nextProfile = await finalizeTasteProfile(avoidances);
      await mutateProfile(nextProfile, { revalidate: false });
      setTasteSetupDismissed(false);
      onSaved?.();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save taste setup.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Quick taste setup" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-6 text-vora-muted">Help Vora calibrate quickly. A few picks make every table sharper.</p>
        <ErrorNotice message={error} />
        <ChipSection label="Cuisines I like" values={CUISINES} selected={favoriteCuisines} onToggle={(value) => toggle(favoriteCuisines, value, setFavoriteCuisines)} />
        <ChipSection label="Flavors I like" values={FLAVORS} selected={favoriteFlavors} onToggle={(value) => toggle(favoriteFlavors, value, setFavoriteFlavors)} />
        <div>
          <Label>Foods I avoid</Label>
          <div className="flex gap-2">
            <Input value={avoidanceInput} onChange={(event) => setAvoidanceInput(event.target.value)} placeholder="beef, pork, shellfish..." onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAvoidance(); } }} />
            <Button type="button" variant="secondary" onClick={addAvoidance}>Add</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {avoidances.map((item) => <Chip key={item} selected onClick={() => setAvoidances(avoidances.filter((value) => value !== item))}>{item} x</Chip>)}
          </div>
        </div>
        <ChipSection label="Dietary preferences" values={DIETARY} selected={dietary} onToggle={(value) => toggle(dietary, value, setDietary)} />
        <div>
          <Label>Dish-swipe essentials</Label>
          <p className="mb-3 text-sm text-vora-muted">Use a few quick reactions. This is calibration, not a full onboarding flow.</p>
          {cardsLoading ? <><Skeleton className="mb-3 h-28" /><Skeleton className="h-28" /></> : cardsError || essentials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-vora-line bg-vora-paper2 p-3 text-sm leading-6 text-vora-muted">Dish cards are unavailable right now. Your taste chips will still be saved.</div>
          ) : <div className="space-y-3">{essentials.map((card) => <DishSwipeCard key={card.id} card={card} action={swipes[card.id]} onAction={(action) => setSwipes({ ...swipes, [card.id]: action })} />)}</div>}
        </div>
        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-vora-line bg-vora-paper px-5 pt-4">
          <Button className="flex-1" loading={saving} onClick={save}>Save taste setup</Button>
          <Button variant="ghost" onClick={onClose}>Skip for now</Button>
        </div>
      </div>
    </Modal>
  );
}

function ChipSection({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div><Label>{label}</Label><div className="flex flex-wrap gap-2">{values.map((value) => <Chip key={value} selected={selected.includes(value)} onClick={() => onToggle(value)}>{value}</Chip>)}</div></div>;
}

function DishSwipeCard({ card, action, onAction }: { card: OnboardingDishCard; action?: SwipeAction; onAction: (action: SwipeAction) => void }) {
  return (
    <div className="rounded-3xl border border-vora-line bg-vora-paper2 p-3">
      <h3 className="font-black tracking-[-0.02em] text-vora-ink">{card.dish_name}</h3>
      <p className="mt-1 text-sm leading-5 text-vora-muted">{card.display_description}</p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <SwipeButton label="Love" selected={action === "love"} onClick={() => onAction("love")} />
        <SwipeButton label="Like" selected={action === "like"} onClick={() => onAction("like")} />
        <SwipeButton label="Not for me" selected={action === "dislike"} onClick={() => onAction("dislike")} />
        <SwipeButton label="Skip" selected={action === "skip"} onClick={() => onAction("skip")} />
      </div>
    </div>
  );
}

function SwipeButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl border px-1 py-2 text-[11px] font-black transition ${selected ? "border-vora-olive bg-vora-olive text-white" : "border-vora-line bg-vora-paper text-vora-muted"}`}>{label}</button>;
}
