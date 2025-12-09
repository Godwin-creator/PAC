// --- Gemini API Configuration ---

const apiKey = CONFIG.apiKey; //Vous collerez votre clé api ic avant de lancer le programme.
const LLM_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MODEL_TEXT = 'gemini-2.5-flash-preview-09-2025';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';
console.log(apiKey);

// Theme Management (Light/Dark Mode)
const theme = document.getElementById('theme');
let isDarkMode = false;

const darkModeStyles = {
    body: { backgroundColor: '#1f2937', color: '#f3f4f6' },
    header: { backgroundColor: '#111827', color: '#f3f4f6' },
    'chat-window': { backgroundColor: '#111827', color: '#f3f4f6' },
    'action-area': { backgroundColor: '#1f2937' },
    'etape-area': { backgroundColor: '#1f2937' },
    'progress-area': { backgroundColor: '#1f2937' },
};

const lightModeStyles = {
    body: { backgroundColor: '#fafaf8', color: '#292524' },
    header: { backgroundColor: '#ffffff', color: '#292524' },
    'chat-window': { backgroundColor: '#ffffff', color: '#292524' },
    'action-area': { backgroundColor: '#fafaf8' },
    'etape-area': { backgroundColor: '#fafaf8' },
    'progress-area': { backgroundColor: '#fafaf8' },
};

function applyTheme(isDark) {
    const styles = isDark ? darkModeStyles : lightModeStyles;
    
    Object.entries(styles).forEach(([elementId, styleObj]) => {
        const element = elementId === 'body' ? document.body : document.getElementById(elementId);
        if (element) {
            Object.assign(element.style, styleObj);
        }
    });
    
    // Update text colors in chat messages
    document.querySelectorAll('.bot-message').forEach(msg => {
        msg.style.backgroundColor = isDark ? '#374151' : '#e7e5e4';
        msg.style.color = isDark ? '#f3f4f6' : '#292524';
    });
    
    document.querySelectorAll('.user-message').forEach(msg => {
        msg.style.backgroundColor = isDark ? '#d97706' : '#fcd34d';
        msg.style.color = isDark ? '#111827' : '#292524';
    });
    
    // Update modal styles
    const modal = document.getElementById('llm-modal');
    if (modal) {
        modal.style.backgroundColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)';
    }
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.backgroundColor = isDark ? '#1f2937' : '#ffffff';
        modalContent.style.color = isDark ? '#f3f4f6' : '#292524';
    }
}

// Toggle theme on button click
theme.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyTheme(isDarkMode);
    theme.textContent = isDarkMode ? '☀️' : '🌙';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Load saved theme preference
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        applyTheme(true);
        theme.textContent = '☀️';
    }
});

