#!/usr/bin/env bun
import { analyzeImage } from "./analyze.js";
import { generateImage } from "./generate.js";

const [command, ...args] = process.argv.slice(2);

async function main() {
  switch (command) {
    case "analyze": {
      const imagePath = args[0];
      if (!imagePath) {
        console.error("Usage: bun run src/cli.ts analyze <image-path>");
        process.exit(1);
      }
      const result = await analyzeImage(imagePath);
      console.log(JSON.stringify(result, null, 2));

      // Optionally save to file
      const outputFlag = args.indexOf("-o");
      if (outputFlag !== -1 && args[outputFlag + 1]) {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(args[outputFlag + 1], JSON.stringify(result, null, 2));
        console.error(`Saved to ${args[outputFlag + 1]}`);
      }
      break;
    }

    case "generate": {
      const jsonPath = args[0];
      if (!jsonPath) {
        console.error("Usage: bun run src/cli.ts generate <prompt.json> [-o output.png]");
        process.exit(1);
      }
      const outputFlag = args.indexOf("-o");
      const outputPath = outputFlag !== -1 ? args[outputFlag + 1] : undefined;

      const result = await generateImage(jsonPath, outputPath);
      console.error(`Prompt: ${result.prompt_text}`);
      console.error(`Saved to ${result.path}`);
      break;
    }

    case "roundtrip": {
      // analyze image -> json -> generate new image
      const imagePath = args[0];
      if (!imagePath) {
        console.error("Usage: bun run src/cli.ts roundtrip <image-path> [-o output.png]");
        process.exit(1);
      }
      console.error("Step 1: Analyzing image...");
      const prompt = await analyzeImage(imagePath);
      console.log(JSON.stringify(prompt, null, 2));

      console.error("\nStep 2: Generating from JSON...");
      const outputFlag = args.indexOf("-o");
      const outputPath = outputFlag !== -1 ? args[outputFlag + 1] : undefined;
      const result = await generateImage(prompt, outputPath);
      console.error(`Prompt: ${result.prompt_text}`);
      console.error(`Saved to ${result.path}`);
      break;
    }

    default:
      console.error(`nano-banana-structured — Image <-> JSON roundtrip tool

Commands:
  analyze   <image>          Image → JSON description
  generate  <prompt.json>    JSON → Image generation
  roundtrip <image>          Image → JSON → Image

Options:
  -o <path>  Output file path

Examples:
  bun run src/cli.ts analyze photo.jpg
  bun run src/cli.ts analyze photo.jpg -o description.json
  bun run src/cli.ts generate description.json -o output.png
  bun run src/cli.ts roundtrip photo.jpg -o recreated.png`);
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
