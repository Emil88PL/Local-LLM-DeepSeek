const URL = 'http://127.0.0.1:11434/api/generate';
const sendButton = document.getElementById('send');
let conversationHistory = [];

async function sendPromptToOllama(prompt, modelLlm, temp) {
    const url = URL;
    const data = {
        model: modelLlm,
        prompt: prompt,
        stream: false,
        "options": {
            "temperature": parseFloat(temp)
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        sendButton.style.background = '#4CAF50';
        sendButton.removeAttribute('data-tooltip');
        sendButton.classList.remove('custom-tooltip');
        runButton.setAttribute('data-tooltip', 'Model Loaded');
        runButton.style.background = '#4CAF50';
        runButton.innerText = 'Model Loaded';
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        return result.response;
    } catch (error) {
        console.error('Error sending prompt to Ollama:', error);
        sendButton.style.background = '#DC143C';
        sendButton.setAttribute('data-tooltip', 'Make sure you are running Ollama server');
        sendButton.classList.add('custom-tooltip');
    }
}

const slider = document.querySelector('input[type="range"]');
const sliderOutput = document.getElementById('creativityValue');

slider.addEventListener('input', function() {
    sliderOutput.textContent = this.value;
    console.log(sliderOutput.textContent);
});

const runButton = document.getElementById('runButton');
let isFetching = false;

runButton.addEventListener('click', async function() {
    isFetching = true;
    const modelLlm = document.getElementById('llm').value;
    const url = URL;
    const data = {
        model: modelLlm,
        prompt: '',
        stream: false,
    };

    try {
        runButton.classList.add('loading');
        runButton.style.background = '#FFFFFF33';
        runButton.innerText = 'Loading...';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            runButton.classList.remove('loading');
            runButton.style.background = '#4CAF50';
            runButton.setAttribute('data-tooltip', 'Model Loaded');
            runButton.innerText = 'Model Loaded';
        } else {
            runButton.classList.remove('loading');
            runButton.style.background = '#DC143C';
            runButton.setAttribute('data-tooltip', 'Error loading');
            runButton.innerText = 'Error loading';
        }
    } catch (error) {
        runButton.classList.remove('loading');
        runButton.style.background = '#DC143C';
        runButton.setAttribute('data-tooltip', 'Make sure you are running Ollama server');
        runButton.innerText = 'Error loading';
    }

    isFetching = false;
});

