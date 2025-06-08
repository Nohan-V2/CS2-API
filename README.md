# CS:GO Players API

Une API REST pour accéder aux données des joueurs CS:GO, avec une documentation interactive.

## 🚀 Fonctionnalités

- Récupération des données des joueurs CS:GO
- Documentation interactive
- Interface de test intégrée
- Recherche par nom d'équipe ou de joueur
- Filtrage par équipe
- Support CORS
- Mise à jour automatique hebdomadaire des données (tous les lundis à 2h du matin)

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

## 🔧 Installation

1. Clonez le repository :

```bash
git clone [URL_DU_REPO]
cd scrappePro
```

2. Installez les dépendances :

```bash
npm install
```

3. Démarrez l'API :

```bash
npm start
```

L'API sera accessible sur `http://localhost:3001`

## 📚 Documentation

La documentation interactive est disponible à l'adresse : `http://localhost:3001/docs`

### Endpoints disponibles

- `GET /api/players` : Liste tous les joueurs
- `GET /api/players/:id` : Récupère un joueur spécifique
- `GET /api/teams` : Liste toutes les équipes
- `GET /api/teams/:team/players` : Liste les joueurs d'une équipe
- `GET /api/search?query=terme` : Recherche des joueurs

## 🔍 Exemples d'utilisation

### Récupérer tous les joueurs

```bash
curl http://localhost:3001/api/players
```

### Rechercher un joueur

```bash
curl http://localhost:3001/api/search?query=donk
```

### Obtenir les joueurs d'une équipe

```bash
curl http://localhost:3001/api/teams/Spirit/players
```

## 🛠️ Structure du projet

```
scrappePro/
├── api.js           # Serveur API Express avec mise à jour automatique
├── index.js         # Script de scraping
├── players.json     # Base de données des joueurs
├── docs/            # Documentation
│   ├── index.html   # Page de documentation
│   └── style.css    # Styles de la documentation
└── package.json     # Dépendances et scripts
```

## 🔄 Mise à jour automatique

L'API est configurée pour mettre à jour automatiquement les données des joueurs tous les lundis à 2h du matin. Cette mise à jour :

- Récupère les dernières informations des joueurs
- Met à jour les statistiques
- Actualise les équipes et les trophées
- Conserve l'historique des données

Pour que la mise à jour automatique fonctionne correctement, assurez-vous que :

- Le serveur est en cours d'exécution 24/7
- La connexion Internet est stable
- Les ressources système sont suffisantes

## 📝 Format des données

### Joueur

```json
{
  "id": "string",
  "nickname": "string",
  "team": "string",
  "nationality": "string",
  "age": "string",
  "prize": "string",
  "trophies": "number"
}
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue.
