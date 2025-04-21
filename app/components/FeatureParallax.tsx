"use client";
import React, { memo } from "react";
import {
  UserPlus,
  ShieldCheck,
  Settings,
  Users,
  MessageCircle,
  LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";

/**
 * Feature metadata for the parallax grid.
 */
type Feature = {
  icon: LucideIcon;
  iconColor: string;
  titleKey: string;
  descKey: string;
};

/**
 * List of features to display. Icons and colors are defined for flexibility.
 * i18n keys are used for titles and descriptions.
 */
const features: Feature[] = [
  {
    icon: UserPlus,
    iconColor: "text-blue-500 dark:text-blue-400",
    titleKey: "feature_1_title",
    descKey: "feature_1_desc",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-green-500 dark:text-green-400",
    titleKey: "feature_2_title",
    descKey: "feature_2_desc",
  },
  {
    icon: Settings,
    iconColor: "text-purple-500 dark:text-purple-400",
    titleKey: "feature_3_title",
    descKey: "feature_3_desc",
  },
  {
    icon: Users,
    iconColor: "text-pink-500 dark:text-pink-400",
    titleKey: "feature_4_title",
    descKey: "feature_4_desc",
  },
  {
    icon: MessageCircle,
    iconColor: "text-yellow-500 dark:text-yellow-400",
    titleKey: "feature_5_title",
    descKey: "feature_5_desc",
  },
];

/**
 * Renders a single feature card.
 * @param feature Feature metadata
 */
const FeatureCard = memo(({ feature }: { feature: Feature }) => {
  const { t } = useTranslation();
  const Icon = feature.icon;
  return (
    <Card
      className="flex flex-col items-center text-center gap-4 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-102 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:brightness-110 backdrop-blur-md bg-white/30 dark:bg-background/60 p-6 md:p-8 min-h-[260px]"
      role="region"
      aria-label={t(feature.titleKey)}
    >
      <div
        className="p-4 rounded-full bg-gradient-to-br from-white/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 shadow-inner border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300"
        aria-hidden="true"
      >
        <Icon className={`w-10 h-10 ${feature.iconColor}`} aria-hidden="true" />
      </div>
      <h3 className="font-bold text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
        {t(feature.titleKey)}
      </h3>
      <p className="text-gray-700 dark:text-gray-200">
        {t(feature.descKey)}
      </p>
    </Card>
  );
});
FeatureCard.displayName = "FeatureCard";

/**
 * Responsive, accessible, and i18n-ready feature parallax grid.
 */
const FeatureParallax: React.FC = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 xl:gap-10">
        {features.map((feature, idx) => (
          <FeatureCard key={feature.titleKey} feature={feature} />
        ))}
      </div>
    </div>
  );
};

export default FeatureParallax;