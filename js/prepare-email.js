// Node: "Prepare Email"  | Type: Code | Mode: Run Once for Each Item
const html = $json.html || "";
const text = $json.text || "";
const snippet = $json.snippet || "";

// Readable text from the HTML part
const htmlText = html
  .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&zwnj;|&#\d+;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// Use the longest source, because the plain-text part is sometimes a stub
const candidates = [htmlText, text, snippet].filter(Boolean);
const body = (candidates.sort((a, b) => b.length - a.length)[0] || "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 4000);

// Real links only (no images, CSS, schema)
const hrefs = [...html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(m => m[1]);
const plain = (text + " " + snippet).match(/https?:\/\/[^\s<>"')]+/g) || [];
const junk = /\.(png|jpe?g|gif|svg|css|woff2?)(\?|$)|w3\.org|schema\.org/i;
const urls = [...new Set([...hrefs, ...plain])].filter(u => !junk.test(u));

// SPF / DKIM / DMARC summary
const auth = $json.headers?.["authentication-results"] || "";
const pick = k => (auth.match(new RegExp(k + "=(\\w+)", "i")) || [])[1] || "none";
const authSummary = `SPF=${pick("spf")}, DKIM=${pick("dkim")}, DMARC=${pick("dmarc")}`;

return {
  ...$json,
  cleanBody: body,
  urls,
  extractedUrl: urls.length ? encodeURI(urls[0]) : "",
  authSummary
};