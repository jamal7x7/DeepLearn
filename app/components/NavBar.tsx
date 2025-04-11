"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function NavBar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 z-50">
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
        Avent
      </div>
      <div className="flex items-center gap-4">
        <Link href="/sign-in" className="text-sm font-medium hover:underline">
          Login
        </Link>
        <Link href="/sign-up" className="text-sm font-medium hover:underline">
          Register
        </Link>
        <ModeToggle />
      </div>
    </nav>
  );
}