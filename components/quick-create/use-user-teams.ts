"use client";
import { useEffect, useState } from "react";

export type UserTeam = {
  id: number;
  name: string;
};

/**
 * Fetches all teams the current user is a member of.
 * Returns loading, error, and the teams array.
 */
export function useUserTeams() {
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch("/api/user/teams")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch teams");
        const data = await res.json();
        if (isMounted) setTeams(data);
      })
      .catch((err) => {
        if (isMounted) setHasError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { teams, isLoading, hasError };
}
