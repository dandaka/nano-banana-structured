---
name: nano-banana
description: Use when creating or modifying visual assets — illustrations, product photos, icons, hero images. Generates images via structured JSON prompts using Google Gemini. Also use when analyzing existing images into reproducible structured prompts.
allowed-tools: Bash(bun run*), Bash(ni-gate*), Read, Write, Glob
---

# nano-banana — Structured Image Generation

Generate and analyze images using structured JSON prompts via Google Gemini. Located at `~/projects/nano-banana-structured`.

## When to Use

- Creating visual assets (illustrations, product shots, icons, hero images)
- Recreating or iterating on existing images
- Analyzing an image into a reproducible structured prompt
- When precise control over style, lighting, composition is needed

## Quick Reference

```bash
# Analyze image into structured JSON
cd ~/projects/nano-banana-structured
ni-gate run GEMINI_API_KEY -- bun run src/cli.ts analyze path/to/image.jpg -o prompt.json

# Generate image from JSON prompt
ni-gate run GEMINI_API_KEY -- bun run src/cli.ts generate prompt.json -o output.png

# Round-trip: image -> JSON -> new image
ni-gate run GEMINI_API_KEY -- bun run src/cli.ts roundtrip path/to/image.jpg -o recreated.png
```

## Workflow

1. **Start from scratch:** Write a JSON prompt file following the schema below, then `generate`
2. **Start from reference:** `analyze` an existing image, edit the JSON, then `generate`
3. **Iterate:** Modify JSON fields (style, lighting, composition) and re-generate

## JSON Schema (key fields)

```jsonc
{
  "core": {
    "subject": "MUST start with rendering medium, e.g. 'Photorealistic photo of...'",
    "scene": "scene/setting",
    "objects": ["visible", "objects"],
    "constraints": ["rendering rules like 'no color fills'"]
  },
  "style": {
    "primary_style": "photorealistic | cinematic | illustrative | pencil_sketch | ...",
    "lighting": "natural | studio | dramatic | golden-hour | ...",
    "color_profile": "neutral | rich | muted | monochrome",
    "aesthetic": ["line art", "flat color", "cel shaded"]
  },
  "technical": {
    "camera": { "focal_length_mm": 85, "depth_of_field": "shallow", "aperture": "f/2.8" }
  },
  "quality_keywords": {
    "include": ["sharp focus", "studio lighting"],
    "avoid": ["cartoon", "illustration"]  // what would BREAK the style
  }
}
```

Full schema with all fields: `~/projects/nano-banana-structured/src/schema.ts`

## Key Insight

**Style constraints go first.** The tool assembles prompts with style rules and avoid-keywords leading, content second, technical last. The `quality_keywords.avoid` field is critical — it tells the model what would break the intended style.

## Common Mistakes

- Omitting rendering medium from `core.subject` (say "line drawing of..." not just "a cat")
- Forgetting `quality_keywords.avoid` — without it, style drifts
- Using free text where enums exist (`primary_style` has fixed options)
