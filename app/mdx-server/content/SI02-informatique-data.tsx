import React from 'react';

export const accordionItems = [
  {
    title: "Étape 4: Les algorithmes, base de la programmation",
    content: (
      <div>
        <p>Un <strong>algorithme</strong> est une suite d'instructions précises qui permettent de résoudre un problème. C'est comme une recette de cuisine : une série d'étapes à suivre dans un ordre précis pour obtenir un résultat.</p>
        <p>Les caractéristiques d'un bon algorithme sont :</p>
        <ul>
          <li><strong>Finitude</strong> : Il doit se terminer après un nombre fini d'étapes</li>
          <li><strong>Précision</strong> : Chaque instruction doit être non ambiguë</li>
          <li><strong>Entrées/Sorties</strong> : Il doit avoir des données d'entrée et produire des résultats</li>
          <li><strong>Efficacité</strong> : Il doit utiliser les ressources (temps, mémoire) de manière optimale</li>
        </ul>
        <p>Voici un exemple simple d'algorithme pour calculer la moyenne de trois nombres :</p>
        <pre>
          <code>
{`1. Demander les trois nombres a, b et c
2. Calculer somme = a + b + c
3. Calculer moyenne = somme / 3
4. Afficher moyenne`}
          </code>
        </pre>
        <p>Pour qu'un ordinateur puisse exécuter un algorithme, il faut le traduire en un <strong>programme</strong> écrit dans un langage de programmation (Python, Java, C++, etc.).</p>
      </div>
    )
  },
  {
    title: "Étape 5: L'évolution et les applications de l'informatique",
    content: (
      <div>
        <p>L'informatique a connu une évolution fulgurante depuis ses débuts :</p>
        <ul>
          <li><strong>Années 1940-50</strong> : Premiers ordinateurs électroniques (ENIAC, UNIVAC)</li>
          <li><strong>Années 1960-70</strong> : Miniaturisation, premiers langages de programmation modernes</li>
          <li><strong>Années 1980-90</strong> : Ordinateurs personnels, interfaces graphiques</li>
          <li><strong>Années 2000-10</strong> : Internet, mobilité, cloud computing</li>
          <li><strong>Années 2010-20</strong> : Big data, intelligence artificielle, objets connectés</li>
        </ul>
        <p>Aujourd'hui, l'informatique est présente dans presque tous les domaines :</p>
        <ul>
          <li><strong>Communication</strong> : Smartphones, réseaux sociaux, messageries</li>
          <li><strong>Santé</strong> : Imagerie médicale, séquençage génétique, télémédecine</li>
          <li><strong>Éducation</strong> : E-learning, simulations, réalité virtuelle</li>
          <li><strong>Transport</strong> : GPS, voitures autonomes, optimisation de trafic</li>
          <li><strong>Divertissement</strong> : Jeux vidéo, streaming, effets spéciaux</li>
          <li><strong>Sciences</strong> : Modélisation, calcul scientifique, analyse de données</li>
        </ul>
        <p>L'informatique continue d'évoluer avec des technologies émergentes comme l'informatique quantique, la blockchain, ou les interfaces cerveau-machine.</p>
      </div>
    )
  }
];