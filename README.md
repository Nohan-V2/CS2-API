# BO3.gg Player Scraper

Ce script permet de scraper les informations des joueurs du site bo3.gg.

## Installation

1. Assurez-vous d'avoir Node.js installé sur votre machine
2. Installez les dépendances :

```bash
npm install
```

## Utilisation

Pour lancer le scraper :

```bash
npm start
```

Le script va :

1. Ouvrir un navigateur Chrome
2. Visiter la page des joueurs
3. Cliquer sur chaque joueur pour récupérer ses informations
4. Sauvegarder les données dans un fichier `players.json`

## Données récupérées

Pour chaque joueur, les informations suivantes sont collectées :

- Nickname
- Team
- Nationalité
- Âge
- Prix gagnés
- Trophées
