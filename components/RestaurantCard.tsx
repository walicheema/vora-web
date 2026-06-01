import Link from "next/link";
import type { RestaurantRecommendation } from "@/lib/types";
import { Card } from "./UI";

export function RestaurantRecommendationCard({ tableId, restaurant, rank }: { tableId: string; restaurant: RestaurantRecommendation; rank: number }) {
  return (
    <Link href={`/table/${tableId}/restaurant/${restaurant.id}`} className="block">
      <Card className="transition hover:-translate-y-0.5 hover:border-vora-olive/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-vora-olive">#{rank} · {Math.round(restaurant.score * 100)}% match</p>
            <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-vora-ink">{restaurant.name}</h3>
            <p className="mt-1 text-sm font-semibold lowercase text-vora-muted">{[restaurant.neighborhood, restaurant.cuisine_tags.slice(0, 2).join(" / "), restaurant.price_tier].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-vora-muted">{restaurant.explanation}</p>
        {restaurant.representative_dishes.length ? <div className="mt-4 flex flex-wrap gap-2">{restaurant.representative_dishes.slice(0, 3).map((dish) => <span key={dish.id} className="rounded-full bg-vora-paper px-3 py-1.5 text-xs font-bold text-vora-muted">{dish.dish_name}</span>)}</div> : null}
        <span className="mt-4 inline-flex min-h-10 items-center rounded-full bg-vora-olive px-4 text-sm font-bold text-white">See dish picks</span>
      </Card>
    </Link>
  );
}

export const RestaurantCard = RestaurantRecommendationCard;
