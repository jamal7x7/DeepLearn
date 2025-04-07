'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


// Composants Card pour les exercices
export function ExerciseCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="w-full max-w-3xl mx-auto my-6 pb-6">
      
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
// Composants Card pour les exercices
export function FigureCard2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
 
<figure 
  className="flex flex-col gap-1 rounded-xl bg-gray-950/5 p-1 inset-ring inset-ring-gray-950/5 dark:bg-white/10 dark:inset-ring-white/10"
>
<div className="not-prose overflow-auto rounded-lg bg-white outline outline-white/5 dark:bg-gray-950/50">
  <div className="relative grid w-full grid-cols-[1fr_8rem_1fr] grid-rows-[1fr_3fr_1fr] gap-px bg-gray-700/10 font-mono text-sm leading-6 font-bold dark:bg-gray-700">
    <div className="col-start-1 row-start-1 bg-white dark:bg-gray-900"></div>
    <div className="relative col-start-2 row-start-1 bg-white dark:bg-gray-900">
      <div className="absolute right-0 bottom-2 left-0 flex">
        <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-px bg-sky-400"></div>
        <div className="w-full">
          <div className="absolute top-1/2 left-0 h-2 w-px -translate-x-px -translate-y-1 rounded-full bg-sky-400"></div>
        </div>
        <div className="relative flex w-full flex-auto items-center justify-center bg-white px-1.5 font-mono text-xs leading-none font-bold text-sky-600 dark:bg-gray-900 dark:text-sky-400">100px</div>
        <div className="w-full">
          <div className="absolute top-1/2 right-0 h-2 w-px translate-x-px -translate-y-1 rounded-full bg-sky-400"></div>
        </div>
      </div>
    </div>
    <div className="col-start-3 row-start-1 bg-white dark:bg-gray-900"></div>
    <div className="relative col-start-1 row-start-2 bg-white dark:bg-gray-900">
      <div className="absolute top-0 right-2 bottom-0 flex w-3">
        <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-[0.5px] bg-sky-400"></div>
        <div className="w-full">
          <div className="absolute top-0 left-1/2 h-px w-2 -translate-x-1 -translate-y-px rounded-full bg-sky-400"></div>
        </div>
        <div className="relative flex h-3 flex-auto -translate-x-[1.15rem] translate-y-14 -rotate-90 items-center justify-center bg-white px-1.5 font-mono text-xs leading-none font-bold text-sky-600 dark:bg-gray-900 dark:text-sky-400">100px</div>
        <div className="w-full">
          <div className="absolute bottom-0 left-1/2 h-px w-2 -translate-x-1 translate-y-px rounded-full bg-sky-400"></div>
        </div>
      </div>
    </div>
    <div className="col-start-2 row-start-2 size-32 bg-white ring-1 ring-sky-300 dark:bg-gray-900 dark:ring-sky-400">
      <div className="relative box-border size-32 p-5 ring ring-sky-300 ring-inset">
        <div className="relative z-1 h-full w-full bg-sky-500 ring-1 ring-sky-500"></div>
        <div className="absolute inset-0">
          <div className="h-full text-black/10 dark:text-white/12.5 bg-[size:8px_8px] bg-left-top bg-[image:repeating-linear-gradient(315deg,currentColor_0,currentColor_1px,transparent_0,transparent_50%)]"></div>
        </div>
      </div>
    </div>
    <div className="col-start-3 row-start-2 bg-white dark:bg-gray-900"></div>
    <div className="col-start-1 row-start-3 bg-white dark:bg-gray-900"></div>
    <div className="col-start-2 row-start-3 bg-white dark:bg-gray-900"></div>
    <div className="col-start-3 row-start-3 bg-white dark:bg-gray-900"></div>
  </div>
</div>
<small className="p-4 ">Chaque carré aura un côté de 100 pas, et il y aura un espace de 50 pas entre chaque carré.</small>
  
</figure >   
  );
}
// Composants Card pour les exercices
export function FigureCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
   
