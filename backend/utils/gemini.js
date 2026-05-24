const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeWithAI(scanResults) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const findingsSummary = scanResults.findings
      .filter(f => f.status === 'FAIL')
      .map(f => `- [${f.severity}] ${f.check}: ${f.detail}`)
      .join('\n');

    const prompt = `
You are a senior application security engineer. Analyze these vulnerability scan results for ${scanResults.url} and provide a professional security report.

SCAN FINDINGS:
${findingsSummary || 'No vulnerabilities found.'}

SUMMARY: Total checks: ${scanResults.summary.total}, High: ${scanResults.summary.high}, Medium: ${scanResults.summary.medium}, Low: ${scanResults.summary.low}

Provide your response in this exact JSON format:
{
  "risk_level": "CRITICAL or HIGH or MEDIUM or LOW",
  "executive_summary": "2-3 sentence summary for non-technical stakeholders",
  "top_risks": [
    {"risk": "risk name", "impact": "what could happen", "fix": "how to fix it"}
  ],
  "quick_wins": ["immediate action 1", "immediate action 2"],
  "overall_score": "security score out of 100"
}

Return only valid JSON, no markdown, no extra text.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Clean and parse JSON
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.error('Gemini AI error:', err.message);
    return {
      risk_level: 'UNKNOWN',
      executive_summary: 'AI analysis unavailable. Please review findings manually.',
      top_risks: [],
      quick_wins: [],
      overall_score: 'N/A'
    };
  }
}

module.exports = { analyzeWithAI };