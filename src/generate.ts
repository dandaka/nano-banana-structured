import { GoogleGenAI } from "@google/genai";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { promptToText, type ImagePrompt } from "./schema.js";

export async function generateImage(
  input: string | ImagePrompt,
  outputPath?: string,
): Promise<{ path: string; prompt_text: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set");

  // If string, treat as path to JSON file
  const prompt: ImagePrompt =
    typeof input === "string"
      ? JSON.parse(readFileSync(input, "utf-8"))
      : input;

  let promptText = promptToText(prompt);

  // Append negative prompt if present
  if (prompt.meta?.negative_prompt?.length) {
    promptText += `\n\nNEGATIVE PROMPT — do NOT include any of the following: ${prompt.meta.negative_prompt.join(", ")}.`;
  }

  const ai = new GoogleGenAI({ apiKey });

  const config: Record<string, unknown> = {
    responseModalities: ["image", "text"],
  };
  if (prompt.meta?.aspect_ratio) {
    // Gemini expects "1:1" format as aspectRatio
    config.aspectRatio = prompt.meta.aspect_ratio;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: promptText,
    config,
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No response from Gemini");

  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data!, "base64");
      const ext = part.inlineData.mimeType?.includes("png") ? "png" : "png";
      const outPath = outputPath ?? join(process.cwd(), `generated-${Date.now()}.${ext}`);
      writeFileSync(outPath, buffer);
      return { path: outPath, prompt_text: promptText };
    }
  }

  throw new Error("No image data in response");
}
