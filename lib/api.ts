import { getClientId, getSessionId } from "./session";
import { getSupabaseAccessToken } from "./supabase";
import type {
  ApiErrorShape,
  LocationPayload,
  OnboardingDishCard,
  OnboardingTasteProfile,
  SwipeAction,
  TableDishPicksResponse,
  TableRecommendationsResponse,
  TableResponse,
  TablesMineResponse,
  UserProfile
} from "./types";
import type { SignalOption } from "./signals";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://vora-api-fx7m.onrender.com").replace(/\/$/, "");
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = await getSupabaseAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  headers.set("X-Session-Id", getSessionId());
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    let details: unknown = null;
    try {
      details = (await response.json()) as ApiErrorShape;
    } catch {
      details = await response.text().catch(() => null);
    }
    throw new ApiError(errorMessage(details, response.status), response.status, details);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function errorMessage(details: unknown, status: number): string {
  if (typeof details === "string" && details.trim()) return details;
  if (details && typeof details === "object") {
    const shape = details as ApiErrorShape;
    if (typeof shape.message === "string") return shape.message;
    if (typeof shape.detail === "string") return shape.detail;
    if (shape.detail && typeof shape.detail === "object") return JSON.stringify(shape.detail);
  }
  if (status === 404) return "Not found.";
  if (status >= 500) return "Backend unavailable.";
  return "Something went wrong.";
}

function sessionBody(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    session_id: getSessionId(),
    client_id: getClientId(),
    ...extra
  };
}

export async function createTable(input: { name: string } & LocationPayload): Promise<TableResponse> {
  return apiFetch<TableResponse>("/tables", {
    method: "POST",
    body: JSON.stringify(sessionBody(input))
  });
}

export async function updateTable(tableId: string, input: { planned_for_at?: string | null }): Promise<TableResponse> {
  return apiFetch<TableResponse>(`/tables/${tableId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function getTable(tableId: string): Promise<TableResponse> {
  const params = new URLSearchParams({ session_id: getSessionId(), client_id: getClientId() });
  return apiFetch<TableResponse>(`/tables/${tableId}?${params.toString()}`);
}

export async function getMyTables(): Promise<TablesMineResponse> {
  const params = new URLSearchParams({ session_id: getSessionId(), client_id: getClientId() });
  return apiFetch<TablesMineResponse>(`/tables/mine?${params.toString()}`);
}

export async function lookupInvite(inviteCode: string): Promise<{ table_id: string }> {
  return apiFetch<{ table_id: string }>(`/tables/by-invite/${encodeURIComponent(inviteCode)}`);
}

export async function joinTable(tableId: string, guestName: string): Promise<TableResponse> {
  return apiFetch<TableResponse>(`/tables/${tableId}/join`, {
    method: "POST",
    body: JSON.stringify(
      sessionBody({
        guest_name: guestName.trim() || "Guest",
        taste_profile_id: getSessionId()
      })
    )
  });
}

export async function submitTableSignals(tableId: string, options: SignalOption[]): Promise<TableResponse> {
  return apiFetch<TableResponse>(`/tables/${tableId}/signals`, {
    method: "POST",
    body: JSON.stringify(
      sessionBody({
        signals: options.map((option) => ({
          signal_type: option.type,
          signal_value: option.value,
          weight: 1.0
        }))
      })
    )
  });
}

export async function getTableRecommendations(tableId: string): Promise<TableRecommendationsResponse> {
  return apiFetch<TableRecommendationsResponse>(`/tables/${tableId}/recommendations`);
}

export async function getDishPicks(tableId: string, restaurantId: string): Promise<TableDishPicksResponse> {
  return apiFetch<TableDishPicksResponse>(`/tables/${tableId}/restaurants/${restaurantId}/dish-picks`);
}

export async function getOnboardingCards(): Promise<OnboardingDishCard[]> {
  const response = await apiFetch<{ cards: OnboardingDishCard[] }>("/onboarding/dish-cards?limit=30");
  return response.cards;
}

export async function recordOnboardingSwipes(
  swipes: Array<{ card_id: string; action: SwipeAction }>,
  explicitAvoidances: string[]
): Promise<OnboardingTasteProfile> {
  return apiFetch<OnboardingTasteProfile>("/onboarding/swipes", {
    method: "POST",
    body: JSON.stringify(
      sessionBody({
        swipes,
        explicit_avoidances: explicitAvoidances
      })
    )
  });
}

export async function getTasteProfile(): Promise<OnboardingTasteProfile> {
  const params = new URLSearchParams({ session_id: getSessionId(), client_id: getClientId() });
  return apiFetch<OnboardingTasteProfile>(`/taste-profile?${params.toString()}`);
}

export async function finalizeTasteProfile(explicitAvoidances: string[]): Promise<OnboardingTasteProfile> {
  return apiFetch<OnboardingTasteProfile>("/taste-profile/finalize", {
    method: "POST",
    body: JSON.stringify(sessionBody({ explicit_avoidances: explicitAvoidances }))
  });
}

export async function updateTastePreferences(input: {
  dietary_preferences: string[];
  food_avoidances: string[];
  favorite_cuisines: string[];
  favorite_flavors: string[];
}): Promise<OnboardingTasteProfile> {
  return apiFetch<OnboardingTasteProfile>("/taste-profile/preferences", {
    method: "PATCH",
    body: JSON.stringify(sessionBody(input))
  });
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me");
}

export async function updateCurrentUserProfile(input: { name?: string; username?: string }): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}
