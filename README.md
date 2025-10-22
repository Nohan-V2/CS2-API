# API CS2 Players

Une API REST simple pour accéder aux statistiques des joueurs professionnels de Counter-Strike 2 (CS2).

## Prérequis

- Node.js (version 14 ou supérieure)
- npm (gestionnaire de paquets Node.js)

## Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/CS2-API.git
   cd CS2-API
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Démarrer le serveur :
   ```bash
   npm start
   ```

Le serveur démarrera sur `http://localhost:3000` en développement.

## Documentation de l'API

### Base URL
Toutes les requêtes doivent être préfixées par : `https://cs2-api.onrender.com/api`

### Endpoints

#### 1. Récupérer tous les joueurs
```
GET /players
```

**Réponse réussie (200 OK) :**
```json
[
  {
    "id": "1",
    "username": "ZywOo",
    "flag_url": "https://www.hltv.org/img/static/flags/30x20/FR.gif",
    "age": "24 years",
    "team": "Vitality",
    "majors": "9"
  },
  // ... autres joueurs
]
```

#### 2. Récupérer un joueur par son ID
```
GET /players/:id
```

**Paramètres :**
- `id` (requis) : L'identifiant unique du joueur

**Réponse réussie (200 OK) :**
```json
{
  "id": "1",
  "username": "ZywOo",
  "flag_url": "https://www.hltv.org/img/static/flags/30x20/FR.gif",
  "age": "24 years",
  "team": "Vitality",
  "majors": "9"
}
```

**Erreur (404 Not Found) :**
```json
{
  "error": "Joueur non trouvé"
}
```

#### 3. Récupérer les joueurs par équipe
```
GET /players/team/:team
```

**Paramètres :**
- `team` (requis) : Le nom de l'équipe

**Réponse réussie (200 OK) :**
```json
[
  {
    "id": "1",
    "username": "ZywOo",
    "flag_url": "https://www.hltv.org/img/static/flags/30x20/FR.gif",
    "age": "24 years",
    "team": "Vitality",
    "majors": "9"
  },
  // ... autres joueurs de la même équipe
]
```

**Erreur (404 Not Found) :**
```json
{
  "error": "Aucun joueur trouvé pour cette équipe"
}
```

#### 4. Récupérer la liste des équipes
```
GET /teams
```

**Réponse réussie (200 OK) :**
```json
[
  "Vitality",
  "Spirit",
  "FaZe",
  // ... autres équipes
]
```

### Codes d'erreur

- `200 OK` : Requête réussie
- `400 Bad Request` : Requête mal formée
- `404 Not Found` : Ressource non trouvée
- `500 Internal Server Error` : Erreur serveur

## Structure des données

### Joueur
| Champ     | Type   | Description                          |
|-----------|--------|--------------------------------------|
| id        | string | Identifiant unique du joueur        |
| username  | string | Pseudo du joueur                    |
| flag_url  | string | URL du drapeau du pays du joueur    |
| age       | string | Âge du joueur                       |
| team      | string | Équipe actuelle du joueur           |
| majors    | string | Nombre de majors remportés          |

## Exemple d'utilisation avec JavaScript (fetch)

```javascript
// Récupérer tous les joueurs
fetch('http://localhost:3000/api/players')
  .then(response => response.json())
  .then(data => console.log(data));

// Récupérer un joueur par ID
fetch('https://cs2-api.onrender.com/api/players/1')
  .then(response => response.json())
  .then(data => console.log(data));

// Récupérer les joueurs d'une équipe
fetch('https://cs2-api.onrender.com/api/players/team/Vitality')
  .then(response => response.json())
  .then(data => console.log(data));

// Récupérer la liste des équipes
fetch('https://cs2-api.onrender.com/api/teams')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Développement

Pour le développement, vous pouvez utiliser :

```bash
# Démarrer le serveur en mode développement (avec rechargement automatique)
npm run dev
```

## Licence

Ce projet est sous licence MIT.
