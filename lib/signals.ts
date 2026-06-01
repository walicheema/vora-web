import type { TableSignalType } from "./types";

export type SignalOption = {
  label: string;
  value: string;
  type: TableSignalType;
};

export const QUICK_SIGNALS: SignalOption[] = [
  { label: "Spicy", value: "spicy", type: "craving" },
  { label: "Comfort", value: "comfort", type: "vibe" },
  { label: "Light", value: "light", type: "vibe" },
  { label: "Adventurous", value: "adventurous", type: "vibe" },
  { label: "Date Night", value: "date_night", type: "vibe" }
];

export const BUDGET_SIGNALS: SignalOption[] = [
  { label: "$", value: "budget_1", type: "vibe" },
  { label: "$$", value: "budget_2", type: "vibe" },
  { label: "$$$", value: "budget_3", type: "vibe" },
  { label: "$$$$", value: "budget_4", type: "vibe" }
];

export const MORE_SIGNAL_GROUPS: Array<{ title: string; options: SignalOption[] }> = [
  {
    title: "Cravings",
    options: [
      { label: "Noodles", value: "noodles", type: "craving" },
      { label: "Sushi", value: "sushi", type: "craving" },
      { label: "Pizza", value: "pizza", type: "craving" },
      { label: "Tacos", value: "tacos", type: "craving" },
      { label: "Seafood", value: "seafood", type: "craving" },
      { label: "Grilled", value: "grilled", type: "craving" },
      { label: "Vegetarian", value: "vegetarian", type: "craving" },
      { label: "Share plates", value: "share_plates", type: "craving" }
    ]
  },
  {
    title: "Vibe",
    options: [
      { label: "Casual", value: "casual", type: "vibe" },
      { label: "Group dinner", value: "group_dinner", type: "vibe" },
      { label: "Cheap eats", value: "cheap_eats", type: "vibe" },
      { label: "Special occasion", value: "special_occasion", type: "vibe" }
    ]
  }
];

export const ALL_SIGNAL_OPTIONS = [...QUICK_SIGNALS, ...BUDGET_SIGNALS, ...MORE_SIGNAL_GROUPS.flatMap((group) => group.options)];
export const BUDGET_SIGNAL_KEYS = new Set(BUDGET_SIGNALS.map(signalKey));

export function signalKey(option: SignalOption): string {
  return `${option.type}:${option.value}`;
}

export function optionFromKey(key: string): SignalOption | undefined {
  return ALL_SIGNAL_OPTIONS.find((option) => signalKey(option) === key);
}

export function selectedOptionsFromKeys(keys: string[]): SignalOption[] {
  return keys.map(optionFromKey).filter((option): option is SignalOption => Boolean(option));
}

export function sameKeys(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}
