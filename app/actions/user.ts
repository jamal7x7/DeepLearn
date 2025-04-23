// app/actions/user.ts
// Boilerplate for user-related server actions

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

/**
 * Zod schema for user creation
 */
export const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Example server action to create a user
 * @param data - User creation data
 */
export async function createUser(data: z.infer<typeof createUserSchema>) {
  // TODO: Implement actual user creation logic (e.g., DB insert)
  // This is a mock implementation
  return {
    id: Math.random().toString(36).substring(2, 10),
    ...data,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Example server action to fetch a user by ID
 * @param id - User ID
 */
export async function getUserById(id: string) {
  // TODO: Implement actual DB lookup
  // This is a mock implementation
  return {
    id,
    username: 'mockuser',
    email: 'mockuser@example.com',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Example server action to fetch all users
 */
export async function getUsers() {
  // Fetch all users from the database
  const allUsers = await db.select().from(users);
  // Remove sensitive fields before returning (e.g., password, passwordHash)
  return allUsers.map(({ password, passwordHash, ...user }) => user);
}
