export type TableSignalType = "craving" | "avoid" | "vibe" | "intensity";
export type SwipeAction = "dislike" | "like" | "love" | "skip";

export type TableMember = {
  id: string;
  session_id: string | null;
  user_id: string | null;
  guest_name: string | null;
  taste_profile_id: string | null;
  is_guest: boolean;
  joined_at: string;
  last_active_at: string | null;
};

export type TableSignal = {
  id: string;
  member_id: string | null;
  signal_type: TableSignalType;
  signal_value: string;
  signal_value_raw: string | null;
  weight: number;
  created_at: string;
};

export type TableResponse = {
  id: string;
  invite_code: string;
  name: string;
  location_lat: number | null;
  location_lng: number | null;
  location_city: string | null;
  location_state: string | null;
  location_neighborhood: string | null;
  host_session_id: string | null;
  host_user_id: string | null;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
  planned_for_at: string | null;
  members: TableMember[];
  mood_signals: TableSignal[];
};

export type TableSummary = {
  id: string;
  invite_code: string;
  name: string;
  location_city: string | null;
  location_state: string | null;
  location_neighborhood: string | null;
  member_count: number;
  last_active_at: string | null;
  created_at: string;
};

export type TablesMineResponse = {
  tables: TableSummary[];
};

export type TableCompatibility = {
  compatibility_score: number;
  overlap_strength: string;
  summary: string;
  shared_preferences: string[];
  taste_differences: string[];
  group_personality: string[];
  recommendation_reasoning: string[];
};

export type RepresentativeDish = {
  id: string;
  dish_name: string;
  description: string | null;
  section: string | null;
  price: number | null;
  cuisine_tags: string[];
  flavor_tags: string[];
  protein_tags: string[];
  ingredient_tags: string[];
  format_tags: string[];
  confidence: number;
};

export type RestaurantRecommendation = {
  id: string;
  name: string;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  cuisine_tags: string[];
  occasion_tags: string[];
  price_tier: string | null;
  explanation: string;
  score: number;
  representative_dishes: RepresentativeDish[];
};

export type TableRecommendationsResponse = {
  table_id: string;
  compatibility: TableCompatibility;
  recommendations: RestaurantRecommendation[];
  notes: string[];
  source: "curated_inventory";
};

export type DishPick = {
  dish_id: string;
  dish_name: string;
  description: string | null;
  price: number | null;
  section: string | null;
  match_score: number;
  reasons: string[];
  tags: string[];
};

export type DishPickMember = {
  member_id: string;
  display_name: string;
  has_taste_profile: boolean;
  dish_picks: DishPick[];
};

export type DishPickRestaurant = {
  id: string;
  name: string;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  cuisine_tags: string[];
  price_tier: string | null;
};

export type TableDishPicksResponse = {
  table_id: string;
  restaurant: DishPickRestaurant;
  members: DishPickMember[];
};

export type OnboardingDishCard = {
  id: string;
  dish_name: string;
  primary_cuisine: string;
  cuisine_tags: string[];
  display_description: string;
  format_tags: string[];
  protein_tags: string[];
  ingredient_tags: string[];
  flavor_tags: string[];
  texture_tags: string[];
  secondary_descriptor_tags: string[];
  dietary_tags: string[];
  adventure_score: number;
  image_url: string;
};

export type OnboardingTasteProfile = {
  session_id: string;
  liked_cuisines: Record<string, number>;
  disliked_cuisines: Record<string, number>;
  liked_formats: Record<string, number>;
  disliked_formats: Record<string, number>;
  liked_proteins: Record<string, number>;
  disliked_proteins: Record<string, number>;
  liked_ingredients: Record<string, number>;
  disliked_ingredients: Record<string, number>;
  liked_descriptors: Record<string, number>;
  disliked_descriptors: Record<string, number>;
  adventure_level: number;
  explicit_avoidances: string[];
  dietary_preferences: string[];
  food_avoidances: string[];
  swipe_count: number;
  onboarding_completed: boolean;
  updated_at: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  username: string;
  created_at: string | null;
  updated_at: string | null;
};

export type LocationPayload = {
  location_lat: number | null;
  location_lng: number | null;
  location_city: string | null;
  location_state: string | null;
  location_neighborhood: string | null;
};

export type ApiErrorShape = {
  detail?: unknown;
  message?: string;
};
