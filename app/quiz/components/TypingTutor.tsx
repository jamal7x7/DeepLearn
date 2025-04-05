"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from "@/lib/utils"; // Assurez-vous que ce chemin est correct pour votre config shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Définition des Niveaux ---
const levels = [
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
            let isCurrent = index === currentPosition;
            let charToDisplay = char === ' ' ? '\u00A0' : char; // Espace insécable

            if (index < currentPosition) {
                // Correctement tapé
                className = "text-gray-400"; // Plus subtil que line-through
            } else if (isCurrent) {
                // Position actuelle
                if (isInErrorState) {
                    className = "text-red-600 bg-red-100 rounded"; // Erreur
                } else {
                    // Normal, pas d'erreur (le curseur sera ajouté après)
                    className = "text-black"; // Caractère en attente standard
                }
            } else {
                // Caractères à venir
                className = "text-gray-600"; // Moins visible que noir
            }

            return (
                <span key={index} className={cn("text-2xl font-mono transition-colors duration-100 relative", className)}>
                    {/* Badge pour touche morte */}
                    {isCurrent && !isInErrorState && deadKeyState && (
                        <Badge variant="outline" className="absolute -top-5 left-0 text-xs px-1 py-0 leading-tight bg-orange-100 text-orange-700 z-10">
                            {deadKeyState}
                        </Badge>
                    )}
                    {charToDisplay}
                </span>
            );
        });

        // Ajouter le curseur clignotant à la position actuelle (si pas d'erreur et niveau en cours)
        if (!isInErrorState && !isLevelComplete && !isFinished && currentPosition <= textToType.length) {
             // Insérer le curseur à la bonne position dans le tableau de spans
             chars.splice(currentPosition, 0, <span key="cursor" className="blinking-cursor text-2xl font-mono">|</span>);
        }

        return chars;
    };

    return (
        <Card className="w-full max-w-3xl mx-auto mt-10">
            <CardHeader>
                <CardTitle>Frappe Agile - {isFinished ? 'Terminé !' : `Niveau ${currentLevelIndex + 1}`}</CardTitle>
                <CardDescription>{isFinished ? "Félicitations !" : currentLevel?.name ?? "Chargement..."}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Zone de Texte */}
                <div className="p-4 border rounded-md mb-6 bg-gray-50 min-h-[100px] relative">
                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                        {renderText()}
                    </p>
                     {/* Message de niveau complété */}
                     {isLevelComplete && !isFinished && (
                         <div className="absolute inset-0 bg-green-500 bg-opacity-70 flex items-center justify-center rounded-md">
                             <p className="text-white text-xl font-semibold">Niveau Terminé !</p>
                         </div>
                     )}
                      {isFinished && (
                         <div className="absolute inset-0 bg-blue-500 bg-opacity-70 flex items-center justify-center rounded-md">
                             <p className="text-white text-xl font-semibold">Jeu Terminé !</p>
                         </div>
                     )}
                </div>

                {/* Statistiques */}
                <div className="flex flex-wrap justify-around items-center text-center mb-4 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Précision</p>
                        <p className="text-2xl font-semibold">{stats.accuracy}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Erreurs</p>
                        <p className="text-2xl font-semibold">{errors}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">MPM (Brut)</p>
                        <p className="text-2xl font-semibold">{stats.wpm}</p>
                    </div>
                    {/* Indicateur touche morte actif (hors position actuelle) */}
                    {deadKeyState && <Badge variant="secondary">Touche Morte Active: {deadKeyState}</Badge>}
                </div>
                 {/* Zone de débogage */}
                 <p className="text-xs text-gray-400 mt-4 h-4 truncate" title={debugInfo}>{debugInfo}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    onClick={() => resetLevel(isFinished)} // Si jeu fini, recommence du début, sinon niveau actuel
                    variant="outline"
                    disabled={isLevelComplete && !isFinished} // Désactiver si en attente du passage au niveau suivant
                    >
                    {isFinished ? "Rejouer depuis le début" : "Recommencer ce niveau"}
                </Button>

                {/* Bouton Niveau Suivant */}
                {isLevelComplete && !isFinished && (
                     <Button onClick={goToNextLevel}>
                        Niveau Suivant →
                     </Button>
                )}
            </CardFooter>
        </Card>
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