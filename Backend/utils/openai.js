// openai.js
import "dotenv/config";

/**
 * getOpenAIAPIResponse
 * - Uses OpenRouter's chat completions endpoint to call
 *   model: "google/gemma-3n-e4b-it:free"
 *
 * Requirements:
 * - set process.env.OPENROUTER_API_KEY to your OpenRouter API key
 *
 * Docs reference: OpenRouter chat completions endpoint.
 */

const getOpenAIAPIResponse = async (message) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY in environment variables.");
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";

  const body = {
    model: "google/gemma-3n-e4b-it:free",
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
    // optional: adjust temperature, max_tokens etc. if you want:
    // temperature: 0.7,
    // max_tokens: 512,
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // Optional OpenRouter headers (for leaderboard / referer): HTTP-Referer, X-Title
      // "HTTP-Referer": "<YOUR_SITE_URL>",
      // "X-Title": "<YOUR_SITE_NAME>",
    },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // try to surface any useful error info
      const errText = await response.text();
      console.error("OpenRouter API error:", response.status, errText);
      throw new Error(
        `OpenRouter API returned status ${response.status}: ${errText}`
      );
    }

    const data = await response.json();

    // OpenRouter follows OpenAI-compatible response format for chat completions.
    // Safely extract the assistant reply if available.
    if (
      data &&
      Array.isArray(data.choices) &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
    ) {
      return data.choices[0].message.content;
    }

    // Some providers may return a different shape — try a couple of fallbacks:
    if (data && data.choices && data.choices[0] && data.choices[0].text) {
      return data.choices[0].text;
    }

    // If nothing found, return a safe fallback string and log the raw response.
    console.warn("Unexpected OpenRouter response shape:", JSON.stringify(data));
    return "Sorry, I couldn't get a response from the model.";
  } catch (err) {
    console.error("Error while calling OpenRouter API:", err);
    // rethrow so caller (router) can handle it and return 500
    throw err;
  }
};

export default getOpenAIAPIResponse;
