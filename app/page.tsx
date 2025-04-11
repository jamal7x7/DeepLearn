"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Users, MessageCircle, UserPlus, Settings, Lock } from "lucide-react";
import FeatureParallax from "@/app/components/FeatureParallax";
import {ProgressiveBlurSlider} from "@/app/components/infinitnumbers";
import NavBar from "./components/NavBar";
import LogoCloud from "@/components/logo-cloud";

export default function LandingPage() {
  return (
    <>
      <NavBar />

    <main dir="rtl" className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-b from-white to-slate-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl px-6 py-32 text-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 via-purple-200/30 to-pink-200/30 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 animate-pulse blur-2xl"></div>
        
        {/* Glassmorphism overlay */}
        <div className="relative backdrop-blur-md bg-white/30 dark:bg-gray-800/30 rounded-3xl p-10 shadow-2xl mx-auto max-w-3xl border border-gray-200 dark:border-gray-700">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            مرحبًا بك في أفينت: تواصل مدرسي آمن وفعّال
          </h1>
          <p className="text-lg md:text-xl mb-10 animate-fade-in delay-200 text-gray-800 dark:text-gray-200">
            استمتع بتعاون سلس مع أعلى مستويات الخصوصية والأمان.
          </p>
          <Button size="lg" className="px-12 py-5 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white shadow-xl transition-all duration-300 animate-pulse rounded-full border-2 border-transparent hover:border-white">
            أنشئ حسابك المجاني الآن
          </Button>
        </div>

        <div className="relative mt-16 flex justify-center animate-fade-in delay-500">
          <div className="absolute w-80 h-80 bg-gradient-to-br from-blue-300/20 via-purple-300/20 to-pink-300/20 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl -z-10"></div>
          <Image
            src="/images/connected-people.svg"
            alt="طلاب ومعلمون متصلون"
            width={600}
            height={400}
            className="rounded-3xl shadow-2xl border-4 border-white dark:border-gray-800"
          />
        </div>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Key Features Section */}
      <section className="relative w-full max-w-7xl px-6 py-20 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 blur-2xl rounded-3xl"></div>

        <h2 className="text-4xl font-extrabold text-center mb-16 animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          الميزات الرئيسية
        </h2>

        <div className="w-full ">
          <FeatureParallax />
          {/* <LogoCloud /> */}
          {/* <ProgressiveBlurSlider/> */}
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
          آراء المستخدمين
        </h2>
        <div className="relative max-w-2xl mx-auto p-10 rounded-3xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-2xl animate-fade-in delay-200 border border-gray-200 dark:border-gray-700">
          <blockquote className="italic mb-4 text-lg md:text-xl">
            "لقد غيّر أفينت طريقة تواصل مدرستنا، وجعلها أكثر أمانًا وكفاءة."
          </blockquote>
          <p className="font-semibold text-gray-800 dark:text-gray-200">– جين دو، مديرة المدرسة</p>
        </div>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Security Assurance */}
      <section className="w-full max-w-4xl px-6 py-20">
        <h2 className="text-4xl font-extrabold text-center mb-10 animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          أمانك أولويتنا
        </h2>
        <ul className="list-none space-y-6 text-lg leading-relaxed animate-fade-in delay-200">
          <li className="flex items-center gap-4 p-4 rounded-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow border border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <Lock className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            تشفير كامل لجميع الرسائل
          </li>
          <li className="flex items-center gap-4 p-4 rounded-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow border border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <ShieldCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            الامتثال للوائح GDPR و FERPA
          </li>
          <li className="flex items-center gap-4 p-4 rounded-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow border border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
              <Settings className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            دعم المصادقة متعددة العوامل
          </li>
          <li className="flex items-center gap-4 p-4 rounded-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow border border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900">
              <Users className="w-6 h-6 text-pink-500 dark:text-pink-400" />
            </div>
            مراجعات وتحديثات أمنية منتظمة
          </li>
        </ul>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Secondary CTA */}
      <section className="relative w-full max-w-4xl px-6 py-20 text-center overflow-hidden rounded-3xl bg-gradient-to-r from-blue-100/30 to-purple-100/30 dark:from-blue-900/30 dark:to-purple-900/30 shadow-2xl animate-fade-in delay-200 border border-gray-200 dark:border-gray-700">
        <h2 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          انضم إلى أفينت اليوم وطور تواصل مدرستك
        </h2>
        <Button size="lg" className="px-12 py-5 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white shadow-xl transition-all duration-300 animate-pulse rounded-full border-2 border-transparent hover:border-white">
          ابدأ الآن
        </Button>
      </section>

      <Separator className="my-20 w-3/4" />

      {/* Footer */}
      <footer className="w-full max-w-7xl px-6 py-16 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-transparent to-slate-100 dark:to-gray-900">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-x-4 md:space-x-reverse">
            <a href="/privacy-policy" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">سياسة الخصوصية</a>
            <a href="/terms-of-service" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">شروط الاستخدام</a>
            <a href="/contact" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">اتصل بنا</a>
          </div>
          <div className="space-x-4 md:space-x-reverse mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">تويتر</a>
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">فيسبوك</a>
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">لينكدإن</a>
          </div>
        </div>
        <p className="mt-6">&copy; {new Date().getFullYear()} أفينت. جميع الحقوق محفوظة.</p>
      </footer>
    </main>
    </>
  );
}