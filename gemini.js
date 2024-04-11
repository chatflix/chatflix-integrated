const fetch = require('node-fetch');

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

async function callGeminiAPI(prompt) {
  const requestBody = {
    prompt: {
      text: prompt,
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  return data
}

const prompt = 'Write a short story about a cat who goes on an adventure.';

callGeminiAPI(prompt).then((output) => {
  console.log(output);
});
