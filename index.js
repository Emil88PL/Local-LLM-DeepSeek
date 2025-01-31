const URL = 'http://127.0.0.1:11434/api/generate';

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

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        return result.response;
    } catch (error) {
        console.error('Error sending prompt to Ollama:', error);
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
        } else {
            console.error('Failed to load model');
            runButton.style.background = '#DC143C';
        }
    } catch (error) {
        console.error('Error loading model:', error);
        runButton.style.background = '#DC143C';
        runButton.setAttribute('data-tooltip', 'Make sure you running Ollama server');
    }
})

document.getElementById('send').addEventListener('click', async () => {
    const modelLlm = document.getElementById('llm').value;
    const input = document.getElementById('input').value;
    const output = document.getElementById('output');
    const thinkingOverlay = document.getElementById('thinking-overlay');
    const thinkPlaceholder = document.getElementById('think-placeholder');
    output.style.display = 'block';

    if (input) {
        // Show the thinking overlay
        thinkingOverlay.style.display = 'flex';

        // Send the prompt and wait for the response
        const response = await sendPromptToOllama(input, modelLlm, slider);

        // Hide the thinking overlay
        thinkingOverlay.style.display = 'none';

        if (response) {
            // Decode HTML-encoded characters (\u003c -> <, \u003e -> >, etc.)
            const decodedResponse = response.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

            // Use regex to find <think> tags and their content
            const thinkRegex = /<think>([\s\S]*?)<\/think>/;
            const thinkMatch = decodedResponse.match(thinkRegex);

            // Extract <think> content if it exists
            let thinkContent = thinkMatch ? thinkMatch[1].trim() : null;

            if (thinkContent) {
                thinkPlaceholder.style.display = 'block';
                // Manual formatting for Markdown-like syntax
                thinkContent = thinkContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold formatting
                    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>') // Code block formatting
                    .replace(/###\s?(.*?)(?=\n|$)/g, '<h3>$1</h3>'); // Heading level 3 formatting
                // Display <think> content in the think-placeholder div
                thinkPlaceholder.innerHTML = thinkContent;
            } else {
                // No <think> tags found
                thinkPlaceholder.style.display = 'block';
                thinkPlaceholder.textContent = 'No thoughts to display.';
            }

            // Remove <think> tags and their content from the response for the main output
            let restOfResponse = decodedResponse.replace(thinkRegex, '').trim();

            // Manual formatting for Markdown-like syntax in the main response
            restOfResponse = restOfResponse
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/###\s?(.*?)(?=\n|$)/g, '<h3>$1</h3>'); // Heading level 3 formatting

            // Display the rest of the response in the output div
            output.innerHTML += `<span class="myInput"">You: ${input}</span><br>Ollama: ${restOfResponse}<br><br>`;

            // Clear input and auto-scroll output
            document.getElementById('input').value = '';
            output.scrollTop = output.scrollHeight;

            console.log('Decoded Response:', decodedResponse); // For debugging
            console.log('Extracted <think> Content:', thinkContent); // For debugging
            console.log('Model: ' + modelLlm);
        }
    }
});

const initials = "© Emil";
const currentDate = new Date().toLocaleDateString();

document.getElementById('initialsDate').textContent = `${initials} | ${currentDate}`;