'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircledIcon, CrossCircledIcon, RocketIcon, TimerIcon, LightningBoltIcon, StarFilledIcon, ArrowRightIcon, MagicWandIcon, PlusIcon } from '@radix-ui/react-icons';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { Separator } from '@/components/ui/separator';

// Dynamically import canvas-confetti to avoid SSR issues
const confetti = dynamic(() => import('canvas-confetti').then(mod => mod.default), {
  ssr: false
});

// Helper function to format time
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to get performance rating
const getPerformanceRating = (percentage: number): string => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 75) return 'Très bien';
  if (percentage >= 60) return 'Bien';
  if (percentage >= 40) return 'Moyen';
  return 'À améliorer';
};

// Helper function to get star rating based on percentage
const getStarRating = (percentage: number): number => {
  return Math.round(percentage / 20); // 0-100% maps to 0-5 stars
};

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string; // Optional explanation for each question
}

interface QuizProps {
  questions: QuizQuestion[];
}

export function Quiz({ questions }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  
  // Timer related states
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [averageTime, setAverageTime] = useState<number>(0);
  const [fastestTime, setFastestTime] = useState<number | null>(null);
  const [slowestTime, setSlowestTime] = useState<number | null>(null);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Initialize option refs array
  useEffect(() => {
    optionRefs.current = Array(currentQuestion.options.length).fill(null);
  }, [currentQuestion.options.length]);
  
  // Start timer for each question
  useEffect(() => {
    // Start timer for the current question
    const now = Date.now();
    setStartTime(now);
    setCurrentTime(now);
    
    // Update timer every 100ms
    timerRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    
    // Cleanup timer on question change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If feedback is shown and Enter is pressed, go to next question
      if (showFeedback && e.key === 'Enter') {
        handleNextQuestion();
        return;
      }
      
      // If no feedback is shown, allow option selection with number keys
      if (!showFeedback) {
        // Number keys 1-9 (options A-I)
        const num = parseInt(e.key);
        if (num >= 1 && num <= currentQuestion.options.length) {
          handleAnswerSelect(num - 1);
          return;
        }
        
        // Letter keys A-I
        const letterCode = e.key.toUpperCase().charCodeAt(0);
        if (letterCode >= 65 && letterCode < 65 + currentQuestion.options.length) {
          handleAnswerSelect(letterCode - 65);
          return;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback, currentQuestion.options.length]);

  // Trigger confetti animation
  const triggerConfetti = useCallback(() => {
    if (typeof window === 'undefined' || !confetti) return;
    
    const canvasTarget = containerRef.current;
    if (!canvasTarget) return;
    
    // Call confetti directly as a function
    (confetti as Function)({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800']
    });
    
    // No need for reset as the default confetti doesn't have this method
    // It will clean up automatically
  }, []);
  
  const handleAnswerSelect = (selectedIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after feedback is shown

    // Stop the timer and calculate time taken for this question
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const timeTaken = Date.now() - startTime;
    setQuestionTimes(prev => [...prev, timeTaken]);
    
    const correct = selectedIndex === currentQuestion.correctIndex;
    setSelectedAnswer(selectedIndex);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore((prevScore) => prevScore + 1);
      // Trigger confetti for correct answers
      triggerConfetti();
    }
    
    // Provide haptic feedback if available
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(correct ? [100, 50, 100] : [300]);
    }
    
    // Focus the next button after selecting an answer
    setTimeout(() => {
      if (nextButtonRef.current) {
        nextButtonRef.current.focus();
      }
    }, 100);
  };

  const handleNextQuestion = () => {
    // Fade out animation
    setFadeIn(false);
    
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      } else {
        // Calculate quiz statistics before completing
        const times = [...questionTimes];
        const total = times.reduce((sum, time) => sum + time, 0);
        const average = total / times.length;
        const fastest = Math.min(...times);
        const slowest = Math.max(...times);
        
        setTotalTime(total);
        setAverageTime(average);
        setFastestTime(fastest);
        setSlowestTime(slowest);
        setQuizCompleted(true);
      }
      
      // Fade in animation for the next question
      setFadeIn(true);
    }, 300); // Match this with the CSS transition duration
  };

  const handleRestartQuiz = () => {
    setFadeIn(false);
    
    setTimeout(() => {
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
      setQuizCompleted(false);
      setProgress(0);
      setFadeIn(true);
    }, 300);
  };
  
  // Update progress bar when question changes
  useEffect(() => {
    const progressValue = (currentQuestionIndex / totalQuestions) * 100;
    setProgress(progressValue);
  }, [currentQuestionIndex, totalQuestions]);
  
  // Trigger confetti on completion with good score
  useEffect(() => {
    if (quizCompleted && fadeIn && (score / totalQuestions) * 100 >= 70) {
      setTimeout(() => {
        if (confetti) {
          (confetti as Function)({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.3 },
            colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800']
          });
        }
      }, 500);
    }
  }, [quizCompleted, fadeIn, score, totalQuestions, confetti]);

  if (quizCompleted) {
    // Calculate percentage score
    const percentage = (score / totalQuestions) * 100;
    const scoreMessage = 
      percentage === 100 ? 'Parfait ! Vous avez tout bon !' :
      percentage >= 80 ? 'Excellent travail !' :
      percentage >= 60 ? 'Bien joué ! Continuez comme ça !' :
      percentage >= 40 ? 'Pas mal ! Vous pouvez vous améliorer !' :
      'Continuez à vous entraîner !'
    
    // Get performance rating and stars
    const performanceRating = getPerformanceRating(percentage);
    const starRating = getStarRating(percentage);
    
    // Generate personalized tips based on performance
    const getTips = () => {
      if (percentage >= 80) {
        return "Continuez à approfondir vos connaissances et à explorer des sujets plus avancés.";
      } else if (percentage >= 60) {
        return "Revoyez les questions que vous avez manquées et essayez de comprendre pourquoi.";
      } else {
        return "Prenez le temps de revoir les concepts de base avant de réessayer le quiz.";
      }
    };
    
    return (
      <motion.div 
        ref={containerRef}
        className="w-full max-w-2xl mx-auto my-8 px-4"
        role="region"
        aria-label="Résultats du quiz"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Background decorative elements */}
        <div className="absolute -z-10 top-20 left-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse" 
             style={{ animationDuration: '20s' }} />
        <div className="absolute -z-10 bottom-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse" 
             style={{ animationDuration: '15s' }} />

        <Card className="shadow-xl border-2 overflow-hidden bg-gradient-to-b from-card to-card/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-b from-primary/20 to-primary/10 pb-6 text-center border-b border-primary/10 relative overflow-hidden">
            {/* Decorative header elements */}
            <div className="absolute top-0 left-0 w-full h-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-primary/10 to-transparent opacity-80"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-xl"></div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3 relative">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                >
                  <RocketIcon className="h-8 w-8 text-primary" />
                </motion.div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Quiz terminé !</span>
              </CardTitle>
            </motion.div>
          </CardHeader>

          <CardContent className="text-center p-8 md:p-10">
            <motion.div 
              className="mb-8 p-6 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-muted shadow-inner relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Decorative score card elements */}
              <div className="absolute -right-10 top-10 w-40 h-40 bg-primary/5 rounded-full blur-xl"></div>
              <div className="absolute -left-10 bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-xl"></div>
              
              <p className="text-xl mb-3 text-foreground/80 font-medium">Votre score final est :</p>
              <div className="relative">
                <motion.p 
                  className="text-6xl font-bold text-primary mb-2 tabular-nums"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.5 }}
                >
                  {score} / {totalQuestions}
                </motion.p>
                <motion.div 
                  className="absolute -top-4 -right-4 bg-primary/20 rounded-full p-2.5 shadow-md"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.7 }}
                >
                  <motion.span 
                    className="text-lg font-bold text-primary"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                  >
                    {Math.round(percentage)}%
                  </motion.span>
                </motion.div>
              </div>
              
              <div className="mt-6 mb-5">
                <div className="relative">
                  <Progress 
                    value={0} 
                    className="h-5 w-full max-w-md mx-auto rounded-full" 
                    aria-label={`Score: ${percentage}%`}
                  />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                  />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-primary/20 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 2, delay: 0.8 }}
                    style={{ filter: "blur(8px)" }}
                  />
                </div>
                <motion.p 
                  className="mt-4 text-muted-foreground font-medium text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  {scoreMessage}
                </motion.p>
              </div>
              
              <motion.div 
                className="flex justify-center mt-4" 
                aria-label={`Note: ${starRating} sur 5 étoiles`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.4 + (i * 0.1) }}
                  >
                    <StarFilledIcon 
                      className={cn(
                        "h-9 w-9 transition-all duration-300 mx-1",
                        i < starRating ? "text-yellow-400 drop-shadow-lg" : "text-gray-300"
                      )}
                    />
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.p 
                className="mt-4 text-base font-semibold bg-primary/10 inline-block px-5 py-1.5 rounded-full shadow-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8 }}
              >
                {performanceRating}
              </motion.p>
            </motion.div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: <TimerIcon className="h-6 w-6 text-primary" />, title: "Temps total", value: formatTime(totalTime), delay: 0.3 },
                { icon: <TimerIcon className="h-6 w-6 text-primary" />, title: "Temps moyen par question", value: formatTime(averageTime), delay: 0.4 },
                { icon: <LightningBoltIcon className="h-6 w-6 text-primary" />, title: "Réponse la plus rapide", value: fastestTime ? formatTime(fastestTime) : '-', delay: 0.5 },
                { icon: <TimerIcon className="h-6 w-6 text-primary" />, title: "Réponse la plus lente", value: slowestTime ? formatTime(slowestTime) : '-', delay: 0.6 }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="p-5 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-muted/50 flex flex-col items-center transition-all duration-300 hover:shadow-md hover:border-primary/20 group relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.8 + stat.delay }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <motion.div 
                    className="bg-primary/10 rounded-full p-3 mb-2 group-hover:scale-110 transition-transform relative z-10"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    {stat.icon}
                  </motion.div>
                  <p className="text-sm font-medium text-muted-foreground relative z-10">{stat.title}</p>
                  <p className="text-xl font-semibold mt-1 tabular-nums relative z-10">{stat.value}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              className="mb-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 shadow-inner relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.2 }}
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>
              
              <motion.h3 
                className="text-xl font-semibold mb-3 flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.4 }}
              >
                <motion.span 
                  className="bg-primary/10 p-1.5 rounded-full inline-flex"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                >
                  <RocketIcon className="h-5 w-5 text-primary" />
                </motion.span>
                Conseils personnalisés
              </motion.h3>
              
              <motion.p 
                className="text-base text-muted-foreground relative z-10 bg-card/50 p-4 rounded-lg border border-muted/50 shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6 }}
              >
                {getTips()}
              </motion.p>
            </motion.div>
          </CardContent>
        </Card>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleRestartQuiz} 
                  size="lg" 
                  className="font-medium px-8 py-6 h-auto bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/40 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out" />
                  <RocketIcon className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">Recommencer le quiz</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="font-medium px-8 py-6 h-auto border-primary/20 hover:bg-primary/10 shadow-sm relative overflow-hidden group"
                  onClick={() => {
                    // Cette fonction pourrait être utilisée pour partager les résultats
                    // ou naviguer vers d'autres quiz
                    alert('Fonctionnalité à venir : partager vos résultats');
                  }}
                >
                  <span className="absolute inset-0 w-full h-full bg-primary/5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left" />
                  <span className="relative z-10">Partager mes résultats</span>
                </Button>
              </motion.div>
            </motion.div>
  }

  return (
    <motion.div 
      ref={containerRef} 
      className="w-full max-w-2xl mx-auto my-6 px-4"
      role="region"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background decorative elements */}
      <div className="absolute -z-10 top-20 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse" 
           style={{ animationDuration: '15s' }} />
      <div className="absolute -z-10 bottom-20 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse" 
           style={{ animationDuration: '20s' }} />
      
      {/* Progress and stats bar */}
      <motion.div 
        className="mb-6 bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/40 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="w-full sm:w-3/4">
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md inline-flex items-center">
                <RocketIcon className="h-3.5 w-3.5 mr-1" />
                {currentQuestionIndex + 1}/{totalQuestions}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground">Score: </span>
              <span className="font-semibold">{score}</span>
            </p>
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-2.5 rounded-full" 
                aria-label={`Progression: ${Math.round(progress)}%`}
              />
              <motion.div 
                className="absolute top-0 left-0 h-full bg-primary/20 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ opacity: 0.6 }}
              />
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-sm bg-muted/50 px-3 py-1.5 rounded-full hover:bg-muted transition-colors">
                  <TimerIcon className="h-4 w-4 mr-1.5 text-primary" />
                  <span className="font-mono">{formatTime(currentTime - startTime)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Temps écoulé pour cette question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl border-2 overflow-hidden bg-gradient-to-b from-card to-card/95 backdrop-blur-sm">
            {/* Card header with decorative elements */}
            <CardHeader className="relative bg-gradient-to-b from-primary/20 to-primary/5 pb-5 border-b border-primary/10">
              <div className="absolute top-0 left-0 w-full h-16 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70"></div>
              
              <CardDescription className="relative z-10 text-sm font-medium bg-primary/10 inline-block px-3 py-1 rounded-full mb-2 shadow-sm">
                Question {currentQuestionIndex + 1} sur {totalQuestions}
              </CardDescription>
              
              <CardTitle className="relative z-10 text-xl md:text-2xl font-semibold leading-tight">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-3.5" role="radiogroup" aria-labelledby="quiz-options-label">
                <div className="sr-only" id="quiz-options-label">Options de réponse</div>
                <div className="sr-only">Utilisez les touches numériques (1-{currentQuestion.options.length}) ou les lettres (A-{String.fromCharCode(64 + currentQuestion.options.length)}) pour sélectionner une réponse</div>
                
                {currentQuestion.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Button
                      ref={(el: HTMLButtonElement | null) => { optionRefs.current[index] = el }}
                      variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "outline"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-4 px-5 whitespace-normal transition-all group relative overflow-hidden",
                        showFeedback && index === currentQuestion.correctIndex ? 'border-green-500 border-2 bg-green-50 dark:bg-green-950/20 shadow-md' : '',
                        showFeedback && selectedAnswer === index && !isCorrect ? 'border-red-500 border-2 bg-red-50 dark:bg-red-950/20 shadow-md' : '',
                        !showFeedback ? 'hover:scale-[1.01] hover:border-primary/50 hover:shadow-md' : ''
                      )}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showFeedback}
                      role="radio"
                      aria-checked={selectedAnswer === index}
                      aria-label={`Option ${String.fromCharCode(65 + index)}: ${option}`}
                      data-key={String.fromCharCode(65 + index)}
                      tabIndex={showFeedback ? -1 : 0}
                    >
                      {/* Hover effect overlay */}
                      <span className="absolute inset-0 w-full h-full bg-primary/5 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100 duration-300 ease-out -z-10" />
                      
                      {/* Option letter badge */}
                      <span className="mr-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-sm font-medium transition-all group-hover:bg-primary/20 group-hover:scale-110 shadow-sm">
                        {String.fromCharCode(65 + index)}
                      </span>
                      
                      {/* Option text */}
                      <span className="group-hover:text-primary/90 transition-colors">{option}</span>
                      
                      {/* Correct/incorrect indicators */}
                      {showFeedback && index === currentQuestion.correctIndex && (
                        <motion.span 
                          className="absolute right-3 text-green-600"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          <CheckCircledIcon className="h-6 w-6" />
                        </motion.span>
                      )}
                      {showFeedback && selectedAnswer === index && !isCorrect && (
                        <motion.span 
                          className="absolute right-3 text-red-600"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          <CrossCircledIcon className="h-6 w-6" />
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardFooter className="flex flex-col p-6 pt-0 gap-4">
                  <Alert 
                    variant={isCorrect ? "default" : "destructive"} 
                    className={cn(
                      "w-full border-2 shadow-md",
                      isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                    )}
                    role="alert"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      {isCorrect ? (
                        <CheckCircledIcon className="h-5 w-5 text-green-600"/>
                      ) : (
                        <CrossCircledIcon className="h-5 w-5 text-red-600"/>
                      )}
                    </motion.div>
                    <AlertTitle className="text-base font-semibold">
                      {isCorrect ? "Correct !" : "Incorrect !"}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      <p className="font-medium">La bonne réponse est : {currentQuestion.options[currentQuestion.correctIndex]}</p>
                      {currentQuestion.explanation && (
                        <motion.p 
                          className="mt-2 p-2 bg-card/50 rounded-md border border-border/50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {currentQuestion.explanation}
                        </motion.p>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="self-end">
                    <Button 
                      ref={nextButtonRef}
                      onClick={handleNextQuestion}
                      size="lg"
                      className="font-medium transition-all hover:scale-105 bg-gradient-to-r from-primary to-primary/90 shadow-md"
                      aria-label={currentQuestionIndex < totalQuestions - 1 ? "Passer à la question suivante" : "Voir les résultats du quiz"}
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>
                          Question suivante
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Voir les résultats
                          <RocketIcon className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
      
      <motion.div 
        className="mt-4 text-sm text-muted-foreground text-center bg-card/50 backdrop-blur-sm p-2 rounded-lg border border-border/30 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>Utilisez les touches <kbd className="px-1 py-0.5 bg-muted rounded border">1</kbd>-<kbd className="px-1 py-0.5 bg-muted rounded border">{currentQuestion.options.length}</kbd> ou <kbd className="px-1 py-0.5 bg-muted rounded border">A</kbd>-<kbd className="px-1 py-0.5 bg-muted rounded border">{String.fromCharCode(64 + currentQuestion.options.length)}</kbd> pour sélectionner une réponse</p>
      </motion.div>
    </motion.div>
  );




}