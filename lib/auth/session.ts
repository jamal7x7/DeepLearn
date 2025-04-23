import bcrypt from 'bcryptjs';

/**
 * Compares a plain password with a hashed password.
 * @param plainPassword - The plain text password to check
 * @param hashedPassword - The hashed password from the database
 * @returns Promise<boolean> - true if passwords match, false otherwise
 */
export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  if (!plainPassword || !hashedPassword) return false;
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    // Optionally log error here
    return false;
  }
}

/**
 * Hashes a plain password using bcryptjs
 * @param password - The plain text password
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Add any other session helpers below as needed