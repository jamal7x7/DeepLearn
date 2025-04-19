export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

// This route doesn't need to do much. Its primary purpose is to
// confirm that the Next.js server (handled by our custom server.js)
// is running and ready to handle requests before the client attempts
// to establish a WebSocket connection.
// We could potentially add more robust health checks here if needed.

export async function GET(request: Request) {
  // Simply return a success response
  return NextResponse.json({ message: 'Socket.IO server is running' });
}
