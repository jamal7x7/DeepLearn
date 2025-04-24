// import './globals0.css';
import './globals.css';
import 'katex/dist/katex.min.css'; // Add KaTeX CSS
import 'prismjs/themes/prism-okaidia.css' ; // Add Prism theme CSS
import type { Metadata, Viewport } from 'next';
import { Manrope, Instrument_Sans, Inter } from 'next/font/google';
import { cookies } from "next/headers";

import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import { cn } from "@/lib/utils";

import AppClientProviders from "./components/AppClientProviders";

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
};

export const metadata: Metadata = {
  title: 'Avent',
  description: 'Study nest',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

// const manrope = Manrope({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });
// const instrumentSans  = Instrument_Sans ({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPromise = getUser();
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${inter.className}`}
    >
      <head>
        {/* Add any additional scripts or meta tags here */}
      </head>
      <body
        className={cn(
          " bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : ""
        )}
        
      >
        <UserProvider userPromise={userPromise}>
          <AppClientProviders>
            <div className="">
              {children}
            </div>
          </AppClientProviders>
        </UserProvider>
      </body>
    </html>
  );
}
