// Merged schema combining pauhu's structured prompt schema with alexewerlof's extended fields.
// This is the canonical JSON shape for both analyze (output) and generate (input).

export interface ImagePrompt {
  core: {
    subject: string;
    scene?: string;
    objects?: string[];
    actions?: string[];
    constraints?: string[];
    notes?: string;
  };
  style: {
    primary_style: "photorealistic" | "cinematic" | "documentary" | "studio" | "editorial" | "illustrative" | "anime" | "3d_render" | "oil_painting" | "watercolor" | "pencil_sketch" | "pixel_art" | "vector_illustration";
    render_quality?: "hyperrealistic" | "detailed" | "high-resolution" | "high-definition-minimum" | "professional-quality";
    lighting?: "natural" | "studio" | "dramatic" | "soft-ambient" | "golden-hour" | "overcast" | "neon_lights" | "candlelight" | "cinematic" | "bioluminescent";
    color_profile?: "neutral" | "rich" | "muted" | "monochrome";
    aesthetic?: string[];
  };
  technical?: {
    camera?: {
      focal_length_mm?: number;
      depth_of_field?: "shallow" | "medium" | "deep";
      aperture?: string;
      shutter_speed?: string;
      iso?: string;
    };
    resolution?: {
      target?: "hd" | "quad-hd" | "4k" | "8k";
    };
    film_stock?: string;
  };
  materials?: {
    skin_textures?: string;
    fabric_details?: string;
    surfaces?: string[];
  };
  environment?: {
    atmosphere?: string[];
    time_season?: string[];
    particles?: string[];
  };
  composition?: {
    perspective?: string;
    framing?: string;
    subject_placement?: string;
    angle?: string;
  };
  quality_keywords?: {
    include?: string[];
    avoid?: string[];
  };
  // alexewerlof extensions
  subject_details?: Array<{
    type?: string;
    description?: string;
    position?: string;
    pose?: string;
    expression?: string;
    clothing?: Array<{ item: string; color?: string; fabric?: string }>;
    accessories?: Array<{ item: string; material?: string; color?: string }>;
  }>;
  text_rendering?: {
    enabled?: boolean;
    text_content?: string;
    placement?: string;
    font_style?: string;
    color?: string;
  };
}

export const ANALYZE_SYSTEM_PROMPT = `You are an expert image analyst. Your output will be used directly to regenerate a visually identical image via an AI image generator. Accuracy of the RENDERING MEDIUM and VISUAL STYLE is the #1 priority — getting the content right but the style wrong is a failure.

CRITICAL STYLE ANALYSIS — answer these questions FIRST before writing JSON:
- Is this a photograph, illustration, line drawing, painting, 3D render, or something else?
- Does it use color fills or only outlines/lines?
- Is it black-and-white, monochrome, limited palette, or full color?
- Are there gradients/shading or is it flat?
- What is the line weight — thin, medium, bold?
- What is the background — white/blank, colored, detailed scene?

Encode your style findings into EVERY relevant field: core.subject must mention the medium (e.g. "black and white line drawing of..."), style.aesthetic must include rendering details (e.g. "line art", "no fills", "bold outline"), quality_keywords.avoid must explicitly list what would break the style (e.g. "color", "shading", "gradients" for a B&W line drawing), and core.constraints must enforce rendering rules.

Return ONLY valid JSON matching this structure:
{
  "core": {
    "subject": "MUST start with rendering medium: e.g. 'Black and white line drawing of...' or 'Photorealistic photo of...' (required)",
    "scene": "scene/setting description including background treatment",
    "objects": ["list", "of", "visible", "objects"],
    "actions": ["ongoing", "actions"],
    "constraints": ["CRITICAL: rendering constraints like 'black and white only', 'no color fills', 'white background', etc."]
  },
  "style": {
    "primary_style": "one of: photorealistic, cinematic, documentary, studio, editorial, illustrative, anime, 3d_render, oil_painting, watercolor, pencil_sketch, pixel_art, vector_illustration",
    "render_quality": "perceived quality level",
    "lighting": "lighting type — use 'flat' for illustrations with no lighting",
    "color_profile": "one of: neutral, rich, muted, monochrome — use monochrome for B&W",
    "aesthetic": ["MUST include rendering-specific tags: e.g. 'line art', 'no fills', 'bold outline', 'flat color', 'cel shaded', etc."]
  },
  "technical": {
    "camera": {
      "focal_length_mm": 50,
      "depth_of_field": "shallow|medium|deep",
      "aperture": "estimated f-stop",
      "iso": "estimated ISO"
    },
    "film_stock": "if recognizable"
  },
  "materials": {
    "skin_textures": "if people present",
    "fabric_details": "clothing/fabric description",
    "surfaces": ["surface qualities"]
  },
  "environment": {
    "atmosphere": ["atmospheric effects"],
    "time_season": ["time of day", "season"],
    "particles": ["particles/effects"]
  },
  "composition": {
    "perspective": "camera perspective",
    "framing": "framing technique",
    "subject_placement": "where subject is placed",
    "angle": "camera angle"
  },
  "quality_keywords": {
    "include": ["MUST include medium-specific terms: e.g. 'clean black outlines', 'no color', 'bold lines' for line art"],
    "avoid": ["MUST list what would break the style: e.g. 'color', 'fills', 'shading', 'gradients' for B&W line art, or 'cartoon', 'flat' for photorealistic"]
  },
  "subject_details": [
    {
      "type": "person|animal|object|vehicle",
      "description": "detailed appearance — include rendering style e.g. 'drawn with simple black outlines'",
      "position": "position in frame",
      "pose": "body pose/action",
      "expression": "facial expression if applicable",
      "clothing": [{"item": "garment", "color": "color as rendered (e.g. 'black outline only')", "fabric": "material"}],
      "accessories": [{"item": "accessory", "material": "material", "color": "color as rendered"}]
    }
  ],
  "text_rendering": {
    "enabled": true/false,
    "text_content": "any visible text",
    "placement": "where text appears",
    "font_style": "font description",
    "color": "text color"
  }
}

Only include fields that are clearly observable. Omit fields you cannot determine. Return raw JSON, no markdown fences.`;

