import fs from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get the fileName from the query string
    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ success: false, message: 'Missing fileName parameter' }, { status: 400 });
    }

    // Define the path to the MDX files
    const mdxDirectory = path.join(process.cwd(), 'app', 'mdx-server', 'content');
    const filePath = path.join(mdxDirectory, fileName);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: `File ${fileName} not found` }, { status: 404 });
    }

    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Return the file content
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error('Error reading MDX file:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}