<figure 
  className="flex flex-col gap-1 rounded-xl bg-gray-950/5 p-1 inset-ring inset-ring-gray-950/5 dark:bg-white/10 dark:inset-ring-white/10"
>
  <div 
    className="not-prose overflow-auto rounded-lg bg-white outline outline-white/5 dark:bg-gray-950/50"
  >
    <div 
      className="relative grid w-full grid-cols-[1fr_8rem_1fr] grid-rows-[1fr_3fr_1fr] gap-px bg-gray-700/10 font-mono text-sm leading-6 font-bold dark:bg-gray-700"
    >
      <div className="col-start-1 row-start-1 bg-white dark:bg-gray-900"></div>
      <div className="relative col-start-2 row-start-1 bg-white dark:bg-gray-900">
        <div className="absolute right-0 bottom-2 left-0 flex">
          <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-px bg-sky-400"></div>
          <div className="w-full">
            <div className="absolute top-1/2 left-0 h-2 w-px -translate-x-px -translate-y-1 rounded-full bg-sky-400"></div>
          </div>
          <div className="relative flex w-full flex-auto items-center justify-center bg-white px-1.5 font-mono text-xs leading-none font-bold text-sky-600 dark:bg-gray-900 dark:text-sky-400">
            128px
          </div>
          <div className="w-full">
            <div className="absolute top-1/2 right-0 h-2 w-px translate-x-px -translate-y-1 rounded-full bg-sky-400"></div>
          </div>
        </div>
      </div>
      <div className="col-start-3 row-start-1 bg-white dark:bg-gray-900"></div>
      <div className="relative col-start-1 row-start-2 bg-white dark:bg-gray-900">
        <div className="absolute top-0 right-2 bottom-0 flex w-3">
          <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-[0.5px] bg-sky-400"></div>
          <div className="w-full">
            <div className="absolute top-0 left-1/2 h-px w-2 -translate-x-1 -translate-y-px rounded-full bg-sky-400"></div>
          </div>
          <div className="relative flex h-3 flex-auto -translate-x-[1.15rem] translate-y-14 -rotate-90 items-center justify-center bg-white px-1.5 font-mono text-xs leading-none font-bold text-sky-600 dark:bg-gray-900 dark:text-sky-400">
            128px
          </div>
          <div className="w-full">
            <div className="absolute bottom-0 left-1/2 h-px w-2 -translate-x-1 translate-y-px rounded-full bg-sky-400"></div>
          </div>
        </div>
      </div>
      <div className="col-start-2 row-start-2 size-32 bg-white ring-1 ring-sky-300 dark:bg-gray-900 dark:ring-sky-400">
        <div className="relative box-border size-32 p-5 ring ring-sky-300 ring-inset">
          <div className="relative z-1 h-full w-full bg-sky-500 ring-1 ring-sky-500"></div>
          <div className="absolute inset-0">
            <div className="h-full text-black/10 dark:text-white/12.5 bg-[size:8px_8px] bg-left-top bg-[image:repeating-linear-gradient(315deg,currentColor_0,currentColor_1px,transparent_0,transparent_50%)]"></div>
          </div>
        </div>
      </div>
      <div className="col-start-3 row-start-2 bg-white dark:bg-gray-900"></div>
      <div className="col-start-1 row-start-3 bg-white dark:bg-gray-900"></div>
      <div className="col-start-2 row-start-3 bg-white dark:bg-gray-900"></div>
      <div className="col-start-3 row-start-3 bg-white dark:bg-gray-900"></div>
    </div>
  </div>
  <div>
    <div className="rounded-xl bg-gray-950 in-data-stack:mt-0 in-data-stack:rounded-none in-[figure]:-mx-1 in-[figure]:-mb-1 in-data-stack:[:first-child>&]:rounded-t-xl in-data-stack:[:first-child>&]:*:rounded-t-xl in-data-stack:[:last-child>&]:rounded-b-xl in-data-stack:[:last-child>&]:*:rounded-b-xl">
      <div className="rounded-xl p-1 text-sm scheme-dark in-data-stack:rounded-none dark:bg-white/5 dark:inset-ring dark:inset-ring-white/10 in-data-stack:dark:inset-ring-0 not-prose">
        <div className="*:flex *:*:max-w-none *:*:shrink-0 *:*:grow *:overflow-auto *:rounded-lg *:bg-white/10! *:p-5 dark:*:bg-white/5! **:[.line]:isolate **:[.line]:not-last:min-h-[1lh] *:inset-ring *:inset-ring-white/10 dark:*:inset-ring-white/5">
          <pre 
            className="shiki tailwindcss-theme" 
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-slate-50)'
            }}
            tabIndex={0}
          >
            <code>
              <div className="line">
                <span style={{color: 'var(--color-slate-400)'}}>&lt;</span>
                <span style={{color: 'var(--color-pink-400)'}}>div</span>
                <span style={{color: 'var(--color-slate-300)'}}> class</span>
                <span style={{color: 'var(--color-slate-400)'}}>="</span>
                <span style={{color: 'var(--color-sky-300)'}}>box-border</span>
                <span style={{color: 'var(--color-sky-300)'}} className="highlighted-word relative before:absolute before:-inset-x-0.5 before:-inset-y-0.25 before:-z-10 before:block before:rounded-sm before:bg-[lab(19.93_-1.66_-9.7)] [.highlighted-word_+_&]:before:rounded-l-none">box-border</span>
                <span style={{color: 'var(--color-sky-300)'}}> size-32 border-4 p-4 ..."</span>
                <span style={{color: 'var(--color-slate-400)'}}>&gt;</span>
              </div>
              <div className="line">
                <span style={{color: 'var(--color-slate-400)', fontStyle: 'italic'}}>  &lt;!-- ... --&gt;</span>
              </div>
              <div className="line">
                <span style={{color: 'var(--color-slate-400)'}}>&lt;/</span>
                <span style={{color: 'var(--color-pink-400)'}}>div</span>
                <span style={{color: 'var(--color-slate-400)'}}>&gt;</span>
              </div>
              <div className="line"></div>
            </code>
          </pre>
        </div>
      </div>
    </div>
  </div>
