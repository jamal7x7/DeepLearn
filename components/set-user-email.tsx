"use client";

import { useEffect } from "react";

/**
 * Sets the current user's email in localStorage for client-only badge logic.
 * @param email - The authenticated user's email address
 */
export function SetUserEmail({ email }: { email: string }) {
  useEffect(() => {
    if (email) {
      window.localStorage.setItem("userEmail", email);
    }
  }, [email]);

  return null;
}
