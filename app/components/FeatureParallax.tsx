"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { UserPlus, ShieldCheck, Settings, Users, MessageCircle } from "lucide-react";

import { useTranslation } from "react-i18next";

const features = [
  {
    icon: <UserPlus className="w-10 h-10 text-blue-500 dark:text-blue-400" />,
    titleKey: "feature_1_title",
    descKey: "feature_1_desc",
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-green-500 dark:text-green-400" />,
    titleKey: "feature_2_title",
    descKey: "feature_2_desc",
  },
  {
    icon: <Settings className="w-10 h-10 text-purple-500 dark:text-purple-400" />,
    titleKey: "feature_3_title",
    descKey: "feature_3_desc",
  },
  {
    icon: <Users className="w-10 h-10 text-pink-500 dark:text-pink-400" />,
    titleKey: "feature_4_title",
    descKey: "feature_4_desc",
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />,
    titleKey: "feature_5_title",
    descKey: "feature_5_desc",
  },
  // Repeat for animation effect
  {
    icon: <UserPlus className="w-10 h-10 text-blue-500 dark:text-blue-400" />,
    titleKey: "feature_1_title",
    descKey: "feature_1_desc",
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-green-500 dark:text-green-400" />,
    titleKey: "feature_2_title",
    descKey: "feature_2_desc",
  },
  {
    icon: <Settings className="w-10 h-10 text-purple-500 dark:text-purple-400" />,
    titleKey: "feature_3_title",
    descKey: "feature_3_desc",
  },
  {
    icon: <Users className="w-10 h-10 text-pink-500 dark:text-pink-400" />,
    titleKey: "feature_4_title",
    descKey: "feature_4_desc",
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />,
    titleKey: "feature_5_title",
    descKey: "feature_5_desc",
  },
  {
    icon: <UserPlus className="w-10 h-10 text-blue-500 dark:text-blue-400" />,
    titleKey: "feature_1_title",
    descKey: "feature_1_desc",
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-green-500 dark:text-green-400" />,
    titleKey: "feature_2_title",
    descKey: "feature_2_desc",
  },
  {
    icon: <Settings className="w-10 h-10 text-purple-500 dark:text-purple-400" />,
    titleKey: "feature_3_title",
    descKey: "feature_3_desc",
  },
  {
    icon: <Users className="w-10 h-10 text-pink-500 dark:text-pink-400" />,
    titleKey: "feature_4_title",
    descKey: "feature_4_desc",
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />,
    titleKey: "feature_5_title",
    descKey: "feature_5_desc",
  },
];

export default function FeatureParallax() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0.5); // base speed
  const offsetRef = useRef(0);
  const contentWidthRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    if (contentRef.current) {
      contentWidthRef.current = contentRef.current.scrollWidth;
    }
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const deltaY = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      setSpeed(0.5 + deltaY * 0.05); // accelerate with scroll delta
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      timeRef.current += 0.02;
      offsetRef.current += speed;

      const verticalOffset = Math.sin(timeRef.current) * 5; // subtle vertical oscillation

      if (containerRef.current) {
        offsetRef.current = offsetRef.current % (contentWidthRef.current / 3);
        containerRef.current.style.transform = `translate(${-offsetRef.current}px, ${verticalOffset}px)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [speed]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex gap-10 will-change-transform"
      >
        <div ref={contentRef} className="flex gap-10">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="min-w-[250px] md:min-w-[300px] p-8 flex flex-col items-center text-center gap-4 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-102 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:brightness-110 backdrop-blur-md bg-white/30 dark:bg-background/60"
              onMouseMove={(e) => {
                const card = e.currentTarget as HTMLDivElement;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const centerX = rect.width / 2;
                const offset = (x < centerX) ? 10 : -10; // move right if cursor on left, else left
                card.style.transform = `translateX(${offset}px)`;
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLDivElement;
                card.style.transform = "";
              }}
            >
              <div className="p-4 rounded-full bg-gradient-to-br from-white/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 shadow-inner border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{t(feature.descKey)}</p>
            </Card>
          ))}
        </div>
        <div className="flex gap-10">
          {features.map((feature, idx) => (
            <Card
              key={`dup-${idx}`}
              className="min-w-[250px] md:min-w-[300px] p-8 flex flex-col items-center text-center gap-4 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:brightness-110 backdrop-blur-md bg-white/30 dark:bg-transparent/20"
              onMouseMove={(e) => {
                const card = e.currentTarget as HTMLDivElement;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const centerX = rect.width / 2;
                const offset = (x < centerX) ? 10 : -10;
                card.style.transform = `translateX(${offset}px)`;
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLDivElement;
                card.style.transform = "";
              }}
            >
              <div className="p-4 rounded-full bg-gradient-to-br from-white/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 shadow-inner border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{t(feature.descKey)}</p>
            </Card>
          ))}
        </div>
        <div className="flex gap-10">
          {features.map((feature, idx) => (
            <Card
              key={`trip-${idx}`}
              className="min-w-[250px] md:min-w-[300px] p-8 flex flex-col items-center text-center gap-4 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:brightness-110 backdrop-blur-md bg-white/30 dark:bg-transparent/20"
              onMouseMove={(e) => {
                const card = e.currentTarget as HTMLDivElement;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const centerX = rect.width / 2;
                const offset = (x < centerX) ? 10 : -10;
                card.style.transform = `translateX(${offset}px)`;
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLDivElement;
                card.style.transform = "";
              }}
            >
              <div className="p-4 rounded-full bg-gradient-to-br from-white/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 shadow-inner border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{t(feature.descKey)}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}