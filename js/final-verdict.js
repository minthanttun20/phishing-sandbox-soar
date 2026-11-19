// Node: "Final Verdict"  | Type: Code | Mode: Run Once for Each Item
// Scanners always override the AI. Node names referenced below must not be renamed:
// "Parse AI", "VirusTotal Result", "Analyze Result".

const ai = $('Parse AI').first().json;
const hasUrl = !!ai.extractedUrl;

let vtMal = 0, usMal = false, usScore = 0;
if (hasUrl) {
  try { vtMal = $('VirusTotal Result').first().json.data?.attributes?.stats?.malicious ?? 0; } catch (e) {}
  try {
    const us = $('Analyze Result').first().json;
    usMal = !!us.verdicts?.engines?.malicious;
    usScore = us.verdicts?.engines?.score ?? 0;
  } catch (e) {}
}

const authOk = /SPF=pass/.test(ai.authSummary || "") &&
               /DKIM=pass/.test(ai.authSummary || "") &&
               /DMARC=pass/.test(ai.authSummary || "");
const invalid = (ai.aiFlags || []).includes("invalid_ai_output");

// Optional: sender domains you trust. Only honored when DMARC passes.
const trusted = ["linkedin.com", "dbs.com", "dbs.com.sg", "hm.com"];
const fromAddr = (ai.from?.value?.[0]?.address || "").toLowerCase();
const fromDomain = fromAddr.split("@")[1] || "";
const isTrusted = trusted.some(d => fromDomain === d || fromDomain.endsWith("." + d));

let verdict = "safe";
const reasons = [];

if (vtMal >= 1 || usMal || usScore > 75) {
  verdict = "phishing";
  reasons.push(`URL flagged (VirusTotal malicious=${vtMal}, urlscan malicious=${usMal})`);
} else if (ai.aiVerdict === "scam" && ai.aiConfidence >= 0.8) {
  verdict = "phishing";
  reasons.push("AI: high-confidence scam");
} else if (invalid) {
  verdict = "suspicious";
  reasons.push("AI unavailable, needs review");
} else if (ai.aiVerdict === "scam") {
  verdict = "suspicious";
  reasons.push("AI: scam (low confidence)");
} else if (ai.aiVerdict === "suspicious" && ai.aiConfidence >= 0.7 && !(authOk && isTrusted)) {
  verdict = "suspicious";
  reasons.push("AI: suspicious");
}

return {
  id: ai.id,
  threadId: ai.threadId,
  subject: ai.subject,
  verdict,
  reasons,
  aiVerdict: ai.aiVerdict,
  aiConfidence: ai.aiConfidence,
  aiReason: ai.aiReason,
  aiFlags: ai.aiFlags,
  vtMal,
  usMal
};