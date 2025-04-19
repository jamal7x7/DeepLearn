"use client"

import { MessageCircle, Settings, ShieldCheck, UserPlus, Users } from 'lucide-react';

import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'

import { Card } from './ui/card';


const features = [
  {
    icon: <UserPlus className="w-10 h-10 text-blue-500 dark:text-blue-400" />,
    title: "إنشاء حساب بسهولة",
    desc: "سجّل بسرعة دون الحاجة إلى رقم هاتف أو بريد إلكتروني.",
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-green-500 dark:text-green-400" />,
    title: "تسجيل دخول آمن",
    desc: "ادخل إلى حسابك بسرعة مع ضمان أعلى معايير الأمان.",
  },
  {
    icon: <Settings className="w-10 h-10 text-purple-500 dark:text-purple-400" />,
    title: "إدارة المعلومات الشخصية",
    desc: "قم بتحديث بياناتك الشخصية بسهولة في أي وقت.",
  },
  {
    icon: <Users className="w-10 h-10 text-pink-500 dark:text-pink-400" />,
    title: "إنشاء وإدارة المجموعات",
    desc: "كوّن مجموعات وأدرها مع تحكم إداري كامل.",
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />,
    title: "مراسلة فورية",
    desc: "تواصل مع مجتمع مدرستك في الوقت الحقيقي.",
  },
];

export default function LogoCloud() {
    return (
        <section className="bg-transparent overflow-hidden  py-16">
            <div className="group relative  px-6">
                <div className="flex flex-col items-center md:flex-row">
                    {/* <div className="md:max-w-44 md:border-r md:pr-6">
                        <p className="text-end text-sm">Powering the best teams</p>
                    </div> */}
                    <div className="relative py-6 md:w-[calc(100%-1rem)]">
                        <InfiniteSlider
                            speedOnHover={40}
                            speed={200}
                            gap={0}>
                            <div className="flex gap-0 md:gap-8">

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
                                        {/* <h3 className="font-bold text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text"> */}
                                        <h3 className="font-bold text-xl ">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300">{feature.desc}</p>
                                        </Card>
                                    ))}

                                {/* <img
                                    className="mx-auto h-5 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/nvidia.svg"
                                    alt="Nvidia Logo"
                                    height="20"
                                    width="auto"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto h-4 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/column.svg"
                                    alt="Column Logo"
                                    height="16"
                                    width="auto"
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto h-4 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/github.svg"
                                    alt="GitHub Logo"
                                    height="16"
                                    width="auto"
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto h-5 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/nike.svg"
                                    alt="Nike Logo"
                                    height="20"
                                    width="auto"
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto h-5 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                                    alt="Lemon Squeezy Logo"
                                    height="20"
                                    width="auto"
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto h-4 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/laravel.svg"
                                    alt="Laravel Logo"
                                    height="16"
                                    width="auto"
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto h-7 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/lilly.svg"
                                    alt="Lilly Logo"
                                    height="28"
                                    width="auto"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto h-6 w-fit dark:invert"
                                    src="https://html.tailus.io/blocks/customers/openai.svg"
                                    alt="OpenAI Logo"
                                    height="24"
                                    width="auto"
                                />*/}
                            </div> 
                        </InfiniteSlider>

                        <div className="bg-linear-to-r from-transparent absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-linear-to-l from-transparent absolute inset-y-0 right-0 w-20"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
