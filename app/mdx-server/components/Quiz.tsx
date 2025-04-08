'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircledIcon, CrossCircledIcon, RocketIcon, TimerIcon, LightningBoltIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';

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
      <div 
        ref={containerRef}
        className={`w-full  max-w-2xl mx-auto my-6 transition-opacity duration-300 ease-in-out ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        role="region"
        aria-label="Résultats du quiz"
      >
        <Card className="shadow-lg border-2 overflow-hidden ">
          <CardHeader className="bg-primary/5 pb-4 text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <RocketIcon className="h-6 w-6" />
              Quiz terminé !
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-8">
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-xl mb-2">Votre score final est :</p>
              <p className="text-5xl font-bold text-primary">{score} / {totalQuestions}</p>
              <div className="mt-2 mb-4">
                <Progress 
                  value={percentage} 
                  className="h-3 w-full max-w-md mx-auto" 
                  aria-label={`Score: ${percentage}%`}
                />
                <p className="mt-2 text-muted-foreground">{scoreMessage}</p>
              </div>
              <div className="flex justify-center mt-2" aria-label={`Note: ${starRating} sur 5 étoiles`}>
                {[...Array(5)].map((_, i) => (
                  <StarFilledIcon 
                    key={i} 
                    className={`h-6 w-6 ${i < starRating ? 'text-yellow-400' : 'text-gray-300'} transition-all duration-300 ${fadeIn ? 'animate-[bounce_0.5s_ease-in-out_' + (i * 0.1) + 's]' : ''}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm font-medium">{performanceRating}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-muted/20 rounded-lg flex flex-col items-center transition-all duration-300 hover:bg-muted/30">
                <TimerIcon className="h-5 w-5 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Temps total</p>
                <p className="text-xl font-semibold">{formatTime(totalTime)}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg flex flex-col items-center transition-all duration-300 hover:bg-muted/30">
                <TimerIcon className="h-5 w-5 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Temps moyen par question</p>
                <p className="text-xl font-semibold">{formatTime(averageTime)}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg flex flex-col items-center transition-all duration-300 hover:bg-muted/30">
                <LightningBoltIcon className="h-5 w-5 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Réponse la plus rapide</p>
                <p className="text-xl font-semibold">{fastestTime ? formatTime(fastestTime) : '-'}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg flex flex-col items-center transition-all duration-300 hover:bg-muted/30">
                <TimerIcon className="h-5 w-5 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Réponse la plus lente</p>
                <p className="text-xl font-semibold">{slowestTime ? formatTime(slowestTime) : '-'}</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-primary/5 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Conseils personnalisés</h3>
              <p className="text-sm text-muted-foreground">{getTips()}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleRestartQuiz} 
                size="lg" 
                className="font-medium px-8 py-6 h-auto transition-all hover:scale-105"
              >
                Recommencer le quiz
              </Button>
              
              <Button 
                variant="outline"
                size="lg" 
                className="font-medium px-8 py-6 h-auto transition-all hover:scale-105"
                onClick={() => {
                  // Cette fonction pourrait être utilisée pour partager les résultats
                  // ou naviguer vers d'autres quiz
                  alert('Fonctionnalité à venir : partager vos résultats');
                }}
              >
                Partager mes résultats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full max-w-2xl mx-auto my-6 "
      role="region"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="w-full sm:w-3/4">
          <Progress 
            value={progress} 
            className="h-2" 
            aria-label={`Progression: ${Math.round(progress)}%`}
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium whitespace-nowrap">
            Question {currentQuestionIndex + 1} sur {totalQuestions} | Score: {score}
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TimerIcon className="h-4 w-4 mr-1" />
                  <span>{formatTime(currentTime - startTime)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Temps écoulé pour cette question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Card 
        className={`shadow-lg bg-card/70 border overflow-hidden transition-all duration-300 ease-in-out ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        role="form"
      >
        <CardHeader className="bg-primary/5 pb-2">
          <CardDescription className="text-sm font-medium">
            Question {currentQuestionIndex + 1} sur {totalQuestions}
          </CardDescription>
          <CardTitle className="text-xl font-semibold">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-3" role="radiogroup" aria-labelledby="quiz-options-label">
            <div className="sr-only" id="quiz-options-label">Options de réponse</div>
            <div className="sr-only">Utilisez les touches numériques (1-{currentQuestion.options.length}) ou les lettres (A-{String.fromCharCode(64 + currentQuestion.options.length)}) pour sélectionner une réponse</div>
            
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                ref={(el: HTMLButtonElement | null) => { optionRefs.current[index] = el }}
                variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "outline"}
                className={`w-full justify-start text-left h-auto py-4 px-4 whitespace-normal transition-all ${
                  showFeedback && index === currentQuestion.correctIndex ? 'border-green-500 border-2 bg-green-50 dark:bg-green-950/20' : ''
                } ${
                  showFeedback && selectedAnswer === index && !isCorrect ? 'border-red-500 border-2 bg-red-50 dark:bg-red-950/20' : ''
                } ${
                  !showFeedback ? 'hover:scale-[1.01] hover:border-primary/50' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={showFeedback}
                role="radio"
                aria-checked={selectedAnswer === index}
                aria-label={`Option ${String.fromCharCode(65 + index)}: ${option}`}
                data-key={String.fromCharCode(65 + index)}
                tabIndex={showFeedback ? -1 : 0}
              >
                <span className="mr-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
        
        {showFeedback && (
          <CardFooter className="flex flex-col p-6 pt-0 gap-4">
            <Alert 
              variant={isCorrect ? "default" : "destructive"} 
              className={`w-full border-2 ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}`}
              role="alert"
            >
              {isCorrect ? (
                <CheckCircledIcon className="h-5 w-5"/>
              ) : (
                <CrossCircledIcon className="h-5 w-5"/>
              )}
              <AlertTitle className="text-base">{isCorrect ? "Correct !" : "Incorrect !"}</AlertTitle>
              <AlertDescription className="text-sm">
                La bonne réponse est : {currentQuestion.options[currentQuestion.correctIndex]}
                {currentQuestion.explanation && (
                  <p className="mt-2">{currentQuestion.explanation}</p>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="self-end">
              <Button 
                ref={nextButtonRef}
                onClick={handleNextQuestion}
                size="lg"
                className="font-medium transition-all hover:scale-105"
                aria-label={currentQuestionIndex < totalQuestions - 1 ? "Passer à la question suivante" : "Voir les résultats du quiz"}
              >
                {currentQuestionIndex < totalQuestions - 1 ? "Question suivante" : "Voir les résultats"}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <div className="mt-4 text-sm text-muted-foreground text-center">
        <p>Utilisez les touches <kbd className="px-1 py-0.5 bg-muted rounded border">1</kbd>-<kbd className="px-1 py-0.5 bg-muted rounded border">{currentQuestion.options.length}</kbd> ou <kbd className="px-1 py-0.5 bg-muted rounded border">A</kbd>-<kbd className="px-1 py-0.5 bg-muted rounded border">{String.fromCharCode(64 + currentQuestion.options.length)}</kbd> pour sélectionner une réponse</p>
      </div>
    </div>
  );
}