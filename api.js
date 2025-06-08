const express = require("express");
const fs = require("fs").promises;
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const { scrapePlayers } = require("./index.js");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques de la documentation
app.use("/docs", express.static(path.join(__dirname, "docs")));

// Rediriger la racine vers la documentation
app.get("/", (req, res) => {
  res.redirect("/docs");
});

// Routes
app.get("/api/players", async (req, res) => {
  try {
    const data = await fs.readFile("players.json", "utf8");
    const players = JSON.parse(data);
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Route pour obtenir un joueur spécifique par ID
app.get("/api/players/:id", async (req, res) => {
  try {
    const data = await fs.readFile("players.json", "utf8");
    const players = JSON.parse(data);
    const player = players.find((p) => p.id === req.params.id);

    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ error: "Joueur non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Route pour obtenir les joueurs par équipe
app.get("/api/teams/:team/players", async (req, res) => {
  try {
    const data = await fs.readFile("players.json", "utf8");
    const players = JSON.parse(data);
    const teamPlayers = players.filter((p) => p.team === req.params.team);

    if (teamPlayers.length > 0) {
      res.json(teamPlayers);
    } else {
      res.status(404).json({ error: "Aucun joueur trouvé pour cette équipe" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Route pour obtenir la liste des équipes
app.get("/api/teams", async (req, res) => {
  try {
    const data = await fs.readFile("players.json", "utf8");
    const players = JSON.parse(data);
    const teams = [...new Set(players.map((p) => p.team))].filter(Boolean);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Route pour rechercher des joueurs
app.get("/api/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Paramètre de recherche requis" });
    }

    const data = await fs.readFile("players.json", "utf8");
    const players = JSON.parse(data);
    const searchResults = players.filter(
      (player) =>
        player.nickname.toLowerCase().includes(query.toLowerCase()) ||
        player.team.toLowerCase().includes(query.toLowerCase())
    );

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
  console.log(`Documentation disponible sur http://localhost:${PORT}/docs`);
});
