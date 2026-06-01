"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { getDishPicks } from "@/lib/api";
import type { TableDishPicksResponse } from "@/lib/types";
import { AppShell, PageSection } from "@/components/Shell";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/UI";
import { DishPickCard } from "@/components/DishPickCard";

export default function RestaurantDetailPage() {
  const { tableId, restaurantId } = useParams<{ tableId: string; restaurantId: string }>();
  const { data, error, isLoading, mutate } = useSWR<TableDishPicksResponse>(tableId && restaurantId ? ["dish-picks", tableId, restaurantId] : null, () => getDishPicks(tableId, restaurantId), { shouldRetryOnError: false });
  return <AppShell><PageSection className="space-y-5"><Link href={`/table/${tableId}`} className="text-sm font-bold text-vora-muted">← Back to table</Link>{isLoading ? <><Skeleton className="h-32" /><Skeleton className="h-52" /><Skeleton className="h-52" /></> : error ? <ErrorState title="Dish picks did not load" body={error instanceof Error ? error.message : "Could not load dish picks."} onRetry={() => void mutate()} /> : data ? <RestaurantContent data={data} /> : <EmptyState title="No dish picks" body="Menu data is still being cleaned for this restaurant." />}</PageSection></AppShell>;
}

function RestaurantContent({ data }: { data: TableDishPicksResponse }) {
  const hasPicks = data.members.some((member) => member.dish_picks.length);
  return <><Card><p className="text-xs font-black uppercase tracking-[0.2em] text-vora-olive">Restaurant</p><h1 className="mt-2 text-4xl font-black leading-none tracking-[-0.07em] text-vora-ink">{data.restaurant.name}</h1><p className="mt-3 text-sm font-semibold lowercase text-vora-muted">{[data.restaurant.neighborhood, data.restaurant.cuisine_tags.slice(0, 2).join(" / "), data.restaurant.price_tier].filter(Boolean).join(" · ")}</p></Card><div><p className="text-xs font-black uppercase tracking-[0.2em] text-vora-subtle">Best for the table</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-vora-ink">Dish picks for each person</h2></div>{!hasPicks ? <EmptyState title="Menu data is still being cleaned" body="Vora does not have confident dish picks for this restaurant yet." /> : data.members.map((member) => <Card key={member.member_id} className="space-y-3"><div className="flex items-center justify-between gap-2"><h3 className="text-xl font-black tracking-[-0.04em] text-vora-ink">{member.display_name}</h3><span className="rounded-full bg-vora-paper px-3 py-1 text-xs font-black text-vora-muted">{member.has_taste_profile ? "Taste profile" : "Quick signals"}</span></div>{member.dish_picks.slice(0, 5).map((dish, index) => <DishPickCard key={`${dish.dish_id}-${index}`} dish={dish} rank={index + 1} />)}</Card>)}</>;
}
