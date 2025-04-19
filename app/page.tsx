"use client";

import Image from "next/image";
import { ShieldCheck, Users, Settings, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Separator } from "@/components/ui/separator";
import FeatureParallax from "@/app/components/FeatureParallax";
import {RainbowButton} from "@/components/ui/rainbow-button";

import NavBar from "./components/NavBar";



export default function LandingPage() {
  const { t } = useTranslation();
  const [activeCard, setActiveCard] = React.useState(0);
  const { theme } = useTheme();

  return (
    <>
      <NavBar />

    <main dir="rtl" className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-b from-white to-slate-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl px-6 py-32 text-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 via-purple-200/30 to-pink-200/30 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 animate-pulse blur-2xl"></div>
        
        {/* Glassmorphism overlay */}
        

        <div className="relative  flex justify-center animate-fade-in delay-500">
          <div className="-mt-80 absolute w-80 h-80 bg-gradient-to-br from-blue-300/20 via-purple-300/20 to-pink-300/20 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl -z-10"></div>
          <ContainerScroll
            titleComponent={
            <>
            <div className="relative backdrop-blur-md bg-white/30 dark:bg-gray-800/30 rounded-3xl p-10 shadow-sm mx-auto max-w-3xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl md:text-2xl font-bold mb-3 animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            {t('hero_title_prefix', 'مرحبًا بك في')}
          </h3>
          <h1 className="text-5xl md:text-5xl font-extrabold mb-6 leading-tight animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            {t('hero_title_suffix', 'أفينت: تواصل مدرسي آمن وفعّال')}
          </h1>
          <p className="text-lg md:text-xl mb-10 animate-fade-in delay-200 text-gray-800 dark:text-gray-200">
            {t('hero_subtitle', 'استمتع بتعاون سلس مع أعلى مستويات الخصوصية والأمان.')}
          </p>
          <Link href="/sign-up">
           

<RainbowButton  className="px-12 py-5  text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-normal dark:text-white  dark:shadow-xl transition-all duration-1200 animate-pulse rounded-full border-2   hover:border-gray-400 hover:dark:border-gray-100">
{t('cta_primary', 'أنشئ حسابك المجاني الآن')}
</RainbowButton>

</Link>

        
        </div>
            </>
            }
          >
            <Image
              // src={"/images/connected-people-dark.png"}
              src={theme === 'dark' ? '/images/connected-people-dark.png' : '/images/connected-people-light.png'}
              alt={t('hero_image_alt', 'طلاب ومعلمون متصلون')}
              width={1200}
              height={800}
              className="rounded-4xl shadow-2xl border-4 border-white dark:border-gray-800 object-cover"
              priority
            />
          </ContainerScroll>
        </div>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Key Features Section */}
      <section className="relative w-full max-w-7xl px-6 py-20 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 blur-2xl rounded-3xl"></div>

        <h2 className="text-4xl font-extrabold text-center mb-16 animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          {t('key_features_title', 'الميزات الرئيسية')}
        </h2>

        <div className="w-full ">
          <FeatureParallax />
          {/* <LogoCloud /> */}
          {/* <ProgressiveBlurSlider/> */}
        </div>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Security Assurance */}
      <section className="w-full max-w-5xl px-6 py-20">
        <h2
          className="text-4xl font-extrabold text-center mb-16 animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 sticky top-14 z-30 py-6 md:py-8 backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 shadow-sm"
          style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem' }}
        >
          {t('security_assurance_title', 'أمانك أولويتنا')}
        </h2>
        <div className="flex flex-col-reverse md:flex-row gap-10 items-stretch">
          {/* Paragraphs on the right */}
          <div className="md:w-2/3 flex flex-col gap-20 justify-center">
            {[0, 1, 2, 3].map(idx => (
              <SecurityParagraph
                key={idx}
                idx={idx}
                activeCard={activeCard}
                setActiveCard={setActiveCard}
                title={t(`security_assurance_item_${idx + 1}`)}
                desc={t(`security_assurance_desc_${idx + 1}`)}
              />
            ))}
          </div>
          {/* Cards on the left */}
          <div className="md:w-1/3 flex flex-col gap-8 sticky top-64 self-start z-10">
            <SecurityCard
              icon={<Lock className="w-6 h-6 text-blue-500 dark:text-blue-400" />}
              title={t('security_assurance_item_1')}
              isActive={activeCard === 0}
            />
            <SecurityCard
              icon={<ShieldCheck className="w-6 h-6 text-green-500 dark:text-green-400" />}
              title={t('security_assurance_item_2')}
              isActive={activeCard === 1}
            />
            <SecurityCard
              icon={<Settings className="w-6 h-6 text-purple-500 dark:text-purple-400" />}
              title={t('security_assurance_item_3')}
              isActive={activeCard === 2}
            />
            <SecurityCard
              icon={<Users className="w-6 h-6 text-pink-500 dark:text-pink-400" />}
              title={t('security_assurance_item_4')}
              isActive={activeCard === 3}
            />
          </div>
        </div>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Visual Demonstration
      <section className="w-full max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-10 animate-fade-in">شاهد أفينت أثناء العمل</h2>
        <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl mx-auto border-4 border-blue-300 dark:border-blue-700 animate-fade-in delay-200">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="فيديو توضيحي لتطبيق أفينت"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section> */}

      <Separator className="my-20 w-3/4" />

      {/* User Testimonials */}
      <section className="w-full max-w-4xl px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-100/20 to-pink-100/20 dark:from-purple-900/20 dark:to-pink-900/20 blur-2xl rounded-3xl"></div>
        <h2 className="text-4xl font-extrabold mb-10 animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
          {t('testimonials_title', 'آراء المستخدمين')}
        </h2>
        <div className="relative max-w-2xl mx-auto p-10 rounded-3xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-2xl animate-fade-in delay-200 border border-gray-200 dark:border-gray-700">
          <blockquote className="italic mb-4 text-lg md:text-xl">
            {t('testimonial_quote', 'لقد غيّر أفينت طريقة تواصل مدرستنا، وجعلها أكثر أمانًا وكفاءة.')}
          </blockquote>
          {/* <p className="font-semibold text-gray-800 dark:text-gray-200">{t('testimonial_author', '– جين دو، مديرة المدرسة')}</p> */}
        </div>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Secondary CTA */}
      <section className="relative w-full max-w-4xl px-6 py-20 text-center overflow-hidden rounded-3xl bg-gradient-to-r from-blue-100/30 to-purple-100/30 dark:from-blue-900/30 dark:to-purple-900/30 shadow-2xl animate-fade-in delay-200 border border-gray-200 dark:border-gray-700">
        <h2 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          {t('cta_secondary_title', 'انضم إلى أفينت اليوم وطور تواصل مدرستك')}
        </h2>
        <Link href="/sign-up">

        <RainbowButton  className="px-12 py-5  text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-normal dark:text-white  dark:shadow-xl transition-all duration-1200 animate-pulse rounded-full border-2   hover:border-gray-400 hover:dark:border-gray-100">
        {t('cta_secondary', 'ابدأ الآن')}
            </RainbowButton>

        </Link>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Footer */}
      <footer className="w-full max-w-7xl px-6 py-16 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-transparent to-slate-100 dark:to-gray-900">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-x-4 md:space-x-reverse">
            <a href="/privacy-policy" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{t('privacy_policy', 'سياسة الخصوصية')}</a>
            <a href="/terms-of-service" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{t('terms_of_service', 'شروط الاستخدام')}</a>
            <a href="/contact" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{t('contact_us', 'اتصل بنا')}</a>
          </div>
          <div className="space-x-4 md:space-x-reverse mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{t('twitter', 'تويتر')}</a>
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{t('facebook', 'فيسبوك')}</a>
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{t('linkedin', 'لينكدإن')}</a>
          </div>
        </div>
        <p className="mt-6">&copy; {new Date().getFullYear()} {t('copyright', 'أفينت. جميع الحقوق محفوظة.')}</p>
      </footer>
    </main>
    </>
  );
}

