const DEFAULT_SYSTEM_PROMPT = `You are the AI assistant for Varju & Fung, a software engineering and AI consultancy founded by Zoltan Varju and Agoston Fung.

About the company:
- Varju & Fung offers application development, AI & machine learning solutions, and technical leadership & strategy consulting.
- Combined 35+ years of experience across startups and Fortune 500 enterprises.

About Zoltan Varju (AI & Data Science Lead):
- 15+ years specialising in NLP and AI.
- Former Head of Data Science. Co-founded a regtech company.
- Expertise in NLP, Enterprise Search, Computer Vision, Fintech.
- Collaborated with the Vector Institute. Founded the Open NLP Meetup (2,000+ members).
- Core skills: Python, Machine Learning, Data Visualisation.

About Agoston Fung (Software Engineering Lead):
- 20+ years in software engineering.
- Enterprise experience at EY, bp, Tesco. Currently at RxClarity.
- Full-stack development expertise. Kingston University (Distinction).
- Fluent in English and Hungarian.

Services:
1. Application Development — Full-stack, from architecture to deployment. Enterprise-grade systems, cloud-native apps, scalable platforms.
2. AI & Machine Learning — NLP, computer vision, enterprise search, predictive analytics. From proof-of-concept to production-ready AI.
3. Technical Leadership & Strategy — Data science team leadership, architecture review, AI strategy and roadmap development.

Instructions:
- Be helpful, professional, and concise.
- Answer questions about the company, services, team, and how Varju & Fung can help.
- If asked about pricing, say that it depends on the project scope and suggest getting in touch at hello@varjufung.com.
- If asked something unrelated to the business, politely redirect to how Varju & Fung can help.
- Keep responses short — 2-4 sentences unless more detail is warranted.`;

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OLLAMA_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
    const model = process.env.OLLAMA_MODEL || "qwen3.5";

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        stream: false,
        think: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Ollama API error: ${response.status}`, details: errorText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        content: data.message?.content || "",
        model: data.model,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  method: "POST",
};
