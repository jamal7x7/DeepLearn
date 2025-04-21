import { useEffect, useState } from "react";

/**
 * useMediaQuery - React hook for responsive design (SSR-safe)
 * @param query Media query string (e.g., '(max-width: 767px)')
 * @returns boolean - true if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (q: string): boolean => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia(q).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mediaQueryList = window.matchMedia(query);
      const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
      mediaQueryList.addEventListener("change", listener);
      setMatches(mediaQueryList.matches);
      return () => mediaQueryList.removeEventListener("change", listener);
    }
    return undefined;
  }, [query]);

  return matches;
}
