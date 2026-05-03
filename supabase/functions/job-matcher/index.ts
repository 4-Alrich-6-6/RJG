import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // MUST be first — before any await or req.json()
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only allow POST beyond this point
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { jobs, userSummary } = body;
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    if (!Array.isArray(jobs) || !userSummary) throw new Error("Missing jobs or userSummary");

    const jobList = jobs.map((job: any, i: number) => [
      `[${i + 1}] ID: ${job.id}`,
      `Title: ${job.title}`,
      `Skills required: ${(job.skills || []).join(", ") || "Not specified"}`,
      `Location: ${job.location || "Not specified"}`,
      `Type: ${job.type || ""} | Schedule: ${job.schedule || ""}`,
      `Description: ${(job.description || "").slice(0, 300)}`,
    ].join("\n")).join("\n\n---\n\n");

    const systemPrompt = `You are an expert job-matching AI for Ready-Job-Go, a Philippine job platform. Score how well the candidate matches each job on a scale of 0-100. Respond ONLY with a valid JSON array. No markdown, no explanation. Example: [{"id":"abc-123","aiScore":87}]`;

    const userPrompt = `CANDIDATE PROFILE:\n${userSummary}\n\n---\n\nJOBS TO SCORE:\n\n${jobList}\n\nReturn a JSON array with "id" (string) and "aiScore" (integer 0-100) per job.`;

    const geminiRes = await fetch(`${GEMINI_API}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error(`Gemini error ${geminiRes.status}: ${err}`);
    }

    const data   = await geminiRes.json();
    const raw    = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(raw.replace(/```json|```/gi, "").trim());

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});