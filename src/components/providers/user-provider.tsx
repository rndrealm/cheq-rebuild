"use client";

import { createContext, useContext } from "react";
import { usePreloadedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Preloaded } from "convex/react";
import type { Doc } from "../../../convex/_generated/dataModel";

type UserContextValue = Doc<"users">;

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  preloadedUser,
  children,
}: {
  preloadedUser: Preloaded<typeof api.users.me>;
  children: React.ReactNode;
}) {
  const user = usePreloadedQuery(preloadedUser);

  if (!user) return null;

  return <UserContext value={user}>{children}</UserContext>;
}

export function useUser(): UserContextValue {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return user;
}
