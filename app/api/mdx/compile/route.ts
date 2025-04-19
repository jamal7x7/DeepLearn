export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { serialize } from 'next-mdx-remote/serialize';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypePrismPlus from 'rehype-prism-plus'; // For syntax highlighting
import matter from 'gray-matter'; // For parsing front-matter

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawMdx = body.mdxContent;

    if (typeof rawMdx !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid mdxContent in request body' }, { status: 400 });
    }

    // Parse front-matter from MDX content
    const { content, data: frontMatter } = matter(rawMdx);

    // Serialize the MDX content without front-matter
    const serializedSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [
          remarkGfm, // Tables, footnotes, strikethrough, task lists
          remarkMath, // Support math syntax
        ],
        rehypePlugins: [
          rehypeKatex, // Render math with KaTeX
          [rehypePrismPlus, { ignoreMissing: true }], // Add syntax highlighting, ignore errors for unknown languages
        ],
        format: 'mdx', // or 'md' if you don't use JSX components in MDX
      },
      // Optionally pass scope data if needed by MDX components
      // scope: { data: 'someValue' },
    });

    // Return both serialized content and front-matter metadata
    return NextResponse.json({ 
      serializedSource,
      frontMatter 
    });

  } catch (error) {
    console.error("MDX Serialization Error:", error);
    // Provide more specific error message if possible
    const message = error instanceof Error ? error.message : 'Failed to compile MDX';
    // Check if it's a known serialization error structure
    // const detail = error?.errors?.[0]?.message || message;
    return NextResponse.json({ error: 'Failed to compile MDX', detail: message }, { status: 500 });
  }
}
