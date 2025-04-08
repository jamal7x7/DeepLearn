'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import { motion } from "motion/react"
import AnimatedGradient from "@/components/background/animated-gradient-with-svg"

interface QuizCardProps {
  title: string;
  children: React.ReactNode;
}

export function QuizCard({ title, children }: QuizCardProps) {
  return (
    <Card className="w-[calc(100%+8rem)] gap-0 my-8 p-0 shadow-lg -mx-16 overflow-visible">
     <BentoCard
        speed={100}
        colors={["#EC4899", "#F472B6", "#3B82F6"]}
        delay={.3}>
      <CardHeader className="p-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10  rounded-t-lg">
        <CardTitle className="mx-auto text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-background/95 dark:bg-background/90">
        {children}
      </CardContent>
 </BentoCard>
    </Card>
  );
}


interface BentoCardProps {
  children: React.ReactNode
  colors: string[]
  delay: number
  speed: number
}

const BentoCard: React.FC<BentoCardProps> = ({
children,
  colors,
  delay,
  speed
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3, // Add a small delay after the card appears
      },
    },
  }



  return (
    <motion.div
      className="relative overflow-hidden h-full rounded-2xl "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <AnimatedGradient colors={colors} speed={speed} blur="medium" />
      <motion.div
        className="relative z-10  p-0 "
        variants={container}
        initial="hidden"
        animate="show"
      >
       {children}
      </motion.div>
    </motion.div>
  )
}