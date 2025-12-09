# **PAC — Power Assistant Chatbot**

<p align="center">
  <img src="https://github.com/user-attachments/assets/aa9e03f7-b929-44ce-a934-5810095b025a" alt="favicon" width="220">
</p>

PAC (**Power Assistant Chatbot**) est une interface web conçue pour assister le diagnostic des défaillances d’alimentation électrique d’une machine.
L’application propose un arbre de décision interactif, des tests guidés, ainsi que des outils visuels pour faciliter la compréhension du diagnostic.

---

## **Fonctionnalités**

* Interface de conversation interactive pour guider l’utilisateur dans la localisation de la panne.
* **Arbre de décision dynamique** pour orienter les étapes de diagnostic.
* **Graphiques Chart.js** pour visualiser l’évolution ou la probabilité du diagnostic.
* **Carte schématique** de la chaîne d’alimentation.
* **Synthèse vocale (TTS)** intégrée pour lire les réponses.
* Mode **clair / sombre** et option de **réinitialisation de la session**.

---

## **Prérequis**

Aucun backend obligatoire.
Fonctionne dans tout navigateur moderne :

* Chrome
* Edge
* Firefox

Pour éviter certaines restrictions CORS, l’usage d’un serveur statique est recommandé :

```bash
# Python 3
python -m http.server 8000

# ou directement via Live Server (VSCode)
```

---

## **Structure du projet**

```
PAC/
│
├── chatbot.html      # Interface principale du chatbot
├── script.js         # Logique principale (arbre de décision, TTS, graphiques, interactions)
├── config.js         # Paramètres globaux et constantes
├── assets/           # Icônes, images et fichiers statiques
└── README.md         # Documentation du projet
```

---

## **Démarrage rapide**

1. Lancer un serveur statique (optionnel mais recommandé).
2. Ouvrir le fichier `chatbot.html` dans le navigateur.
3. Suivre les instructions pour démarrer le diagnostic.

---

## **Équipe & Responsabilités**

| Membre                    | Rôle                                           |
| ------------------------- | ---------------------------------------------- |
| **SEWONOU Pascal**        | Conception UI/UX, design des flux utilisateur  |
| **EDOH BEDI Komi Godwin** | Développement front-end, logique de diagnostic |
| **HEDEKA Gilles**         | Intégration Chart.js, visualisations           |
| **AMEGANDJIN Josué**      | Gestion des assets, packaging                  |
| **EKLO Regis**            | Tests, validation, documentation               |

---

## **Contribution**

* Créer une branche dédiée avant tout ajout ou modification.
* Soumettre une **pull request** claire et détaillée.
* Respecter l’architecture du projet et documenter toute fonctionnalité ajoutée.

---

## **Licence**

À préciser (ex. **MIT**).
Si aucune licence n’a encore été choisie, se référer au responsable du projet.

---

## **Contact**

Pour toute question ou retour :
**[contact@pac.personal](mailto:edohbedigodwin@gmail.com)**