</figure>
  );
}

// Composants Accordion pour les tutoriels
export function TutorialAccordion({
  items,
  children,
}: {
  items?: { title: string; content: React.ReactNode }[];
  children?: React.ReactNode;
}) {
  return (
    <Accordion  type="single" collapsible className="w-full max-w-3xl mx-auto my-6">
      {items
        ? items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger  className="text-lg hover:bg-accent px-4 hover:no-underline cursor-pointer">{item.title}</AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))
        : children}
    </Accordion>
  );
}

// Composant pour centrer le conteneur (pas le texte)
export function CenteredContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full px-4 sm:px-6 md:px-8 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-4xl">
      {children}
    </div>
  );
}

// Astuce avec icône
export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 dark:bg-primary/20 border-l-4 border-primary p-6 my-4 rounded-r-xl w-full max-w-3xl mx-auto">
      <div className="flex items-start">
        <span className="text-2xl mr-4 "><IconBulbFilled className="fill-primary" color=''/></span>
        <div>{children}</div>
      </div>
    </div>
  );
}

import { GlowEffect } from '@/components/ui/glow-effect';
import { IconBulb, IconBulbFilled, IconBulbOff, IconCircuitBulb } from '@tabler/icons-react';

export function GlowEffectCardBackground() {
  return (
    <div className='relative h-44 w-64'>
      <GlowEffect
        colors={['#0894FF', '#C959DD', '#FF2E54', '#FF9004']}
        mode='static'
        blur='medium'
      />
      <div className='relative h-44 w-64 rounded-lg dark:bg-black p-2 text-white bg-white dark:text-black'>
       
      </div>
    </div>
  );
}
