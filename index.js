const puppeteer = require("puppeteer");
const fs = require("fs").promises;

// Configuration du navigateur
const browserConfig = {
  headless: false,
  defaultViewport: null,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  ignoreHTTPSErrors: true,
};

// Configuration de l'optimisation des performances
const setupPageOptimization = async (page) => {
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
};

// Fonction pour scraper un joueur individuel avec retry
const scrapePlayer = async (browser, link, retryCount = 0) => {
  const page = await browser.newPage();
  try {
    await setupPageOptimization(page);
    await page.goto(link, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log(`Scraping du joueur: ${link}`);

    await page.waitForSelector(".o-profile-header__info h1", {
      timeout: 10000,
    });

    // Cliquer sur le bouton "Show More"
    try {
      const showMoreButton = await page.waitForSelector(
        ".o-profile-sidebar__show-more button",
        { timeout: 5000 }
      );
      if (showMoreButton) {
        await showMoreButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('Bouton "Show More" non trouvé ou déjà cliqué');
    }

    // Récupérer les informations de base du joueur
    const basicInfo = await page.evaluate(() => {
      const nickname = document
        .querySelector(".o-profile-header__info h1")
        ?.textContent.trim();

      if (!nickname) {
        console.log("Nom du joueur non trouvé");
        return null;
      }

      const nationality = document
        .querySelector(".c-country-flag__image")
        ?.getAttribute("src")
        ?.replace("https://bo3.gg", "");

      const age = document
        .querySelector(
          ".o-profile-sidebar__item .o-list-bare__item:nth-child(5) p"
        )
        ?.textContent.trim()
        ?.replace("years", "")
        ?.replace(" ", "")
        ?.replace("year", "");

      const trophies = Array.from(
        document.querySelectorAll(
          ".c-global-awards-list .o-list-bare .o-list-bare__item"
        )
      ).filter((item) => item.textContent.trim() !== "").length;

      const kills = document
        .querySelector(
          ".c-table-ingame-stats .table-group .table-row:nth-child(2) .avg .white"
        )
        ?.textContent.trim();
      const deaths = document
        .querySelector(
          ".c-table-ingame-stats .table-group .table-row:nth-child(3) .avg .white"
        )
        ?.textContent.trim();
      const assists = document
        .querySelector(
          ".c-table-ingame-stats .table-group .table-row:nth-child(4) .avg .white"
        )
        ?.textContent.trim();

      // Calculer le KDA
      const kda =
        deaths && parseFloat(deaths) !== 0
          ? (
              (parseFloat(kills || 0) + parseFloat(assists || 0)) /
              parseFloat(deaths)
            ).toFixed(2)
          : (parseFloat(kills || 0) + parseFloat(assists || 0)).toFixed(2);

      return {
        nickname,
        nationality: nationality ? `https://bo3.gg${nationality}` : null,
        age: age ? parseInt(age) : null,
        trophies,
        kda: parseFloat(kda),
      };
    });

    if (!basicInfo) {
      throw new Error("Données de base du joueur non trouvées");
    }

    // Récupérer les informations de l'équipe via les transferts
    let team = null;

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

        // Récupérer les informations de l'équipe depuis les transferts
        const teamInfo = await page.evaluate(() => {
          let team = null;

          // D'abord essayer de récupérer l'équipe depuis le profil
          const profileTeam = document.querySelector(
            '.o-list-bare__item a[href^="/teams/"] .c-global-tooltips-objects__trigger'
          );
          if (profileTeam) {
            team = profileTeam.textContent.trim();
            console.log("Nom de l'équipe trouvé dans le profil:", team);
            return { team };
          }

          // Si pas d'équipe dans le profil, chercher dans les transferts
          const transfers = document.querySelectorAll(
            ".c-widget-player-transfers-history .table-group:nth-child(1) .table-row"
          );

          for (const transfer of transfers) {
            const teamElement = transfer.querySelector(".team-name");
            const statusElement = transfer.querySelector(".status");

            if (teamElement && teamElement.textContent.trim() !== "") {
              // Si le statut n'est pas "transfer", on prend cette équipe
              if (
                !statusElement ||
                !statusElement.classList.contains("status--transfer")
              ) {
                team = teamElement.textContent.trim();
                console.log(
                  "Nom de l'équipe trouvé dans les transferts:",
                  team
                );
                break;
              }
            }
          }

          return { team };
        });

        team = teamInfo.team;
      }
    } catch (error) {
      console.log(
        "Erreur lors de la récupération des informations de transfert:",
        error.message
      );
    }

    const playerData = {
      id: link.split("/").pop(),
      ...basicInfo,
      team,
    };

    console.log(
      `Données récupérées pour ${playerData.nickname} - Équipe: ${playerData.team}`
    );
    await page.close();
    return playerData;
  } catch (error) {
    console.log(`Erreur lors du scraping de ${link}: ${error.message}`);
    await page.close();

    if (retryCount < 3) {
      console.log(`Nouvelle tentative (${retryCount + 1}/3) pour ${link}`);
      await page.waitForTimeout(5000);
      return scrapePlayer(browser, link, retryCount + 1);
    }

    return null;
  }
};

// Fonction principale de scraping
async function scrapePlayers() {
  // Supprimer le fichier players.json s'il existe
  try {
    await fs.unlink("players.json");
    console.log("Fichier players.json supprimé.");
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Erreur lors de la suppression de players.json:", error);
      throw error;
    }
  }

  let existingPlayers = [];

  const browser = await puppeteer.launch(browserConfig);

  try {
    const page = await browser.newPage();
    await setupPageOptimization(page);

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

    // On ne filtre plus les joueurs déjà présents, on les scrape tous
    const newPlayerLinks = allPlayerLinks;

    console.log(`${newPlayerLinks.length} joueurs à scraper`);

    // Scraper les joueurs en parallèle (5 à la fois)
    const batchSize = 5;
    for (let i = 0; i < newPlayerLinks.length; i += batchSize) {
      const batch = newPlayerLinks.slice(i, i + batchSize);
      const newPlayers = await Promise.all(
        batch.map((link) => scrapePlayer(browser, link))
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

// Exporter la fonction scrapePlayers
module.exports = { scrapePlayers };

// Exécuter le script
console.log("Démarrage du scraping...");
scrapePlayers()
  .then(() => {
    console.log("Scraping terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur lors du scraping:", error);
    process.exit(1);
  });
