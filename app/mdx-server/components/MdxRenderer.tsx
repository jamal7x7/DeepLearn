'use client'; // Needs to be a client component if we pass serialized source

import React from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';

// Import custom MDX components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GlowEffect } from '@/components/ui/glow-effect'

import { ExerciseCard, TutorialAccordion, CenteredContent, Tip, GlowEffectCardBackground } from './MdxComponents';
import { QuizCard } from './QuizCard';
import { ResourcesCard } from './ResourcesCard'; // Import the ResourcesCard component
import { Quiz } from './Quiz1'; // Import the Quiz component

// Define the shape of front-matter data
interface FrontMatter {
  [key: string]: any;
}

// Custom components for MDX
const components = {
  // Custom components
  ExerciseCard,
  TutorialAccordion,
  CenteredContent,
  Tip,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  GlowEffect,
  GlowEffectCardBackground,
  Quiz, // Added Quiz component
  QuizCard, // Added QuizCard component
  ResourcesCard, // Added ResourcesCard component
  // Headings
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 
      className="text-4xl  font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6" 
      {...props} 
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 
      className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4" 
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 
      className="text-2xl font-medium t  mb-3" 
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 
      className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2" 
      {...props}
    />
  ),
  h5: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5
      className="text-xl font-medium text-green-600 dark:text-green-400 mb-2" 
      {...props}
    />
  ),
  
  // Text elements
  p: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <p 
      className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6" 
      {...props}
    />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
    
      className="border-l-4 border-purple-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4 bg-gray-50 dark:bg-gray-800/30 rounded-r" 
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <code 
      className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 font-mono text-sm" 
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre 
      className="bg-gray-800 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-gray-100 mb-6" 
      {...props}
    />
  ),
  
  // Lists
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul 
      className="list-disc pl-6 space-y-2 mb-4" 
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol 
      className="list-decimal pl-6 space-y-2 mb-4" 
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li 
      className="text-gray-700 dark:text-gray-300 mb-1" 
      {...props}
    />
  ),
  
  // Links
  a: (props: React.HTMLAttributes<HTMLAnchorElement>) => (
    <a 
      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline underline-offset-4" 
      {...props}
    />
  ),
  
  // Images
  img: (props: React.HTMLAttributes<HTMLImageElement>) => (
    <img 
      className="rounded-lg shadow-lg my-6 mx-auto" 
      {...props}
    />
  ),
  
  // Tables
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <table 
      className="w-full border-collapse my-6" 
      {...props}
    />
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead 
      className="bg-gray-100 dark:bg-gray-800" 
      {...props}
    />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody 
      className="divide-y divide-gray-200 dark:divide-gray-700" 
      {...props}
    />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr 
      className="hover:bg-gray-50 dark:hover:bg-gray-800/50" 
      {...props}
    />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th 
      className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" 
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td 
      className="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" 
      {...props}
    />
  ),
  
  // Horizontal rule
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr 
      className="my-8 border-t border-gray-200 dark:border-gray-700" 
      {...props}
    />
  ),
};

interface MdxRendererProps {
  serializedSource: MDXRemoteSerializeResult | null;
}

interface MdxRendererProps {
  serializedSource: MDXRemoteSerializeResult | null;
  frontMatter?: FrontMatter;
}

export default function MdxRenderer({ serializedSource, frontMatter }: MdxRendererProps) {
  if (!serializedSource) {
    // Handle loading state or error state appropriately
    return <div>Loading content...</div>;
  }

  return (
    <div className="prose dark:prose-invert max-w-none flex flex-col items-center bg-transparent !bg-transparent shadow-none border-none p-0 m-0">
      {/* @ts-ignore // TODO: Investigate type mismatch if any */}
      <div className="w-full p-0 md:p-6 lg:p-8 xl:p-20 2xl:p-40 bg-transparent !bg-transparent shadow-none border-none">
        <MDXRemote {...serializedSource} components={components} />
      </div>
    </div>
  );
}

// Note: The actual serialization (compiling MDX to JS) needs to happen
// server-side, likely in an API route or server action, because it uses Node APIs.
// The student page will fetch this serialized source.
// However, for the real-time update via Socket.IO, we might need a slightly
// different approach. Let's refine this as we build the student page logic.
// For now, this component handles the rendering part.