document.getElementById('send').addEventListener('click', async () => {
    const modelLlm = document.getElementById('llm').value;
    const currentInput = document.getElementById('input').value;
    const output = document.getElementById('output');
    const thinkingOverlay = document.getElementById('thinking-overlay');
    const thinkPlaceholder = document.getElementById('think-placeholder');
    const sendButton = document.getElementById('send');

    if (currentInput) {
        thinkingOverlay.style.display = 'flex';

        // 2. Prepare the prompt by prepending the existing conversation history
        let promptWithHistory = "";
        conversationHistory.forEach(turn => {
            // Format: "User: [content]\nAssistant: [content]\n"
            promptWithHistory += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}\n`;
        });
        promptWithHistory += `User: ${currentInput}`; // Add the current user input

        // Use the prompt with history instead of just the current input
        const response = await sendPromptToOllama(promptWithHistory, modelLlm, slider);

        thinkingOverlay.style.display = 'none';

        if (response) {
            const decodedResponse = response.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
            const thinkRegex = /([\s\S]*?)<\/think>/;
            const thinkMatch = decodedResponse.match(thinkRegex);
            let thinkContent = thinkMatch ? thinkMatch[1].trim() : null;

            if (thinkContent) {
                output.style.display = 'block';
                thinkPlaceholder.style.display = 'block';
                thinkContent = thinkContent
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                    .replace(/###\s?(.*?)(?=\n|$)/g, '<h3>$1</h3>');
                thinkPlaceholder.innerHTML = thinkContent;
            } else {
                thinkPlaceholder.style.display = 'block';
                output.style.display = 'block';
                thinkPlaceholder.textContent = 'No thoughts to display.';
            }

            let restOfResponse = decodedResponse.replace(thinkRegex, '').trim();

            restOfResponse = restOfResponse
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/###\s?(.*?)(?=\n|$)/g, '<h3>$1</h3>');

            // Store the AI's message *before* any HTML display formatting for future prompts
            let aiResponseMessage = decodedResponse.replace(thinkRegex, '').trim();

            // 3. Update conversation history with the current turn
            conversationHistory.push({ role: 'user', content: currentInput });
            conversationHistory.push({ role: 'assistant', content: aiResponseMessage });

            // Display chat in output
            output.innerHTML += `<div><strong>You:</strong> ${currentInput}</div><div><strong>Ollama:</strong> ${restOfResponse}</div><br>`;

            document.getElementById('input').value = '';

            // Ensure localStorage data is an array
            let savedChats = [];
            try {
                savedChats = JSON.parse(localStorage.getItem('DeepSeek')) || [];
                if (!Array.isArray(savedChats)) savedChats = [];
            } catch (e) {
                console.error('Error parsing localStorage:', e);
                savedChats = [];
            }

            const currentTime = new Date().toLocaleString();
            savedChats.push({
                timestamp: currentTime,
                question: currentInput,
                model: modelLlm,
                message: aiResponseMessage // Store the raw response without HTML formatting
            });
            localStorage.setItem('DeepSeek', JSON.stringify(savedChats));

            displayChatList();
        }
    } else {
        sendButton.style.background = '#DC143C';
        sendButton.setAttribute('data-tooltip', 'Type the message first');
        sendButton.classList.add('custom-tooltip');
    }
});

function displayChatList() {
    const previousChatP = document.getElementById('previousChatP');
    previousChatP.innerHTML = ''; // Clear previous list
    const savedChats = JSON.parse(localStorage.getItem('DeepSeek')) || [];

    if (savedChats.length === 0) {
        previousChatP.innerHTML = '<p>No previous chats available.</p>';
        return;
    }

    // Iterate over a reversed copy of savedChats so the most recent chat shows first.
    savedChats.slice().reverse().forEach((chat, reversedIndex) => {
        // Calculate the original index in the savedChats array
        const originalIndex = savedChats.length - 1 - reversedIndex;

        const chatItemContainer = document.createElement('div');
        chatItemContainer.classList.add('chat-item-container');

        const chatItem = document.createElement('p');
        chatItem.textContent = chat.timestamp;
        chatItem.style.cursor = 'pointer';
        chatItem.classList.add('chat-timestamp');

        // Show full chat when clicked by loading its content into the textarea
        chatItem.addEventListener('click', () => {
            const inputField = document.getElementById('input');
            inputField.value = chat.question + "\t\t model: " + chat.model + "\n\n" + chat.message;
        });

        // Create delete icon
        const deleteIcon = document.createElement('span');
        deleteIcon.textContent = '🗑️';
        deleteIcon.style.cursor = 'pointer';
        deleteIcon.style.marginLeft = '10px';
        deleteIcon.title = 'Delete chat';

        // Delete functionality
        deleteIcon.addEventListener('click', () => {
            savedChats.splice(originalIndex, 1); // Remove the correct chat
            localStorage.setItem('DeepSeek', JSON.stringify(savedChats));
            document.getElementById('input').value = '';
            displayChatList();
        });

        // Append chat item and delete icon
        chatItemContainer.appendChild(chatItem);
        chatItemContainer.appendChild(deleteIcon);
        previousChatP.appendChild(chatItemContainer);
    });
}


// Display initials and date
const initials = "© Emil";
const currentDate = new Date().toLocaleDateString();
document.getElementById('initialsDate').textContent = `${initials} | ${currentDate}`;

// Toggle button setup for the chat history
document.addEventListener('DOMContentLoaded', () => {
    displayChatList(); // Render chat list on page load

    const previousChatDiv = document.querySelector('.previousChatDiv');
    const toggleBtn = document.createElement('div');
    toggleBtn.classList.add('toggle-btn');
    toggleBtn.textContent = '►';
    previousChatDiv.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => {
        previousChatDiv.classList.toggle('collapsed');
        toggleBtn.textContent = previousChatDiv.classList.contains('collapsed') ? '►' : '◄';
    });
});


// Clear the textarea when the broom icon is clicked
document.querySelector('.broom').addEventListener('click', () => {
    // Clear the input field
    document.getElementById('input').value = '';

    // Clear conversation history
    conversationHistory = [];

    // Clear the visual output
    const output = document.getElementById('output');
    const thinkPlaceholder = document.getElementById('think-placeholder');

    output.innerHTML = '';
    thinkPlaceholder.innerHTML = '';
    thinkPlaceholder.style.display = 'none';
    output.style.display = 'none';

    // Refresh the chat list display
    displayChatList();
});


let synth = window.speechSynthesis;
let utterance;

// function getTextFromXPath(xpath) {
//     let result = document.evaluate(xpath, document, null, XPathResult.STRING_TYPE, null);
//     return result.stringValue;
// }

function speakText() {
    if (!('speechSynthesis' in window)) {
        console.error("Your browser does not support text-to-speech!");
        return;
    }

    const speakFrom = document.getElementById('speakFrom').value; // Get selected option
    const volume = parseFloat(document.getElementById('volume').value);

    let text = "";
    if (speakFrom === "input") {
        text = document.getElementById('input').value.trim();
    } else if (speakFrom === "output") {
        text = document.getElementById('output').innerText.trim();
    } else if (speakFrom === "think-placeholder") {
        text = document.getElementById('think-placeholder').innerText.trim();
    }

    if (!text) {
        console.error(`No text found in the selected option (${speakFrom})!`);
        return;
    }

    const voices = synth.getVoices();
    let selectedVoice = voices.find(voice =>
        voice.lang === 'en-GB' && voice.name.toLowerCase().includes('female'));

    if (!selectedVoice) {
        console.warn("British female voice not found, using default voice.");
        selectedVoice = voices[0];
    }

    // Split long text into smaller chunks
    const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
    let index = 0;

    function speakNext() {
        if (index < sentences.length) {
            let utterance = new SpeechSynthesisUtterance(sentences[index].trim());
            utterance.voice = selectedVoice;
            utterance.pitch = 1;
            utterance.rate = 1;
            utterance.volume = volume;

            utterance.onend = function () {
                index++;
                speakNext(); // Speak next chunk
            };

            synth.speak(utterance);
        }
    }

    speakNext(); // Start speaking
}




function pauseText() {
    if (synth.speaking && !synth.paused) {
        synth.pause();
        console.log('paused');
    }
}

function resumeText() {
    if (synth.paused) {
        synth.resume();
        console.log('paused');
    }
}

function stopText() {
    if (synth.speaking) {
        synth.cancel();
        console.log('stopped');
    }
}

// Ensure the voices are loaded before accessing them
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Speech synthesis started');
        // This ensures that voices are loaded and ready
    };
}