async function sendPromptToOllama(prompt, modelLlm) {
    const url = 'http://127.0.0.1:11434/api/generate';
    const data = {
        model: 'deepseek-r1:' + modelLlm,
        prompt: prompt,
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
        const response = await sendPromptToOllama(input, modelLlm);

        // Hide the thinking overlay
        thinkingOverlay.style.display = 'none';

        if (response) {
            // Decode HTML-encoded characters (\u003c -> <, \u003e -> >, etc.)
            const decodedResponse = response.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

            // Use regex to find <think> tags and their content
            const thinkRegex = /<think>([\s\S]*?)<\/think>/;
            const thinkMatch = decodedResponse.match(thinkRegex);

            // Extract <think> content if it exists
            const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;

            if (thinkContent) {
                // Display <think> content in the think-placeholder div
                thinkPlaceholder.textContent = thinkContent;
            } else {
                // No <think> tags found
                thinkPlaceholder.textContent = 'No thoughts to display.';
            }

            // Remove <think> tags and their content from the response for the main output
            const restOfResponse = decodedResponse.replace(thinkRegex, '').trim();

            // Display the rest of the response in the output div
            output.textContent += `You: ${input}\nOllama: ${restOfResponse}\n\n`;

            // Clear input and auto-scroll output
            document.getElementById('input').value = '';
            output.scrollTop = output.scrollHeight;

            console.log('Decoded Response:', decodedResponse); // For debugging
            console.log('Extracted <think> Content:', thinkContent); // For debugging
        }
    }
});