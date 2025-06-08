// Initialiser highlight.js
hljs.highlightAll();

// Fonction pour gérer la touche Entrée
function handleKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    testEndpoint();
  }
}

// Fonction pour tester les endpoints
async function testEndpoint() {
  const customQuery = document.getElementById("custom-query").value;
  const resultElement = document.getElementById("result");
  const statusElement = document.getElementById("status-code");

  if (!customQuery) {
    statusElement.textContent = "Erreur";
    resultElement.textContent = "Veuillez entrer une requête valide";
    return;
  }

  const url = `https://cs2-api.onrender.com/api${customQuery}`;

  try {
    statusElement.textContent = "Chargement...";
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    statusElement.textContent = `Status: ${response.status}`;
    resultElement.textContent = JSON.stringify(data, null, 2);
    hljs.highlightElement(resultElement);
  } catch (error) {
    statusElement.textContent = "Erreur";
    if (error.message.includes("NetworkError")) {
      resultElement.textContent =
        "Erreur de connexion : Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.";
    } else {
      resultElement.textContent = `Erreur: ${error.message}`;
    }
  }
}

// Fonction pour effacer les résultats
function clearResults() {
  document.getElementById("result").textContent = "";
  document.getElementById("status-code").textContent = "";
  document.getElementById("custom-query").value = "";
}
