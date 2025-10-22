const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques de la documentation
app.use(express.static("docs"));

// Chemin vers le fichier players.json
const playersPath = path.join(__dirname, "players.json");

// Récupérer tous les joueurs
app.get("/api/players", async (req, res) => {
  try {
    const data = await fs.readFile(playersPath, "utf8");
    const players = JSON.parse(data);
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Récupérer un joueur par son ID
app.get("/api/players/:id", async (req, res) => {
  try {
    const data = await fs.readFile(playersPath, "utf8");
    const players = JSON.parse(data);
    const player = players.find((p) => p.id === req.params.id);

    if (!player) {
      return res.status(404).json({ error: "Joueur non trouvé" });
    }

    res.json(player);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Récupérer les joueurs par équipe
app.get("/api/players/team/:team", async (req, res) => {
  try {
    const data = await fs.readFile(playersPath, "utf8");
    const players = JSON.parse(data);
    const teamPlayers = players.filter(
      (p) => p.team.toLowerCase() === req.params.team.toLowerCase()
    );

    if (teamPlayers.length === 0) {
      return res
        .status(404)
        .json({ error: "Aucun joueur trouvé pour cette équipe" });
    }

    res.json(teamPlayers);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Récupérer la liste des équipes uniques
app.get("/api/teams", async (req, res) => {
  try {
    const data = await fs.readFile(playersPath, "utf8");
    const players = JSON.parse(data);

    // Créer un Set pour éliminer les doublons, puis le convertir en tableau
    const teams = [...new Set(players.map((player) => player.team))].sort();

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Rediriger la racine vers la documentation
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "index.html"));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Accédez à l'API : http://localhost:${PORT}/api/players`);
  console.log(`Documentation : http://localhost:${PORT}`);
});
