export type PinType =
  | "travel"
  | "home"
  | "hotel"
  | "cafe"
  | "restaurant"
  | "activity"
  | "challenge"
  | "custom";

export interface Pin {
  id: string;
  type: PinType;
  name: string;
  lat: number;
  lng: number;
  countryCode: string;
  note?: string;
  image?: string;
}

export interface Country {
  code: string;
  name: string;
  visited: boolean;
  visitedAt?: string;
  photoUrl?: string;
  pins: Pin[];
  flagEmoji: string;
  continent: string;
}

export type CharacterSkin = "adventurer" | "nomad" | "explorer" | "wanderer";
export type CharacterColor = "blue" | "red" | "green" | "purple" | "gold";

export interface Character {
  skin: CharacterSkin;
  color: CharacterColor;
  hat: boolean;
  backpack: boolean;
}

export interface Friend {
  id: string;
  username: string;
  character: Character;
  level: number;
  xp: number;
  countriesCount: number;
  rank: number;
  isOnline: boolean;
}

export interface User {
  id: string;
  username: string;
  character: Character;
  level: number;
  xp: number;
  xpToNext: number;
  countries: Country[];
  friends: Friend[];
  rank: number;
  totalPins: number;
  joinedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "explore" | "pin" | "social" | "story";
  progress: number;
  total: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  icon: string;
  difficulty: "easy" | "medium" | "hard" | "legendary";
}

export interface ActivitySuggestion {
  id: string;
  title: string;
  description: string;
  type: PinType;
  countryCode: string;
  countryName: string;
  isFree: boolean;
  rating: number;
  tags: string[];
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorCharacter: Character;
  image: string;
  caption: string;
  countryCode: string;
  countryName: string;
  likes: number;
  createdAt: string;
  isLiked: boolean;
}

export const PIN_COLORS: Record<PinType, string> = {
  travel: "#ffd60a",
  home: "#39ff14",
  hotel: "#00e5ff",
  cafe: "#ff8c00",
  restaurant: "#ff4d6d",
  activity: "#bf5af2",
  challenge: "#ff00ff",
  custom: "#ffffff",
};

export const PIN_ICONS: Record<PinType, string> = {
  travel: "✈",
  home: "🏠",
  hotel: "🏨",
  cafe: "☕",
  restaurant: "🍽",
  activity: "⚡",
  challenge: "🎯",
  custom: "📍",
};
