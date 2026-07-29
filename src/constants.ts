export const TOKEN_NAME = "accessToken" as const;
export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  tokens: number;
  featured?: boolean;
}

export const AVATAR_COLOURS = [
  "#C9A84C",
  "#7B6CE0",
  "#E07BA0",
  "#6ED88A",
  "#E87070",
];

export const GIFT_CATALOG: GiftItem[] = [
  { id: "bouquet", name: "Bouquet", emoji: "💐", tokens: 50 },
  { id: "champagne", name: "Champagne", emoji: "🍾", tokens: 120 },
  { id: "mystery", name: "Mystery Box", emoji: "🎁", tokens: 80 },
  { id: "travel", name: "Travel", emoji: "✈️", tokens: 300 },
  { id: "diamond", name: "Diamond", emoji: "💎", tokens: 500, featured: true },
  { id: "crown", name: "Crown", emoji: "👑", tokens: 800, featured: true },
  { id: "car", name: "Car Key", emoji: "🚗", tokens: 2000, featured: true },
  { id: "house", name: "House Key", emoji: "🏠", tokens: 5000, featured: true },
];
