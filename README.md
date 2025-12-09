# PAC — Power Assistant Chatbot

Résumé
Ce projet fournit une interface web (PAC : Power Assistant Chatbot) pour assister le diagnostic d'alimentation électrique d'une machine. L'interface propose un arbre de décision, des tests guidés et des visualisations (graphes de progression / probabilités).

Fonctionnalités principales
- Interface de conversation et pistes de tests pour localiser une panne.
- Visualisation de la progression du diagnostic (Chart.js).
- Carte schématique des étapes de la chaîne d'alimentation.
- Lecture audio (TTS) pour les réponses de l'IA.
- Thème clair/sombre et réinitialisation de la session.

Prérequis
- Navigateur moderne (Chrome, Edge, Firefox).
- Pas de serveur obligatoire : peut être ouvert en local via un serveur statique (recommandé pour éviter les restrictions CORS), par ex. :
  - Python 3 : `python -m http.server 8000`
  - ou Live Server dans VSCode.

Structure du projet (principaux fichiers)
- chatbot.html — interface principale du chatbot.
- script.js — logique côté client (interactions, gestion de l'arbre de décision, TTS, chart).
- config.js — configuration et constantes du projet.
- assets/ — icônes et ressources statiques.
- README.md — ce fichier.

Utilisation rapide
1. Démarrer un serveur statique depuis le dossier du projet (optionnel mais recommandé).
2. Ouvrir `chatbot.html` dans le navigateur.
3. Suivre les instructions à l'écran pour lancer le diagnostic.

Rôle et responsabilités (équipe)
- SEWONOU Pascal — Conception UI/UX et intégration des flux utilisateur.
- EDOH BEDI Komi Godwin — Développement front-end, logique du diagnostic.
- HEDEKA Gilles — Intégration des graphiques (Chart.js) et visualisations.
- AMEGANDJIN Josué — Gestion des assets et packaging du projet.
- EKLO Regis — Tests, validation et documentation.

Contribuer
- Créer une branche dédiée pour toute nouvelle fonctionnalité.
- Ouvrir une pull request avec une description claire des changements.
- Respecter la structure du projet et ajouter des tests/notes lorsque nécessaire.

Licence
- Documenter ici la licence choisie (ex : MIT). Si non spécifié, demander au responsable du projet.

Contact
Pour questions ou retours : contact@pac.example

