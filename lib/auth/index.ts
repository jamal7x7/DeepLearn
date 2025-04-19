import { createAuth } from "better-auth/server";

const auth = createAuth({
  // You should configure these values in your .env file
  secret: process.env.AUTH_SECRET!,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  // Add other BetterAuth config as needed (db adapter, providers, plugins, etc)
});

export { auth };
