require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// --- Configuration ---
const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 10;
const MAX_RETRIES = 5;
const VALID_CATEGORIES = new Set([
  "global-development",
  "economics",
  "energy-environment",
  "technology",
  "public-health",
  "infrastructure",
  "science",
  "demographics",
  "animal-welfare",
  "ai-and-ai-safety",
]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

// --- Helpers ---

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadSystemPrompt() {
  const promptPath = path.join(__dirname, "prompt-template.txt");
  if (!fs.existsSync(promptPath)) {
    throw new Error(`System prompt not found at ${promptPath}`);
  }
  return fs.readFileSync(promptPath, "utf-8");
}

function extractJsonArray(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned.trim());
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  // Fallback: find the outermost [ ... ] in the text
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error(
      "No JSON array found in response. First 500 chars: " + text.slice(0, 500)
    );
  }

  const jsonStr = cleaned.slice(firstBracket, lastBracket + 1);
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error("Parsed JSON is not an array");
  }
  return parsed;
}

function validateQuestion(q) {
  if (!q || typeof q !== "object") return false;
  if (typeof q.question !== "string" || q.question.length === 0) return false;
  if (typeof q.answer !== "number" || !isFinite(q.answer)) return false;
  if (typeof q.units !== "string" || q.units.length === 0) return false;
  if (!VALID_CATEGORIES.has(q.category)) return false;
  if (!VALID_DIFFICULTIES.has(q.difficulty)) return false;
  if (typeof q.year !== "number" || q.year < 1990 || q.year > 2030) return false;
  if (typeof q.source_url !== "string" || !q.source_url.startsWith("http")) return false;
  if (typeof q.source_text !== "string" || q.source_text.length === 0) return false;
  return true;
}

async function withRetry(fn) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err.status === 429 ||
        err.status === 529 ||
        (err.message && /rate.limit|overloaded|too many/i.test(err.message));

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw err;
      }

      const delay = Math.min(15000 * Math.pow(2, attempt) + Math.random() * 5000, 120000);
      console.log(
        `  Rate limited. Retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`
      );
      await sleep(delay);
    }
  }
}

async function generateBatch(client, systemPrompt, seenQuestions) {
  let userMessage = `Generate exactly ${BATCH_SIZE} new Fermi estimation questions.`;

  if (seenQuestions.length > 0) {
    const recent = seenQuestions.slice(-15).map((q) => q.question);
    userMessage += `\n\nAvoid duplicating these recently generated questions:\n${recent.map((q) => `- ${q}`).join("\n")}`;
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("No text block in API response");
  }

  return extractJsonArray(textBlock.text);
}

// --- Main ---

async function main() {
  const totalQuestions = parseInt(process.argv[2]) || 100;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    console.error("Usage: ANTHROPIC_API_KEY=sk-ant-... node generate-questions.js [N]");
    process.exit(1);
  }

  const client = new Anthropic();
  const systemPrompt = loadSystemPrompt();
  const totalBatches = Math.ceil(totalQuestions / BATCH_SIZE);

  // Timestamped JSONL file for incremental output
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const scriptDir = __dirname;
  const jsonlPath = path.join(scriptDir, `questions-${ts}.jsonl`);
  const jsonPath = path.join(scriptDir, "questions.json");

  console.log(`Generating ${totalQuestions} questions in ${totalBatches} batches of ${BATCH_SIZE}`);
  console.log(`JSONL output: ${jsonlPath}`);
  console.log();

  const allQuestions = [];
  const seenTexts = new Set();

  for (let batch = 0; batch < totalBatches; batch++) {
    const remaining = totalQuestions - allQuestions.length;
    if (remaining <= 0) break;

    try {
      const questions = await withRetry(() => generateBatch(client, systemPrompt, allQuestions));

      let added = 0;
      for (const q of questions) {
        if (allQuestions.length >= totalQuestions) break;

        if (!validateQuestion(q)) {
          console.log(`  Warning: dropping malformed question in batch ${batch + 1}`);
          continue;
        }

        if (seenTexts.has(q.question)) {
          console.log(`  Warning: skipping duplicate question in batch ${batch + 1}`);
          continue;
        }

        q.id = crypto.randomUUID();
        allQuestions.push(q);
        seenTexts.add(q.question);
        fs.appendFileSync(jsonlPath, JSON.stringify(q) + "\n");
        added++;
      }

      console.log(
        `Batch ${batch + 1}/${totalBatches} — added ${added} questions, ${allQuestions.length} total`
      );
    } catch (err) {
      console.error(`Error in batch ${batch + 1}: ${err.message}`);
      console.error("Continuing to next batch...");
    }

    // Delay between batches to respect rate limits
    if (batch < totalBatches - 1) {
      const delay = 5000;
      console.log(`  Waiting ${delay / 1000}s before next batch...`);
      await sleep(delay);
    }
  }

  // Write final combined JSON
  fs.writeFileSync(jsonPath, JSON.stringify(allQuestions, null, 2));

  console.log();
  console.log(`Done. Generated ${allQuestions.length} questions.`);
  console.log(`  JSONL: ${jsonlPath}`);
  console.log(`  JSON:  ${jsonPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
