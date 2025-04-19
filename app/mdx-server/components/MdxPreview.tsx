'use client';

import React, { useState, useEffect } from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

import MdxRenderer from './MdxRenderer';

interface MdxPreviewProps {
  fileName: string;
  onClose?: () => void; // Made onClose optional
  socket?: any; // Optionally pass the socket from parent
}

export default function MdxPreview({ fileName, onClose, socket }: MdxPreviewProps) {
  const [serializedSource, setSerializedSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [frontMatter, setFrontMatter] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mdxContent, setMdxContent] = useState<string>('');

  // First fetch the raw MDX content
  useEffect(() => {
    async function fetchMdxContent() {
      if (!fileName) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Use a simple fetch to get the file content from the server
        const response = await fetch(`/api/mdx/content?fileName=${encodeURIComponent(fileName)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.content) {
          setMdxContent(data.content);
          compileMdx(data.content);
        } else {
          throw new Error(data.message || 'Failed to load file content');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    }
    
    fetchMdxContent();
  }, [fileName]);

  // Compile the MDX content
  const compileMdx = async (content: string) => {
    try {
      const compileResponse = await fetch('/api/mdx/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mdxContent: content }),
      });
      
      if (!compileResponse.ok) {
        throw new Error(`HTTP error! status: ${compileResponse.status}`);
      }
      
      const data = await compileResponse.json();
      setSerializedSource(data.serializedSource);
      setFrontMatter(data.frontMatter || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compile MDX');
    } finally {
      setIsLoading(false);
    }
  };

  // Core content rendering logic
  const renderContent = () => (
    <>
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      {error && (
        <div className="text-red-600 border border-red-600 p-3 rounded bg-red-50 dark:bg-red-900/20">
          Erreur: {error}
        </div>
      )}
      {!isLoading && !error && serializedSource && (
        <MdxRenderer serializedSource={serializedSource} frontMatter={frontMatter} />
      )}
      {!isLoading && !error && !serializedSource && (
        <div className="text-center py-8 text-gray-500">
          Aucun contenu à afficher
        </div>
      )}
    </>
  );

  // If onClose is provided, render as a modal
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-[90%] md:w-[70%] lg:w-[60%] h-[80%] overflow-auto flex flex-col" // Added flex flex-col
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b flex justify-between items-center flex-shrink-0"> {/* Added flex-shrink-0 */}
            <h3 className="text-lg font-semibold">{fileName} - Prévisualisation</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close preview" // Added aria-label
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          {/* Removed scale transform for modal */}
          <div className="p-4 overflow-y-auto flex-grow"> {/* Added overflow-y-auto and flex-grow */}
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render inline (without modal wrapper)
  return (
    <div className="w-full"> {/* Simple wrapper for inline rendering */}
       {renderContent()}
    </div>
  );
}