export function promptToText(prompt: ImagePrompt): string {
  // Style and constraints go FIRST — they are the most important signals for the model.
  // Content details follow after.
  const styleParts: string[] = [];
  const contentParts: string[] = [];

  // === STYLE BLOCK (highest priority, placed first) ===
  // Constraints are rendering rules — they must lead
  if (prompt.core.constraints?.length) {
    styleParts.push(`STYLE RULES: ${prompt.core.constraints.join(", ")}`);
  }
  if (prompt.quality_keywords?.avoid?.length) {
    styleParts.push(`DO NOT use: ${prompt.quality_keywords.avoid.join(", ")}`);
  }
  styleParts.push(`${prompt.style.primary_style} style`);
  if (prompt.style.color_profile) styleParts.push(`${prompt.style.color_profile} color palette`);
  if (prompt.style.lighting) styleParts.push(`${prompt.style.lighting} lighting`);
  if (prompt.style.aesthetic?.length) styleParts.push(prompt.style.aesthetic.join(", "));
  if (prompt.quality_keywords?.include?.length) {
    styleParts.push(prompt.quality_keywords.include.join(", "));
  }

  // === CONTENT BLOCK ===
  contentParts.push(prompt.core.subject);
  if (prompt.core.scene) contentParts.push(prompt.core.scene);
  if (prompt.core.objects?.length) contentParts.push(`with ${prompt.core.objects.join(", ")}`);
  if (prompt.core.actions?.length) contentParts.push(prompt.core.actions.join(", "));

  // Technical
  if (prompt.technical?.camera?.focal_length_mm) {
    contentParts.push(`shot on ${prompt.technical.camera.focal_length_mm}mm lens`);
  }
  if (prompt.technical?.camera?.aperture) {
    contentParts.push(prompt.technical.camera.aperture);
  }
  if (prompt.technical?.camera?.depth_of_field) {
    contentParts.push(`${prompt.technical.camera.depth_of_field} depth of field`);
  }
  if (prompt.technical?.film_stock) {
    contentParts.push(`${prompt.technical.film_stock} film stock`);
  }

  // Materials
  if (prompt.materials?.fabric_details) contentParts.push(prompt.materials.fabric_details);
  if (prompt.materials?.surfaces?.length) contentParts.push(prompt.materials.surfaces.join(", "));

  // Environment
  if (prompt.environment?.atmosphere?.length) contentParts.push(prompt.environment.atmosphere.join(", "));
  if (prompt.environment?.time_season?.length) contentParts.push(prompt.environment.time_season.join(", "));
  if (prompt.environment?.particles?.length) contentParts.push(prompt.environment.particles.join(", "));

  // Composition
  if (prompt.composition?.perspective) contentParts.push(`${prompt.composition.perspective} perspective`);
  if (prompt.composition?.framing) contentParts.push(`${prompt.composition.framing} framing`);
  if (prompt.composition?.angle) contentParts.push(`${prompt.composition.angle} angle`);

  // Subject details
  if (prompt.subject_details?.length) {
    for (const s of prompt.subject_details) {
      if (s.description) contentParts.push(s.description);
      if (s.pose) contentParts.push(s.pose);
      if (s.expression) contentParts.push(`${s.expression} expression`);
      if (s.clothing?.length) {
        contentParts.push(s.clothing.map(c => `${c.color ?? ""} ${c.fabric ?? ""} ${c.item}`.trim()).join(", "));
      }
      if (s.accessories?.length) {
        contentParts.push(s.accessories.map(a => `${a.color ?? ""} ${a.material ?? ""} ${a.item}`.trim()).join(", "));
      }
    }
  }

  // Text rendering
  if (prompt.text_rendering?.enabled && prompt.text_rendering.text_content) {
    contentParts.push(`text "${prompt.text_rendering.text_content}" as ${prompt.text_rendering.placement ?? "overlay"} in ${prompt.text_rendering.font_style ?? "sans-serif"} ${prompt.text_rendering.color ?? "white"}`);
  }

  return styleParts.join(". ") + ".\n\n" + contentParts.join(". ") + ".";
}
