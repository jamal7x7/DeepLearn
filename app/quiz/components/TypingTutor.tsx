"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from  "motion/react"
import { CheckCircle, XCircle, Award, Keyboard, ChevronRight, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils"; // Assurez-vous que ce chemin est correct pour votre config shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

// Ajout de styles CSS pour le curseur clignotant
import "../App.css";

// --- Définition des Niveaux ---
const levels = [
    // { name: "Base Minuscules", text: "« guillemets » (parenthèses) {accolades} [crochets] ; 20 € ; a.b@dom.eu" },
    // { name: "ct", text: " (15 + 13) / 2 - 2 > 6 ; 60% de 12$ = 7$ et 20 cents ; 2 £ ou livres ; §2 #3 ; 10°C < 10°F ?" },
    // { name: "ct", text: "B2*22+B1*2+B0*2 = B2*4+B1*2+B0*1 ; 4*102+3*10+7*1 = 4*100+3*10+7*1 ; A_B " },
    // { name: "Base Minuscules", text: "« guillemets » (parenthèses) {accolades} [crochets] ; 20 € ; a.b@dom.eu" },
    // { name: "Base Minuscules", text: "« guillemets » (parenthèses) {accolades} [crochets] ; 20 € ; a.b@dom.eu" },
    { name: "Base Minuscules", text: "qsdf jklm gh azerty wxcvbn" },
    { name: "Ponctuation Simple", text: "voici, la phrase; elle contient: des points! et des virgules." },
    { name: "Majuscules", text: "Bonjour Paris. Comment allez-vous ? La Tour Eiffel est haute." },
    { name: "Chiffres (Maj)", text: "Il y a 12 mois & 365 jours (environ). 1+2=3 ou 4*5=20 ?" },
    { name: "Accents Directs", text: "l'été révèle où l'élève étudie sa leçon près du café. çà và ù" },
    { name: "Accents Circonflexes", text: "le château de l'île a un drôle d'hôte. arrête ! où est la fenêtre ?" },
    { name: "Tréma", text: "le maïs et l'ambiguë coïncidence de Noël. haïr." },
    { name: "AltGr Courant", text: "mon email@domaine.com coûte 10€. cherchez #hashtag ~ [ok] | {super}" },
    { name: "Mix Complet", text: "Écrivez-moi à noël@exemple.fr pour l'évaluation complète [coût: ~5€]. Ça ira?" },
];

// --- Combinaisons Touches Mortes ---
const deadKeyMap: Record<string, Record<string, string>> = {
    '^': { 'a': 'â', 'e': 'ê', 'i': 'î', 'o': 'ô', 'u': 'û', 'A': 'Â', 'E': 'Ê', 'I': 'Î', 'O': 'Ô', 'U': 'Û' },
    '¨': { 'a': 'ä', 'e': 'ë', 'i': 'ï', 'o': 'ö', 'u': 'ü', 'y': 'ÿ', 'A': 'Ä', 'E': 'Ë', 'I': 'Ï', 'O': 'Ö', 'U': 'Ü', 'Y': 'Ÿ' },
    // '~': {'n': 'ñ', 'N': 'Ñ', 'o':'õ', 'O':'Õ', 'a':'ã', 'A':'Ã'}
};

// --- Mapping event.code vers touche morte (À AJUSTER SELON VOTRE CLAVIER/OS) ---
// Utilisez le debugInfo pour trouver les bons codes si ceux-ci ne fonctionnent pas
const codeToDeadKey: Record<string, string> = {
    'BracketRight': '^', // Souvent touche '[{' sur AZERTY FR Windows/Linux
    // 'Quote': '^',     // Moins courant, touche 4 '
    'Digit6': '¨',       // Souvent touche 6 - sur AZERTY FR Windows/Linux (Shift+^ physique)
    // 'Backslash': '¨', // Peut être une autre touche selon layout précis
    // 'Equal': '¨',     // Ou la touche =+ ?
    // Mac peut utiliser des codes différents (ex: 'Key[', 'Minus') - À tester!
};


// Styles CSS pour les animations et effets visuels
const styles = {
    keyboardKey: "inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md bg-gray-100 border border-gray-300 text-sm font-medium shadow-sm",
    characterCorrect: "text-green-600 font-medium",
    characterError: "text-red-600 bg-red-100 rounded",
    characterCurrent: "text-primary bg-primary/10 rounded px-0.5 py-0.5",
    characterPending: "text-gray-600",
    levelBadge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
};

// Animations pour les transitions entre niveaux
const animations = {
    container: {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    },
    item: {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.4 } },
    },
    character: {
        correct: { scale: [1, 1.2, 1], color: ["#000", "#16a34a", "#6b7280"], transition: { duration: 0.3 } },
        error: { x: [-2, 2, -2, 0], transition: { duration: 0.3 } }
    }
};

