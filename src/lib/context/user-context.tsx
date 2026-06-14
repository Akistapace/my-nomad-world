"use client";
import { createContext, useContext } from "react";
import type { Character } from "@/lib/types";

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  xpToNext: number;
  rank: number;
  totalPins: number;
  countriesCount: number;
  character: Character;
  joinedAt: string;
  homeCode?: string;
}

const UserContext = createContext<UserProfile | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserProfile;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): UserProfile {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
