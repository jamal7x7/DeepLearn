'use client'; // Needs to be a client component if we pass serialized source

import React from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
// Import components you want to allow in MDX if needed
// import { SomeComponent } from '@/components/ui/some-component';

// Optional: Add custom components if you want to use them in MDX
const components = {
  // Example: Replace h1 tags with a custom component
  // h1: (props) => <h1 style={{ color: 'blue' }} {...props} />,
  // Add other components here:
  // MyCustomComponent: SomeComponent,
};

interface MdxRendererProps {
  serializedSource: MDXRemoteSerializeResult | null;
}

export default function MdxRenderer({ serializedSource }: MdxRendererProps) {
  if (!serializedSource) {
    // Handle loading state or error state appropriately
    return <div>Loading content...</div>;
  }

  return (
    <div className="prose dark:prose-invert max-w-none"> {/* Basic styling */}
      {/* @ts-ignore // TODO: Investigate type mismatch if any */}
      <MDXRemote {...serializedSource} components={components} />
    </div>
  );
}

// Note: The actual serialization (compiling MDX to JS) needs to happen
// server-side, likely in an API route or server action, because it uses Node APIs.
// The student page will fetch this serialized source.
// However, for the real-time update via Socket.IO, we might need a slightly
// different approach. Let's refine this as we build the student page logic.
// For now, this component handles the rendering part.