export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmConfig = {
  apiKey?: string;
  provider?: "anthropic" | "openrouter" | "gemini";
};

export async function callLlm(
  systemPrompt: string,
  userPrompt: string,
  config: LlmConfig = {},
): Promise<string> {
  let apiKey = config.apiKey;
  let provider = config.provider;

  if (!apiKey) {
    if (process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
      provider = provider || "gemini";
    } else if (process.env.ANTHROPIC_API_KEY) {
      apiKey = process.env.ANTHROPIC_API_KEY;
      provider = provider || "anthropic";
    } else if (process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
      provider = provider || "openrouter";
    }
  }

  if (!apiKey) {
    throw new Error(
      "AI API Key não configurada. Adicione GEMINI_API_KEY, ANTHROPIC_API_KEY ou OPENROUTER_API_KEY nas variáveis de ambiente.",
    );
  }

  // Clean key in case of surrounding whitespace or quotes
  apiKey = apiKey.trim().replace(/^["']|["']$/g, "");

  // Determine provider if not set
  if (!provider) {
    if (apiKey.startsWith("AIza")) {
      provider = "gemini";
    } else if (apiKey.startsWith("sk-ant-")) {
      provider = "anthropic";
    } else if (apiKey.startsWith("sk-or-") || apiKey.includes("openrouter")) {
      provider = "openrouter";
    } else {
      if (process.env.GEMINI_API_KEY === apiKey) {
        provider = "gemini";
      } else if (process.env.ANTHROPIC_API_KEY === apiKey) {
        provider = "anthropic";
      } else {
        provider = "openrouter";
      }
    }
  }

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    return data.content?.[0]?.text ?? "";
  }

  if (provider === "openrouter") {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://panobianco.dashboard",
          "X-Title": "Panobianco Dashboard",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  // Gemini provider logic with model fallback
  const primaryModel = "gemini-3.6-flash";
  const fallbackModel = "gemini-2.5-flash";

  const tryCallGemini = async (model: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nUser Prompt:\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });
  };

  let response = await tryCallGemini(primaryModel);
  if (!response.ok && (response.status === 404 || response.status === 400)) {
    // If primary model name isn't recognized by Google AI Studio API, retry with fallback model
    response = await tryCallGemini(fallbackModel);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  // Remove markdown code blocks if present (e.g. ```json ... ``` or ``` ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
  }
  return JSON.parse(cleaned.trim());
}