// Utility for exponential backoff
async function fetchWithBackoff(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 && i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            // Errors other than 429 are also subject to backoff, but often indicate a deeper issue.
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// --- TTS Helper Functions ---

// Converts base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Converts PCM audio data to WAV Blob
function pcmToWav(pcm16, sampleRate) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    const buffer = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(buffer);
    let offset = 0;

    /* RIFF identifier */
    view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
    /* file length */
    view.setUint32(offset, 36 + pcm16.length * 2, true); offset += 4;
    /* RIFF type */
    view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
    /* format chunk identifier */
    view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
    /* format chunk length */
    view.setUint32(offset, 16, true); offset += 4; // 16 for PCM
    /* sample format (1 for PCM) */
    view.setUint16(offset, 1, true); offset += 2;
    /* number of channels */
    view.setUint16(offset, numChannels, true); offset += 2;
    /* sample rate */
    view.setUint32(offset, sampleRate, true); offset += 4;
    /* byte rate */
    view.setUint32(offset, byteRate, true); offset += 4;
    /* block align */
    view.setUint16(offset, blockAlign, true); offset += 2;
    /* bits per sample */
    view.setUint16(offset, bitsPerSample, true); offset += 2;
    /* data chunk identifier */
    view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
    /* data chunk length */
    view.setUint32(offset, pcm16.length * 2, true); offset += 4;

    // Write PCM data
    for (let i = 0; i < pcm16.length; i++) {
        view.setInt16(offset, pcm16[i], true);
        offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
}


// Data Store containing report logic
const diagnosisData = {
    nodes: [
        {
            id: 'start',
            title: "Bonjour, je suis PAC. Quel est le problème ?",
            description: "Pour commencer le diagnostic, veuillez préciser le type de matériel concerné. Certaines étapes (comme la batterie) sont spécifiques aux ordinateurs portables. Quel est votre type d'ordinateur ?",
            actions: [],
            type: 'selection',
            targetNode: null,
            responses: [
                { label: "DeskTop", value: 'desktop', next: 'branch1' },
                { label: "PC Portable", value: 'laptop', next: 'branch1' }
            ]
        },
        {
            id: 'branch1',
            title: "Niveau 1 : Environnement Électrique",
            description: "Le problème vient peut-être de la source d'énergie et non du PC. Cette étape permet d'éliminer les causes externes. Voici les actions à effectuer :",
            diagramFocus: 'node-source',
            actions: [
                "Branchez une lampe ou charger un téléphone sur la même prise.",
                "Essayez de brancher le PC sur une autre prise.",
                "Vérifiez le disjoncteur du tableau électrique (voir si tout fonctionne).",
                "Vérifiez que la borne d'alimentation est bien placée"
            ],
            question: "La lampe témoin s'allume-t-elle sur la prise murale ?",
            responses: [
                { label: "Oui, la prise fonctionne", value: 'yes', next: 'branch2' },
                { label: "Non, la prise ne marche pas", value: 'no', next: 'solution_electric' }
            ]
        },
        {
            id: 'solution_electric',
            title: "Diagnostic : Panne Domestique",
            description: "Le problème ne vient pas de votre ordinateur mais de votre installation électrique.",
            type: 'solution',
            outcome: "success",
            actions: [
                "Réarmez le disjoncteur concerné.",
                "Contactez un électricien si la prise est défectueuse.",
                "Utilisez une autre prise pour votre PC en attendant."
            ],
            llmQuery: "Expliquez simplement pourquoi un disjoncteur qui saute peut empêcher un ordinateur de démarrer, même s'il est branché à une prise murale.",
            responses: [{ label: "J'ai compris, fin du diagnostic.", value: 'end', next: 'end' }]
        },
        {
            id: 'branch2',
            title: "Niveau 2 : Connectique Physique",
            description: "L'électricité est présente au mur, mais arrive-t-elle jusqu'à la machine ? Vérifions le câble d'alimentation. Voici les actions à effectuer :",
            diagramFocus: 'node-cable',
            actions: [
                "Vérifiez que le câble est fermement enfoncé côté mur et côté PC.",
                "PC Fixe : Vérifiez l'interrupteur I/O à l'arrière (doit être sur 'I').",
                "Si disponible, testez avec un autre câble d'alimentation compatible."
            ],
            question: "Le PC s'allume-t-il après avoir vérifié/changé le câble ?",
            responses: [
                { label: "Oui, ça marche !", value: 'yes', next: 'solution_cable' },
                { label: "Toujours rien", value: 'no', next: 'branch3' }
            ]
        },
        {
            id: 'solution_cable',
            title: "Problème Résolu : Connectique",
            description: "C'était un problème de câble mal branché ou défectueux.",
            type: 'solution',
            outcome: "success",
            actions: ["Si le câble était défectueux, pensez à en acheter un neuf standard (IEC)."],
            llmQuery: "Expliquez pourquoi un câble d'alimentation défectueux, même s'il semble intact, peut empêcher totalement le démarrage d'un PC.",
            responses: [{ label: "J'ai compris, fin du diagnostic.", value: 'end', next: 'end' }]
        },
        {
            id: 'branch3',
            title: "Niveau 3 : Action de Démarrage",
            description: "Le système est peut-être bloqué dans un état instable ('freeze' éteint) ou le bouton est mal actionné. Voici les actions à effectuer :",
            diagramFocus: 'node-machine',
            actions: [
                "Assurez-vous d'appuyer franchement au centre du bouton Power.",
                "<strong>Test du Hard Reset :</strong> Débranchez le câble secteur.",
                "Maintenez le bouton Power appuyé pendant 30 à 60 secondes (drainage électrique).",
                "Relâchez, rebranchez et tentez d'allumer."
            ],
            question: "Le PC démarre-t-il après le Hard Reset ?",
            responses: [
                { label: "Oui, il a démarré", value: 'yes', next: 'solution_reset' },
                { label: "Toujours aucune réaction", value: 'no', next: 'check_device_type' } // Logic jump based on device type
            ]
        },
        {
            id: 'solution_reset',
            title: "Problème Résolu : Charge Statique",
            description: "Une charge résiduelle empêchait le démarrage. Le drainage électrique a résolu le conflit.",
            type: 'solution',
            outcome: "success",
            actions: ["Le système est de nouveau stable."],
            llmQuery: "Expliquez ce qu'est un 'hard reset' et comment le drainage de la charge résiduelle permet de résoudre un problème de démarrage sur un PC.",
            responses: [{ label: "J'ai compris, fin du diagnostic.", value: 'end', next: 'end' }]
        },
        {
            id: 'branch4', // Laptop Only
            title: "Niveau 4 : Alimentation Portable",
            description: "Pour un PC portable, la batterie ou le chargeur peuvent être en cause. Voici les actions à effectuer :",
            diagramFocus: 'node-machine',
            actions: [
                "Vérifiez la LED sur le boîtier du chargeur (si présente).",
                "<strong>Bypass :</strong> Si la batterie est amovible, retirez-la, branchez uniquement le chargeur, et testez.",
                "Laissez charger 15 minutes (cas de décharge profonde)."
            ],
            question: "Le PC s'allume-t-il (avec ou sans batterie) ?",
            responses: [
                { label: "Oui, ça s'allume", value: 'yes', next: 'solution_battery' },
                { label: "Non, toujours rien", value: 'no', next: 'branch5' }
            ]
        },
        {
            id: 'solution_battery',
            title: "Diagnostic : Batterie ou Chargeur",
            description: "Vous avez identifié le coupable.",
            type: 'solution',
            outcome: "success",
            actions: [
                "Si le PC s'allume sans batterie : La batterie est HS, il faut la remplacer.",
                "Si la LED du chargeur est éteinte : Le chargeur est mort, à remplacer."
            ],
            llmQuery: "Expliquez le rôle d'un chargeur de PC portable et pourquoi un chargeur défectueux empêche à la fois de charger la batterie et d'alimenter directement l'ordinateur.",
            responses: [{ label: "J'ai compris, fin du diagnostic.", value: 'end', next: 'end' }]
        },
        {
            id: 'branch5',
            title: "Niveau 5 : Indicateurs Visuels",
            description: "Nous suspectons une panne interne. Observons les micro-réactions de la machine. Voici les actions à effectuer :",
            diagramFocus: 'node-internal',
            actions: [
                "Regardez les LED de façade ou de clavier.",
                "Écoutez le bruit des ventilateurs (s'ils tournent) ou du disque dur lors de l'appui."
            ],
            question: "Observez-vous une lumière ou un son, même bref ?",
            responses: [
                { label: "Oui (Lumière/Ventilo mais écran noir)", value: 'yes', next: 'conclusion_components' },
                { label: "Non (Silence total et obscurité)", value: 'no', next: 'conclusion_power' }
            ]
        },
        {
            id: 'conclusion_components',
            title: "Diagnostic : Panne de Composants (RAM/GPU)",
            description: "Le PC est alimenté (puisqu'il y a de la lumière/bruit), mais il refuse de démarrer le système (boot).",
            type: 'solution',
            outcome: "partial",
            actions: [
                "Ce n'est pas une panne d'alimentation pure.",
                "Branchez un écran externe pour vérifier l'affichage.",
                "Le problème vient ment de la RAM, de la Carte Graphique ou de l'Écran."
            ],
            llmQuery: "Expliquez ce que signifie un 'boot' et pourquoi le PC peut s'allumer (bruit/lumière) sans afficher d'image à l'écran.",
            responses: [{ label: "J'ai compris, fin du diagnostic.", value: 'end', next: 'end' }]
        },
        {
            id: 'conclusion_power',
            title: "Verdict Final : Panne Matérielle Critique",
            description: "Si toutes les étapes (Prise, Câble, Reset, Batterie) ont échoué et que le PC reste inerte, la panne est interne.",
            diagramFocus: 'node-internal',
            type: 'conclusion',
            outcome: "failure",
            actions: [
                "Bloc d'alimentation (PSU) probablement HS.",
                "Carte Mère potentiellement défaillante.",
                "Bouton Power défectueux."
            ],
            llmQuery: "Expliquez en détail ce qu'est un bloc d'alimentation (PSU) et pourquoi sa panne est la cause la plus fréquente d'un PC qui ne s'allume pas du tout.",
            responses: [{ label: "Voir les suspects s", value: 'show_prob', next: 'end' }]
        }
    ]
};

// App Logic
const app = {
    currentStepId: 'start',
    currentStepIndex: 0,
    deviceType: null,

    init: function () {
        this.initCharts();
        this.renderChatStep(this.getStepData('start'));
    },

    reset: function () {
        this.currentStepId = 'start';
        this.currentStepIndex = 0;
        this.deviceType = null;
        document.getElementById('chat-window').innerHTML = '';
        document.querySelectorAll('.flow-node, .flow-line').forEach(el => {
            el.classList.remove('active', 'completed');
        });
        const audio = document.getElementById('tts-audio');
        audio.pause();
        audio.removeAttribute('src');
        this.initCharts();
        this.renderChatStep(this.getStepData('start'));
    },

    getStepData: function (stepId) {
        return diagnosisData.nodes.find(n => n.id === stepId);
    },

    // --- LLM Integration (Text Generation and Grounding) ---

    showModal: function (title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-content-text').innerHTML = content;
        document.getElementById('llm-modal').style.display = 'flex';
    },

    // Handles the API call to Gemini (Text or Grounding Search)
    handleLLMRequest: async function (type) {
        const currentData = this.getStepData(this.currentStepId);
        let userQuery = currentData.llmQuery;
        let modalTitle = (type === 'explanation') ? "Explication Détaillée (IA)" : "Recherche de Solutions (IA & Web)";
        let systemPrompt;
        let tools = [];

        if (type === 'explanation') {
            systemPrompt = "Agissez comme un expert en réparation PC. Fournissez une explication concise (2 paragraphes maximum), simple et pédagogique en français pour un utilisateur non technique. N'incluez pas de code ni de lien soyez bref.";
        } else if (type === 'search') {
            systemPrompt = "Agissez comme un conseiller en réparation PC. En utilisant les informations de Google, fournissez des recommandations de solutions (réparation par un professionnel ou achat de pièces) en texte brut sans tableau en français. Incluez le prix moyen ou la gamme de prix et fournissez des liens d'attribution. Surtout soyez court et precis";
            userQuery = "Trouvez des informations sur le prix moyen de remplacement d'un bloc d'alimentation (PSU) pour un PC de bureau et le coût de la main d'œuvre spécialement au Togo.";
            tools = [{ "google_search": {} }];
        }

        this.showModal(modalTitle, '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 inline-block"></div><p class="mt-4 text-amber-600">L\'IA analyse et recherche...</p></div>');

        try {
            const apiUrl = `${LLM_URL_BASE}${MODEL_TEXT}:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                tools: tools
            };

            const response = await fetchWithBackoff(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                let text = candidate.content.parts[0].text;
                let sources = [];
                const groundingMetadata = candidate.groundingMetadata;

                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    sources = groundingMetadata.groundingAttributions
                        .map(attribution => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter(source => source.uri && source.title);
                }

                let contentHtml = `<p class="whitespace-pre-wrap">${text}</p>`;

                if (sources.length > 0) {
                    contentHtml += `<h4 class="font-semibold mt-6 mb-2">Sources Web :</h4><ul class="list-disc list-inside space-y-1 text-xs">`;
                    sources.forEach((s, index) => {
                        contentHtml += `<li><a href="${s.uri}" target="_blank" class="text-amber-600 hover:underline">${s.title}</a></li>`;
                    });
                    contentHtml += `</ul>`;
                }

                this.showModal(modalTitle, contentHtml);

            } else {
                this.showModal(modalTitle, "<p class='text-red-600'>Erreur : L'IA n'a pas pu générer de réponse. Veuillez réessayer.</p>");
            }

        } catch (error) {
            console.error("Erreur API Gemini (Text/Search):", error);
            this.showModal(modalTitle, "<p class='text-red-600'>Erreur : La communication avec l'API Gemini a échoué. Vérifiez la console pour les détails.</p>");
        }
    },

    // --- LLM Integration (TTS) ---

    handleTTSRequest: async function () {
        const currentData = this.getStepData(this.currentStepId);
        const audio = document.getElementById('tts-audio');

        // Stop existing audio if playing
        audio.pause();
        audio.removeAttribute('src');

        // Aggregate actions and title into a single prompt for TTS
        let ttsPrompt = `${currentData.title}. Voici les actions à effectuer.`;
        if (currentData.actions && currentData.actions.length > 0) {
            currentData.actions.forEach((action, index) => {
                // Clean up HTML tags (like <strong>) for better speech synthesis
                const cleanAction = action.replace(/<[^>]*>/g, '');
                ttsPrompt += ` Étape ${index + 1}: ${cleanAction}.`;
            });
        } else {
            ttsPrompt += currentData.description;
        }

        // Show loading state
        const ttsButton = document.querySelector('[data-tts-button]');
        const originalText = ttsButton.textContent;
        ttsButton.textContent = "Chargement de l'audio...";
        ttsButton.disabled = true;

        try {
            const apiUrl = `${LLM_URL_BASE}${MODEL_TTS}:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: ttsPrompt }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: "Kore" } // Kore voice for firm/informative tone
                        }
                    }
                }
            };

            const response = await fetchWithBackoff(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.[0];
            const audioData = part?.inlineData?.data;
            const mimeType = part?.inlineData?.mimeType;

            if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
                // Sample rate is expected to be 24000 for L16/PCM data from this API
                const sampleRate = 24000;
                const pcmData = base64ToArrayBuffer(audioData);
                const pcm16 = new Int16Array(pcmData);
                const wavBlob = pcmToWav(pcm16, sampleRate);
                const audioUrl = URL.createObjectURL(wavBlob);

                audio.src = audioUrl;
                audio.play();

                audio.onended = () => {
                    ttsButton.textContent = originalText;
                    ttsButton.disabled = false;
                };

                ttsButton.textContent = "Écoute en cours... 🔊";
            } else {
                console.error("TTS Error: No audio data or invalid mimeType:", mimeType);
                throw new Error("TTS response missing audio content.");
            }

        } catch (error) {
            console.error("Erreur API Gemini (TTS):", error);
            ttsButton.textContent = "Erreur audio ❌";
            // Re-enable button after 3 seconds for retry
            setTimeout(() => { ttsButton.textContent = originalText; ttsButton.disabled = false; }, 3000);
        } finally {
            // Restore button state if not playing (e.g., if error occurred)
            if (!audio.src) {
                ttsButton.textContent = originalText;
                ttsButton.disabled = false;
            }
        }
    },


    // --- Chat Management ---

    sendMessage: function (sender, text, isQuestion = false) {
        const chatWindow = document.getElementById('chat-window');
        const isUser = sender === 'user';
        const messageClass = isUser ? 'user-message self-end' : 'bot-message self-start';
        const alignment = isUser ? 'items-end' : 'items-start';
        const icon = isUser ? '👤' : '<img src="assets/icons/favicon.png" alt="PAC Logo" width="100px" height="220px">';

        const actionsHtml = isQuestion ? `<div class="mt-2 text-sm text-stone-700">${text}</div>` : `<p class="text-sm">${text}</p>`;

        const messageHtml = `
                <div class="flex flex-col ${alignment} max-w-[85%]">
                    <div class="flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}">
                        <span class="text-xl">${icon}</span>
                        <div class="${messageClass} p-3 rounded-xl shadow-sm text-stone-800">
                            ${actionsHtml}
                        </div>
                    </div>
                </div>
            `;

        chatWindow.insertAdjacentHTML('beforeend', messageHtml);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    },

    // Renders the bot's message and the user's clickable response buttons in the action area
    renderChatStep: function (data) {
        const actionArea = document.getElementById('response-buttons');
        actionArea.innerHTML = '';
        document.getElementById('action-prompt').classList.remove('hidden');

        // 1. Send the Bot Message
        let messageContent = `<strong>${data.title}</strong><br>${data.description}`;

        if (data.actions && data.actions.length > 0) {
            messageContent += `<br><br>Actions à effectuer :<ul class="list-disc list-inside mt-2 text-sm space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-100 text-stone-700">`;
            data.actions.forEach(action => {
                messageContent += `<li>${action}</li>`;
            });
            messageContent += `</ul>`;
        }

        if (data.question) {
            messageContent += `<br><br><strong>${data.question}</strong>`;
        }

        this.sendMessage('bot', messageContent, true);

        // 2. Add LLM TTS Button for all action steps (branches)
        if (data.id.startsWith('branch')) {
            const ttsButton = document.createElement('button');
            ttsButton.textContent = "Écouter les conseils ✨";
            ttsButton.className = "px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap bg-purple-500 text-white hover:bg-purple-600 shadow-md";
            ttsButton.onclick = () => this.handleTTSRequest();
            ttsButton.setAttribute('data-tts-button', 'true');
            actionArea.appendChild(ttsButton);
        }

        // 3. Prepare Response Buttons (from data logic)
        if (data.responses) {
            data.responses.forEach(response => {
                const button = document.createElement('button');
                button.textContent = response.label;
                button.className = `px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap 
                                        ${response.value === 'no' ? 'bg-amber-600 text-white hover:bg-amber-700' :
                        (response.value === 'yes' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-stone-200 text-stone-700 hover:bg-stone-300')}`;
                button.onclick = () => this.handleUserResponse(response.label, response.next, response.value);
                actionArea.appendChild(button);
            });
        } else {
            document.getElementById('action-prompt').classList.add('hidden');
        }

        // 4. Add LLM Buttons for final steps (Text/Search)
        if (data.type === 'solution' || data.type === 'conclusion') {
            // LLM Explanation Button (Text Generation)
            const explainerButton = document.createElement('button');
            explainerButton.textContent = "Expliquer la cause ✨";
            explainerButton.className = "px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap bg-indigo-500 text-white hover:bg-indigo-600 shadow-md";
            explainerButton.onclick = () => this.handleLLMRequest('explanation');
            actionArea.appendChild(explainerButton);

            // LLM Search/Part Finder Button (Grounding for Hardware Failure)
            if (data.outcome === 'failure') {
                const searchButton = document.createElement('button');
                searchButton.textContent = "Recherche de solutions/pièces ✨";
                searchButton.className = "px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap bg-teal-500 text-white hover:bg-teal-600 shadow-md";
                searchButton.onclick = () => this.handleLLMRequest('search');
                actionArea.appendChild(searchButton);
            }
        }

        // 5. Update Visualizations
        this.currentStepId = data.id;
        if (data.diagramFocus) {
            this.updateDiagram(data.diagramFocus);
        }
        if (data.type === 'conclusion' && data.outcome === 'failure') {
            setTimeout(() => this.showProbabilityChart(), 100);
        } else if (data.type !== 'conclusion') {
            document.getElementById('probability-container').classList.add('hidden');
        }
    },

    handleUserResponse: function (userLabel, nextStep, userValue = null) {
        // 1. Stop Audio on interaction
        const audio = document.getElementById('tts-audio');
        audio.pause();
        document.querySelectorAll('[data-tts-button]').forEach(b => {
            b.textContent = "Écouter les conseils ✨";
            b.disabled = false;
        });


        // 2. Send User Message to Chat Window
        this.sendMessage('user', userLabel);

        // 3. Clear Buttons
        document.getElementById('response-buttons').innerHTML = '';
        document.getElementById('action-prompt').classList.add('hidden');

        // 4. Process Logic
        if (this.currentStepId === 'start') {
            this.deviceType = userValue; // 'desktop' or 'laptop'
        }

        if (userValue === 'show_prob') {
            document.getElementById('probability-container').classList.remove('hidden');
            return; // End of flow
        }

        let nextId = nextStep;

        if (nextId === 'check_device_type') {
            nextId = (this.deviceType === 'laptop') ? 'branch4' : 'branch5';
        } else if (nextId === 'end') {
            this.updateChart(100);
            return; // End of flow
        }

        // 5. Go to Next Step
        this.currentStepIndex++;
        this.updateChart(this.currentStepIndex * 15); // Rough progress increment
        this.renderChatStep(this.getStepData(nextId));
    },

    // --- Visualization Management (Unchanged) ---

    updateDiagram: function (activeNodeId) {
        document.querySelectorAll('.flow-node').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelectorAll('.flow-line').forEach(el => el.classList.remove('active'));

        if (activeNodeId === 'none') return;

        const activeEl = document.getElementById(activeNodeId);
        if (activeEl) activeEl.classList.add('active');

        const flow = ['node-source', 'node-cable', 'node-machine', 'node-internal'];
        const currentIndex = flow.indexOf(activeNodeId);

        if (currentIndex > -1) {
            for (let i = 0; i < currentIndex; i++) {
                document.getElementById(flow[i]).classList.add('completed');
                if (i < 3) document.getElementById(`line-${i + 1}`).classList.add('active');
            }
        }
    },

    // Charts
    progressChartInstance: null,
    probabilityChartInstance: null,

    initCharts: function () {
        if (this.progressChartInstance) this.progressChartInstance.destroy();
        if (this.probabilityChartInstance) this.probabilityChartInstance.destroy();
        document.getElementById('probability-container').classList.add('hidden');

        const ctx = document.getElementById('progressChart').getContext('2d');
        this.progressChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Complété', 'Restant'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: ['#d97706', '#e7e5e4'], // amber-600, stone-200
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });

        const centerText = {
            id: 'centerText',
            beforeDraw: function (chart) {
                var width = chart.width,
                    height = chart.height,
                    ctx = chart.ctx;
                ctx.restore();
                var fontSize = (height / 114).toFixed(2);
                ctx.font = "bold " + fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#44403c";
                var text = Math.round(chart.data.datasets[0].data[0]) + "%",
                    textX = Math.round((width - ctx.measureText(text).width) / 2),
                    textY = height / 2;
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        };
        Chart.register(centerText);
    },

    updateChart: function (percent) {
        if (this.progressChartInstance) {
            if (percent > 100) percent = 100;
            this.progressChartInstance.data.datasets[0].data = [percent, 100 - percent];
            this.progressChartInstance.update();
        }
    },

    showProbabilityChart: function () {
        const container = document.getElementById('probability-container');
        container.classList.remove('hidden');

        const ctx = document.getElementById('probabilityChart').getContext('2d');

        if (this.probabilityChartInstance) this.probabilityChartInstance.destroy();

        this.probabilityChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Alimentation (PSU)', 'Carte Mère', 'Bouton Power'],
                datasets: [{
                    label: 'Probabilité de Panne',
                    data: [60, 30, 10],
                    backgroundColor: ['#dc2626', '#ea580c', '#f59e0b'],
                    borderRadius: 6
                }]
            },
            options: {
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: { display: false }
                    },
                    y: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.parsed.x + '% de probabilité estimée';
                            }
                        }
                    }
                }
            }
        });
    }
};

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();

});
