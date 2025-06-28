// Chat Widget Script - OpenAI API Integration with Multiple Knowledge Bases and Chat History
// All configurations are now self-contained within this script.
(async function() {
    // --- Default Configuration for the Chat Widget ---
    const defaultConfig = {
        api: {
            // Your OpenAI API Key. Replace with your actual key.
            key: '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',
            // The OpenAI model to use for chat completions.
            model: 'gpt-4o-mini'
        },
        branding: {
            // URL to your brand logo. Will be hidden if not provided or fails to load.
            logo: 'https://i.imgur.com/pRoIdOv.png',
            // Name displayed in the chat header.
            name: 'KV331 Audio Customer Services', // Updated bot name as requested
            // Welcome message shown when the chat is opened.
            welcomeText: 'Hello, how can I help you?', // Updated to match screenshot
            // Text indicating typical response time.
            responseTimeText: 'We usually respond within a few seconds.', // Updated to match screenshot
            // Information about who powers the chatbot.
            poweredBy: {
                text: 'Powered by Castrum AI',
                link: 'https://castrumai.com/'
            }
        },
        style: {
            // Primary color for buttons, highlights etc. (hex code).
            primaryColor: '#3b82f6',
            // Secondary color for gradients (hex code).
            secondaryColor: '#2563eb',
            // Background color of the chat widget (hex code).
            backgroundColor: '#ffffff',
            // Font color for general text (hex code).
            fontColor: '#333333',
            // Position of the chat widget toggle button and chat window ('right' or 'left').
            position: 'right',
        },
        // An array of knowledge bases for the AI to refer to.
        // Each object should have a 'src' (path to JSON file) and a 'description'.
        knowledgeBases: [
            {
                src: './knowledge-base-full.json',
                description: 'Primary knowledge base containing comprehensive information about all KV331 Audio products (SynthMaster series), bundles, expansion packs, FAQs, and company details.'
            },
            // Add more knowledge bases here if needed. Example:
            // {
            //     src: './another-knowledge-base.json',
            //     description: 'A separate knowledge base about a different topic, e.g., advanced tutorials or artist interviews.'
            // }
        ],
        // Supabase configuration for chat history logging.
        supabase: {
            url: 'https://lfclvpaxndovgutvufav.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmY2x2cGF4bmRvdmd1dHZ1ZmF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk3NDM5NSwiZXhwIjoyMDY2NTUwMzk1fQ.r1WZRnAF2Ny80pjPwPr1JKTgg0GTuPBdxEwK0cKf7kw'
        }
    };

    // Merge default config with any user-provided config (if it exists, though not expected for this self-contained script)
    // For a fully self-contained script, window.ChatWidgetConfig would ideally not be used anymore.
    const config = window.ChatWidgetConfig ?
        {
            ...defaultConfig,
            api: { ...defaultConfig.api, ...window.ChatWidgetConfig.api },
            branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
            style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style },
            knowledgeBases: window.ChatWidgetConfig.knowledgeBases || defaultConfig.knowledgeBases,
            supabase: { ...defaultConfig.supabase, ...window.ChatWidgetConfig.supabase }
        } : defaultConfig;

    // Prevent multiple initializations
    if (window.KV331ChatWidgetInitialized) return;
    window.KV331ChatWidgetInitialized = true;

    // --- Style Injection ---
    const styles = `
        .kv-chat-widget {
            --chat--color-primary: var(--kv-chat-primary-color);
            --chat--color-secondary: var(--kv-chat-secondary-color);
            --chat--color-background: var(--kv-chat-background-color);
            --chat--color-font: var(--kv-chat-font-color);
            font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .kv-chat-widget .chat-container {
            position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: flex; flex-direction: column;
            width: 380px; height: 600px; background: var(--chat--color-background); border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;
            overflow: hidden; font-family: inherit; opacity: 0; transform: scale(0.95); pointer-events: none;
            transition: opacity 0.3s ease-out, transform 0.3s ease-out; transform-origin: bottom right;
        }
        .kv-chat-widget .chat-container.position-left { right: auto; left: 20px; transform-origin: bottom left; }
        .kv-chat-widget .chat-container.open { opacity: 1; transform: scale(1); pointer-events: auto; }
        .kv-chat-widget .brand-header { padding: 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e2e8f0; position: relative; flex-shrink: 0; }
        .kv-chat-widget .close-button { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--chat--color-font); cursor: pointer; padding: 4px; font-size: 24px; opacity: 0.6; transition: opacity 0.2s; line-height: 1; }
        .kv-chat-widget .close-button:hover { opacity: 1; }
        .kv-chat-widget .brand-header img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .kv-chat-widget .brand-header span { font-size: 18px; font-weight: 600; color: var(--chat--color-font); }
        .kv-chat-widget .new-conversation { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; max-width: 300px; margin: auto; }
        .kv-chat-widget .new-conversation.hidden { display: none; }
        /* Adjusted welcome text styling to match screenshot */
        .kv-chat-widget .welcome-text {
            font-size: 28px; /* Larger font size */
            font-weight: 700; /* Bolder */
            color: var(--chat--color-font);
            margin-bottom: 24px;
            line-height: 1.3;
        }
        /* Reverted new-chat-btn styles to match original widget.js design from screenshot */
        .kv-chat-widget .new-chat-btn {
            display: flex;
            flex-direction: row; /* Horizontal alignment */
            align-items: center;
            justify-content: center;
            width: 250px; /* Fixed width as seen in screenshot */
            height: 56px; /* Adjusted height */
            padding: 0 24px; /* Adjusted padding */
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px; /* Adjusted font size for text */
            font-weight: 500;
            transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin: 0 auto 12px auto; /* Centered with margin-bottom */
        }
        .kv-chat-widget .new-chat-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.1); }
        /* Styling for the SVG icon within the new-chat-btn */
        .kv-chat-widget .new-chat-btn svg.message-icon {
            width: 24px; /* Smaller icon size as seen in screenshot */
            height: 24px;
            margin-right: 8px; /* Space between icon and text */
            margin-bottom: 0; /* Remove vertical margin */
        }
        .kv-chat-widget .chat-interface { display: none; flex-direction: column; flex: 1; min-height: 0; }
        .kv-chat-widget .chat-interface.active { display: flex; }
        .kv-chat-widget .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .kv-chat-widget .chat-message { padding: 10px 16px; border-radius: 18px; max-width: 85%; word-wrap: break-word; font-size: 15px; line-height: 1.5; animation: fadeInMessage 0.4s ease-out forwards; }
        @keyframes fadeInMessage { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .kv-chat-widget .chat-message.user { background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        .kv-chat-widget .chat-message.bot { background-color: #f1f5f9; color: var(--chat--color-font); align-self: flex-start; border-bottom-left-radius: 4px;}
        .kv-chat-widget .chat-message a { color: var(--chat--color-primary); text-decoration: underline; }
        .kv-chat-widget .chat-input { padding: 16px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        .kv-chat-widget .chat-input textarea { flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: var(--chat--color-font); resize: none; font-family: inherit; font-size: 15px; transition: border-color 0.2s, box-shadow 0.2s; max-height: 120px; overflow-y: auto; }
        .kv-chat-widget .chat-input textarea:focus { outline: none; border-color: var(--chat--color-primary); box-shadow: 0 0 0 3px rgba(var(--chat--color-primary-rgb), 0.2); }
        .kv-chat-widget .chat-input button { background-color: var(--chat--color-primary); color: white; border: none; border-radius: 8px; padding: 0 16px; height: 42px; cursor: pointer; transition: background-color 0.2s; font-weight: 500; display: flex; align-items: center; justify-content: center; }
        .kv-chat-widget .chat-toggle { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 30px; background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%); color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 999; transition: transform 0.2s, opacity 0.2s; display: flex; align-items: center; justify-content: center; }
        .kv-chat-widget .chat-toggle.position-left { right: auto; left: 20px; }
        .kv-chat-widget .chat-toggle:hover { transform: scale(1.1); }
        .kv-chat-widget .chat-toggle.hide { opacity: 0; transform: scale(0.5); pointer-events: none; }
        .kv-chat-widget .chat-footer { padding: 8px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; flex-shrink: 0; }
        .kv-chat-widget .chat-footer a { color: #64748b; text-decoration: none; font-size: 12px; transition: color 0.2s; }
        .kv-chat-widget .chat-footer a:hover { color: var(--chat--color-primary); }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Link for Geist Sans font, used for modern UI appearance.
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
    document.head.appendChild(fontLink);

    // --- State Variables ---
    let knowledgeBaseContent = ''; // Stores combined content from all knowledge bases.
    let conversationHistory = []; // Stores the history of messages in the current conversation.
    let conversationId = null; // Unique ID for the current chat session, used for logging.

    // --- Utility function for Hex to RGB conversion ---
    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }

    // --- Knowledge Base Loading ---
    async function loadKnowledgeBases() {
        if (!config.knowledgeBases || !Array.isArray(config.knowledgeBases) || config.knowledgeBases.length === 0) {
            console.log("No knowledge base specified.");
            return;
        }

        try {
            // Fetch all knowledge base files concurrently.
            const fetchPromises = config.knowledgeBases.map(kb =>
                fetch(kb.src)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} for ${kb.src}`);
                        return response.json();
                    })
                    .then(data => ({ ...kb, data }))
            );

            const loadedKBs = await Promise.all(fetchPromises);

            let kbString = '';
            loadedKBs.forEach((kb, index) => {
                // Format knowledge base content for the AI's system message.
                kbString += `--- KNOWLEDGE BASE ${index + 1} ---\n`;
                kbString += `DESCRIPTION: ${kb.description}\n`;
                kbString += `CONTENT:\n${JSON.stringify(kb.data, null, 2)}\n\n`;
            });
            knowledgeBaseContent = kbString;

            console.log("All knowledge bases loaded and combined successfully.");

        } catch (error) {
            console.error("Could not load one or more knowledge bases:", error);
            knowledgeBaseContent = "Error: Failed to load knowledge base content.";
        }
    }

    // Load knowledge bases as soon as the script executes.
    await loadKnowledgeBases();

    // --- HTML Structure & Injection ---
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'kv-chat-widget';

    // Apply custom colors to the widget using CSS variables.
    const primaryRgb = hexToRgb(config.style.primaryColor);
    const secondaryRgb = hexToRgb(config.style.secondaryColor);

    widgetContainer.style.setProperty('--kv-chat-primary-color', config.style.primaryColor);
    widgetContainer.style.setProperty('--kv-chat-secondary-color', config.style.secondaryColor);
    widgetContainer.style.setProperty('--kv-chat-background-color', config.style.backgroundColor);
    widgetContainer.style.setProperty('--kv-chat-font-color', config.style.fontColor);
    if (primaryRgb) {
        widgetContainer.style.setProperty('--kv-chat-primary-color-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    }
    if (secondaryRgb) {
        widgetContainer.style.setProperty('--kv-chat-secondary-color-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    }

    // Main chat container element.
    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-container${config.style.position === 'left' ? ' position-left' : ''}`;

    // Inner HTML for the chat container, including branding, welcome screen, and chat interface.
    chatContainer.innerHTML = `
        <div class="brand-header">
            ${config.branding.logo ? `<img src="${config.branding.logo}" alt="${config.branding.name}" onerror="this.style.display='none'">` : ''}
            <span>${config.branding.name}</span>
            <button class="close-button">&times;</button>
        </div>
        <div class="new-conversation">
            <h2 class="welcome-text">${config.branding.welcomeText}</h2>
            <button class="new-chat-btn">
                <svg class="message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
                Send us a message
            </button>
            <p class="response-text">${config.branding.responseTimeText || ''}</p>
        </div>
        <div class="chat-interface">
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Type your message here..." rows="1"></textarea>
                <button type="submit">Send</button>
            </div>
            <div class="chat-footer">
                ${config.branding.poweredBy.link ? `<a href="${config.branding.poweredBy.link}" target="_blank" rel="noopener noreferrer">${config.branding.poweredBy.text}</a>` : `<span>${config.branding.poweredBy.text}</span>`}
            </div>
        </div>
    `;

    // Toggle button to open/close the chat widget.
    const toggleButton = document.createElement('button');
    toggleButton.className = `chat-toggle${config.style.position === 'left' ? ' position-left' : ''}`;
    toggleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`;

    // Append the widget elements to the body of the document.
    document.body.appendChild(widgetContainer);
    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);

    // Get references to key DOM elements.
    const newChatBtn = chatContainer.querySelector('.new-chat-btn');
    const chatInterface = chatContainer.querySelector('.chat-interface');
    const messagesContainer = chatContainer.querySelector('.chat-messages');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button[type="submit"]');
    const welcomeScreen = chatContainer.querySelector('.new-conversation');
    const closeButtons = chatContainer.querySelectorAll('.close-button');

    // --- Supabase Save Single Message Function (for chat history logging) ---
    async function saveSingleMessage(convId, message) {
        if (!convId || !message) {
            console.error("Cannot save message without conversation ID or message object.");
            return;
        }

        const row = {
            conversation_id: convId,
            role: message.role,
            content: message.content
        };

        const response = await fetch(`${config.supabase.url}/rest/v1/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.supabase.key,
                'Authorization': `Bearer ${config.supabase.key}`,
                'Prefer': 'return=minimal' // Optimizes for minimal response from Supabase.
            },
            body: JSON.stringify(row)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase insertion error:', errorText);
        }
    }

    // --- Core Chat Functions ---

    // Converts raw text, including Markdown links and URLs, into HTML with clickable links.
    function linkify(text) {
        const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        let processedText = text.replace(markdownLinkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        // Handle standalone URLs not formatted as Markdown links.
        const standaloneUrlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        processedText = processedText.replace(standaloneUrlRegex, url => {
            // Prevent double-linking if already part of a Markdown link.
            if (processedText.includes(`href="${url}"`)) return url;
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        // Replace newlines with <br> for proper display.
        return processedText.replace(/\n/g, '<br>');
    }

    // Displays a message in the chat interface.
    function displayMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.innerHTML = (type === 'bot') ? linkify(content) : content.replace(/\n/g, '<br>');
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the latest message.
    }

    // Sends a message to the OpenAI API and handles the response.
    async function sendMessage(message) {
        if (!config.api.key) {
            displayMessage("API key is not configured.", "bot");
            return;
        }

        const userMessage = { role: 'user', content: message };
        displayMessage(message, 'user');
        conversationHistory.push(userMessage);
        await saveSingleMessage(conversationId, userMessage); // Save user message to Supabase.

        // Display typing indicator while waiting for bot's response.
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-message bot';
        typingIndicator.textContent = '...';
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // System message for the AI, providing instructions and knowledge base content.
        const systemMessage = {
            role: "system",
            content: `You are a helpful assistant for KV331 Audio. Keep your answers short and concise (1-2 sentences) unless asked for detail. Answer based *only* on the provided knowledge bases. Use the descriptions to find the right knowledge base. If the answer isn't in the knowledge bases, say you don't have that information. Format links as Markdown: [link text](url)\n\n${knowledgeBaseContent}`
        };

        try {
            // Make the API call to OpenAI.
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.api.key}`
                },
                body: JSON.stringify({
                    model: config.api.model,
                    messages: [systemMessage, ...conversationHistory] // Send history for context.
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API Error: ${errorData.error.message}`);
            }

            const data = await response.json();
            const botResponseText = data.choices[0].message.content.trim();

            messagesContainer.removeChild(typingIndicator); // Remove typing indicator.
            displayMessage(botResponseText, 'bot'); // Display bot's response.
            const botMessage = { role: 'assistant', content: botResponseText };
            conversationHistory.push(botMessage);
            await saveSingleMessage(conversationId, botMessage); // Save bot message to Supabase.

        } catch (error) {
            console.error('Error sending message to OpenAI:', error);
            messagesContainer.removeChild(typingIndicator);
            const errorMessageContent = 'Sorry, something went wrong.';
            displayMessage(errorMessageContent, 'bot');
            const errorMessage = { role: 'assistant', content: errorMessageContent };
            conversationHistory.push(errorMessage);
            await saveSingleMessage(conversationId, errorMessage); // Save error message to Supabase.
        }
    }

    // Initializes a new conversation, resetting history and generating a new ID.
    async function startNewConversation() {
        messagesContainer.innerHTML = ''; // Clear previous messages.
        conversationHistory = [];
        conversationId = Date.now().toString(); // Generate a unique ID for the new conversation.

        const welcomeMessageContent = config.branding.welcomeText;
        displayMessage(welcomeMessageContent, 'bot');
        const welcomeMessage = { role: 'assistant', content: welcomeMessageContent };
        conversationHistory.push(welcomeMessage);
        await saveSingleMessage(conversationId, welcomeMessage); // Save welcome message to Supabase.
    }

    // Handles sending messages when the send button is clicked or Enter is pressed.
    function handleSend() {
        const message = textarea.value.trim();
        if (message) sendMessage(message);
        textarea.value = ''; // Clear the input field.
        textarea.style.height = 'auto'; // Reset textarea height.
    }

    // --- Event Listeners ---

    // Send button click.
    sendButton.addEventListener('click', handleSend);

    // Enter key press in the textarea (without Shift key).
    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Adjust textarea height dynamically based on content.
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    // "Send us a message" button on the welcome screen.
    newChatBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden'); // Hide welcome screen.
        chatInterface.classList.add('active'); // Show chat interface.
        textarea.focus(); // Focus on the textarea.
        startNewConversation(); // Start a new conversation.
    });

    // Toggles the visibility of the chat window.
    function toggleChatWindow() {
        chatContainer.classList.toggle('open');
        toggleButton.classList.toggle('hide');
        if (chatContainer.classList.contains('open')) {
            // Reset chat state when the window is opened to start fresh.
            welcomeScreen.classList.remove('hidden');
            chatInterface.classList.remove('active');
            messagesContainer.innerHTML = '';
            conversationHistory = [];
            conversationId = null; // Clear conversation ID for a fresh start.
        }
    }

    // Event listener for the main toggle button.
    toggleButton.addEventListener('click', toggleChatWindow);

    // Event listeners for all close buttons inside the chat window.
    closeButtons.forEach(button => {
        button.addEventListener('click', toggleChatWindow);
    });

})();
