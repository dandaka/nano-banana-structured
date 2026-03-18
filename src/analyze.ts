import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { ANALYZE_SYSTEM_PROMPT, type ImagePrompt } from "./schema.js";

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
};

export async function analyzeImage(imagePath: string): Promise<ImagePrompt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set");

  const ext = extname(imagePath).toLowerCase();
  const mimeType = MIME_MAP[ext];
  if (!mimeType) throw new Error(`Unsupported image format: ${ext}`);

  const imageData = readFileSync(imagePath);
  const base64 = imageData.toString("base64");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: ANALYZE_SYSTEM_PROMPT },
        ],
      },
    ],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini");

  // Strip markdown fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

  return JSON.parse(cleaned) as ImagePrompt;
}
