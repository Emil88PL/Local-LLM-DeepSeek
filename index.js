const URL = 'http://127.0.0.1:11434/api/generate';
const sendButton = document.getElementById('send');
async function sendPromptToOllama(prompt, modelLlm, temp) {
    const url = URL;
    const data = {
        model: 'deepseek-r1:' + modelLlm,
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
runButton.addEventListener('click', async function() {
    const modelLlm = document.getElementById('llm').value;
    const url = URL;
    const data = {
        model: 'deepseek-r1:' + modelLlm,
        prompt: '',
        stream: false,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            console.log('Model loaded successfully ' + modelLlm);
            runButton.style.background = '#4CAF50';
            runButton.setAttribute('data-tooltip', 'Model Loaded');
            runButton.innerText = 'Model Loaded';
        } else {
            console.error('Failed to load model');
            runButton.style.background = '#DC143C';
            runButton.innerText = 'Error loading';
        }
    } catch (error) {
        console.error('Error loading model:', error);
        runButton.style.background = '#DC143C';
        runButton.setAttribute('data-tooltip', 'Make sure you are running Ollama server');
        runButton.innerText = 'Error loading';
    }
})

document.getElementById('send').addEventListener('click', async () => {
    const modelLlm = document.getElementById('llm').value;
    const input = document.getElementById('input').value;
    const output = document.getElementById('output');
    const thinkingOverlay = document.getElementById('thinking-overlay');
    const thinkPlaceholder = document.getElementById('think-placeholder');
    const sendButton = document.getElementById('send');

    if (input) {
        thinkingOverlay.style.display = 'flex';

        // Simulated response for demo (replace with your real response)
        const response = await sendPromptToOllama(input, modelLlm, slider);

        thinkingOverlay.style.display = 'none';

        if (response) {
            const decodedResponse = response.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
            const thinkRegex = /<think>([\s\S]*?)<\/think>/;
            const thinkMatch = decodedResponse.match(thinkRegex);
            let thinkContent = thinkMatch ? thinkMatch[1].trim() : null;

            if (thinkContent) {
                output.style.display = 'block';
                thinkPlaceholder.style.display = 'block';
                thinkContent = thinkContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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

            // Display chat in output
            output.innerHTML += `<span class="myInput">You: ${input}</span><br>Ollama: ${restOfResponse}<br><br>`;
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
            savedChats.push({ timestamp: currentTime, message: restOfResponse });
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

    savedChats.forEach((chat, index) => {
        const chatItemContainer = document.createElement('div');
        chatItemContainer.classList.add('chat-item-container');

        const chatItem = document.createElement('p');
        chatItem.textContent = chat.timestamp;
        chatItem.style.cursor = 'pointer';
        chatItem.classList.add('chat-timestamp');

        // Show full chat when clicked
        chatItem.addEventListener('click', () => {
            const inputField = document.getElementById('input');
            // Set the value instead of innerHTML
            inputField.value = chat.message;
        });

        // Create delete icon
        const deleteIcon = document.createElement('span');
        deleteIcon.textContent = '🗑️';
        deleteIcon.style.cursor = 'pointer';
        deleteIcon.style.marginLeft = '10px';
        deleteIcon.title = 'Delete chat';

        // Delete functionality
        deleteIcon.addEventListener('click', () => {
            savedChats.splice(index, 1);
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
    document.getElementById('input').value = '';
    displayChatList();
});