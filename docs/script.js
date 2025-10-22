document.addEventListener('DOMContentLoaded', function() {
    // Configuration de l'API
    const API_BASE_URL = 'https://cs2-api.onrender.com/api';
    
    // Éléments du DOM
    const endpoints = {
        players: {
            url: `${API_BASE_URL}/players`,
            container: document.getElementById('players-response-container'),
            code: document.getElementById('players-response')
        },
        player: {
            getUrl: () => `${API_BASE_URL}/players/${document.getElementById('player-id').value}`,
            container: document.getElementById('player-response-container'),
            code: document.getElementById('player-response')
        },
        team: {
            getUrl: () => `${API_BASE_URL}/players/team/${document.getElementById('team-name').value}`,
            container: document.getElementById('team-response-container'),
            code: document.getElementById('team-response')
        },
        teams: {
            url: `${API_BASE_URL}/teams`,
            container: document.getElementById('teams-response-container'),
            code: document.getElementById('teams-response')
        }
    };

    // Initialisation
    initDocumentation();

    // Gestionnaires d'événements
    document.querySelectorAll('.try-btn').forEach(button => {
        button.addEventListener('click', () => testEndpoint(button.dataset.endpoint));
    });
    
    // Gestion du clic sur les en-têtes de réponse pour le déploiement/fermeture
    document.querySelectorAll('.response-header').forEach(header => {
        header.addEventListener('click', () => {
            const responseSection = header.closest('.response-section');
            const responseContainer = header.nextElementSibling;
            
            if (responseContainer.classList.contains('expanded')) {
                responseContainer.classList.remove('expanded');
                header.classList.remove('expanded');
            } else {
                responseContainer.classList.add('expanded');
                header.classList.add('expanded');
            }
        });
    });
    
    // Mettre à jour la navigation active au défilement
    window.addEventListener('scroll', updateActiveNav);
    
    // Mettre à jour la navigation active au chargement de la page
    window.addEventListener('load', () => {
        // Délai pour s'assurer que le DOM est complètement chargé
        setTimeout(updateActiveNav, 100);
    });
    
    // Gestion de la touche Entrée sur les champs de saisie
    document.querySelectorAll('.param-input').forEach(input => {
        input.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const endpoint = this.id === 'player-id' ? 'player' : 'team';
                testEndpoint(endpoint);
            }
        });
    });

    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const codeElement = document.getElementById(targetId);
            if (codeElement) {
                copyToClipboard(codeElement.textContent);
                showCopiedFeedback(e.currentTarget);
            }
        });
    });

    // Navigation fluide
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Mettre à jour l'URL sans recharger la page
                history.pushState(null, '', targetId);
            }
        });
    });

    // Fonction pour initialiser la documentation
    function initDocumentation() {
        // Charger les exemples de réponses
        Object.keys(endpoints).forEach(endpoint => {
            if (endpoints[endpoint].url) {
                fetchAndDisplayExample(endpoint);
            }
        });
        
        // Afficher le premier exemple de réponse
        fetchAndDisplayExample('players');
    }

    // Fonction pour mettre à jour la navigation active
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.main-nav a');
        
        let current = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = '#' + section.id;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === current) {
                link.classList.add('active');
            }
        });
    }
    
    // Fonction pour tester un endpoint
    async function testEndpoint(endpointName) {
        const endpoint = endpoints[endpointName];
        const url = endpoint.getUrl ? endpoint.getUrl() : endpoint.url;
        
        const button = document.querySelector(`button[data-endpoint="${endpointName}"]`);
        const responseSection = document.getElementById(`${endpointName}-response-section`);
        const responseContainer = responseSection.querySelector('.response-container');
        const responseCode = responseSection.querySelector('code');
        const statusBadge = responseSection.querySelector('.status-badge');
        const originalText = button.textContent;
        
        try {
            // Afficher le chargement
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Envoi...';
            
            // Cacher la section de réponse si elle était déjà ouverte
            responseSection.classList.remove('visible');
            responseContainer.classList.remove('expanded');
            
            // Mettre à jour le statut
            statusBadge.textContent = 'Chargement...';
            statusBadge.className = 'status-badge';
            
            // Faire la requête
            const startTime = Date.now();
            const response = await fetch(url);
            const data = await response.json();
            const endTime = Date.now();
            
            // Formater la réponse
            const formattedData = JSON.stringify(data, null, 2);
            
            // Mettre à jour le code de réponse avec coloration syntaxique
            responseCode.innerHTML = formatJSON(formattedData);
            
            // Mettre à jour le statut
            const statusClass = response.ok ? 'status-200' : `status-${response.status}`;
            statusBadge.textContent = statusClass.replace('status-', '') + (response.ok ? ' OK' : '');
            statusBadge.className = `status-badge ${statusClass}`;
            
            // Vider et mettre à jour le conteneur de réponse
            responseContainer.innerHTML = '';
            
            // Ajouter uniquement le code formaté
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.innerHTML = formatJSON(formattedData);
            pre.appendChild(code);
            responseContainer.appendChild(pre);
            
            // Afficher la section de réponse avec une animation
            responseSection.style.display = 'block';
            setTimeout(() => {
                responseSection.classList.add('visible');
                setTimeout(() => {
                    responseContainer.classList.add('expanded');
                }, 10);
            }, 10);
            
            // Faire défiler jusqu'à la section de réponse
            responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
        } catch (error) {
            console.error('Erreur:', error);
            
            // Mettre à jour le statut d'erreur
            statusBadge.textContent = 'Erreur';
            statusBadge.className = 'status-badge status-error';
            
            // Afficher le message d'erreur
            responseContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Erreur lors de la requête:</strong>
                    <div>${error.message}</div>
                </div>
            `;
            
            // Afficher la section d'erreur
            responseSection.style.display = 'block';
            responseSection.classList.add('visible');
            responseContainer.classList.add('expanded');
            
        } finally {
            // Réinitialiser le bouton
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    // Fonction pour afficher un exemple de réponse
    async function fetchAndDisplayExample(endpointName) {
        const endpoint = endpoints[endpointName];
        const url = endpoint.getExampleUrl ? endpoint.getExampleUrl() : endpoint.url;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            // Limiter la taille de l'exemple pour la lisibilité
            let exampleData = data;
            if (Array.isArray(data) && data.length > 3) {
                exampleData = data.slice(0, 3);
                if (endpointName === 'players') {
                    exampleData.push({
                        "...": "... (plus d'éléments)"
                    });
                }
            }
            
            endpoint.code.textContent = JSON.stringify(exampleData, null, 2);
            
        } catch (error) {
            console.error('Erreur lors du chargement de l\'exemple:', error);
            endpoint.code.textContent = '// Impossible de charger l\'exemple';
        }
    }

    // Fonction pour copier dans le presse-papier
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Fonction pour afficher le feedback de copie
    function showCopiedFeedback(button) {
        const originalHTML = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = '<i class="fas fa-check"></i> <span class="copied">Copié !</span>';
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalHTML;
        }, 2000);
    }

    // Fonction utilitaire pour formater le JSON avec coloration syntaxique
    function formatJSON(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        
        // Simple coloration syntaxique pour le JSON
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"(\w+)":/g, '<span class="hljs-attr">"$1"</span>:')
            .replace(/: "(.*?)"/g, ': <span class="hljs-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="hljs-number">$1</span>')
            .replace(/: (true|false|null)/g, ': <span class="hljs-literal">$1</span>');
    }

    // Initialiser les exemples pour les endpoints dynamiques
    endpoints.player.getExampleUrl = () => `${API_BASE_URL}/players/1`;
    endpoints.team.getExampleUrl = () => `${API_BASE_URL}/players/team/Vitality`;
    
    // Charger les exemples initiaux
    fetchAndDisplayExample('player');
    fetchAndDisplayExample('team');
});