export function TypingTutor() {
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [typedText, setTypedText] = useState(''); // Texte correctement tapé
    const [startTime, setStartTime] = useState<number | null>(null);
    const [errors, setErrors] = useState(0);
    const [totalCharsTyped, setTotalCharsTyped] = useState(0); // Inclut erreurs pour WPM brut
    const [deadKeyState, setDeadKeyState] = useState<string | null>(null);
    const [isInErrorState, setIsInErrorState] = useState(false);
    const [isLevelComplete, setIsLevelComplete] = useState(false); // Nouveau: Niveau actuel terminé?
    const [isFinished, setIsFinished] = useState(false); // Nouveau: Jeu entier terminé?
    const [debugInfo, setDebugInfo] = useState('');

    const currentLevel = useMemo(() => levels[currentLevelIndex], [currentLevelIndex]);
    const textToType = useMemo(() => {
        if (isFinished) return "Bravo ! Tous les niveaux terminés.";
        return currentLevel?.text ?? "";
    }, [currentLevel, isFinished]);
    const currentPosition = typedText.length;

    // --- Reset Logic ---
    const resetLevel = useCallback((startFromZero = false) => {
        const levelIdx = startFromZero ? 0 : currentLevelIndex;
        // Si on redémarre depuis le début, on reset l'index
        if (startFromZero) {
            setCurrentLevelIndex(0);
        }
        setTypedText('');
        setStartTime(null);
        setErrors(0);
        setTotalCharsTyped(0);
        setDeadKeyState(null);
        setIsInErrorState(false);
        setIsLevelComplete(false); // Important: Réinitialiser
        setIsFinished(false); // On n'est plus en mode "fini" si on recommence
        setDebugInfo('');
    }, [currentLevelIndex]); // currentLevelIndex est nécessaire si startFromZero=false

    // --- Go To Next Level Logic ---
    const goToNextLevel = useCallback(() => {
        const nextLevelIndex = currentLevelIndex + 1;
        if (nextLevelIndex < levels.length) {
            setCurrentLevelIndex(nextLevelIndex);
            // Reset state *pour le nouveau niveau* (sans changer l'index ici car déjà fait)
             setTypedText('');
             setStartTime(null);
             setErrors(0);
             setTotalCharsTyped(0);
             setDeadKeyState(null);
             setIsInErrorState(false);
             setIsLevelComplete(false); // Très important
             setDebugInfo('');
        } else {
            // Dernier niveau complété
            setIsFinished(true);
            setIsLevelComplete(false); // Le niveau n'est plus "en attente de passage"
        }
    }, [currentLevelIndex]);

    // --- Keyboard Event Handler ---
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ne rien faire si le jeu est fini ou si le niveau est complété (attente du bouton)
        if (isFinished || isLevelComplete) return;

        const { key, code, ctrlKey, metaKey, altKey } = event;

        // Si textToType n'est pas encore chargé ou vide, ne rien faire
        if (!textToType || textToType.length === 0) return;

        const expectedChar = textToType[currentPosition];

        setDebugInfo(`Key: ${key}, Code: ${code}, Expected: '${expectedChar}', Dead: ${deadKeyState}`);

        // --- Ignorer touches non pertinentes ---
        if (ctrlKey || metaKey || (altKey && key !== 'AltGraph')) {
            if (!(ctrlKey && altKey)) { // Autorise Ctrl+Alt (pour AltGr émulé)
                console.log("Ignored modifier combo");
                return;
            }
        }
        if (key.length > 1 && !['Shift', 'AltGraph', 'Dead', ' ', 'Backspace'].includes(key)) {
            console.log("Ignored functional key:", key);
            return;
        }

        event.preventDefault(); // Empêche comportement par défaut

        // --- Démarrer le timer ---
        if (startTime === null && currentPosition < textToType.length) {
            setStartTime(Date.now());
        }

        // --- Gestion Backspace ---
        if (key === 'Backspace') {
            if (currentPosition > 0) {
                setTypedText(prev => prev.slice(0, -1));
                setIsInErrorState(false); // On n'est plus en erreur sur la position actuelle
                setDebugInfo(prev => prev + ' -> Backspace');
                // Ne pas modifier les stats d'erreur passées ici pour la simplicité
            }
            return; // Fin du traitement pour Backspace
        }

        // --- Gestion Touches Mortes ---
        if (deadKeyState) {
            const dead = deadKeyState;
            setDeadKeyState(null); // Reset état mort

            let combinedChar: string | null | undefined = null;
            if (deadKeyMap[dead]) {
                combinedChar = deadKeyMap[dead][key];
            }

            if (combinedChar === expectedChar) {
                setTypedText(prev => prev + combinedChar);
                setTotalCharsTyped(prev => prev + 1);
                setIsInErrorState(false);
            } else {
                setErrors(prev => prev + 1);
                setTotalCharsTyped(prev => prev + 1);
                setIsInErrorState(true);
                setDebugInfo(prev => prev + ` -> Dead Combo Error. Expected '${expectedChar}', Got '${combinedChar || key}'`);
            }

        } else if (key === 'Dead') {
            const detectedDeadKey = codeToDeadKey[code];
            if (detectedDeadKey) {
                setDeadKeyState(detectedDeadKey);
                setIsInErrorState(false);
                console.log(`Dead key ${detectedDeadKey} activated (Code: ${code})`);
            } else {
                console.log(`Unmapped Dead key (Code: ${code})`);
                 // Optionnel: considérer comme erreur? Non pour l'instant.
            }

        } else {
            // --- Gestion Touches Normales ---
            if (key === expectedChar) {
                setTypedText(prev => prev + key);
                setTotalCharsTyped(prev => prev + 1);
                setIsInErrorState(false);
            } else {
                setErrors(prev => prev + 1);
                setTotalCharsTyped(prev => prev + 1);
                setIsInErrorState(true);
                console.log(`Error: Expected '${expectedChar}', Got '${key}'`);
            }
        }

    }, [textToType, currentPosition, startTime, isFinished, isLevelComplete, deadKeyState]); // Ajouter isLevelComplete aux dépendances

    // --- Attach/Detach Event Listener ---
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        // Donner le focus au document pour capturer les touches (peut nécessiter clic initial)
        // document.body.focus(); // Pas idéal, mais peut aider
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // --- Check Level Completion ---
    // Ce hook vérifie SEULEMENT si le texte tapé correspond au texte à taper
    useEffect(() => {
        // Ne rien faire si le jeu est fini ou si le niveau est déjà marqué comme complet
        if (isFinished || isLevelComplete) return;

        if (textToType && typedText.length === textToType.length) {
            setIsLevelComplete(true); // Marquer le niveau comme complet
            console.log("Level complete, waiting for 'Next Level' button.");
            // Arrêter le timer s'il était actif (pour figer le WPM)
            // Note: le calcul WPM utilise Date.now() donc il se fige naturellement
        }
    }, [typedText, textToType, isFinished, isLevelComplete]);

    // --- Calcul des Statistiques ---
    const stats = useMemo(() => {
        const accuracy = totalCharsTyped > 0 ? Math.max(0, Math.round(((totalCharsTyped - errors) / totalCharsTyped) * 100)) : 100;
        let wpm = 0;
        // Calculer le WPM seulement si le niveau est en cours
        if (startTime && totalCharsTyped > 0 && !isLevelComplete && !isFinished) {
            const now = Date.now();
            const durationMinutes = (now - startTime) / 60000;
            if (durationMinutes > 0) {
                wpm = Math.round((totalCharsTyped / 5) / durationMinutes);
            }
        // Si le niveau est complété, mais pas le jeu, on fige le calcul basé sur le moment de complétion
        } else if (startTime && totalCharsTyped > 0 && (isLevelComplete || isFinished)) {
             // Ici on pourrait stocker l'heure de fin pour un calcul plus précis
             // Pour l'instant, on prend le dernier calcul basé sur totalCharsTyped
            const durationMinutes = (Date.now() - startTime) / 60000; // Approximation finale
             if (durationMinutes > 0) {
                 wpm = Math.round((totalCharsTyped / 5) / durationMinutes);
             }
        }
        return { accuracy, wpm };
    }, [totalCharsTyped, errors, startTime, isLevelComplete, isFinished]);


    // --- Rendu des Caractères ---
    const renderText = () => {
        const chars = textToType.split('').map((char, index) => {
            let className = "";
            const isCurrent = index === currentPosition;
            const charToDisplay = char === ' ' ? '\u00A0' : char; // Espace insécable
            const isTyped = index < currentPosition;
            const isError = isCurrent && isInErrorState;

            if (isTyped) {
                // Correctement tapé
                className = styles.characterCorrect;
            } else if (isCurrent) {
                // Position actuelle
                if (isInErrorState) {
                    className = styles.characterError;
                } else {
                    className = styles.characterCurrent;
                }
            } else {
                // Caractères à venir
                className = styles.characterPending;
            }

            // Utiliser motion.span pour les animations
            return (
                <motion.span 
                    key={index} 
                    className={cn("text-2xl font-mono relative", className)}
                    animate={isTyped ? "correct" : (isError ? "error" : undefined)}
                    variants={animations.character}
                >
                    {/* Badge pour touche morte */}
                    {isCurrent && !isInErrorState && deadKeyState && (
                        <Badge variant="outline" className="absolute -top-5 left-0 text-xs px-1 py-0 leading-tight bg-orange-100 text-orange-700 z-10">
                            {deadKeyState}
                        </Badge>
                    )}
                    {charToDisplay}
                </motion.span>
            );
        });

        // Ajouter le curseur clignotant à la position actuelle (si pas d'erreur et niveau en cours)
        if (!isInErrorState && !isLevelComplete && !isFinished && currentPosition <= textToType.length) {
             // Insérer le curseur à la bonne position dans le tableau de spans
             chars.splice(currentPosition, 0, <span key="cursor" className="blinking-cursor text-2xl font-mono">|</span>);
        }

        return chars;
    };

    // Calcul du pourcentage de progression dans le niveau actuel
    const levelProgress = useMemo(() => {
        if (textToType.length === 0) return 0;
        return Math.round((typedText.length / textToType.length) * 100);
    }, [typedText.length, textToType.length]);

    // Calcul du pourcentage de progression global dans le jeu
    const gameProgress = useMemo(() => {
        return Math.round(((currentLevelIndex) / levels.length) * 100);
    }, [currentLevelIndex]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`level-${currentLevelIndex}-${isFinished ? 'finished' : 'playing'}`}
                variants={animations.container}
                initial="hidden"
                animate="show"
                exit="exit"
                className="w-full max-w-4xl mx-auto"
            >
                <Card className="w-full shadow-lg border-t-4 border-t-primary">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center mb-1">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Keyboard className="h-5 w-5 text-primary" />
                                    Frappe Agile {isFinished ? '- Terminé !' : ''}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {isFinished ? "Félicitations ! Vous avez terminé tous les niveaux." : currentLevel?.name ?? "Chargement..."}
                                </CardDescription>
                            </div>
                            
                            {!isFinished && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn(styles.levelBadge, "bg-primary/10")}>
                                        Niveau {currentLevelIndex + 1}/{levels.length}
                                    </Badge>
                                </div>
                            )}
                        </div>
                        
                        {/* Barre de progression du jeu */}
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progression globale</span>
                                <span>{gameProgress}%</span>
                            </div>
                            <Progress value={gameProgress} className="h-2" />
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {/* Barre de progression du niveau actuel */}
                        {!isFinished && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Niveau actuel</span>
                                    <span>{levelProgress}%</span>
                                </div>
                                <Progress value={levelProgress} className="h-1.5" />
                            </div>
                        )}

                        {/* Zone de Texte */}
                        <motion.div 
                            className="p-6 border rounded-lg mb-6 bg-gray-50 dark:bg-gray-900 min-h-[120px] relative shadow-sm"
                            variants={animations.item}
                        >
                            <p className="whitespace-pre-wrap leading-relaxed break-words text-center">
                                {renderText()}
                            </p>
                            
                            {/* Message de niveau complété avec animation */}
                            <AnimatePresence>
                                {isLevelComplete && !isFinished && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 bg-green-500 bg-opacity-80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm"
                                    >
                                        <CheckCircle className="h-12 w-12 text-white mb-2" />
                                        <p className="text-white text-xl font-semibold">Niveau Terminé !</p>
                                        <p className="text-white/80 text-sm mt-1">Précision: {stats.accuracy}% · Vitesse: {stats.wpm} MPM</p>
                                    </motion.div>
                                )}
                                
                                {isFinished && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 bg-blue-600 bg-opacity-80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm"
                                    >
                                        <Award className="h-16 w-16 text-white mb-2" />
                                        <p className="text-white text-2xl font-bold">Félicitations !</p>
                                        <p className="text-white/80 text-base mt-1">Vous avez terminé tous les niveaux</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Statistiques avec design amélioré */}
                        <motion.div 
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4"
                            variants={animations.item}
                        >
                            <TooltipProvider>
                                <Card className="bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-700 dark:text-green-400 font-medium">Précision</p>
                                            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{stats.accuracy}%</p>
                                        </div>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Pourcentage de frappes correctes</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </CardContent>
                                </Card>
                            
                                <Card className="bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">Erreurs</p>
                                            <p className="text-2xl font-bold text-red-800 dark:text-red-300">{errors}</p>
                                        </div>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Nombre total d'erreurs</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </CardContent>
                                </Card>
                            
                                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">MPM (Brut)</p>
                                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.wpm}</p>
                                        </div>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                    <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Mots par minute (vitesse de frappe)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </CardContent>
                                </Card>
                            </TooltipProvider>
                        </motion.div>
                        
                        {/* Indicateur touche morte actif */}
                        {deadKeyState && (
                            <div className="flex justify-center mb-4">
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                                    Touche Morte Active: <span className={styles.keyboardKey}>{deadKeyState}</span>
                                </Badge>
                            </div>
                        )}
                        
                        {/* Zone de débogage (masquée par défaut) */}
                        {debugInfo && (
                            <p className="text-xs text-gray-400 mt-2 h-4 truncate text-center" title={debugInfo}>{debugInfo}</p>
                        )}
                    </CardContent>
                    
                    <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-2 pb-6">
                        <Button
                            onClick={() => resetLevel(isFinished)}
                            variant="outline"
                            disabled={isLevelComplete && !isFinished}
                            className="w-full sm:w-auto flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            {isFinished ? "Rejouer depuis le début" : "Recommencer ce niveau"}
                        </Button>

                        {/* Bouton Niveau Suivant avec animation */}
                        {isLevelComplete && !isFinished && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="w-full sm:w-auto"
                            >
                                <Button 
                                    onClick={goToNextLevel} 
                                    className="w-full flex items-center gap-2"
                                >
                                    Niveau Suivant
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}

// --- Composant App de base pour tester (optionnel) ---
/*
// Si vous voulez rendre ce fichier directement exécutable dans un projet simple:
import React from 'react';
import ReactDOM from 'react-dom/client';
// Assurez-vous d'avoir un moyen d'importer vos composants UI (shadcn) et utils
// et que les CSS (Tailwind, global) sont chargés.

// Exemple d'un App simple:
function App() {
  return (
    <div className="container mx-auto p-4">
       { // Vous devrez peut-être envelopper dans un ThemeProvider ou autre selon votre config shadcn/Tailwind
       }
       <TypingTutor />
    </div>
  );
}

// Point d'entrée standard React
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
*/

// Export par défaut si utilisé comme module standard
// export default TypingTutor; // Décommentez si vous importez ce composant ailleurs