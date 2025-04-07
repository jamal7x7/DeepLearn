"use client"
import React, { useState } from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon, CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

// Define the structure for a quiz question
interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Define the quiz data
const quizData: Question[] = [
  {
    question: "What does LLM stand for?",
    options: ["Large Learning Model", "Long Language Machine", "Large Language Model", "Logical Learning Mechanism"],
    correctAnswer: 2,
    explanation: "LLM stands for Large Language Model, which refers to deep learning models trained on vast amounts of text data to understand and generate human-like language.",
  },
  {
    question: "Which of these is a common architecture used for building LLMs?",
    options: ["Convolutional Neural Network (CNN)", "Recurrent Neural Network (RNN)", "Transformer", "Support Vector Machine (SVM)"],
    correctAnswer: 2,
    explanation: "The Transformer architecture, introduced in the paper 'Attention Is All You Need', is the foundation for most modern LLMs like GPT and BERT due to its effectiveness in handling long-range dependencies.",
  },
  {
    question: "What is 'fine-tuning' in the context of LLMs?",
    options: ["Adjusting the model's temperature", "Training the model from scratch on a small dataset", "Adapting a pre-trained model to a specific task using a smaller, task-specific dataset", "Optimizing the model's inference speed"],
    correctAnswer: 2,
    explanation: "Fine-tuning involves taking a model already trained on a large dataset (pre-trained) and further training it on a smaller, specific dataset to improve its performance on a particular task.",
  },
    {
    question: "What does the 'temperature' parameter typically control during text generation with an LLM?",
    options: ["The speed of generation", "The randomness/creativity of the output", "The maximum length of the output", "The factual accuracy of the output"],
    correctAnswer: 1,
    explanation: "Temperature controls the randomness of the model's predictions. Lower temperatures lead to more predictable, focused text, while higher temperatures result in more diverse and creative, but potentially less coherent, output.",
  },
  {
    question: "Which company developed the GPT (Generative Pre-trained Transformer) series of models?",
    options: ["Google", "Meta", "OpenAI", "Microsoft"],
    correctAnswer: 2,
    explanation: "OpenAI is the research and deployment company behind the influential GPT series of large language models, including GPT-3, GPT-3.5, and GPT-4.",
  },
];

export default function LLMQuizApp() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const totalQuestions = quizData.length;
  const currentQuestion = quizData[currentQuestionIndex];
  const isQuizFinished = currentQuestionIndex >= totalQuestions;

  const handleAnswerSelect = (selectedIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after feedback is shown

    const correct = selectedIndex === currentQuestion.correctAnswer;
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
    setIsCorrect(false);
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
  };

    const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">LLM Quiz</h1>
        <p className="text-lg text-muted-foreground text-center">
          Score: {score} / {totalQuestions}
        </p>
      </div>

      {isQuizFinished ? (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-xl mb-4">Your final score is:</p>
            <p className="text-4xl font-bold mb-6">{score} / {totalQuestions}</p>
             <Button onClick={handleRestartQuiz}>
                Restart Quiz
             </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardDescription>Question {currentQuestionIndex + 1} of {totalQuestions}</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "outline"}
                className={`w-full justify-start text-left h-auto whitespace-normal ${
                  showFeedback && index === currentQuestion.correctAnswer ? 'border-green-500 border-2' : ''
                } ${
                  showFeedback && selectedAnswer === index && !isCorrect ? 'border-red-500 border-2' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={showFeedback}
              >
                {option}
              </Button>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            {showFeedback && (
              <Alert variant={isCorrect ? "default" : "destructive"} className="mb-4 w-full bg-card border">
                {isCorrect ? (
                   <CheckCircledIcon className="h-4 w-4"/>
                ): (
                   <CrossCircledIcon className="h-4 w-4"/>
                )}
                <AlertTitle>{isCorrect ? "Correct!" : "Incorrect!"}</AlertTitle>
                <AlertDescription>
                  {currentQuestion.explanation}
                </AlertDescription>
              </Alert>
            )}
            {showFeedback && (
              <Button onClick={handleNextQuestion} className="w-full sm:w-auto self-end">
                Next Question
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}