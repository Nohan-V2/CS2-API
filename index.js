const puppeteer = require("puppeteer");
const fs = require("fs").promises;

async function scrapePlayers() {
  // Lire le fichier JSON existant
  let existingPlayers = [];
  try {
    const data = await fs.readFile("players.json", "utf8");
    existingPlayers = JSON.parse(data);
  } catch (error) {
    console.log(
      "Aucun fichier players.json existant, création d'un nouveau fichier"
    );
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    ignoreHTTPSErrors: true,
  });

  try {
    const page = await browser.newPage();
    // Optimiser les performances de la page
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (
        resourceType === "image" ||
        resourceType === "stylesheet" ||
        resourceType === "font"
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Tableau pour stocker tous les liens des joueurs
    let allPlayerLinks = [];

    // Récupérer les joueurs de la première page
    await page.goto("https://bo3.gg/players", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    console.log("Page 1 des joueurs chargée");

    const playerLinksPage1 = await page.evaluate(() => {
      const links = document.querySelectorAll("a[href^='/players/']");
      return Array.from(links).map(
        (link) => "https://bo3.gg" + link.getAttribute("href")
      );
    });

    // Récupérer les joueurs de la deuxième page
    await page.goto("https://bo3.gg/players?page=2", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    console.log("Page 2 des joueurs chargée");

    const playerLinksPage2 = await page.evaluate(() => {
      const links = document.querySelectorAll("a[href^='/players/']");
      return Array.from(links).map(
        (link) => "https://bo3.gg" + link.getAttribute("href")
      );
    });

    // Combiner les liens des deux pages et supprimer les doublons
    allPlayerLinks = [...new Set([...playerLinksPage1, ...playerLinksPage2])];

    console.log("Liens des joueurs trouvés:", allPlayerLinks.length);
    console.log("Premier lien:", allPlayerLinks[0]);

    // Filtrer les joueurs qui n'existent pas déjà
    const newPlayerLinks = allPlayerLinks.filter((link) => {
      const playerId = link.split("/").pop();
      return !existingPlayers.some((player) => player.id === playerId);
    });

    console.log(`${newPlayerLinks.length} nouveaux joueurs à scraper`);

    // Fonction pour scraper un joueur individuel avec retry
    const scrapePlayer = async (link, retryCount = 0) => {
      const page = await browser.newPage();
      try {
        // Optimiser les performances de la page
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          const resourceType = request.resourceType();
          if (
            resourceType === "image" ||
            resourceType === "stylesheet" ||
            resourceType === "font"
          ) {
            request.abort();
          } else {
            request.continue();
          }
        });

        await page.goto(link, { waitUntil: "networkidle0", timeout: 30000 });
        await page.waitForTimeout(2000);
        console.log(`Scraping du joueur: ${link}`);

        await page.waitForSelector(".o-profile-header__info h1", {
          timeout: 10000,
        });

        // Cliquer sur le bouton "Show More"
        try {
          const showMoreButton = await page.waitForSelector(
            ".o-profile-sidebar__show-more",
            { timeout: 5000 }
          );
          if (showMoreButton) {
            await showMoreButton.click();
            await page.waitForTimeout(1000);
          }
        } catch (error) {
          console.log('Bouton "Show More" non trouvé ou déjà cliqué');
        }

        // Cliquer sur le lien des transferts
        try {
          const transfersLink = await page.waitForSelector(
            ".c-profile-menu__wrapper .c-profile-menu-link:nth-child(2)",
            { timeout: 5000 }
          );
          if (transfersLink) {
            await transfersLink.click();
            await page.waitForSelector(".c-widget-player-transfers-history", {
              timeout: 5000,
            });
            await page.waitForTimeout(2000);
          }
        } catch (error) {
          console.log("Lien des transferts non trouvé");
        }

        const playerData = await page.evaluate(() => {
          const nickname = document
            .querySelector(".o-profile-header__info h1")
            ?.textContent.trim();

          if (!nickname) {
            console.log("Nom du joueur non trouvé");
            return null;
          }

          // Récupérer le nom de l'équipe depuis l'historique des transferts
          let team = null;
          let isTransferring = false;

          // Vérifier tous les transferts jusqu'à trouver une équipe valide
          for (let i = 1; i <= 5; i++) {
            const transfer = document.querySelector(
              `.c-widget-player-transfers-history .table-group:nth-child(${i})`
            );

            if (transfer) {
              // Vérifier si le joueur est en cours de transfert dans le premier transfert
              if (i === 1) {
                const transferStatus =
                  transfer.querySelector(".status--transfer");
                isTransferring = transferStatus !== null;
              }

              // Récupérer le nom de l'équipe
              const teamElement = transfer.querySelector(".team-name");
              if (teamElement && teamElement.textContent.trim() !== "") {
                team = teamElement.textContent.trim();
                console.log(
                  `Nom de l'équipe trouvé dans le transfert ${i}:`,
                  team
                );
                if (isTransferring && i === 1) {
                  console.log("Le joueur est en cours de transfert");
                }
                break;
              }
            }
          }

          // Si aucune équipe n'est trouvée dans les transferts, essayer de la récupérer depuis le profil
          if (!team) {
            const profileTeam = document.querySelector(
              '.o-list-bare__item a[href^="/teams/"] .c-global-tooltips-objects__trigger'
            );
            if (profileTeam) {
              team = profileTeam.textContent.trim();
              console.log("Nom de l'équipe trouvé dans le profil:", team);
            }
          }

          const nationality = document
            .querySelector(".c-country-flag__image")
            ?.getAttribute("src")
            ?.replace("https://bo3.gg", "");

          const age = document
            .querySelector(
              ".o-profile-sidebar__item .o-list-bare__item:nth-child(5) p"
            )
            ?.textContent.trim();
          const prize = document
            .querySelector(
              ".o-profile-sidebar__item .o-list-bare__item:nth-child(8) p"
            )
            ?.textContent.trim();

          const trophies = Array.from(
            document.querySelectorAll(
              ".c-global-awards-list .o-list-bare__item"
            )
          ).filter((item) => item.textContent.trim() !== "").length;

          return {
            id: window.location.pathname.split("/").pop(),
            nickname,
            team,
            nationality: nationality ? `https://bo3.gg${nationality}` : null,
            age,
            prize,
            trophies,
          };
        });

        if (playerData) {
          console.log(
            `Données récupérées pour ${playerData.nickname} - Équipe: ${
              playerData.team
            }${playerData.isTransferring ? " (En transfert)" : ""}`
          );
          await page.close();
          return playerData;
        } else {
          throw new Error("Données du joueur non trouvées");
        }
      } catch (error) {
        console.log(`Erreur lors du scraping de ${link}: ${error.message}`);
        await page.close();

        if (retryCount < 3) {
          console.log(`Nouvelle tentative (${retryCount + 1}/3) pour ${link}`);
          await page.waitForTimeout(5000);
          return scrapePlayer(link, retryCount + 1);
        }

        return null;
      }
    };

    // Scraper les nouveaux joueurs en parallèle (5 à la fois)
    const batchSize = 5;
    for (let i = 0; i < newPlayerLinks.length; i += batchSize) {
      const batch = newPlayerLinks.slice(i, i + batchSize);
      const newPlayers = await Promise.all(
        batch.map((link) => scrapePlayer(link))
      );
      const validPlayers = newPlayers.filter((player) => player !== null);
      existingPlayers.push(...validPlayers);
      console.log(
        `Batch ${i / batchSize + 1} terminé: ${
          validPlayers.length
        } joueurs ajoutés`
      );

      // Sauvegarder les données après chaque batch
      await fs.writeFile(
        "players.json",
        JSON.stringify(existingPlayers, null, 2)
      );
    }

    console.log("Données exportées dans players.json");
  } catch (error) {
    console.error("Erreur lors du scraping:", error);
  } finally {
    await browser.close();
  }
}

// Exporter la fonction scrapePlayers au lieu de l'exécuter directement
module.exports = { scrapePlayers };
