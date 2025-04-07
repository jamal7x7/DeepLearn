'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
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

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (selectedIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after feedback is shown

    const correct = selectedIndex === currentQuestion.correctIndex;
    setSelectedAnswer(selectedIndex);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore((prevScore) => prevScore + 1);
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    return (
      <div className="w-full max-w-2xl mx-auto my-6">
        <Card>
          <CardContent className="text-center p-6">
            <h3 className="text-2xl font-bold mb-4">Quiz terminé !</h3>
            <p className="text-xl mb-4">Votre score final est :</p>
            <p className="text-4xl font-bold mb-6">{score} / {totalQuestions}</p>
            <Button onClick={handleRestartQuiz}>Recommencer le quiz</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-6">
      <div className="mb-4 text-right">
        <p className="text-sm font-medium">
          Question {currentQuestionIndex + 1} sur {totalQuestions} | Score: {score}
        </p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "outline"}
                className={`w-full justify-start text-left h-auto py-3 px-4 whitespace-normal ${
                  showFeedback && index === currentQuestion.correctIndex ? 'border-green-500 border-2' : ''
                } ${
                  showFeedback && selectedAnswer === index && !isCorrect ? 'border-red-500 border-2' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={showFeedback}
              >
                {option}
              </Button>
            ))}
          </div>
          
          {showFeedback && (
            <div className="mt-6">
              <Alert variant={isCorrect ? "default" : "destructive"} className="mb-4">
                {isCorrect ? (
                  <CheckCircledIcon className="h-4 w-4"/>
                ) : (
                  <CrossCircledIcon className="h-4 w-4"/>
                )}
                <AlertTitle>{isCorrect ? "Correct !" : "Incorrect !"}</AlertTitle>
                <AlertDescription>
                  La bonne réponse est : {currentQuestion.options[currentQuestion.correctIndex]}
                </AlertDescription>
              </Alert>
              
              <div className="text-right">
                <Button onClick={handleNextQuestion}>
                  {currentQuestionIndex < totalQuestions - 1 ? "Question suivante" : "Voir les résultats"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}