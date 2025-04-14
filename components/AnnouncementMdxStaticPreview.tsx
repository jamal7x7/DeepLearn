"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

const MdxRenderer = dynamic(() => import("../app/mdx-server/components/MdxRenderer"), { ssr: false });

interface AnnouncementMdxStaticPreviewProps {
  value: string;
}

export default function AnnouncementMdxStaticPreview({ value }: AnnouncementMdxStaticPreviewProps) {
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

    setIsLoading(true);
    setError(null);

    fetch("/api/mdx/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mdxContent: value }),
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
        setError(err.message || "Failed to compile MDX");
      })
      .finally(() => setIsLoading(false));
  }, [value]);

  if (!value.trim()) return null;

  return (
    <div className="mt-2   bg-muted/30 p-3 rounded">
      {/* <div className="font-semibold mb-1 text-muted-foreground text-xs">MDX Preview</div> */}
      {isLoading && (
        <div className="text-xs text-muted-foreground">Rendering preview...</div>
      )}
      {error && (
        <div className="text-red-600 border border-red-600 p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs">
          {error}
        </div>
      )}
      {!isLoading && !error && serializedSource && (
        <MdxRenderer serializedSource={serializedSource} frontMatter={frontMatter} />
      )}
      {!isLoading && !error && !serializedSource && (
        <div className="text-muted-foreground text-xs">Nothing to preview</div>
      )}
    </div>
  );
}