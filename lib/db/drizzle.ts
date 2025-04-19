import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

import * as schema from './schema';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Configure the connection pool
export const client = postgres(process.env.POSTGRES_URL, {
  max: 25, // Increase max connections (adjust as needed)
  idle_timeout: 20, // Close idle connections after 20 seconds
  // You might also consider connect_timeout, etc.
});
export const db = drizzle(client, { schema });
