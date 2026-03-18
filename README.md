# nano-banana-structured

Bidirectional image-to-JSON-to-image pipeline using Google Gemini. Analyze any image into a structured JSON prompt, then regenerate it — or craft your own JSON prompt from scratch for precise, reproducible results.

## Why structured prompts?

Plain text prompts are ambiguous. "A cinematic portrait of a marine biologist in a storm" leaves the model guessing about lens choice, color grading, lighting setup, and dozens of other parameters that determine whether the output looks like a phone snapshot or a film still.

Structured JSON prompts fix this by making every visual decision explicit:

```
Plain text prompt                          Structured JSON prompt
─────────────────                          ──────────────────────
"photo of a steel mug on a table"    →     subject, lighting, camera focal length,
                                           depth of field, material finish, color
                                           profile, render quality, style constraints,
                                           quality keywords to include AND avoid
```

The structured approach treats **style constraints as first-class data**, not afterthoughts buried in a long sentence. This matters because the most common failure mode in image generation is getting the content right but the style wrong.

## How it works

The JSON schema covers six control surfaces:

| Layer | What it controls | Example fields |
|-------|-----------------|----------------|
| Core | Content essentials | `subject`, `scene`, `objects`, `actions` |
| Style | Visual treatment | `primary_style`, `color_profile`, `lighting` |
| Technical | Camera & rendering | `focal_length_mm`, `depth_of_field`, `aperture` |
| Materials | Surface & texture | `material`, `finish`, `wear_level` |
| Environment | Atmosphere | `time_of_day`, `weather`, `ambient_light` |
| Quality | Style enforcement | `include` keywords, `avoid` keywords |

The `quality_keywords.avoid` field is particularly powerful — it tells the model what would **break** the intended style (e.g., "color fills" for a line drawing, "cartoon" for photorealism).

## Usage

```bash
# Analyze an image into structured JSON
bun run analyze path/to/image.jpg

# Generate an image from a JSON prompt
bun run generate path/to/prompt.json

# Round-trip: image → JSON → new image
bun run src/cli.ts roundtrip path/to/image.jpg
```

## Schema overview

```jsonc
{
  "subject": "photorealistic photo of a stainless steel travel mug", // rendering medium is explicit
  "scene": "minimalist studio tabletop",
  "style": {
    "primary_style": "photorealistic",       // enum, not free text
    "render_quality": "ultra",
    "color_profile": "neutral warm",
    "lighting": "three-point studio, soft key"
  },
  "technical": {
    "camera": {
      "focal_length_mm": 85,                 // precise lens choice
      "depth_of_field": "shallow",
      "aperture": "f/2.8"
    }
  },
  "quality_keywords": {
    "include": ["product photography", "studio lighting", "sharp focus"],
    "avoid": ["illustration", "cartoon", "painting", "sketch"]
  }
}
```

See `docs/` for complete examples: `cinematic-portrait.json`, `photoreal-product.json`.

## Prompt assembly

Internally, the JSON is converted to text with a deliberate ordering strategy:

1. **Style rules first** — constraints and avoid-keywords lead the prompt so the model locks in the rendering medium before interpreting content
2. **Content second** — subject, scene, objects, actions
3. **Technical details last** — camera specs, materials, environment

This ordering prevents the model from defaulting to its "easiest" interpretation of the content and ignoring style intent.

## Setup

```bash
bun install
```

Requires a `GEMINI_API_KEY` environment variable.

## Stack

Bun + TypeScript, Google Gemini API (`gemini-2.5-flash` for analysis, image generation model for output).