// --- SecurityCard and SecurityParagraph components ---


type SecurityCardProps = {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
};

function SecurityCard({ icon, title, isActive }: SecurityCardProps) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md shadow border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isActive ? 'ring-2 ring-blue-400 dark:ring-blue-500 scale-105' : ''}`}
      style={{ fontSize: '0.9rem', minHeight: 56 }}>
      <div>{icon}</div>
      <span className="font-semibold text-base truncate leading-tight" style={{ fontSize: '0.95em' }}>{title}</span>
    </div>
  );
}

type SecurityParagraphProps = {
  idx: number;
  activeCard: number;
  setActiveCard: (idx: number) => void;
  title: string;
  desc: string;
};

function SecurityParagraph({ idx, activeCard, setActiveCard, title, desc }: SecurityParagraphProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.2;
      if (isVisible) setActiveCard(idx);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial
    return () => window.removeEventListener("scroll", handleScroll);
  }, [idx, setActiveCard]);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-in-out transform ${activeCard === idx ? 'opacity-100 translate-x-0 scale-100 blur-0' : 'opacity-0 translate-x-10 scale-95 blur-sm pointer-events-none h-0 overflow-hidden'} flex flex-col gap-4 text-left`}
      style={{ minHeight: 120 }}
    >
      <h3 className="text-xl md:text-2xl font-bold mb-2 text-blue-600 dark:text-blue-400 transition-all duration-500">
        {title}
      </h3>
      <p className="text-base md:text-lg text-gray-700 dark:text-gray-200 leading-relaxed transition-all duration-700" style={{ lineHeight: 1.8 }}>
        {desc}
      </p>
    </div>
  );
}
// --- End SecurityCard and SecurityParagraph ---