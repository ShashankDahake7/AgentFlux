const logos = {
    google: "https://cloudonair.withgoogle.com/api/assets?path=/gs/gweb-gc-gather-production.appspot.com/files/AFiumC5HS17acVQUTkwzerfEucSVvRMinXGOqC97Dtg5fREwhUful4BC97FFW2yEBLn9NPSd-7o.k0guz5CS4xZQu6H2",
    openai: "https://mir-s3-cdn-cf.behance.net/project_modules/fs/e50214173218977.648c4882a75d6.gif",
    deepseek: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYpzFp7T95S6gDEFYMor4BT_eRZpVYx43HjacHa6Uc6Jmsond15fa32s0XzKEpBqSwUcU&usqp=CAU",
    mistral: "https://logosandtypes.com/wp-content/uploads/2025/02/mistral-ai.svg",
    qwen: "https://i.namu.wiki/i/eNiAyEuBeEyN7lOJGFdl0yhPhzwYlirqWYU1_tSVOkPrNKv65zvqvQxh-hYzCNREUMnLlZytk8JEcHvYEEdVLcIFgCgo9QSd7h40vyy9ruW3XZE0ocz1O-FX6cuI7iJuJkXf58CaumvTVZn8E11ZKg.webp"
};

const companies = {
    google: "Google",
    openai: "OpenAI",
    deepseek: "DeepSeek AI",
    mistral: "Mistral AI",
    qwen: "Qwen"
};

const gradients = {
    google: {
        selected: "bg-gradient-to-r from-green-400 to-blue-500",
        default: "bg-gradient-to-r from-green-600 to-blue-700"
    },
    openai: {
        selected: "bg-gradient-to-r from-purple-400 to-pink-500",
        default: "bg-gradient-to-r from-purple-600 to-pink-700"
    },
    deepseek: {
        selected: "bg-gradient-to-r from-red-400 to-yellow-500",
        default: "bg-gradient-to-r from-red-600 to-yellow-700"
    },
    mistral: {
        selected: "bg-gradient-to-r from-indigo-400 to-purple-500",
        default: "bg-gradient-to-r from-indigo-600 to-purple-700"
    },
    qwen: {
        selected: "bg-gradient-to-r from-sky-600 to-indigo-700",
        default: "bg-gradient-to-r from-sky-500 to-indigo-500"
    }
};

const motherModels = [
    "gemini",
    "chat-bison",
    "text-bison",
    "embedding-gecko",
    "learnlm",
    "gemma",
    "imagen",
    "aqa"
];

function googlegenerateTags(id: string): string[] {
    const base = id.toLowerCase();
    const tags = [];

    if (base.includes("gemini")) tags.push("gemini");
    if (base.includes("flash")) tags.push("flash");
    if (base.includes("pro")) tags.push("pro");
    if (base.includes("vision")) tags.push("vision", "multimodal");
    if (base.includes("embedding")) tags.push("embedding");
    if (base.includes("bison")) tags.push("bison", "language");
    if (base.includes("learnlm")) tags.push("learnlm", "experimental");
    if (base.includes("gemma")) tags.push("gemma", "instruction", "small");
    if (base.includes("imagen")) tags.push("image-generation");
    if (base.includes("aqa")) tags.push("qa", "agent");
    if (base.includes("preview") || base.includes("exp")) tags.push("experimental");

    return [...new Set(tags)];
}



export const modellist = [
    {
        id: "deepseek-r1",
        name: "DeepSeek-R1",
        company: companies.deepseek,
        tags: ["search", "distillation", "ai"],
        gradients: gradients.deepseek,
        logo: logos.deepseek
    },
    {
        id: "gemini-2.5-pro-exp-03-25",
        name: "Gemini 2.5 Pro Exp-03-25",
        company: companies.google,
        tags: ["gemini", "pro", "experimental", "vision", "multimodal"],
        gradients: gradients.google,
        logo: logos.google
    },
    {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        company: companies.google,
        tags: ["gemini", "flash", "ai", "speed"],
        gradients: gradients.google,
        logo: logos.google
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        company: companies.google,
        tags: ["gemini", "flash", "ai"],
        gradients: gradients.google,
        logo: logos.google
    },
    {
        id: "openai-gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        company: companies.openai,
        tags: ["chatbot", "turbo", "openai"],
        gradients: gradients.openai,
        logo: logos.openai
    },
    {
        id: "openai-gpt-4",
        name: "GPT-4",
        company: companies.openai,
        tags: ["chatbot", "gpt4", "openai", "general"],
        gradients: gradients.openai,
        logo: logos.openai
    },
    {
        id: "qwen/Qwen3-235B-A22B",
        name: "Qwen3-235B-A22B",
        company: companies.qwen,
        tags: ["qwen", "reasoning", "large"],
        gradients: gradients.qwen,
        logo: logos.qwen
    },
    {
        id: "mistralai/Mistral-7B-Instruct-v0.3",
        name: "Mistral-7B-Instruct-v0.3",
        company: companies.mistral,
        tags: ["mistral", "instruction", "compact"],
        gradients: gradients.mistral,
        logo: logos.mistral
    },
    {
        id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
        name: "DeepSeek Distill",
        company: companies.deepseek,
        tags: ["distill", "qwen", "efficiency"],
        gradients: gradients.deepseek,
        logo: logos.deepseek
    },

    // 🆕 Google Models (auto-tagged)
    ...[
        "chat-bison-001",
        "text-bison-001",
        "embedding-gecko-001",
        "gemini-1.0-pro-vision-latest",
        "gemini-pro-vision",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro-001",
        "gemini-1.5-pro-002",
        "gemini-1.5-pro",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-001-tuning",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash-8b-001",
        "gemini-1.5-flash-8b-latest",
        "gemini-1.5-flash-8b-exp-0827",
        "gemini-1.5-flash-8b-exp-0924",
        "gemini-2.5-pro-preview-03-25",
        "gemini-2.5-flash-preview-04-17",
        "gemini-2.5-flash-preview-04-17-thinking",
        "gemini-2.5-pro-preview-05-06",
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash-001",
        "gemini-2.0-flash-exp-image-generation",
        "gemini-2.0-flash-lite-001",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-preview-image-generation",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-flash-lite-preview",
        "gemini-2.0-pro-exp",
        "gemini-2.0-pro-exp-02-05",
        "gemini-exp-1206",
        "gemini-2.0-flash-thinking-exp-01-21",
        "gemini-2.0-flash-thinking-exp",
        "gemini-2.0-flash-thinking-exp-1219",
        "learnlm-1.5-pro-experimental",
        "learnlm-2.0-flash-experimental",
        "gemma-3-1b-it",
        "gemma-3-4b-it",
        "gemma-3-12b-it",
        "gemma-3-27b-it",
        "embedding-001",
        "text-embedding-004",
        "gemini-embedding-exp-03-07",
        "gemini-embedding-exp",
        "aqa",
        "imagen-3.0-generate-002",
        "gemini-2.0-flash-live-001"
    ].map(id => ({
        id,
        name: id.replace(/models\//, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        company: companies.google,
        tags: googlegenerateTags(id),
        gradients: gradients.google,
        logo: logos.google
    }))
];
