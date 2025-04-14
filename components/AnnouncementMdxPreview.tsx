"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

// Dynamically import MdxRenderer to avoid SSR issues
const MdxRenderer = dynamic(() => import("../app/mdx-server/components/MdxRenderer"), { ssr: false });

interface AnnouncementMdxPreviewProps {
  value: string;
}

export default function AnnouncementMdxPreview({ value }: AnnouncementMdxPreviewProps) {
  const [serializedSource, setSerializedSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [frontMatter, setFrontMatter] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setSerializedSource(null);
      setFrontMatter(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      fetch("/api/mdx/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mdxContent: value }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to compile MDX");
          }
          return res.json();
        })
        .then((data) => {
          setSerializedSource(data.serializedSource);
          setFrontMatter(data.frontMatter || null);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setError(err.message || "Failed to compile MDX");
          }
        })
        .finally(() => setIsLoading(false));
    }, 400); // debounce

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  return (
    <div className="mt-4 border rounded bg-muted/30 p-4">
      <div className="font-semibold mb-2 text-muted-foreground">Preview</div>
      {isLoading && (
        <div className="text-sm text-muted-foreground">Rendering preview...</div>
      )}
      {error && (
        <div className="text-red-600 border border-red-600 p-2 rounded bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      )}
      {!isLoading && !error && serializedSource && (
        <MdxRenderer serializedSource={serializedSource} frontMatter={frontMatter} />
      )}
      {!isLoading && !error && !serializedSource && (
        <div className="text-muted-foreground text-sm">Nothing to preview</div>
      )}
    </div>
  );
}