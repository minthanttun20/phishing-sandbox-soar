// Node: "Parse AI"  | Type: Code | Mode: Run Once for Each Item
// Reads the Gemini output, validates it, and fails safe to "suspicious".

const raw =
  $json.content?.parts?.[0]?.text ??
  $json.candidates?.[0]?.content?.parts?.[0]?.text ??
  $json.output?.[0]?.content?.[0]?.text ??
  $json.message?.content ??
  $json.text;

let ai = null;
try {
  if (raw && typeof raw === "object") {
    ai = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    ai = JSON.parse(match ? match[0] : cleaned);
  }
} catch (e) {
  ai = null;
}

const verdict = String(ai?.verdict || "").toLowerCase();
if (!["scam", "suspicious", "legit"].includes(verdict)) {
  ai = {
    verdict: "suspicious",
    confidence: 0,
    red_flags: ["invalid_ai_output"],
    reason: "AI did not return a valid verdict"
  };
} else {
  ai.verdict = verdict;
  ai.confidence = Math.min(1, Math.max(0, Number(ai.confidence) || 0));
  ai.red_flags = Array.isArray(ai.red_flags) ? ai.red_flags : [];
  ai.reason = String(ai.reason || "");
}

// The node name must stay exactly "Prepare Email"
const prep = $('Prepare Email').item.json;
return {
  ...prep,
  aiVerdict: ai.verdict,
  aiConfidence: ai.confidence,
  aiFlags: ai.red_flags,
  aiReason: ai.reason
};