// Example utility for risk analysis
export function analyzeRisk(documentText: string): { risk: string; details: string } {
  // Dummy logic: look for words like "danger", "fraud", etc.
  const lower = documentText.toLowerCase();
  if (lower.includes("danger") || lower.includes("fraud")) {
    return { risk: "high", details: "Potential risk keywords found." };
  }
  return { risk: "low", details: "No obvious risk keywords detected." };
}